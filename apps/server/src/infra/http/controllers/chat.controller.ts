import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Chat } from '@prisma/client';
import type { EnvService } from '@src/infra/env/env.service';
import { CurrentUser } from '@src/infra/http/decorators/current-user.decorator';
import { RateLimit } from '@src/infra/http/decorators/rate-limit.decorator';
import { AdminGuard } from '@src/infra/http/guards/admin.guard';
import { AuthGuard } from '@src/infra/http/guards/auth.guard';
import { Serialize } from '@src/infra/http/interceptors/serialize.interceptor';
import type { ChatsService } from '@src/modules/chat/chat.service';
import type { ConversationService } from '@src/modules/chat/conversation.service';
import {
  normalizeHostOrigins,
  parseDashboardOrigins,
  requestOrigin,
  visitorOriginAllowed,
} from '@src/modules/chat/visitor-context';
import type { DocumentsService } from '@src/modules/documents/documents.service';
import type { AuthUser } from '@src/modules/user/auth-user';
import type { Request, Response } from 'express';
import { ChatMetadataDto } from './dto/get-chat-metadata.dto';
import type { PostMessageDto } from './dto/post-message.dto';
import type { UpdateChatMetadataDto } from './dto/put-chat-metadata.dto';

@Controller('api/chats')
export class ChatController {
  constructor(
    private readonly chatsService: ChatsService,
    private readonly documentsService: DocumentsService,
    private readonly conversationService: ConversationService,
    private readonly env: EnvService,
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
    return this.chatsService.create(user.id, this.normalizeUpdate(data));
  }

  @Get('/')
  @UseGuards(AuthGuard)
  @Serialize(ChatMetadataDto)
  async getChatsByOwner(@CurrentUser() user: AuthUser): Promise<Chat[]> {
    let chats = await this.chatsService.findManyByOwner(user.id);
    if (chats.length === 0) {
      const chat = await this.chatsService.create(user.id, {});
      chats = [chat];
    }

    return chats;
  }

  @Put('/:id')
  @UseGuards(AuthGuard)
  @Serialize(ChatMetadataDto)
  async updateChat(
    @CurrentUser() user: AuthUser,
    @Body() data: UpdateChatMetadataDto,
    @Param('id') id: string,
  ): Promise<Chat> {
    return this.chatsService.update(user.id, id, this.normalizeUpdate(data));
  }

  @Delete('/:id')
  @UseGuards(AuthGuard)
  @Serialize(ChatMetadataDto)
  async deleteChat(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ): Promise<Chat> {
    const chat = await this.chatsService.findFirstById(id);
    if (!chat) {
      throw new NotFoundException('Chat not found');
    }
    if (chat.ownerId !== user.id && !user.isAdmin) {
      throw new NotFoundException('Chat not found');
    }

    await this.documentsService.deleteChatNamespace(chat.id);
    return this.chatsService.delete(chat.id);
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
    this.assertVisitorOrigin(req, chat.hostOrigins);

    const isOwner = req.currentUser?.id === chat.ownerId;
    if (isOwner) {
      const resources = await this.documentsService.findByChatId(chat.id);
      return { ...chat, resources };
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
    this.assertVisitorOrigin(req, chat.hostOrigins);

    await this.chatsService.incrementPoints(chat.id);

    const conversationId = await this.conversationService.resolveConversationId(
      chat.id,
      body.conversationId,
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
        send('done', { ...result, conversationId });
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

  private normalizeUpdate(data: UpdateChatMetadataDto): UpdateChatMetadataDto {
    if (data.hostOrigins === undefined) {
      return data;
    }

    try {
      return {
        ...data,
        hostOrigins: normalizeHostOrigins(data.hostOrigins, { strict: true }),
      };
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Invalid hostOrigins',
      );
    }
  }

  private assertVisitorOrigin(req: Request, hostOrigins: string[] = []) {
    const origin = requestOrigin(
      headerString(req.headers.origin),
      headerString(req.headers.referer),
    );
    const allowed = visitorOriginAllowed(origin, hostOrigins, {
      dashboardOrigins: parseDashboardOrigins(this.env.get('CORS_ORIGIN')),
    });
    if (!allowed) {
      throw new NotFoundException('Chat not found');
    }
  }
}

function headerString(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}
