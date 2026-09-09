import { IsOptional, IsString } from 'class-validator';

export class PostMessageDto {
  @IsString()
  question: string;

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
