import { IsObject, IsString } from 'class-validator';
import { MessageAgent } from '../services/rag.service';

export class PostMessageDto {
  @IsString()
  question: string;

  // TODO: Add validation for agent
  @IsObject()
  chatHistory: { message: string; agent: MessageAgent }[];
}
