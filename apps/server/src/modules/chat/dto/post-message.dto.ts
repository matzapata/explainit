import { IsArray, IsString } from 'class-validator';
import { MessageAgent } from '@src/modules/chat/message';

export class PostMessageDto {
  @IsString()
  question: string;

  // TODO: Add validation for agent
  @IsArray()
  chatHistory: { message: string; agent: MessageAgent }[];
}
