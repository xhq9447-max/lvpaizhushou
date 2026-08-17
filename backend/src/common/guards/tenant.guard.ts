import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleCode } from '@prisma/client';
import { PLATFORM_ENDPOINT_KEY, SKIP_TENANT_KEY } from '../decorators/platform.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AuthUser } from '../types/auth-user';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()])) return true;
    if (this.reflector.getAllAndOverride<boolean>(SKIP_TENANT_KEY, [context.getHandler(), context.getClass()])) return true;
    const platform = this.reflector.getAllAndOverride<boolean>(PLATFORM_ENDPOINT_KEY, [context.getHandler(), context.getClass()]);
    const user = context.switchToHttp().getRequest<{ user?: AuthUser }>().user;
    if (!user) return true;
    if (platform) {
      if (user.role !== RoleCode.SUPER_ADMIN) throw new ForbiddenException('仅平台管理员可访问');
      return true;
    }
    if (user.role === RoleCode.SUPER_ADMIN || !user.merchantId) {
      throw new ForbiddenException('该接口必须使用商家账号访问');
    }
    return true;
  }
}
