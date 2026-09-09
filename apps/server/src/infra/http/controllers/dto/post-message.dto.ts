import type { MessageAgent } from '@src/modules/chat/message';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class PostMessageDto {
  @IsString()
  question: string;

  // TODO: Add validation for agent. Remove, we should load from db/cache
  @IsArray()
  chatHistory: { message: string; agent: MessageAgent }[];

  @IsOptional()
  @IsString()
  pageUrl?: string;

  @IsOptional()
  @IsString()
  selectedText?: string;

  /** Optional visitor conversation id (client-held; replaces cookie). */
  @IsOptional()
  @IsString()
  conversationId?: string;
}
