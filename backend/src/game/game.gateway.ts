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
  EncounterResponse,
  BaseResponse,
  GameEvent,
  TypingStatus
} from './interfaces/message.types';
import { Logger } from '@nestjs/common';

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

  protected readonly logger: Logger;

  constructor(private readonly gameService: GameService) {
    super(GameGateway.name);
    this.logger = new Logger('GameGateway');
  }

  afterInit(server: Server) {
    this.gameService.setServer(server);
    this.logger.log('WebSocket Gateway initialized');
  }

  protected getPlayerIdFromSocket(client: Socket): string {
    try {
      const playerId = client.handshake.query.playerId;
      if (!playerId || typeof playerId !== 'string') {
        this.logger.error('Invalid player ID in socket handshake:', client.handshake.query);
        throw new Error('No valid player ID found in socket');
      }
      return playerId;
    } catch (error) {
      this.logger.error('Error getting player ID:', error);
      throw error;
    }
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
    @MessageBody() character: any
  ) {
    try {
      this.logger.log(`Received character creation request from client ${client.id}`);

      const playerId = this.getPlayerIdFromSocket(client);
      if (!playerId) {
        throw new Error('No player ID found in socket');
      }

      this.logger.log(`Setting character for player ${playerId}`);
      await this.gameService.setCharacter(playerId, character);

      // Send confirmation back to client
      this.logger.log('Sending character creation success message');
      client.emit('character_creation_success', {
        message: 'Character created successfully!',
        character
      });

      // First, send a brief loading message
      this.logger.log('Sending initial loading message');
      client.emit('game_message', {
        type: 'system',
        content: "The mists of creation swirl as your tale begins to take shape...",
        timestamp: new Date().toISOString()
      });

      // Generate and send the main welcome scene
      this.logger.log('Generating welcome message');
      const welcomeMessage = await this.gameService.generateWelcomeMessage(character);

      // Send the rich narrative welcome message
      this.logger.log('Sending welcome narrative');
      client.emit('game_message', {
        type: 'narrative',
        content: welcomeMessage,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      this.logger.error('Error in character creation:', error);
      client.emit('character_creation_error', {
        message: error.message || 'Failed to create character',
        error: error
      });
    }
  }

  @SubscribeMessage('message')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    try {
      const playerId = this.getPlayerIdFromSocket(client);
      if (!playerId) {
        client.emit('error', { message: 'No player ID found' });
        client.disconnect(true);
        return;
      }

      // Check if character exists for this player
      const character = await this.gameService.getCharacter(playerId);
      if (!character) {
        this.logger.warn(`No character found for player ${playerId}`);
        client.emit('error', {
          message: 'No character found. Please create a character first.',
          code: 'NO_CHARACTER_FOUND'
        });
        client.disconnect(true);
        return;
      }

      // Process the message
      const response = await this.gameService.handleMessage(playerId, data);

      // Send response back to client
      client.emit('message', {
        type: 'gm_response',
        content: response,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      this.logger.error('Error handling message:', error);
      client.emit('error', {
        message: 'Failed to process message',
        error: error.message
      });
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

  @SubscribeMessage('server_info')
  async handleServerInfo(@ConnectedSocket() client: Socket) {
    try {
      const serverInfo = this.gameService.getServerInfo();
      client.emit('server_info_response', serverInfo);
    } catch (error) {
      this.logger.error('Error getting server info:', error);
      client.emit('error', { message: 'Failed to get server info' });
    }
  }

  @SubscribeMessage('typing_status')
  async handleTypingStatus(
    @ConnectedSocket() client: Socket,
    @MessageBody() status: TypingStatus
  ): Promise<void> {
    // Broadcast typing status to all clients except sender
    client.broadcast.emit('typing_status', status);
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
