import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { MerchantStatus, UserStatus } from '@prisma/client';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/types/auth-user';

interface JwtPayload { sub: string; merchantId: string | null; role: AuthUser['role']; type: 'access'; }

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService, private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthUser> {
    if (payload.type !== 'access') throw new UnauthorizedException('Token 类型无效');
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub }, include: { merchant: true } });
    if (!user || user.status !== UserStatus.ACTIVE) throw new UnauthorizedException('账号不可用');
    if (user.merchant && user.merchant.status !== MerchantStatus.ACTIVE) throw new UnauthorizedException('商家不可用');
    if (user.merchantId !== payload.merchantId || user.role !== payload.role) throw new UnauthorizedException('账号权限已变更，请重新登录');
    return { userId: user.id, merchantId: user.merchantId, role: user.role, username: user.username };
  }
}
