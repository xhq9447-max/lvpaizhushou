import { FileCategory } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class UploadFileDto {
  @IsOptional() @IsEnum(FileCategory) category: FileCategory = FileCategory.OTHER;
  @IsOptional() @IsString() @MaxLength(50) relatedType?: string;
  @IsOptional() @IsString() @MaxLength(100) relatedId?: string;
}
