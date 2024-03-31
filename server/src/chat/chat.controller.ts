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
import { AuthGuard } from 'src/users/guards/auth.guard';
import { CurrentUser } from 'src/users/decorators/current-user.decorator';
import { Serialize } from 'src/interceptors/serialize.interceptor';
import { StorageService } from 'src/infrastructure/storage/storage.service';
import { PlanCheckerService } from 'src/payments/services/plan-checker.service';
import { ChatMetadataDto } from './dtos/chat-metadata.dto';
import { UpdateChatMetadataDto } from './dtos/update-chat-metadata.dto';
import { User } from '@prisma/client';
import { AuthUser } from 'src/users/middlewares/current-user.middleware';
import { PostResourceDto } from './dtos/post-resource.dto';
import { DeleteResourceDto } from './dtos/delete-resource.dto';
import { ResourcesService } from './services/resources.service';

@Controller('api/chats')
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
  async getChatByOwner(@CurrentUser() user: AuthUser) {
    let chat = this.chatsService.findByOwner(user.id);
    if (!chat) {
      // Create mock chat
      chat = this.chatsService.create(user.id, {
        organizationName: 'Lorem Ipsum',
        organizationLogo: 'https://lorem.com/ipsum.png',
        organizationUrl: 'https://lorem.com',
        published: false,
        conversationStarters: [],
      });
    }
    return chat;
  }

  @Put('/')
  @UseGuards(AuthGuard)
  @Serialize(ChatMetadataDto)
  async updateChat(
    @CurrentUser() user: AuthUser,
    @Body() data: UpdateChatMetadataDto,
  ) {
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
          fileType:
            /(application\/json|application\/pdf|text\/csv|text\/plain)/,
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

    // upload logo
    await this.storageService.uploadFile(chat.id, file.buffer);

    // update chat with url
    chat = await this.chatsService.update(user.id, {
      organizationLogo: await this.storageService.getFileUrl(chat.id),
    });

    return chat;
  }

  @Post('/resources')
  @UseGuards(AuthGuard)
  @Serialize(ChatMetadataDto)
  async addResourcesToChat(
    @CurrentUser() user: AuthUser,
    @Body() resource: PostResourceDto,
  ) {
    // create embeddings for the resource
  }

  @Delete('/resources')
  @UseGuards(AuthGuard)
  async deleteResourcesFromChat(
    @CurrentUser() user: AuthUser,
    @Body() resource: DeleteResourceDto,
  ) {
    // get resource
    const r = await this.resourcesService.findById(resource.id);

    // delete embeddings
    await this.ragService.deleteDocuments(r.embeddingIds);

    // delete resource
    await this.resourcesService.delete(r.id);

    return 'OK';
  }

  // Public endpoints for open chat
  // TODO: Add rate limiting per plan for these endpoints. I mean no free plan, jus rate limit per account

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
    @CurrentUser() user: User,
    @Param('id') id: string,
  ) {}
}
