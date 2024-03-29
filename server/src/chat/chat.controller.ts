import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  ParseFilePipeBuilder,
  Post,
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
import { ChatMetadataDto } from './dtos/chat-metadata.dto';
import { ChatDto } from './dtos/chat.dto';
import { StorageService } from 'src/infrastructure/storage/storage.service';
import { PlanCheckerService } from 'src/payments/services/plan-checker.service';
import { MimeType } from 'src/infrastructure/vectorstore/vectorstore.service';
import { MessageAgent, User } from '@prisma/client';

@Controller('api/chats')
@UseGuards(AuthGuard)
export class ChatController {
  constructor(
    private readonly ragService: RetrievalAugmentedGenerationService,
    private readonly chatsService: ChatsService,
    private readonly storageService: StorageService,
    private readonly planCheckerService: PlanCheckerService,
  ) {}

  @Get('/')
  @Serialize(ChatMetadataDto)
  async getChats(@CurrentUser() user: User) {
    return this.chatsService.findAllOwnedBy(user.id);
  }

  @Post('/')
  @Serialize(ChatMetadataDto)
  @UseInterceptors(FileInterceptor('file'))
  async createChat(
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
    @CurrentUser() user: User,
  ) {
    // One chat conversation per file. so files and chats are associated

    // Check user's plan
    const documentsCount = await this.chatsService.countDocumentsByOwner(
      user.id,
    );
    await this.planCheckerService.canUploadDocument(user.id, documentsCount);

    // Check if there's already a chat for the file
    const existingChat = await this.chatsService.findFileForOwner(
      user.id,
      file.originalname,
    );
    if (existingChat) {
      throw new BadRequestException('Chat already exists for this file');
    }

    // store embedded files with corresponding metadata
    const embeddingsIds = await this.ragService.loadFile(
      new Blob([file.buffer], { type: file.mimetype }),
      file.mimetype as MimeType,
      { filename: file.originalname, owner: user.id },
    );

    // store file in db
    const chat = await this.chatsService.create(
      user.id,
      file.originalname,
      file.size,
      file.mimetype as MimeType,
      embeddingsIds,
    );

    // store file in storage
    await this.storageService.uploadFile(`${user.id}/aaa`, file.buffer);

    return chat;
  }

  @Delete('/:id')
  async deleteChat(@Param('id') id: string) {
    const chat = await this.chatsService.findById(id);

    // delete file from vector store
    await this.ragService.deleteDocuments(chat.embeddingsIds);

    // delete file from storage
    await this.storageService
      .deleteFile(`${chat.ownerId}/${chat.id}-${chat.filename}`)
      .catch(() => null); // ignore not found errors

    // delete file from files db
    await this.chatsService.delete(id);

    return chat;
  }

  @Delete('/:id/messages')
  @Serialize(ChatMetadataDto)
  async deleteMessages(@Param('id') id: string) {
    const chat = await this.chatsService.findById(id);
    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    // delete messages from db
    await this.chatsService.deleteAllByChatId(id);

    return chat;
  }

  @Post('/:id')
  async postMessage(
    @Body() body: PostMessageDto,
    @CurrentUser() user: User,
    @Param('id') id: string,
  ) {
    // Check user's plan
    const startOfToday = new Date(new Date().setHours(0, 0, 0, 0));
    const messageCount = await this.chatsService.countMessagesByOwner(
      user.id,
      startOfToday,
      new Date(),
    );
    await this.planCheckerService.canSendMessage(user.id, messageCount);

    // Check user has permissions
    const chat = await this.chatsService.findById(id, { messages: true });
    if (!chat) {
      throw new NotFoundException('Chat not found');
    }
    if (chat.ownerId !== user.id) {
      throw new ForbiddenException('Not allowed');
    }

    // Create response
    const res = await this.ragService.invoke(
      body.message,
      chat.messages.map((m) => ({ agent: m.agent, message: m.message })),
      2,
      { filename: chat.filename, owner: user.id },
    );

    // Add user and ai message to chat
    await this.chatsService.addMessage(id, body.message, MessageAgent.USER);

    // Add ai message to chat
    await this.chatsService.addMessage(id, res.answer, MessageAgent.AI);

    return {
      question: body.message,
      answer: res.answer,
      context: res.context,
    };
  }

  @Get('/:id')
  @Serialize(ChatDto)
  async getChat(@Param('id') id: string) {
    const chat = this.chatsService.findById(id, { messages: true });
    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    return chat;
  }
}
