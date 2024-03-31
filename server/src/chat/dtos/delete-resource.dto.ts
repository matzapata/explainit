import { IsNumber } from 'class-validator';

export class DeleteResourceDto {
  @IsNumber()
  id: number;
}
