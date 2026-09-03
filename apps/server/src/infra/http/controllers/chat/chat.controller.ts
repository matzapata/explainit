import {
  Body,
  Controller,
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
import { Express } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { ChatsService } from '@src/modules/chat/chat.service';
import { AuthGuard } from '@src/infra/http/guards/auth.guard';
import { CurrentUser } from '@src/infra/http/decorators/current-user.decorator';
import { Serialize } from '@src/infra/http/interceptors/serialize.interceptor';
import { StorageService } from '@src/infra/storage/storage.service';
import { ChatMetadataDto } from '@src/modules/chat/dto/get-chat-metadata.dto';
import { UpdateChatMetadataDto } from '@src/modules/chat/dto/put-chat-metadata.dto';
import { AuthUser } from '@src/modules/user/domain/user';
import { Chat, ChatResource } from '@prisma/client';
import { PostMessageDto } from '@src/modules/chat/dto/post-message.dto';
import { RateLimit } from '@src/infra/http/decorators/rate-limit.decorator';
import { AdminGuard } from '@src/infra/http/guards/admin.guard';
import { DocumentsService } from '@src/modules/documents/documents.service';

@Controller('api/chats')
export class ChatController {
  constructor(
    private readonly chatsService: ChatsService,
    private readonly storageService: StorageService,
    private readonly documentsService: DocumentsService,
  ) {}

  @Get('/admin')
  @UseGuards(AdminGuard)
  @Serialize(ChatMetadataDto)
  async getAllChatsByOwner(@CurrentUser() user: AuthUser): Promise<Chat[]> {
    return this.chatsService.findManyByOwner(user.id);
  }

  @Post('/admin')
  @UseGuards(AdminGuard)
  @Serialize(ChatMetadataDto)
  async createChat(
    @CurrentUser() user: AuthUser,
    @Body() data: UpdateChatMetadataDto,
  ): Promise<Chat> {
    return this.chatsService.create(user.id, data);
  }

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

    const resources = await this.documentsService.findByChatId(chat.id);

    return { ...chat, logo: chat.logo + '?v=' + Date.now(), resources };
  }

  @Put('/:id')
  @UseGuards(AuthGuard)
  @Serialize(ChatMetadataDto)
  async updateChat(
    @CurrentUser() user: AuthUser,
    @Body() data: UpdateChatMetadataDto,
    @Param('id') id: string,
  ): Promise<Chat> {
    return this.chatsService.update(user.id, id, data);
  }

  @Put('/:id/logo')
  @UseGuards(AuthGuard)
  @Serialize(ChatMetadataDto)
  @UseInterceptors(FileInterceptor('file'))
  async updateChatLogo(
    @CurrentUser() user: AuthUser,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
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

    await this.storageService.deleteFile(`logos/${chat.id}.webp`);

    const resized = await this.storageService.resizeImage(
      file.buffer,
      200,
      200,
    );

    await this.storageService.uploadFile(`logos/${chat.id}.webp`, resized);

    chat = await this.chatsService.update(user.id, id, {
      logo: await this.storageService.getFileUrl(`logos/${chat.id}.webp`, true),
    });

    return { ...chat, logo: chat.logo + '?v=' + Date.now() };
  }

  @Get('/:id')
  @Serialize(ChatMetadataDto)
  async getChat(@Param('id') id: string) {
    const chat = await this.chatsService.findFirstById(id);
    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    return chat;
  }

  @Post('/:id/messages')
  @RateLimit({
    keyPrefix: 'chat-messages',
    points: 10,
    duration: 60,
    getKey: (req) => req.params.id,
  })
  async postMessage(@Body() body: PostMessageDto, @Param('id') id: string) {
    const chat = await this.chatsService.findFirstById(id);
    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    await this.chatsService.incrementPoints(chat.id);

    return this.chatsService.answer(
      body.question,
      body.chatHistory,
      4,
      chat.id,
    );
  }
}
