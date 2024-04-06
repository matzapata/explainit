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
import { ChatMetadataDto } from './dtos/get-chat-metadata.dto';
import { UpdateChatMetadataDto } from './dtos/put-chat-metadata.dto';
import { AuthUser } from '@src/users/middlewares/current-user.middleware';
import { PostResourceDto } from './dtos/post-resource.dto';
import { ResourcesService } from './services/resources.service';
import { Chat, ChatResource } from '@prisma/client';
import { DocumentLoader } from '@src/infrastructure/vectorstore/vectorstore.service';
import { GetResourceDto } from './dtos/get-resource.dto';

@Controller('api/chat')
export class ChatController {
  constructor(
    private readonly ragService: RetrievalAugmentedGenerationService,
    private readonly chatsService: ChatsService,
    private readonly storageService: StorageService,
    private readonly resourcesService: ResourcesService,
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

    // check if file exists and delete it
    await this.storageService.deleteFile(`logos/${chat.id}.webp`);

    // resize image
    const resized = await this.storageService.resizeImage(
      file.buffer,
      200,
      200,
    );

    await this.storageService.uploadFile(`logos/${chat.id}.webp`, resized);

    // update chat with url
    chat = await this.chatsService.update(user.id, {
      logo: await this.storageService.getFileUrl(`logos/${chat.id}.webp`, true),
    });

    return chat;
  }

  // loads the urls from a webpage and adds them to the chat
  @Post('/resources/web')
  @UseGuards(AuthGuard)
  @Serialize(GetResourceDto)
  async loadWebResource(
    @CurrentUser() user: AuthUser,
    @Body() resource: PostResourceDto,
  ) {
    // get chat id for user
    const chat = await this.chatsService.findByOwner(user.id);
    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    // add source to vectorstore
    const results = await this.ragService.loadWebpageWithCrawling(
      resource.urls,
      chat.id,
    );

    // return { r, ...urls };
    return results;
  }

  // inspect a webpage and get urls to add to the chat
  @Post('/resources/web/inspect')
  @UseGuards(AuthGuard)
  async inspectWebResource(@Body() resource: { url: string }) {
    // TODO: DTO
    const results = await this.ragService.inspectWebpage(resource.url);

    return { urls: results };
  }

  //  deletes a resource from the chat including embeddings
  @Delete('/resources/:id')
  @UseGuards(AuthGuard)
  @Serialize(GetResourceDto)
  async deleteResourcesFromChat(@Param('id') id: string) {
    const r = await this.resourcesService.findById(id);

    await this.ragService.deleteDocuments(r.embeddingIds);

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
      4,
      chat.id,
    );

    return response;
  }
}
