import { StoreStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, Length, Matches } from 'class-validator';

export class CreateStoreDto {
  @IsString() @Length(2, 100) name!: string;
  @IsOptional() @IsString() @Length(2, 255) address?: string;
  @IsOptional() @Matches(/^[0-9+\-() ]{6,20}$/) contactPhone?: string;
  @IsOptional() @IsEnum(StoreStatus) status?: StoreStatus;
}

export class UpdateStoreDto {
  @IsOptional() @IsString() @Length(2, 100) name?: string;
  @IsOptional() @IsString() @Length(2, 255) address?: string;
  @IsOptional() @Matches(/^[0-9+\-() ]{6,20}$/) contactPhone?: string;
  @IsOptional() @IsEnum(StoreStatus) status?: StoreStatus;
}
