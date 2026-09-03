import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseFilePipeBuilder,
  Post,
  Put,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Request, Response } from 'express';
import 'multer';
import { FileInterceptor } from '@nestjs/platform-express';
import { ChatsService } from '@src/modules/chat/chat.service';
import { AuthGuard } from '@src/infra/http/guards/auth.guard';
import { CurrentUser } from '@src/infra/http/decorators/current-user.decorator';
import { Serialize } from '@src/infra/http/interceptors/serialize.interceptor';
import { ObjectStorageService } from '@src/infra/object-storage/object-storage.service';
import { ChatMetadataDto } from './dto/get-chat-metadata.dto';
import { UpdateChatMetadataDto } from './dto/put-chat-metadata.dto';
import { AuthUser } from '@src/modules/user/auth-user';
import { Chat, ChatResource } from '@prisma/client';
import { PostMessageDto } from './dto/post-message.dto';
import { RateLimit } from '@src/infra/http/decorators/rate-limit.decorator';
import { AdminGuard } from '@src/infra/http/guards/admin.guard';
import { DocumentsService } from '@src/modules/documents/documents.service';

@Controller('api/chats')
export class ChatController {
  constructor(
    private readonly chatsService: ChatsService,
    private readonly objectStorage: ObjectStorageService,
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

    await this.objectStorage.deleteFile(`logos/${chat.id}.webp`);

    const resized = await this.objectStorage.resizeImage(file.buffer, 200, 200);

    await this.objectStorage.uploadFile(`logos/${chat.id}.webp`, resized);

    chat = await this.chatsService.update(user.id, id, {
      logo: await this.objectStorage.getFileUrl(`logos/${chat.id}.webp`, true),
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
  async postMessage(
    @Body() body: PostMessageDto,
    @Param('id') id: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const chat = await this.chatsService.findFirstById(id);
    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    await this.chatsService.incrementPoints(chat.id);

    // Server-Sent Events: stream tokens as they're generated instead of
    // waiting for the full answer. Kept inline since it's a handful of
    // lines specific to this one route.
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // disable nginx response buffering
    res.socket?.setNoDelay(true); // flush each chunk immediately
    res.flushHeaders();

    const send = (event: string, data: unknown) =>
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

    const abort = new AbortController();
    const onDisconnect = () => abort.abort();
    req.on('close', onDisconnect);

    try {
      const result = await this.chatsService.answer(
        body.question,
        body.chatHistory,
        4,
        chat.id,
        (token) => {
          if (!abort.signal.aborted) {
            send('token', { text: token });
          }
        },
        abort.signal,
      );

      if (!abort.signal.aborted) {
        send('done', result);
      }
    } catch (error) {
      if (!abort.signal.aborted && !res.writableEnded) {
        const message =
          error instanceof Error ? error.message : 'Failed to generate answer';
        send('error', { message });
      }
    } finally {
      req.off('close', onDisconnect);
      if (!res.writableEnded) {
        res.end();
      }
    }
  }
}
