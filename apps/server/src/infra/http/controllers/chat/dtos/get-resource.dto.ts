import { Expose } from 'class-transformer';

export class GetResourceDto {
  @Expose()
  id: string;
  @Expose()
  type: string;
  @Expose()
  data: string;
  @Expose()
  urls: string[];
}
