import { IsString, Length } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @Length(8, 20)
  readonly name: string;
}
