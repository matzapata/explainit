import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseFilePipeBuilder,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { RagService } from './services/rag.service';
import { PostMessageDto } from './dtos/post-message.dto';
import { Express } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { ChatsService } from './services/chat.service';
import { AuthGuard } from '@src/users/guards/auth.guard';
import { CurrentUser } from '@src/users/decorators/current-user.decorator';
import { Serialize } from '@src/interceptors/serialize.interceptor';
import { StorageService } from '@src/infrastructure/storage/storage.service';
import { ChatMetadataDto } from './dtos/get-chat-metadata.dto';
import { UpdateChatMetadataDto } from './dtos/put-chat-metadata.dto';
import { AuthUser } from '@src/users/middlewares/current-user.middleware';
import {
  PostTextResourceDto,
  PostWebResourceDto,
} from './dtos/post-resource.dto';
import { ResourcesService } from './services/resources.service';
import { Chat, ChatResource } from '@prisma/client';
import { GetResourceDto } from './dtos/get-resource.dto';
import { PostResourceInspectDto } from './dtos/post-resource-inspect.dto';
import { PlanCheckerService } from '@src/payments/services/plan-checker.service';
import { ChatMessagesRateLimit } from './guards/chat-messages-rate-limit.guard';
import { CrawlerService } from '@src/infrastructure/crawler/crawler.service';
import { RagLoaderService } from './services/rag-loader.service';
import { OnEvent } from '@nestjs/event-emitter';
import { SubscriptionCanceled } from '@src/payments/events/subscription-canceled.event';
import { AdminGuard } from '@src/users/guards/admin.guard';

@Controller('api/chats')
export class ChatController {
  constructor(
    private readonly ragService: RagService,
    private readonly ragLoaderService: RagLoaderService,
    private readonly chatsService: ChatsService,
    private readonly storageService: StorageService,
    private readonly resourcesService: ResourcesService,
    private readonly planChecker: PlanCheckerService,
    private readonly crawlerService: CrawlerService,
  ) {}

  // Admin chat endpoints ============================================================

  @Get('/admin')
  @UseGuards(AdminGuard)
  @Serialize(ChatMetadataDto)
  async getAllChatsByOwner(@CurrentUser() user: AuthUser): Promise<Chat[]> {
    const chats = await this.chatsService.findManyByOwner(user.id);

    return chats;
  }

  @Post('/admin')
  @UseGuards(AdminGuard)
  @Serialize(ChatMetadataDto)
  async createChat(
    @CurrentUser() user: AuthUser,
    @Body() data: UpdateChatMetadataDto,
  ): Promise<Chat> {
    const chat = await this.chatsService.create(user.id, data);
    return chat;
  }

  // Consumer chat endpoints ============================================================

  // get chat metadata based on the owner
  @Get('/')
  @UseGuards(AuthGuard)
  @Serialize(ChatMetadataDto)
  async getChatByOwner(
    @CurrentUser() user: AuthUser,
  ): Promise<Chat & { resources: ChatResource[] }> {
    let chat = await this.chatsService.findFirstByOwner(user.id);
    if (!chat) {
      chat = await this.chatsService.create(user.id, {});
    }

    // get resources
    const resources = await this.resourcesService.findByChatId(chat.id);

    return { ...chat, logo: chat.logo + '?v=' + Date.now(), resources };
  }

  // Updates the chat metadata
  @Put('/:id')
  @UseGuards(AuthGuard)
  @Serialize(ChatMetadataDto)
  async updateChat(
    @CurrentUser() user: AuthUser,
    @Body() data: UpdateChatMetadataDto,
    @Param('id') id: string,
  ): Promise<Chat> {
    if (data.published) {
      await this.planChecker.canPublishChat(user.id);
    }

    const chat = this.chatsService.update(user.id, id, data);
    return chat;
  }

  // Uploads a logo for the chat
  @Put('/:id/logo')
  @UseGuards(AuthGuard)
  @Serialize(ChatMetadataDto)
  @UseInterceptors(FileInterceptor('file'))
  async updateChatLogo(
    @CurrentUser() user: AuthUser,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          // Only images are allowed
          fileType: /(image\/jpg|image\/png)|(image\/jpeg)/,
        })
        .addMaxSizeValidator({
          maxSize: 1000000,
        })
        .build(),
    )
    file: Express.Multer.File,
    @Param('id') id: string,
  ) {
    let chat = await this.chatsService.findFirstById(id);
    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    // check if file exists and delete it
    await this.storageService.deleteFile(`logos/${chat.id}.webp`);

    // resize image
    const resized = await this.storageService.resizeImage(
      file.buffer,
      200,
      200,
    );

    // upload file
    await this.storageService.uploadFile(`logos/${chat.id}.webp`, resized);

    // update chat with url
    chat = await this.chatsService.update(user.id, id, {
      logo: await this.storageService.getFileUrl(`logos/${chat.id}.webp`, true),
    });

    return { ...chat, logo: chat.logo + '?v=' + Date.now() }; // add a version to the url to force refresh
  }

  // loads the urls from a webpage and adds them to the chat
  @Post('/:id/resources/web')
  @UseGuards(AuthGuard)
  @Serialize(GetResourceDto)
  async loadWebResource(
    @CurrentUser() user: AuthUser,
    @Body() resource: PostWebResourceDto,
    @Param('id') id: string,
  ) {
    // get chat id for user
    const chat = await this.chatsService.findFirstById(id);
    if (!chat) {
      throw new NotFoundException('Chat not found');
    } else if (chat.ownerId !== user.id) {
      throw new BadRequestException('Chat not owned by user');
    }

    const resources = await this.resourcesService.findByChatId(chat.id);

    // filter out already existing urls
    const existingUrls = resources.map((r) => r.data);
    const newUrls = resource.urls.filter((r) => !existingUrls.includes(r));
    if (newUrls.length === 0) {
      throw new BadRequestException('No new urls to add');
    }

    // check if user can add more resources
    await this.planChecker.withinResourcesLimit(
      user.id,
      resources.length + newUrls.length,
    );

    // scrape the urls content
    const scrappedHtml = await this.crawlerService.scrape({
      urls: resource.urls,
    });

    // load documents and resources
    const result: ChatResource[] = [];
    for (const d of scrappedHtml) {
      // Create documents for rag, one per page. We'll do one resource per page
      const documents = await this.ragLoaderService.generateDocsFromHtml(
        d,
        chat.id,
      );

      const ids = await this.ragService.addDocuments(documents);

      const r = await this.resourcesService.create(chat.id, {
        data: d.url,
        type: 'website',
        embeddingIds: ids,
      });
      result.push(r);
    }

    return result;
  }

  @Post('/:id/resources/text')
  @UseGuards(AuthGuard)
  @Serialize(GetResourceDto)
  async loadTextResource(
    @CurrentUser() user: AuthUser,
    @Body() resource: PostTextResourceDto,
    @Param('id') id: string,
  ) {
    // get chat id for user
    const chat = await this.chatsService.findFirstById(id);
    if (!chat) {
      throw new NotFoundException('Chat not found');
    } else if (chat.ownerId !== user.id) {
      throw new BadRequestException('Chat not owned by user');
    }

    // check if user can add more resources
    const resources = await this.resourcesService.findByChatId(chat.id);
    await this.planChecker.withinResourcesLimit(user.id, resources.length + 1);

    // load documents and resources
    // Create documents for rag, one per page. We'll do one resource per page
    const documents = await this.ragLoaderService.generateDocsFromText(
      {
        text: resource.text,
        source: resource.source,
        title: resource.title,
      },
      chat.id,
    );

    const ids = await this.ragService.addDocuments(documents);

    const r = await this.resourcesService.create(chat.id, {
      data: resource.title,
      type: 'text',
      embeddingIds: ids,
    });

    return [r];
  }

  // inspect a webpage and get urls to add to the chat
  @Post('/:id/resources/web/inspect')
  @UseGuards(AuthGuard)
  async inspectWebResource(
    @CurrentUser() user: AuthUser,
    @Body() data: PostResourceInspectDto,
    @Param('id') id: string,
  ) {
    // get the chat for the user
    const chat = await this.chatsService.findFirstById(id);
    if (!chat) {
      throw new NotFoundException('Chat not found');
    } else if (chat.ownerId !== user.id) {
      throw new BadRequestException('Chat not owned by user');
    }

    // check if the url is already used
    const resources = await this.resourcesService.findByChatId(chat.id);
    const urls = resources.map((r) => r.data);
    if (urls.includes(data.url)) {
      throw new BadRequestException(
        `Resource with url ${data.url} already exists`,
      );
    }

    const crawledUrls = await this.crawlerService.inspect({
      url: data.url,
    });

    // filter out already existing urls
    return { urls: crawledUrls.filter((r) => !urls.includes(r)) };
  }

  //  deletes a resource from the chat including embeddings
  @Delete('/:id/resources/:resource_id')
  @UseGuards(AuthGuard)
  @Serialize(GetResourceDto)
  async deleteResourcesFromChat(@Param('resource_id') resource_id: string) {
    const r = await this.resourcesService.findById(resource_id);

    // delete embeddings
    await this.ragService.deleteDocuments(r.embeddingIds);

    // delete resources
    await this.resourcesService.delete(r.id);

    return r;
  }

  // Public Chat Endpoints ============================================================

  @Get('/published')
  @Serialize(ChatMetadataDto)
  async getChats(
    @Query('limit') limit: number,
    @Query('offset') offset: number,
  ) {
    limit = limit || 100;
    offset = offset || 0;
    const chats = await this.chatsService.findManyPublished(limit, offset);
    return chats;
  }

  // get chat metadata based on the chat id. This is a public endpoint
  @Get('/:id')
  @Serialize(ChatMetadataDto)
  async getChat(@Param('id') id: string) {
    const chat = await this.chatsService.findFirstById(id);
    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    return chat;
  }

  // post a message to the chat. This is a public endpoint
  @Post('/:id/messages')
  @UseGuards(ChatMessagesRateLimit)
  async postMessage(@Body() body: PostMessageDto, @Param('id') id: string) {
    const chat = await this.chatsService.findFirstById(id);
    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    // increment chat points
    await this.chatsService.incrementPoints(chat.id);

    // create response for the message
    const response = await this.ragService.invoke(
      body.question,
      body.chatHistory,
      4,
      chat.id,
    );

    return response;
  }

  // Handle events ============================================================

  @OnEvent(SubscriptionCanceled.type)
  async onSubscriptionCanceled(payload: SubscriptionCanceled) {
    const findManyByOwner = await this.chatsService.findManyByOwner(
      payload.userId,
    );
    await Promise.all(
      findManyByOwner.map((chat) =>
        this.chatsService.update(payload.userId, chat.id, { published: false }),
      ),
    );
  }
}
