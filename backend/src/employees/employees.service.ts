import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, RoleCode } from '@prisma/client';
import { AuthUser } from '../common/types/auth-user';
import { OperationLogsService } from '../operation-logs/operation-logs.service';
import { TenantPrismaService } from '../prisma/tenant-prisma.service';
import { CreateEmployeeDto, UpdateEmployeeDto } from './dto/employee.dto';
import { QueryEmployeesDto } from './dto/query-employees.dto';

@Injectable()
export class EmployeesService {
  constructor(private readonly tenant: TenantPrismaService, private readonly logs: OperationLogsService) {}
  async findAll(query: QueryEmployeesDto) {
    const where: Prisma.EmployeeWhereInput = {
      role: query.role, storeId: query.storeId, status: query.status,
      OR: query.keyword ? [{ name: { contains: query.keyword } }, { phone: { contains: query.keyword } }] : undefined,
    };
    const [items, total] = await Promise.all([this.tenant.employees.findMany(where, (query.page - 1) * query.pageSize, query.pageSize), this.tenant.employees.count(where)]);
    return { items, total, page: query.page, pageSize: query.pageSize };
  }
  async findOne(id: string) {
    const item = await this.tenant.employees.findById(id);
    if (!item) throw new NotFoundException('员工不存在');
    return item;
  }
  async create(dto: CreateEmployeeDto, user: AuthUser) {
    await this.ensureStore(dto.storeId);
    const item = await this.tenant.employees.create({ ...dto, joinDate: dto.joinDate ? new Date(dto.joinDate) : undefined });
    await this.logs.record(user, 'CREATE', 'employee', item.id, { name: item.name, role: item.role });
    return item;
  }
  async update(id: string, dto: UpdateEmployeeDto, user: AuthUser) {
    const existing = await this.findOne(id);
    if (existing.role === RoleCode.OWNER) throw new ForbiddenException('老板档案不能通过员工管理修改');
    await this.ensureStore(dto.storeId);
    const data = { ...dto, joinDate: dto.joinDate ? new Date(dto.joinDate) : undefined };
    const result = await this.tenant.employees.update(id, data);
    if (!result.count) throw new NotFoundException('员工不存在');
    await this.logs.record(user, 'UPDATE', 'employee', id, { fields: Object.keys(dto) });
    return this.findOne(id);
  }
  async remove(id: string, user: AuthUser) {
    const existing = await this.findOne(id);
    if (existing.role === RoleCode.OWNER) throw new ForbiddenException('老板档案不能通过员工管理删除');
    const result = await this.tenant.employees.softDelete(id);
    if (!result.count) throw new NotFoundException('员工不存在');
    await this.logs.record(user, 'DELETE', 'employee', id);
  }
  private async ensureStore(storeId?: string): Promise<void> {
    if (storeId && !(await this.tenant.stores.findById(storeId))) throw new BadRequestException('所属门店不存在或不属于当前商家');
  }
}
