import { ForbiddenException, Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { EmployeeStatus, Prisma, RoleCode, StoreStatus } from '@prisma/client';
import { Request } from 'express';
import { PrismaService } from './prisma.service';
import { AuthUser } from '../common/types/auth-user';

type AuthRequest = Request & { user?: AuthUser };

@Injectable({ scope: Scope.REQUEST })
export class TenantPrismaService {
  constructor(private readonly prisma: PrismaService, @Inject(REQUEST) private readonly request: AuthRequest) {}

  get merchantId(): string {
    const merchantId = this.request.user?.merchantId;
    if (!merchantId) throw new ForbiddenException('缺少商户身份');
    return merchantId;
  }

  readonly stores = {
    findMany: (where: Prisma.StoreWhereInput, skip: number, take: number) => this.prisma.store.findMany({
      where: { ...where, merchantId: this.merchantId, deletedAt: null }, skip, take, orderBy: { createdAt: 'desc' },
    }),
    count: (where: Prisma.StoreWhereInput = {}) => this.prisma.store.count({ where: { ...where, merchantId: this.merchantId, deletedAt: null } }),
    findById: (id: string) => this.prisma.store.findFirst({ where: { id, merchantId: this.merchantId, deletedAt: null } }),
    create: (data: { name: string; address?: string; contactPhone?: string; status?: StoreStatus }) =>
      this.prisma.store.create({ data: { ...data, merchantId: this.merchantId } }),
    update: (id: string, data: Prisma.StoreUpdateManyMutationInput) =>
      this.prisma.store.updateMany({ where: { id, merchantId: this.merchantId, deletedAt: null }, data }),
    softDelete: (id: string) => this.prisma.store.updateMany({ where: { id, merchantId: this.merchantId, deletedAt: null }, data: { deletedAt: new Date(), status: StoreStatus.DISABLED } }),
  };

  readonly employees = {
    findMany: (where: Prisma.EmployeeWhereInput, skip: number, take: number) => this.prisma.employee.findMany({
      where: { ...where, merchantId: this.merchantId, deletedAt: null }, skip, take, orderBy: { createdAt: 'desc' }, include: { store: true },
    }),
    count: (where: Prisma.EmployeeWhereInput = {}) => this.prisma.employee.count({ where: { ...where, merchantId: this.merchantId, deletedAt: null } }),
    findById: (id: string) => this.prisma.employee.findFirst({ where: { id, merchantId: this.merchantId, deletedAt: null }, include: { store: true } }),
    create: (data: { name: string; phone: string; storeId?: string; role: RoleCode; avatar?: string; status?: EmployeeStatus; joinDate?: Date }) =>
      this.prisma.employee.create({ data: { ...data, merchantId: this.merchantId }, include: { store: true } }),
    update: (id: string, data: Prisma.EmployeeUpdateManyMutationInput) =>
      this.prisma.employee.updateMany({ where: { id, merchantId: this.merchantId, deletedAt: null }, data }),
    softDelete: (id: string) => this.prisma.employee.updateMany({ where: { id, merchantId: this.merchantId, deletedAt: null }, data: { deletedAt: new Date(), status: EmployeeStatus.DISABLED } }),
  };
}
