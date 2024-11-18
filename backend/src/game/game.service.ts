import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AIService } from '../ai/ai.service';
import { GameState, ServerInfo } from './interfaces/game-state.interface';
import { GameUtils } from './utils/game.utils';
import { Socket } from 'socket.io';
import { ChatMessage, TypingStatus, AIResponse } from './interfaces/message.types';

@Injectable()
export class GameService {
  private gameState: GameState = {
    players: {},
    encounters: 0,
    rolls: 0,
    conversations: {},
  };

  private activeConnections: Map<string, Socket> = new Map();

  constructor(
    private readonly aiService: AIService,
    private readonly configService: ConfigService,
  ) {}

  async connect(socket: Socket, playerId: string): Promise<void> {
    this.activeConnections.set(playerId, socket);
    this.gameState.players[playerId] = {
      joined_at: new Date().toISOString(),
    };
    this.gameState.conversations[playerId] = [];
  }

  async disconnect(playerId: string): Promise<void> {
    this.activeConnections.delete(playerId);
    delete this.gameState.players[playerId];
    delete this.gameState.conversations[playerId];
  }

  private async broadcastMessage(message: TypingStatus): Promise<void> {
    const messageStr = JSON.stringify(message);
    for (const socket of this.activeConnections.values()) {
      try {
        socket.emit('message', messageStr);
      } catch (error) {
        console.error('Error broadcasting message:', error);
      }
    }
  }

  async broadcastTypingStatus(isTyping: boolean): Promise<void> {
    await this.broadcastMessage({
      type: 'gm_typing',
      is_typing: isTyping,
    });
  }

  private addToConversation(playerId: string, message: any): void {
    if (!this.gameState.conversations[playerId]) {
      this.gameState.conversations[playerId] = [];
    }
    this.gameState.conversations[playerId].push(message);
    // Keep only last 10 messages for context
    this.gameState.conversations[playerId] = this.gameState.conversations[playerId].slice(-10);
  }

  getPlayerCount(): number {
    return this.activeConnections.size;
  }

  incrementEncounters(): number {
    return ++this.gameState.encounters;
  }

  incrementRolls(): number {
    return ++this.gameState.rolls;
  }

  async processGameAction(playerId: string, data: ChatMessage): Promise<AIResponse> {
    if (!this.gameState.conversations[playerId]) {
      this.gameState.conversations[playerId] = [];
    }

    try {
      await this.broadcastTypingStatus(true);

      const response = await this.aiService.getResponse(
        data.message,
        data.character,
        this.gameState.conversations[playerId],
      );

      await this.broadcastTypingStatus(false);

      this.addToConversation(playerId, {
        role: 'user',
        content: data.message,
      });
      this.addToConversation(playerId, {
        role: 'assistant',
        content: response,
      });

      return { response: GameUtils.wrapDiceRolls(response) };
    } catch (error) {
      await this.broadcastTypingStatus(false);
      console.error('Error in processGameAction:', error);
      throw new Error('Failed to process game action');
    }
  }

  getServerInfo(): ServerInfo {
    const currentModel = this.configService.get<string>('AI_MODEL', 'deepseek');
    const modelDetails = {
      type: currentModel,
      name:
        currentModel === 'openrouter'
          ? this.configService.get<string>('OPENROUTER_MODEL', 'default')
          : 'deepseek',
    };

    return {
      status: 'ok',
      activeConnections: this.getPlayerCount(),
      encounters: this.gameState.encounters,
      rolls: this.gameState.rolls,
      model: modelDetails,
    };
  }
}
