import { IsString } from 'class-validator';

export class PostResourceDto {
  @IsString({ each: true })
  urls: string[];
  @IsString()
  type: string; // web for now but can add github and more
}
