import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { PrismaService } from '../../prisma.service';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly prisma: PrismaService) {}

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message;
    if (exception instanceof HttpException) {
      message = exception.getResponse();
    } else {
      message = 'An error occurred';
      // Log the error for debugging purposes in development environment
      if (process.env.NODE_ENV !== 'production') {
        this.logger.error(
          `${request.method} ${request.url} ${status} - ${exception.message}`,
          exception.stack,
        );
      }
    }

    const errorPayload = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message:
        typeof message === 'string'
          ? message
          : message.message || JSON.stringify(message),
      stack: null, // Hide stack trace for security reasons
    };

    // Log to console in development environment
    if (process.env.NODE_ENV !== 'production') {
      this.logger.error(
        `${request.method} ${request.url} ${status} - ${errorPayload.message}`,
        errorPayload.stack,
      );
    }

    // === İZLEME (monitoring) ===
    // Kalıcı hata kaydı: 5xx (S3/upload dahil), auth 401 oranı ve 429 rate-limit
    // olayları errorlog tablosuna yazılır. Admin paneli /api/admin/errors ile okur.
    this.persistErrorLog(status, request, exception, errorPayload.message);

    response.status(status).json({
      statusCode: status,
      message:
        process.env.NODE_ENV === 'production' ? message : errorPayload.message,
      path: request.url,
      timestamp: errorPayload.timestamp,
    });
  }

  /**
   * Hata kaydını DB'ye asenkron yazar (fire-and-forget; yanıtı geciktirmez).
   * Kaydedilenler:
   *  - Tüm 5xx hatalar (S3 upload 500/503'leri dahil → "S3 5xx & upload-fallback" alarmı)
   *  - /api/auth/* üzerindeki 401'ler (auth 401 oranı alarmı)
   *  - 429 rate-limit ihlalleri (abuse tespiti)
   */
  private persistErrorLog(
    status: number,
    request: Request,
    exception: any,
    message: string,
  ) {
    const isServerError = status >= 500;
    const isAuth401 = status === 401 && request.url.includes('/api/auth/');
    const isRateLimited = status === 429;

    if (!isServerError && !isAuth401 && !isRateLimited) return;

    const stack: string | null =
      isServerError && typeof exception?.stack === 'string'
        ? exception.stack.slice(0, 4000)
        : null;

    this.prisma.errorlog
      .create({
        data: {
          statusCode: status,
          path: request.url.slice(0, 500),
          method: request.method,
          message: String(message).slice(0, 1000),
          stack,
          userAgent: request.headers['user-agent']?.slice(0, 500) ?? null,
          ip:
            (request.headers['x-forwarded-for'] as string)
              ?.split(',')[0]
              ?.trim() ??
            request.ip ??
            null,
          userId: (request as any).user?.userId ?? null,
        },
      })
      .catch((err: unknown) => {
        // DB'ye yazılamazsa uygulamayı etkilemesin, sadece console'a düş.
        this.logger.warn(
          `errorlog yazılamadı: ${err instanceof Error ? err.message : String(err)}`,
        );
      });
  }
}
