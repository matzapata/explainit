import { IsArray, IsOptional, IsString } from 'class-validator';
import { MessageAgent } from '@src/modules/chat/message';

export class PostMessageDto {
  @IsString()
  question: string;

  // TODO: Add validation for agent
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
