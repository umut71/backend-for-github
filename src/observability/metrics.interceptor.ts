import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MetricsService } from './metrics.service';

/** Her HTTP isteğini süre + durum koduyla MetricsService'e kaydeder. */
@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metrics: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle();

    const started = Date.now();
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();

    // Şablon rota (düşük kardinalite): /api/videos/:id gibi
    const route: string =
      `${req.baseUrl || ''}${req.route?.path || ''}` || req.path || 'unknown';
    const method: string = req.method || 'GET';

    return next.handle().pipe(
      tap({
        next: () => {
          this.metrics.recordHttp(
            method,
            route,
            res.statusCode || 200,
            Date.now() - started,
          );
        },
        error: (err: { status?: number }) => {
          this.metrics.recordHttp(
            method,
            route,
            err?.status || 500,
            Date.now() - started,
          );
        },
      }),
    );
  }
}
