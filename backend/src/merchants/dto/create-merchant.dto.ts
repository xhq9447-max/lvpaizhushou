import { Plan } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsPhoneNumber, IsString, Length, Matches, MinLength } from 'class-validator';

export class CreateMerchantDto {
  @IsString() @Length(2, 100) name!: string;
  @IsString() @Matches(/^[A-Z0-9_-]{3,30}$/) merchantCode!: string;
  @IsOptional() @IsString() @Length(2, 50) contactName?: string;
  @IsOptional() @IsPhoneNumber('CN') contactPhone?: string;
  @IsOptional() @IsEnum(Plan) plan?: Plan;
  @IsOptional() @IsDateString() expireAt?: string;
  @IsString() @Length(2, 50) ownerUsername!: string;
  @IsString() @MinLength(8) ownerPassword!: string;
  @IsString() @Length(2, 50) ownerName!: string;
  @IsPhoneNumber('CN') ownerPhone!: string;
}
