import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { TenantPrismaService } from '../prisma/tenant-prisma.service';
import { AuthUser } from '../common/types/auth-user';
import { OperationLogsService } from '../operation-logs/operation-logs.service';
import { CreateStoreDto, UpdateStoreDto } from './dto/store.dto';
import { QueryStoresDto } from './dto/query-stores.dto';

@Injectable()
export class StoresService {
  constructor(private readonly tenant: TenantPrismaService, private readonly logs: OperationLogsService) {}
  async findAll(query: QueryStoresDto) {
    const where: Prisma.StoreWhereInput = { status: query.status, OR: query.keyword ? [{ name: { contains: query.keyword } }, { address: { contains: query.keyword } }] : undefined };
    const [items, total] = await Promise.all([this.tenant.stores.findMany(where, (query.page - 1) * query.pageSize, query.pageSize), this.tenant.stores.count(where)]);
    return { items, total, page: query.page, pageSize: query.pageSize };
  }
  async findOne(id: string) {
    const item = await this.tenant.stores.findById(id);
    if (!item) throw new NotFoundException('门店不存在');
    return item;
  }
  async create(dto: CreateStoreDto, user: AuthUser) {
    const item = await this.tenant.stores.create(dto);
    await this.logs.record(user, 'CREATE', 'store', item.id, { name: item.name });
    return item;
  }
  async update(id: string, dto: UpdateStoreDto, user: AuthUser) {
    const result = await this.tenant.stores.update(id, dto);
    if (!result.count) throw new NotFoundException('门店不存在');
    await this.logs.record(user, 'UPDATE', 'store', id, { fields: Object.keys(dto) });
    return this.findOne(id);
  }
  async remove(id: string, user: AuthUser) {
    const result = await this.tenant.stores.softDelete(id);
    if (!result.count) throw new NotFoundException('门店不存在');
    await this.logs.record(user, 'DELETE', 'store', id);
  }
}
