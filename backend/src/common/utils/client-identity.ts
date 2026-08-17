import { UnauthorizedException } from '@nestjs/common';

type HeaderValue = string | string[] | undefined;

export function clientOpenId(headers: Record<string, HeaderValue>): string {
  const value = headers['x-wx-openid'] ?? headers['x-wx-from-openid'];
  const openId = Array.isArray(value) ? value[0] : value;
  if (!openId || openId.length > 128) throw new UnauthorizedException('请从微信小程序中访问');
  return openId;
}
