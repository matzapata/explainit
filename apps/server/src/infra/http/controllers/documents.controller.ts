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
import { AuthGuard } from '@src/infra/http/guards/auth.guard';
import { CurrentUser } from '@src/infra/http/decorators/current-user.decorator';
import { Serialize } from '@src/infra/http/interceptors/serialize.interceptor';
import { AuthUser } from '@src/modules/user/auth-user';
import { ChatsService } from '@src/modules/chat/chat.service';
import { CrawlerService } from '@src/infra/crawler/crawler.service';
import { DocumentsService } from '@src/modules/documents/documents.service';
import { GetResourceDto } from './dto/get-resource.dto';
import { PostResourceInspectDto } from './dto/post-resource-inspect.dto';
import {
  PostTextResourceDto,
  PostWebResourceDto,
} from './dto/post-resource.dto';

@Controller('api/chats')
export class DocumentsController {
  constructor(
    private readonly chatsService: ChatsService,
    private readonly documentsService: DocumentsService,
    private readonly crawlerService: CrawlerService,
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
    const chat = await this.chatsService.findFirstById(id);
    if (!chat) {
      throw new NotFoundException('Chat not found');
    } else if (chat.ownerId !== user.id) {
      throw new BadRequestException('Chat not owned by user');
    }

    return this.documentsService.enqueueWebsiteUrls(chat.id, resource.urls);
  }

  @Post('/:id/resources/text')
  @UseGuards(AuthGuard)
  @Serialize(GetResourceDto)
  async loadTextResource(
    @CurrentUser() user: AuthUser,
    @Body() resource: PostTextResourceDto,
    @Param('id') id: string,
  ) {
    const chat = await this.chatsService.findFirstById(id);
    if (!chat) {
      throw new NotFoundException('Chat not found');
    } else if (chat.ownerId !== user.id) {
      throw new BadRequestException('Chat not owned by user');
    }

    const created = await this.documentsService.createTextResource(chat.id, {
      text: resource.text,
      source: resource.source,
      title: resource.title,
    });

    return [created];
  }

  @Post('/:id/resources/web/inspect')
  @UseGuards(AuthGuard)
  async inspectWebResource(
    @CurrentUser() user: AuthUser,
    @Body() data: PostResourceInspectDto,
    @Param('id') id: string,
  ) {
    const chat = await this.chatsService.findFirstById(id);
    if (!chat) {
      throw new NotFoundException('Chat not found');
    } else if (chat.ownerId !== user.id) {
      throw new BadRequestException('Chat not owned by user');
    }

    const crawledUrls = await this.crawlerService.inspect({
      url: data.url,
    });

    const resources = await this.documentsService.findByChatId(chat.id);
    const urls = resources.map((r) => r.data);
    return { urls: crawledUrls.filter((r) => !urls.includes(r)) };
  }

  @Delete('/:id/resources/:resource_id')
  @UseGuards(AuthGuard)
  @Serialize(GetResourceDto)
  async deleteResourcesFromChat(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('resource_id') resource_id: string,
  ) {
    const chat = await this.chatsService.findFirstById(id);
    if (!chat) {
      throw new NotFoundException('Chat not found');
    } else if (chat.ownerId !== user.id) {
      throw new BadRequestException('Chat not owned by user');
    }

    const resource = await this.documentsService.findById(resource_id);
    if (!resource || resource.chatId !== chat.id) {
      throw new NotFoundException('Resource not found');
    }

    const deleted = await this.documentsService.deleteWithEmbeddings(
      resource_id,
    );
    if (!deleted) {
      throw new NotFoundException('Resource not found');
    }

    return deleted;
  }
}
