import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get('live')
  live() {
    return { status: 'ok', timestamp: new Date().toISOString(), uptime: Math.floor(process.uptime()) };
  }

  @Public()
  @Get()
  async ready() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ok', database: 'ok', version: process.env.APP_VERSION ?? 'development', timestamp: new Date().toISOString(),
      };
    } catch {
      throw new ServiceUnavailableException('服务尚未就绪');
    }
  }
}
