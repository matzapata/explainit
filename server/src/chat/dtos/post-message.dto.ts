import { IsString } from 'class-validator';

export class PostMessageDto {
  @IsString()
  message: string;
}
