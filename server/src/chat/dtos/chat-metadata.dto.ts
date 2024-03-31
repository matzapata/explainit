import { Expose } from 'class-transformer';

export class ChatMetadataDto {
  @Expose()
  id: string;
  @Expose()
  organizationName: string;
  @Expose()
  organizationLogo: string;
  @Expose()
  organizationUrl: string;
  @Expose()
  conversationStarters: string[];
  @Expose()
  published: boolean;
}
