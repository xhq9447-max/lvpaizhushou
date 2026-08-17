import { IsString, Length } from 'class-validator';

export class LoginDto {
  @IsString() @Length(2, 50) username!: string;
  @IsString() @Length(8, 128) password!: string;
}
