import { Expose } from 'class-transformer';

export class ChatMetadataDto {
  @Expose()
  id: string;
  @Expose()
  name: string;
  @Expose()
  logo: string;
  @Expose()
  url: string;
  @Expose()
  conversationStarters: string[];
  @Expose()
  published: boolean;
  @Expose() // TODO: transform here
  resources: {
    id: string;
    type: string;
    data: string;
    status: string;
    error: string | null;
  }[];
  @Expose()
  description: string;
  @Expose()
  points: number;
}
