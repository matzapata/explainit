import { Expose } from 'class-transformer';

export class GetResourceDto {
  @Expose()
  id: string;
  @Expose()
  type: string;
  @Expose()
  data: string;
  @Expose()
  title: string | null;
  @Expose()
  status: string;
  @Expose()
  error: string | null;
  @Expose()
  updatedAt: Date;
  @Expose()
  urls: string[];
}
