import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const raw = exception instanceof HttpException ? exception.getResponse() : null;
    const message = typeof raw === 'string' ? raw : raw && typeof raw === 'object' && 'message' in raw ? raw.message : '服务器内部错误';
    response.status(status).json({ success: false, error: { statusCode: status, message }, timestamp: new Date().toISOString() });
  }
}
