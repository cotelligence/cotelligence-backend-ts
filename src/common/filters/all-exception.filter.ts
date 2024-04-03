import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  catch(exception: any, host: ArgumentsHost): void {
    // In certain situations `httpAdapter` might not be available in the
    // constructor method, thus we should resolve it here.
    const { httpAdapter } = this.httpAdapterHost;

    const ctx = host.switchToHttp();

    let httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
    let msg = 'no message';
    let stack: string | undefined;
    if (exception.message) {
      msg = exception.message;
    }
    if (exception.stack) {
      stack = exception.stack;
    }
    if (exception instanceof HttpException) {
      httpStatus = exception.getStatus();
    }

    this.logger.error(
      `url: ${exception?.config?.url}, msg: ${msg}, status: ${httpStatus}, stack: ${stack}`
    );

    const responseBody = {
      statusCode: httpStatus,
      message: exception.message,
      timestamp: new Date().toISOString(),
      path: httpAdapter.getRequestUrl(ctx.getRequest()),
    };

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}
