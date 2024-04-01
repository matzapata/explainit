import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

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
  @MaxLength(40, { each: true })
  conversationStarters?: string[];

  @IsOptional()
  @IsBoolean()
  published?: boolean;
}
