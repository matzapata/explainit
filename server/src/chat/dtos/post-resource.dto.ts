import { IsUrl } from 'class-validator';

export class PostResourceDto {
  @IsUrl()
  url: string;
}
