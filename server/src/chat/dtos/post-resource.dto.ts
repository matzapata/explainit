import { IsString, Length } from 'class-validator';

export class PostWebResourceDto {
  @IsString({ each: true })
  urls: string[];
}

export class PostTextResourceDto {
  @IsString()
  @Length(1000)
  text: string;
  @IsString()
  source: string;
  @IsString()
  title: string;
}
