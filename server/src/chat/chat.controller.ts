import {
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
import { RetrievalAugmentedGenerationService } from './services/rag.service';
import { PostMessageDto } from './dtos/post-message.dto';
import { Express } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { ChatsService } from './services/chat.service';
import { AuthGuard } from '@src/users/guards/auth.guard';
import { CurrentUser } from '@src/users/decorators/current-user.decorator';
import { Serialize } from '@src/interceptors/serialize.interceptor';
import { StorageService } from '@src/infrastructure/storage/storage.service';
import { PlanCheckerService } from '@src/payments/services/plan-checker.service';
import { ChatMetadataDto } from './dtos/get-chat-metadata.dto';
import { UpdateChatMetadataDto } from './dtos/put-chat-metadata.dto';
import { AuthUser } from '@src/users/middlewares/current-user.middleware';
import { PostResourceDto } from './dtos/post-resource.dto';
import { ResourcesService } from './services/resources.service';
import { Chat, ChatResource } from '@prisma/client';
import { DocumentLoader } from '@src/infrastructure/vectorstore/vectorstore.service';

@Controller('api/chat')
export class ChatController {
  constructor(
    private readonly ragService: RetrievalAugmentedGenerationService,
    private readonly chatsService: ChatsService,
    private readonly storageService: StorageService,
    private readonly planCheckerService: PlanCheckerService,
    private readonly resourcesService: ResourcesService,
  ) {}

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
    console.log('chat', chat);

    // get resources
    const resources = await this.resourcesService.findByChatId(chat.id);

    return { ...chat, resources };
  }

  @Put('/')
  @UseGuards(AuthGuard)
  @Serialize(ChatMetadataDto)
  async updateChat(
    @CurrentUser() user: AuthUser,
    @Body() data: UpdateChatMetadataDto,
  ): Promise<Chat> {
    const chat = this.chatsService.update(user.id, data);
    return chat;
  }

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
          fileType: /(image\/jpg|image\/png)/,
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

    // TODO: check if file exists and delete it

    // TODO: resize image

    // TODO: properly set image type

    await this.storageService.uploadFile(`logos/${chat.id}.jpg`, file.buffer);

    // update chat with url
    chat = await this.chatsService.update(user.id, {
      logo: await this.storageService.getFileUrl(`logos/${chat.id}.jpg`, true),
    });

    return chat;
  }

  @Post('/resources')
  @UseGuards(AuthGuard)
  async addResourcesToChat(
    @CurrentUser() user: AuthUser,
    @Body() resource: PostResourceDto,
  ) {
    // get chat id for user
    const chat = await this.chatsService.findByOwner(user.id);
    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    // select loader
    let loader: DocumentLoader;
    if (resource.url.includes('gitbook')) {
      loader = DocumentLoader.gitbook;
    } else if (resource.url.includes('github')) {
      loader = DocumentLoader.github;
    } else {
      loader = DocumentLoader.website;
    }

    // add source to vectorstore
    const embeddingIds = await this.ragService.loadSource(
      resource.url,
      loader,
      { namespace: chat.id },
    );

    // save resource
    const r = await this.resourcesService.create(chat.id, {
      data: resource.url,
      type: loader,
      embeddingIds,
    });

    return r;
  }

  @Delete('/resources/:id')
  @UseGuards(AuthGuard)
  async deleteResourcesFromChat(@Param('id') id: string) {
    console.log('id', id);

    const r = await this.resourcesService.findById(id);

    // delete embeddings
    await this.ragService.deleteDocuments(r.embeddingIds);

    // delete resource
    await this.resourcesService.delete(r.id);

    return 'OK';
  }

  // ============================== Public Chat Endpoints ==============================

  @Get('/:id')
  @Serialize(ChatMetadataDto)
  async getChat(@Param('id') id: string) {
    const chat = await this.chatsService.findById(id);
    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    return chat;
  }

  @Post('/:id')
  async postMessage(
    @Body() body: PostMessageDto,
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ) {
    // TODO: Add rate limiting per plan for these endpoints. I mean no free plan, jus rate limit per account
    const chat = await this.chatsService.findById(id);
    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    // create response for the message
    const response = await this.ragService.invoke(
      body.question,
      body.chatHistory,
      2,
      { namespace: chat.id },
    );

    return response;
  }
}
