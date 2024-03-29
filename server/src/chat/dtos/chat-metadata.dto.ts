import { Expose, Transform } from 'class-transformer';

export class ChatMetadataDto {
  @Expose()
  id: string;

  @Expose()
  filename: string;

  @Expose()
  filesize: number;

  @Expose()
  createdAt: Date;

  @Expose()
  mimetype: string;

  @Transform(({ obj }) => obj.user.id)
  owner: string;
}
