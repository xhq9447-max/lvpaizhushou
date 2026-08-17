import { MerchantStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';
export class QueryMerchantsDto extends PaginationDto {
  @IsOptional() @IsString() keyword?: string;
  @IsOptional() @IsEnum(MerchantStatus) status?: MerchantStatus;
}
