import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { FileCategory, Prisma } from '@prisma/client';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import { AuthUser } from '../common/types/auth-user';
import { OperationLogsService } from '../operation-logs/operation-logs.service';
import { PrismaService } from '../prisma/prisma.service';
import { UploadFileDto } from './dto/file.dto';
import { CloudBaseStorageService } from './cloudbase-storage.service';

@Injectable()
export class FilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: CloudBaseStorageService,
    private readonly logs: OperationLogsService,
  ) {}

  async upload(file: Express.Multer.File | undefined, dto: UploadFileDto, user: AuthUser) {
    const merchantId = this.merchantId(user);
    if (!file) throw new BadRequestException('请选择要上传的文件');
    const extension = this.safeExtension(file.originalname);
    const now = new Date();
    const cloudPath = `assets/${merchantId}/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, '0')}/${randomUUID()}${extension}`;
    const uploaded = await this.storage.upload(cloudPath, file.buffer);
    const metadata: Prisma.InputJsonValue | undefined = dto.relatedType || dto.relatedId
      ? { relatedType: dto.relatedType ?? null, relatedId: dto.relatedId ?? null }
      : undefined;
    let asset;
    try {
      asset = await this.prisma.fileAsset.create({ data: {
        merchantId, uploaderId: user.userId, fileId: uploaded.fileId, url: uploaded.url, cloudPath,
        originalName: file.originalname, mimeType: file.mimetype, size: file.size, category: dto.category ?? FileCategory.OTHER, metadata,
      } });
    } catch (error) {
      await this.storage.remove(uploaded.fileId).catch(() => undefined);
      throw error;
    }
    await this.logs.record(user, 'UPLOAD', 'file_asset', asset.id, { category: asset.category, size: asset.size, mimeType: asset.mimeType });
    return asset;
  }

  async findAll(user: AuthUser) {
    return this.prisma.fileAsset.findMany({
      where: { merchantId: this.merchantId(user) }, orderBy: { createdAt: 'desc' }, take: 100,
      select: { id: true, fileId: true, url: true, originalName: true, mimeType: true, size: true, category: true, metadata: true, createdAt: true },
    });
  }

  async downloadUrl(id: string, user: AuthUser) {
    const asset = await this.prisma.fileAsset.findFirst({ where: { id, merchantId: this.merchantId(user) } });
    if (!asset) throw new NotFoundException('文件不存在');
    return { fileId: asset.fileId, url: await this.storage.temporaryUrl(asset.fileId), expiresIn: 3600 };
  }

  private merchantId(user: AuthUser) {
    if (!user.merchantId) throw new ForbiddenException('缺少商户身份');
    return user.merchantId;
  }

  private safeExtension(name: string) {
    const extension = extname(name).toLowerCase();
    return /^\.[a-z0-9]{1,10}$/.test(extension) ? extension : '';
  }
}
