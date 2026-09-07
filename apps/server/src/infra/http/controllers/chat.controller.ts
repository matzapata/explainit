import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ChatsService } from '@src/modules/chat/chat.service';
import { ConversationService } from '@src/modules/chat/conversation.service';
import {
  CONVERSATION_COOKIE,
  conversationCookieHeader,
  parseCookieHeader,
} from '@src/modules/chat/visitor-context';
import { AuthGuard } from '@src/infra/http/guards/auth.guard';
import { CurrentUser } from '@src/infra/http/decorators/current-user.decorator';
import { Serialize } from '@src/infra/http/interceptors/serialize.interceptor';
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
    private readonly documentsService: DocumentsService,
    private readonly conversationService: ConversationService,
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

    return { ...chat, resources };
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

  @Get('/:id')
  @Serialize(ChatMetadataDto)
  async getChat(@Param('id') id: string, @Req() req: Request) {
    const chat = await this.chatsService.findFirstById(id);
    if (!chat) {
      throw new NotFoundException('Chat not found');
    }
    if (!chat.published && !req.currentUser) {
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
    if (!chat.published && !req.currentUser) {
      throw new NotFoundException('Chat not found');
    }

    await this.chatsService.incrementPoints(chat.id);

    const cookieConversationId = parseCookieHeader(
      req.headers.cookie,
      CONVERSATION_COOKIE,
    );
    const conversationId = await this.conversationService.resolveConversationId(
      chat.id,
      cookieConversationId,
    );
    res.setHeader(
      'Set-Cookie',
      conversationCookieHeader(conversationId, {
        secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
      }),
    );

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
        {
          pageUrl: body.pageUrl,
          selectedText: body.selectedText,
        },
      );

      if (!abort.signal.aborted) {
        send('done', result);
        void this.conversationService.persistTurn({
          conversationId,
          chatId: chat.id,
          question: body.question,
          answer: result.answer,
          context: result.context,
          pageUrl: body.pageUrl,
          selectedText: body.selectedText,
        });
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
