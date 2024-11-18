import { Logger } from '@nestjs/common';
import { BaseResponse } from '../interfaces/message.types';

export abstract class BaseGateway {
  protected readonly logger: Logger;

  constructor(context: string) {
    this.logger = new Logger(context);
  }

  protected handleError(method: string, error: any): BaseResponse {
    this.logger.error(`Error in ${method}:`, error);
    return {
      error: `Failed to process ${method.toLowerCase()}`,
      success: false,
    };
  }

  protected wrapSuccess<T extends BaseResponse>(data: T): T {
    return {
      ...data,
      success: true,
    };
  }

  protected getPlayerIdFromSocket(socket: any): string | null {
    const playerId = socket.handshake.query.playerId as string;
    if (!playerId) {
      this.logger.warn('No player ID found in socket connection');
      return null;
    }
    return playerId;
  }
}
