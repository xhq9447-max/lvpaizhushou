import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, RoleCode } from '@prisma/client';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/types/auth-user';
import { OperationLogsService } from '../operation-logs/operation-logs.service';
import { CreateMerchantDto } from './dto/create-merchant.dto';
import { QueryMerchantsDto } from './dto/query-merchants.dto';
import { UpdateMerchantDto } from './dto/update-merchant.dto';

@Injectable()
export class MerchantsService {
  constructor(private readonly prisma: PrismaService, private readonly logs: OperationLogsService) {}

  async findAll(query: QueryMerchantsDto) {
    const where: Prisma.MerchantWhereInput = {
      status: query.status,
      OR: query.keyword ? [{ name: { contains: query.keyword } }, { merchantCode: { contains: query.keyword } }] : undefined,
    };
    const [items, total] = await Promise.all([
      this.prisma.merchant.findMany({ where, skip: (query.page - 1) * query.pageSize, take: query.pageSize, orderBy: { createdAt: 'desc' }, include: { _count: { select: { stores: { where: { deletedAt: null } }, employees: { where: { deletedAt: null } } } } } }),
      this.prisma.merchant.count({ where }),
    ]);
    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  async findOne(id: string) {
    const merchant = await this.prisma.merchant.findUnique({ where: { id }, include: { _count: { select: { stores: { where: { deletedAt: null } }, employees: { where: { deletedAt: null } }, users: true } } } });
    if (!merchant) throw new NotFoundException('商家不存在');
    return merchant;
  }

  async create(dto: CreateMerchantDto, operator: AuthUser) {
    const duplicate = await this.prisma.user.findUnique({ where: { username: dto.ownerUsername } });
    if (duplicate) throw new ConflictException('老板登录账号已存在');
    const passwordHash = await argon2.hash(dto.ownerPassword);
    const merchant = await this.prisma.$transaction(async (tx) => {
      const created = await tx.merchant.create({ data: {
        name: dto.name, merchantCode: dto.merchantCode, contactName: dto.contactName, contactPhone: dto.contactPhone,
        plan: dto.plan, expireAt: dto.expireAt ? new Date(dto.expireAt) : undefined,
      } });
      const user = await tx.user.create({ data: { merchantId: created.id, username: dto.ownerUsername, phone: dto.ownerPhone, passwordHash, role: RoleCode.OWNER } });
      await tx.employee.create({ data: { merchantId: created.id, userId: user.id, name: dto.ownerName, phone: dto.ownerPhone, role: RoleCode.OWNER } });
      return created;
    });
    await this.logs.record(operator, 'CREATE', 'merchant', merchant.id, { name: merchant.name });
    return merchant;
  }

  async update(id: string, dto: UpdateMerchantDto, operator: AuthUser) {
    await this.findOne(id);
    const merchant = await this.prisma.merchant.update({ where: { id }, data: { ...dto, expireAt: dto.expireAt ? new Date(dto.expireAt) : undefined } });
    await this.logs.record(operator, 'UPDATE', 'merchant', id, { fields: Object.keys(dto) });
    return merchant;
  }
}
