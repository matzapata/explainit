import { IsUrl } from 'class-validator';

export class PostResourceDto {
  @IsUrl()
  resourceUrl: string;
}
