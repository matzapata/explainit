import { CHAT_COLORS } from '@src/modules/chat/chat-colors';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
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
  @IsIn([...CHAT_COLORS])
  color?: (typeof CHAT_COLORS)[number];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  hostOrigins?: string[];

  @IsOptional()
  @MaxLength(100, { each: true })
  @MinLength(15, { each: true })
  conversationStarters?: string[];

  @IsOptional()
  @IsBoolean()
  published?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  @MinLength(15)
  description?: string;
}
