import { Expose, Type } from 'class-transformer';
import { GetResourceDto } from './get-resource.dto';

export class ChatMetadataDto {
  @Expose()
  id: string;
  @Expose()
  name: string;
  @Expose()
  hostOrigins: string[];
  @Expose()
  conversationStarters: string[];
  @Expose()
  published: boolean;
  @Expose()
  @Type(() => GetResourceDto)
  resources: GetResourceDto[];
  @Expose()
  description: string;
  @Expose()
  color: string;
  @Expose()
  points: number;
  @Expose()
  updatedAt: Date;
  @Expose()
  lastUsedAt: Date | null;
}
