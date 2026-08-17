import { FileCategory } from '@prisma/client';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class UploadFileDto {
  @IsOptional() @IsEnum(FileCategory) category: FileCategory = FileCategory.OTHER;
  @IsOptional() @IsString() @MaxLength(50) relatedType?: string;
  @IsOptional() @IsString() @MaxLength(100) relatedId?: string;
}

export class RegisterClientFileDto {
  @IsString() @IsNotEmpty() @MaxLength(512) fileId!: string;
  @IsString() @IsNotEmpty() @MaxLength(512) cloudPath!: string;
  @IsString() @IsNotEmpty() @MaxLength(255) originalName!: string;
  @IsString() @IsNotEmpty() @MaxLength(100) mimeType!: string;
  @IsInt() @Min(1) @Max(20 * 1024 * 1024) size!: number;
  @IsOptional() @IsEnum(FileCategory) category: FileCategory = FileCategory.PHOTO;
}
