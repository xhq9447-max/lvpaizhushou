import { OrderStatus, ServiceStage } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateOrderDto {
  @IsString() @IsNotEmpty() @MaxLength(50) customerName!: string;
  @IsString() @IsNotEmpty() @MaxLength(30) customerPhone!: string;
  @IsString() @IsNotEmpty() storeId!: string;
  @IsOptional() @IsString() @MaxLength(100) packageName?: string;
  @IsOptional() @IsDateString() appointmentAt?: string;
  @IsOptional() @IsString() @MaxLength(1000) notes?: string;
}

export class PublicCreateOrderDto extends CreateOrderDto {
  @IsString() @IsNotEmpty() merchantCode!: string;
}

export class QueryOrdersDto {
  @IsOptional() @IsEnum(OrderStatus) status?: OrderStatus;
  @IsOptional() @IsString() keyword?: string;
  @IsOptional() @IsString() storeId?: string;
  @Type(() => Number) @IsInt() @Min(1) page = 1;
  @Type(() => Number) @IsInt() @Min(1) @Max(100) pageSize = 20;
}

export class StageDto {
  @IsEnum(ServiceStage) stage!: ServiceStage;
}

export class QueryStageDto extends StageDto {}

export class ReplaceServiceDto extends StageDto {
  @IsString() @IsNotEmpty() newEmployeeId!: string;
  @IsString() @IsNotEmpty() @MaxLength(300) reason!: string;
}

export class CreateValueAddedDto extends StageDto {
  @IsString() @IsNotEmpty() @MaxLength(100) name!: string;
  @Type(() => Number) @IsInt() @Min(1) @Max(99) quantity!: number;
  @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) unitAmount!: number;
  @IsOptional() @IsString() @MaxLength(500) description?: string;
}

export class DisputeValueAddedDto {
  @IsString() @IsNotEmpty() @MaxLength(500) reason!: string;
}
