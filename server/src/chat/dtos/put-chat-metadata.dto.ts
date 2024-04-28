import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateChatMetadataDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  logo?: string;

  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @MaxLength(100, { each: true })
  @MinLength(15, { each: true })
  conversationStarters?: string[];

  @IsOptional()
  @IsBoolean()
  published?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @MinLength(15)
  description?: string;
}
