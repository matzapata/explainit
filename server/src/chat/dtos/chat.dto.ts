import { Message } from '@prisma/client';
import { Expose, Transform } from 'class-transformer';
import { MimeType } from 'src/infrastructure/vectorstore/vectorstore.service';

export class ChatDto {
  @Expose()
  id: string;

  @Expose()
  filename: string;

  @Expose()
  filesize: number;

  @Expose()
  mimetype: MimeType;

  @Expose()
  createdAt: Date;

  @Expose()
  @Transform(({ obj }) => obj.ownerId)
  owner: string;

  @Expose()
  @Transform(({ obj }) => obj.messages)
  messages: Message[];
}
