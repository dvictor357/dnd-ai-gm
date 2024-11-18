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
  CharacterData,
  CharacterCreatedResponse,
  RollResponse,
  EncounterResponse,
  BaseResponse,
  AIResponse,
} from './interfaces/message.types';

@WebSocketGateway({
  cors: {
    origin: '*', // In production, replace with specific origins
  },
})
export class GameGateway extends BaseGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly gameService: GameService) {
    super(GameGateway.name);
  }

  async handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    const playerId = Array.from(client.handshake.query.values()).find(
      (value) => typeof value === 'string' && value.includes('_'),
    );
    if (playerId) {
      await this.gameService.disconnect(playerId as string);
    }
  }

  @SubscribeMessage('character_created')
  async handleCharacterCreated(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: CharacterData,
  ): Promise<CharacterCreatedResponse> {
    try {
      const charData = data.data;
      const playerId = `${charData.name}_${Date.now()}`;
      await this.gameService.connect(client, playerId);
      
      return this.wrapSuccess({
        event: 'character_created',
        data: { playerId },
      });
    } catch (error) {
      return this.handleError('character creation', error);
    }
  }

  @SubscribeMessage('chat')
  async handleChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: ChatMessage,
  ): Promise<BaseResponse> {
    try {
      const playerId = this.getPlayerIdFromSocket(client);
      if (!playerId) {
        return { error: 'Player not found', success: false };
      }

      const response = await this.gameService.processGameAction(playerId, data);
      return this.wrapSuccess(response);
    } catch (error) {
      return this.handleError('chat', error);
    }
  }

  @SubscribeMessage('roll')
  async handleRoll(
    @ConnectedSocket() client: Socket,
  ): Promise<RollResponse> {
    try {
      const rolls = this.gameService.incrementRolls();
      return this.wrapSuccess({ total_rolls: rolls });
    } catch (error) {
      return this.handleError('roll', error);
    }
  }

  @SubscribeMessage('encounter')
  async handleEncounter(
    @ConnectedSocket() client: Socket,
  ): Promise<EncounterResponse> {
    try {
      const encounters = this.gameService.incrementEncounters();
      return this.wrapSuccess({ total_encounters: encounters });
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
}
