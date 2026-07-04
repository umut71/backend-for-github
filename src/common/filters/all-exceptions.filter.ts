import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

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

    response.status(status).json({
      statusCode: status,
      message:
        process.env.NODE_ENV === 'production' ? message : errorPayload.message,
      path: request.url,
      timestamp: errorPayload.timestamp,
    });
  }
}
