import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '@src/infra/http/decorators/current-user.decorator';
import { AuthGuard } from '@src/infra/http/guards/auth.guard';
import { Serialize } from '@src/infra/http/interceptors/serialize.interceptor';
import { ChatsService } from '@src/modules/chat/chat.service';
import { DocumentsService } from '@src/modules/documents/documents.service';
import type { AuthUser } from '@src/modules/user/auth-user';
import { GetResourceDto } from './dto/get-resource.dto';
import {
  PostTextResourceDto,
  PostWebCrawlDto,
  PostWebResourceDto,
} from './dto/post-resource.dto';

@Controller('api/chats')
export class DocumentsController {
  constructor(
    private readonly chatsService: ChatsService,
    private readonly documentsService: DocumentsService,
  ) {}

  @Post('/:id/resources/web')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.ACCEPTED)
  @Serialize(GetResourceDto)
  async loadWebResource(
    @CurrentUser() user: AuthUser,
    @Body() resource: PostWebResourceDto,
    @Param('id') id: string,
  ) {
    const chat = await this.requireOwnedChat(user, id);
    return this.documentsService.enqueueWebsiteUrls(chat.id, resource.urls);
  }

  @Post('/:id/resources/web/crawl')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.ACCEPTED)
  @Serialize(GetResourceDto)
  async crawlWebResource(
    @CurrentUser() user: AuthUser,
    @Body() resource: PostWebCrawlDto,
    @Param('id') id: string,
  ) {
    const chat = await this.requireOwnedChat(user, id);
    const created = await this.documentsService.enqueueWebsiteCrawl(
      chat.id,
      resource.url,
    );
    return [created];
  }

  @Post('/:id/resources/text')
  @UseGuards(AuthGuard)
  @Serialize(GetResourceDto)
  async loadTextResource(
    @CurrentUser() user: AuthUser,
    @Body() resource: PostTextResourceDto,
    @Param('id') id: string,
  ) {
    const chat = await this.requireOwnedChat(user, id);
    const created = await this.documentsService.createTextResource(chat.id, {
      text: resource.text,
      title: resource.title,
    });

    return [created];
  }

  @Delete('/:id/resources/:resource_id')
  @UseGuards(AuthGuard)
  @Serialize(GetResourceDto)
  async deleteResourcesFromChat(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('resource_id') resource_id: string,
  ) {
    const chat = await this.requireOwnedChat(user, id);

    const resource = await this.documentsService.findById(resource_id);
    if (!resource || resource.chatId !== chat.id) {
      throw new NotFoundException('Resource not found');
    }

    const deleted =
      await this.documentsService.deleteWithEmbeddings(resource_id);
    if (!deleted) {
      throw new NotFoundException('Resource not found');
    }

    return deleted;
  }

  private async requireOwnedChat(user: AuthUser, id: string) {
    const chat = await this.chatsService.findFirstById(id);
    if (!chat) {
      throw new NotFoundException('Chat not found');
    }
    if (chat.ownerId !== user.id) {
      throw new BadRequestException('Chat not owned by user');
    }
    return chat;
  }
}
