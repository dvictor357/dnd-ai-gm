import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Catch(HttpException, WsException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException | WsException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (host.getType() === 'ws') {
      const client = host.switchToWs().getClient<Socket>();
      const error =
        exception instanceof WsException
          ? exception.getError()
          : exception.getResponse();

      this.logger.error(`WebSocket Error: ${JSON.stringify(error)}`);
      client.emit('error', {
        statusCode:
          exception instanceof HttpException ? exception.getStatus() : 500,
        timestamp: new Date().toISOString(),
        error: error,
      });
      return;
    }

    const status =
      exception instanceof HttpException ? exception.getStatus() : 500;
    const error = exception.getResponse();

    this.logger.error(`HTTP Error: ${JSON.stringify(error)}`);
    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      error: error,
    });
  }
}
