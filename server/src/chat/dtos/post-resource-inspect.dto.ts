import { IsUrl } from 'class-validator';

export class PostResourceInspectDto {
  @IsUrl()
  url: string;
}
