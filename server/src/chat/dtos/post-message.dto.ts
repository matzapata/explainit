import { IsArray, IsString } from 'class-validator';
import { MessageAgent } from '../services/rag.service';

export class PostMessageDto {
  @IsString()
  question: string;

  // TODO: Add validation for agent
  @IsArray()
  chatHistory: { message: string; agent: MessageAgent }[];
}
