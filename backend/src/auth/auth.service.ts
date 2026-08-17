import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { MerchantStatus, UserStatus } from '@prisma/client';
import * as argon2 from 'argon2';
import { createHash, randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/types/auth-user';
import { LoginDto } from './dto/login.dto';

interface RefreshPayload { sub: string; jti: string; type: 'refresh'; }

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly jwt: JwtService, private readonly config: ConfigService) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { username: dto.username }, include: { merchant: true } });
    if (!user || !(await argon2.verify(user.passwordHash, dto.password)) || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('账号或密码错误');
    }
    if (user.merchant && user.merchant.status !== MerchantStatus.ACTIVE) throw new UnauthorizedException('商家已停用或过期');
    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    return this.issueTokens({ userId: user.id, merchantId: user.merchantId, role: user.role, username: user.username });
  }

  async refresh(token: string) {
    let payload: RefreshPayload;
    try {
      payload = await this.jwt.verifyAsync<RefreshPayload>(token, { secret: this.config.getOrThrow('JWT_REFRESH_SECRET') });
    } catch { throw new UnauthorizedException('刷新凭证无效或已过期'); }
    if (payload.type !== 'refresh') throw new UnauthorizedException('刷新凭证类型无效');
    const record = await this.prisma.refreshToken.findUnique({ where: { id: payload.jti }, include: { user: { include: { merchant: true } } } });
    if (!record || record.userId !== payload.sub || record.revokedAt || record.expiresAt <= new Date() || record.tokenHash !== this.hashToken(token)) {
      throw new UnauthorizedException('刷新凭证已失效');
    }
    await this.prisma.refreshToken.update({ where: { id: record.id }, data: { revokedAt: new Date() } });
    const user = record.user;
    if (user.status !== UserStatus.ACTIVE || (user.merchant && user.merchant.status !== MerchantStatus.ACTIVE)) throw new UnauthorizedException('账号不可用');
    return this.issueTokens({ userId: user.id, merchantId: user.merchantId, role: user.role, username: user.username });
  }

  async logout(token: string): Promise<void> {
    const hash = this.hashToken(token);
    await this.prisma.refreshToken.updateMany({ where: { tokenHash: hash, revokedAt: null }, data: { revokedAt: new Date() } });
  }

  async profile(user: AuthUser) {
    const account = await this.prisma.user.findUnique({ where: { id: user.userId }, include: { merchant: true, employee: { include: { store: true } } } });
    if (!account) throw new UnauthorizedException();
    const counts = account.merchantId ? await Promise.all([
      this.prisma.store.count({ where: { merchantId: account.merchantId, deletedAt: null } }),
      this.prisma.employee.count({ where: { merchantId: account.merchantId, deletedAt: null } }),
    ]) : [0, 0];
    return {
      id: account.id, username: account.username, phone: account.phone, role: account.role,
      merchant: account.merchant ? { id: account.merchant.id, name: account.merchant.name, merchantCode: account.merchant.merchantCode, plan: account.merchant.plan, expireAt: account.merchant.expireAt, status: account.merchant.status } : null,
      employee: account.employee ? { id: account.employee.id, name: account.employee.name, store: account.employee.store?.name ?? null } : null,
      stats: { storeCount: counts[0], employeeCount: counts[1] },
    };
  }

  private async issueTokens(user: AuthUser) {
    const accessToken = await this.jwt.signAsync(
      { sub: user.userId, merchantId: user.merchantId, role: user.role, type: 'access' },
      { secret: this.config.getOrThrow('JWT_ACCESS_SECRET'), expiresIn: this.config.get('JWT_ACCESS_EXPIRES_IN', '15m') },
    );
    const jti = randomUUID();
    const refreshToken = await this.jwt.signAsync(
      { sub: user.userId, jti, type: 'refresh' },
      { secret: this.config.getOrThrow('JWT_REFRESH_SECRET'), expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN', '7d') },
    );
    const decoded = this.jwt.decode<{ exp: number }>(refreshToken);
    await this.prisma.refreshToken.create({ data: { id: jti, userId: user.userId, tokenHash: this.hashToken(refreshToken), expiresAt: new Date(decoded.exp * 1000) } });
    return { accessToken, refreshToken };
  }

  private hashToken(token: string): string { return createHash('sha256').update(token).digest('hex'); }
}
