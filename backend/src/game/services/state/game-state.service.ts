import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GameState,
  Player,
  GameSession,
  GameSettings,
  Character,
  ServerInfo
} from '../../interfaces/game-state.interface';
import { ChatMessage } from '../../interfaces/message.types';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class GameStateService {
  private state: GameState;
  private readonly defaultSettings: GameSettings = {
    difficulty: 'normal',
    pvp_enabled: false,
    max_players: 8,
    language: 'en',
    dice_rules: {
      advantage_enabled: true,
      critical_threshold: 20,
      house_rules: [],
    },
  };

  constructor(private readonly configService: ConfigService) {
    this.initializeState();
  }

  private initializeState(): void {
    this.state = {
      players: new Map<string, Player>(),
      encounters: 0,
      rolls: 0,
      messages: [],
      conversations: {},
      lastUpdate: new Date().toISOString(),
      settings: { ...this.defaultSettings },
      currentSession: undefined,
    };
  }

  // Player Management
  async addPlayer(playerId: string, initialData?: Partial<Player>): Promise<Player> {
    const player: Player = {
      id: playerId,
      joined_at: new Date().toISOString(),
      status: 'active',
      last_active: new Date().toISOString(),
      permissions: ['player'],
      ...initialData,
    };

    this.state.players.set(playerId, player);
    this.state.conversations[playerId] = [];
    this.updateLastModified();
    return player;
  }

  async removePlayer(playerId: string): Promise<void> {
    this.state.players.delete(playerId);
    delete this.state.conversations[playerId];

    if (this.state.currentSession?.active_players.includes(playerId)) {
      this.state.currentSession.active_players =
        this.state.currentSession.active_players.filter(id => id !== playerId);
    }

    this.updateLastModified();
  }

  async updatePlayerStatus(playerId: string, status: Player['status']): Promise<void> {
    if (this.state.players.has(playerId)) {
      const player = this.state.players.get(playerId);
      if (player) {
        player.status = status;
        player.last_active = new Date().toISOString();
        this.updateLastModified();
      }
    }
  }

  async updatePlayer(playerId: string, updates: Partial<any>): Promise<void> {
    const currentPlayer = this.state.players.get(playerId);
    if (currentPlayer) {
      this.state.players.set(playerId, {
        ...currentPlayer,
        ...updates,
        last_active: new Date().toISOString(),
      });
      this.updateLastModified();
    }
  }

  // Session Management
  async startNewSession(scene: string, environment: string): Promise<GameSession> {
    const session: GameSession = {
      id: uuidv4(),
      started_at: new Date().toISOString(),
      scene,
      environment,
      active_players: Array.from(this.state.players.keys()).filter(
        id => this.state.players.get(id)?.status === 'active'
      ),
    };

    this.state.currentSession = session;
    this.updateLastModified();
    return session;
  }

  async endCurrentSession(): Promise<void> {
    this.state.currentSession = undefined;
    this.updateLastModified();
  }

  // Character Management
  async updateCharacter(playerId: string, character: Character): Promise<void> {
    if (this.state.players.has(playerId)) {
      const player = this.state.players.get(playerId);
      if (player) {
        player.character = character;
        this.updateLastModified();
      }
    }
  }

  async setPlayerCharacter(playerId: string, character: Character): Promise<void> {
    const player = this.state.players.get(playerId);
    if (!player) {
      throw new Error('Player not found');
    }
    
    player.character = character;
    player.last_active = new Date().toISOString();
    this.state.players.set(playerId, player);
    this.updateLastModified();
  }

  // Conversation Management
  async addMessage(playerId: string, message: ChatMessage): Promise<void> {
    if (!this.state.conversations[playerId]) {
      this.state.conversations[playerId] = [];
    }
    this.state.conversations[playerId].push(message);
    this.updateLastModified();
  }

  async clearConversation(playerId: string): Promise<void> {
    this.state.conversations[playerId] = [];
    this.updateLastModified();
  }

  // Statistics and Counters
  incrementEncounters(): void {
    this.state.encounters++;
    this.updateLastModified();
  }

  incrementRolls(count: number = 1): void {
    this.state.rolls += count;
    this.updateLastModified();
  }

  // Settings Management
  updateSettings(settings: Partial<GameSettings>): void {
    this.state.settings = {
      ...this.state.settings,
      ...settings,
    };
    this.updateLastModified();
  }

  resetSettings(): void {
    this.state.settings = { ...this.defaultSettings };
    this.updateLastModified();
  }

  // State Access
  getState(): GameState {
    return { ...this.state };
  }

  async getPlayer(playerId: string): Promise<Player | undefined> {
    return this.state.players.get(playerId);
  }

  getServerInfo(): ServerInfo {
    const processStartTime = process.uptime();
    const memoryUsage = process.memoryUsage();
    const activeConnections = Array.from(this.state.players.values())
      .filter(p => p.status === 'active').length;

    return {
      status: 'online',
      activeConnections,
      encounters: this.state.encounters,
      rolls: this.state.rolls,
      uptime: processStartTime,
      model: {
        name: this.configService.get<string>('AI_MODEL_NAME', 'deepseek'),
        type: this.configService.get<string>('AI_MODEL_TYPE', 'chat'),
        version: this.configService.get<string>('AI_MODEL_VERSION', '1.0.0'),
      },
      memory: {
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal,
        external: memoryUsage.external,
      },
      performance: {
        memory_usage: process.memoryUsage().heapUsed / 1024 / 1024, // Convert to MB
        response_time: 0, // This would need to be tracked separately
        active_sessions: activeConnections,
      },
    };
  }

  private updateLastModified(): void {
    this.state.lastUpdate = new Date().toISOString();
  }
}
