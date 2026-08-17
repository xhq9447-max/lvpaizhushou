import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleCode } from '@prisma/client';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthUser } from '../types/auth-user';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()])) return true;
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);
    if (!required?.length) return true;
    const user = context.switchToHttp().getRequest<{ user?: AuthUser }>().user;
    if (!user) return true;
    if (user.role === RoleCode.SUPER_ADMIN || user.role === RoleCode.OWNER) return true;
    const role = await this.prisma.role.findFirst({
      where: { code: user.role, OR: [{ merchantId: user.merchantId }, { merchantId: null }] },
      include: { permissions: { include: { permission: true } } },
    });
    const available = new Set(role?.permissions.map((item) => item.permission.code) ?? []);
    if (!required.every((permission) => available.has(permission))) throw new ForbiddenException('权限不足');
    return true;
  }
}
