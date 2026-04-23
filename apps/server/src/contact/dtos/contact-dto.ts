import { IsString, Length } from 'class-validator';

export class CreateContactDto {
  @IsString()
  @Length(100, 300)
  readonly message: string;

  @IsString()
  @Length(5, 50)
  readonly subject: string;
}
