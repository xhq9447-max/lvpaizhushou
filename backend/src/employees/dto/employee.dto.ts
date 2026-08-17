import { EmployeeStatus, RoleCode } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsString, IsUrl, Length, Matches } from 'class-validator';

const EMPLOYEE_ROLES = [RoleCode.MANAGER, RoleCode.RECEPTION, RoleCode.SALES, RoleCode.MAKEUP, RoleCode.PHOTOGRAPHER, RoleCode.RETOUCHER];

export class CreateEmployeeDto {
  @IsString() @Length(2, 50) name!: string;
  @Matches(/^1[3-9]\d{9}$/) phone!: string;
  @IsOptional() @IsString() storeId?: string;
  @IsEnum(EMPLOYEE_ROLES) role!: RoleCode;
  @IsOptional() @IsUrl({ require_protocol: true }) avatar?: string;
  @IsOptional() @IsEnum(EmployeeStatus) status?: EmployeeStatus;
  @IsOptional() @IsDateString() joinDate?: string;
}

export class UpdateEmployeeDto {
  @IsOptional() @IsString() @Length(2, 50) name?: string;
  @IsOptional() @Matches(/^1[3-9]\d{9}$/) phone?: string;
  @IsOptional() @IsString() storeId?: string;
  @IsOptional() @IsEnum(EMPLOYEE_ROLES) role?: RoleCode;
  @IsOptional() @IsUrl({ require_protocol: true }) avatar?: string;
  @IsOptional() @IsEnum(EmployeeStatus) status?: EmployeeStatus;
  @IsOptional() @IsDateString() joinDate?: string;
}
