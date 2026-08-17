import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/types/auth-user';

@Injectable()
export class OperationLogsService {
  constructor(private readonly prisma: PrismaService) {}
  async record(user: AuthUser, action: string, resource: string, resourceId?: string, detail?: Prisma.InputJsonValue): Promise<void> {
    await this.prisma.operationLog.create({ data: { merchantId: user.merchantId, operatorId: user.userId, action, resource, resourceId, detail } });
  }
}
