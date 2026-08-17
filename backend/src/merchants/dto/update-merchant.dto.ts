import { MerchantStatus, Plan } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsPhoneNumber, IsString, Length } from 'class-validator';

export class UpdateMerchantDto {
  @IsOptional() @IsString() @Length(2, 100) name?: string;
  @IsOptional() @IsString() logo?: string;
  @IsOptional() @IsString() @Length(2, 50) contactName?: string;
  @IsOptional() @IsPhoneNumber('CN') contactPhone?: string;
  @IsOptional() @IsEnum(MerchantStatus) status?: MerchantStatus;
  @IsOptional() @IsEnum(Plan) plan?: Plan;
  @IsOptional() @IsDateString() expireAt?: string;
}
