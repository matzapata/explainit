import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUrl,
  Length,
} from 'class-validator';
export class PostWebResourceDto {
  @IsString({ each: true })
  urls: string[];
}

export class PostWebCrawlDto {
  @IsUrl()
  url: string;

  @IsOptional()
  @IsBoolean()
  unlimited?: boolean;
}

export class PostTextResourceDto {
  @IsString()
  @Length(1000)
  text: string;
  @IsString()
  title: string;
}
