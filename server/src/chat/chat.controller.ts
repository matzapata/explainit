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
import { RateLimitGuard } from './guards/rate-limit.guard';
import { CrawlerService } from '@src/infrastructure/crawler/crawler.service';
import { RagLoaderService } from './services/rag-loader.service';

@Controller('api/chat')
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

  // get chat metadata based on the owner
  @Get('/')
  @UseGuards(AuthGuard)
  @Serialize(ChatMetadataDto)
  async getChatByOwner(
    @CurrentUser() user: AuthUser,
  ): Promise<Chat & { resources: ChatResource[] }> {
    let chat = await this.chatsService.findByOwner(user.id);
    if (!chat) {
      // Create mock chat
      chat = await this.chatsService.create(user.id, {
        name: 'Lorem Ipsum',
        logo: 'https://lorem.com/ipsum.png',
        url: 'https://lorem.com',
        published: false,
        conversationStarters: [],
      });
    }

    // get resources
    const resources = await this.resourcesService.findByChatId(chat.id);

    return { ...chat, resources };
  }

  // Updates the chat metadata
  @Put('/')
  @UseGuards(AuthGuard)
  @Serialize(ChatMetadataDto)
  async updateChat(
    @CurrentUser() user: AuthUser,
    @Body() data: UpdateChatMetadataDto,
  ): Promise<Chat> {
    if (data.published) {
      await this.planChecker.canPublishChat(user.id);
    }

    const chat = this.chatsService.update(user.id, data);
    return chat;
  }

  // Uploads a logo for the chat
  @Put('/logo')
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
  ) {
    let chat = await this.chatsService.findByOwner(user.id);
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
    chat = await this.chatsService.update(user.id, {
      logo: await this.storageService.getFileUrl(`logos/${chat.id}.webp`, true),
    });

    return { ...chat, logo: chat.logo + '?v=' + Date.now() }; // add a version to the url to force refresh
  }

  // loads the urls from a webpage and adds them to the chat
  @Post('/resources/web')
  @UseGuards(AuthGuard)
  @Serialize(GetResourceDto)
  async loadWebResource(
    @CurrentUser() user: AuthUser,
    @Body() resource: PostWebResourceDto,
  ) {
    // get chat id for user
    const chat = await this.chatsService.findByOwner(user.id);
    if (!chat) {
      throw new NotFoundException('Chat not found');
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

  @Post('/resources/text')
  @UseGuards(AuthGuard)
  @Serialize(GetResourceDto)
  async loadTextResource(
    @CurrentUser() user: AuthUser,
    @Body() resource: PostTextResourceDto,
  ) {
    // get chat id for user
    const chat = await this.chatsService.findByOwner(user.id);
    if (!chat) {
      throw new NotFoundException('Chat not found');
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
  @Post('/resources/web/inspect')
  @UseGuards(AuthGuard)
  async inspectWebResource(
    @CurrentUser() user: AuthUser,
    @Body() data: PostResourceInspectDto,
  ) {
    // get the chat for the user
    const chat = await this.chatsService.findByOwner(user.id);
    if (!chat) {
      throw new NotFoundException('Chat not found');
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
  @Delete('/resources/:id')
  @UseGuards(AuthGuard)
  @Serialize(GetResourceDto)
  async deleteResourcesFromChat(@Param('id') id: string) {
    const r = await this.resourcesService.findById(id);

    // delete embeddings
    await this.ragService.deleteDocuments(r.embeddingIds);

    // delete resources
    await this.resourcesService.delete(r.id);

    return r;
  }

  // Public Chat Endpoints ============================================================

  // get chat metadata based on the chat id. This is a public endpoint
  @Get('/:id')
  @Serialize(ChatMetadataDto)
  async getChat(@Param('id') id: string) {
    const chat = await this.chatsService.findById(id);
    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    return chat;
  }

  // post a message to the chat. This is a public endpoint
  @Post('/:id')
  @UseGuards(RateLimitGuard)
  async postMessage(@Body() body: PostMessageDto, @Param('id') id: string) {
    const chat = await this.chatsService.findById(id);
    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    // create response for the message
    const response = await this.ragService.invoke(
      body.question,
      body.chatHistory,
      4,
      chat.id,
    );

    return response;
  }
}
