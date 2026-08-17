import { EmployeeStatus, RoleCode } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';
export class QueryEmployeesDto extends PaginationDto {
  @IsOptional() @IsString() keyword?: string;
  @IsOptional() @IsEnum(RoleCode) role?: RoleCode;
  @IsOptional() @IsString() storeId?: string;
  @IsOptional() @IsEnum(EmployeeStatus) status?: EmployeeStatus;
}
