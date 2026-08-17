import { StoreStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';
export class QueryStoresDto extends PaginationDto {
  @IsOptional() @IsString() keyword?: string;
  @IsOptional() @IsEnum(StoreStatus) status?: StoreStatus;
}
