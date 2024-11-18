import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameService } from './game.service';
import { BaseGateway } from './base/base.gateway';
import {
  ChatMessage,
  CharacterCreatedResponse,
  RollResponse,
  EncounterResponse,
  BaseResponse,
  GameEvent,
} from './interfaces/message.types';
import { Character } from './interfaces/game-state.interface';

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  path: '/ws',
  transports: ['websocket'],
  connectTimeout: 45000,
  pingTimeout: 45000,
  pingInterval: 25000,
  allowEIO3: true,
  namespace: '/',
})
export class GameGateway extends BaseGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly gameService: GameService) {
    super(GameGateway.name);
  }

  protected getPlayerIdFromSocket(client: Socket): string | null {
    const query = client.handshake.query;
    return typeof query.playerId === 'string' ? query.playerId : null;
  }

  @SubscribeMessage('connect')
  async handleConnection(client: Socket) {
    try {
      this.logger.log(`Client connected: ${client.id}`);

      // Get all connected sockets in this namespace
      const sockets = await this.server.fetchSockets();
      this.logger.log(`Total clients connected: ${sockets.length}`);

      // Check for and handle duplicate connections
      for (const socket of sockets) {
        if (socket.id !== client.id && 
            socket.handshake.headers.origin === client.handshake.headers.origin) {
          this.logger.log(`Disconnecting duplicate client: ${socket.id}`);
          socket.disconnect(true);
        }
      }

      const playerId = this.getPlayerIdFromSocket(client);
      if (playerId) {
        await this.gameService.connect(client, playerId);
      }
    } catch (error) {
      this.logger.error(`Connection error: ${error.message}`);
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('disconnect')
  async handleDisconnect(client: Socket) {
    try {
      this.logger.log(`Client disconnected: ${client.id}`);
      const playerId = this.getPlayerIdFromSocket(client);
      if (playerId) {
        await this.gameService.disconnect(playerId);
      }
    } catch (error) {
      this.logger.error(`Disconnect error: ${error.message}`);
    }
  }

  @SubscribeMessage('character_created')
  async handleCharacterCreated(
    @ConnectedSocket() client: Socket,
    @MessageBody() character: Character,
  ): Promise<CharacterCreatedResponse> {
    try {
      if (!character?.name) {
        throw new Error('Invalid character data');
      }

      const playerId = `${character.name}_${Date.now()}`;
      await this.gameService.connect(client, playerId);

      const event: GameEvent = {
        type: 'character_created',
        timestamp: new Date().toISOString(),
        data: { playerId, character },
      };

      this.server.emit('game_event', event);

      return this.wrapSuccess({
        event: 'character_created',
        data: { playerId, character },
      });
    } catch (error) {
      return this.handleError('character creation', error);
    }
  }

  @SubscribeMessage('message')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() message: ChatMessage,
  ): Promise<void> {
    try {
      const playerId = this.getPlayerIdFromSocket(client);
      if (!playerId) {
        throw new Error('Player not found');
      }

      // Check if this is a roll command
      if (message.content.includes('[') && message.content.includes(']')) {
        const notation = message.content.match(/\[(.*?)\]/)?.[1];
        if (notation) {
          const result = await this.gameService.handleDiceRoll(playerId, notation);

          // Create roll message
          const rollMessage: ChatMessage = {
            type: 'system',
            content: `🎲 ${message.content.split('[')[0]}\n**Result:** ${result.total} (${result.results.join(' + ')}${result.modifier ? ` ${result.modifier >= 0 ? '+' : '-'} ${Math.abs(result.modifier)}` : ''})`,
            timestamp: new Date().toISOString(),
            metadata: {
              roll: {
                notation,
                result: result.total,
                breakdown: result.results.join(' + ')
              }
            }
          };

          // Broadcast roll result
          this.server.emit('message', rollMessage);
          return;
        }
      }

      // Handle normal message
      await this.gameService.handleMessage(playerId, message);
    } catch (error) {
      this.logger.error(`Message error: ${error.message}`);
      client.emit('error', { message: 'Failed to process message' });
    }
  }

  @SubscribeMessage('encounter')
  async handleEncounter(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { type?: string; difficulty?: string },
  ): Promise<EncounterResponse> {
    try {
      const playerId = this.getPlayerIdFromSocket(client);
      if (!playerId) {
        throw new Error('Player not found');
      }

      const encounter = await this.gameService.generateEncounter(data);

      const event: GameEvent = {
        type: 'encounter',
        timestamp: new Date().toISOString(),
        data: { playerId, ...encounter },
      };

      this.server.emit('game_event', event);

      return this.wrapSuccess({
        total_encounters: this.gameService.getEncounterCount(),
        ...encounter,
      });
    } catch (error) {
      return this.handleError('encounter', error);
    }
  }

  @SubscribeMessage('get_server_info')
  async handleGetServerInfo(): Promise<BaseResponse> {
    try {
      const info = this.gameService.getServerInfo();
      return this.wrapSuccess(info);
    } catch (error) {
      return this.handleError('server info', error);
    }
  }

  protected wrapSuccess<T>(data: T): BaseResponse & T {
    return {
      success: true,
      ...data,
    };
  }

  protected handleError(context: string, error: Error): BaseResponse {
    this.logger.error(`Error in ${context}: ${error.message}`, error.stack);
    return {
      success: false,
      error: `Failed to process ${context}: ${error.message}`,
    };
  }
}
