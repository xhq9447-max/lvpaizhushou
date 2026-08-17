import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Express as ExpressApplication, NextFunction, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.use(helmet());
  const expressApp = app.getHttpAdapter().getInstance() as ExpressApplication;
  expressApp.set('trust proxy', 1);
  app.use((request: Request, response: Response, next: NextFunction) => {
    const startedAt = Date.now();
    const requestId = request.header('x-request-id') ?? randomUUID();
    response.setHeader('x-request-id', requestId);
    response.on('finish', () => {
      process.stdout.write(`${JSON.stringify({
        level: 'info', type: 'http_request', requestId, method: request.method, path: request.originalUrl,
        statusCode: response.statusCode, durationMs: Date.now() - startedAt, ip: request.ip, timestamp: new Date().toISOString(),
      })}\n`);
    });
    next();
  });
  const allowedOrigins = (process.env.CORS_ORIGIN ?? '').split(',').map((origin) => origin.trim()).filter(Boolean);
  if (process.env.NODE_ENV === 'production' && !allowedOrigins.length) throw new Error('生产环境必须配置 CORS_ORIGIN');
  app.enableCors({
    origin: (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => {
      if (!origin || allowedOrigins.includes(origin) || (!allowedOrigins.length && process.env.NODE_ENV !== 'production')) return callback(null, true);
      callback(null, false);
    },
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type', 'X-Request-Id'],
    exposedHeaders: ['X-Request-Id'],
    credentials: false,
  });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  await app.listen(Number(process.env.PORT ?? 3000));
}

void bootstrap();
