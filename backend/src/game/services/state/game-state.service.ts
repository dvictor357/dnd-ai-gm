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
      players: {},
      encounters: 0,
      rolls: 0,
      conversations: {},
      lastUpdate: new Date().toISOString(),
      settings: { ...this.defaultSettings },
    };
  }

  // Player Management
  async addPlayer(playerId: string, initialData?: Partial<Player>): Promise<Player> {
    const player: Player = {
      joined_at: new Date().toISOString(),
      status: 'active',
      last_active: new Date().toISOString(),
      permissions: ['player'],
      ...initialData,
    };

    this.state.players[playerId] = player;
    this.state.conversations[playerId] = [];
    this.updateLastModified();
    return player;
  }

  async removePlayer(playerId: string): Promise<void> {
    delete this.state.players[playerId];
    delete this.state.conversations[playerId];
    
    if (this.state.currentSession?.active_players.includes(playerId)) {
      this.state.currentSession.active_players = 
        this.state.currentSession.active_players.filter(id => id !== playerId);
    }
    
    this.updateLastModified();
  }

  async updatePlayerStatus(playerId: string, status: Player['status']): Promise<void> {
    if (this.state.players[playerId]) {
      this.state.players[playerId].status = status;
      this.state.players[playerId].last_active = new Date().toISOString();
      this.updateLastModified();
    }
  }

  async updatePlayer(playerId: string, updates: Partial<any>): Promise<void> {
    const currentPlayer = this.state.players[playerId];
    if (currentPlayer) {
      this.state.players[playerId] = {
        ...currentPlayer,
        ...updates,
        last_active: new Date().toISOString(),
      };
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
      active_players: Object.keys(this.state.players).filter(
        id => this.state.players[id].status === 'active'
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
    if (this.state.players[playerId]) {
      this.state.players[playerId].character = character;
      this.updateLastModified();
    }
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

  getPlayer(playerId: string): Player | undefined {
    return this.state.players[playerId];
  }

  getServerInfo(): ServerInfo {
    const processStartTime = process.uptime();
    const memoryUsage = process.memoryUsage();

    return {
      status: 'online',
      activeConnections: Object.values(this.state.players)
        .filter(p => p.status === 'active').length,
      encounters: this.state.encounters,
      rolls: this.state.rolls,
      uptime: processStartTime,
      model: {
        type: this.configService.get<string>('AI_MODEL', 'deepseek'),
        name: this.configService.get<string>('AI_MODEL_NAME', 'Unknown'),
        status: 'ready',
      },
      performance: {
        memory_usage: memoryUsage.heapUsed / 1024 / 1024, // MB
        response_time: 0, // Updated by monitoring service
        active_sessions: this.state.currentSession ? 1 : 0,
      },
    };
  }

  private updateLastModified(): void {
    this.state.lastUpdate = new Date().toISOString();
  }
}
