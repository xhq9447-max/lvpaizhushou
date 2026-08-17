import { BadRequestException, Controller, Get, Param, Post, UploadedFile, UseInterceptors, Body } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { AuthUser } from '../common/types/auth-user';
import { UploadFileDto } from './dto/file.dto';
import { FilesService } from './files.service';

const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf']);

@Controller('files')
export class FilesController {
  constructor(private readonly service: FilesService) {}

  @RequirePermissions('file:view')
  @Get()
  findAll(@CurrentUser() user: AuthUser) { return this.service.findAll(user); }

  @RequirePermissions('file:upload')
  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: Number(process.env.MAX_UPLOAD_MB ?? 20) * 1024 * 1024, files: 1 },
    fileFilter: (_request, file, callback) => callback(
      allowedMimeTypes.has(file.mimetype) ? null : new BadRequestException('仅支持 JPEG、PNG、WebP、HEIC 和 PDF'),
      allowedMimeTypes.has(file.mimetype),
    ),
  }))
  upload(@UploadedFile() file: Express.Multer.File | undefined, @Body() dto: UploadFileDto, @CurrentUser() user: AuthUser) {
    return this.service.upload(file, dto, user);
  }

  @RequirePermissions('file:view')
  @Get(':id/download-url')
  downloadUrl(@Param('id') id: string, @CurrentUser() user: AuthUser) { return this.service.downloadUrl(id, user); }
}
