import { ChatMessage } from './message.types';

export interface Character {
  name: string;
  race: string;
  class: string;
  background?: string;
  level?: number;
  stats?: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
  hp?: {
    current: number;
    max: number;
  };
  status?: string[];
  inventory?: string[];
  abilities?: string[];
  traits?: string[];
  created_at?: string;
  last_updated?: string;
}

export interface Player {
  id: string;
  joined_at: string;
  character?: Character;
  status: 'active' | 'inactive' | 'away';
  last_active: string;
  permissions: string[];
}

export interface GameSession {
  id: string;
  started_at: string;
  scene?: string;
  environment?: string;
  active_players: string[];
  current_turn?: string;
}

export interface GameState {
  players: Map<string, Player>;
  encounters: number;
  rolls: number;
  messages: ChatMessage[];
  conversations: { [key: string]: ChatMessage[] };
  lastUpdate: string;
  settings: GameSettings;
  currentSession?: GameSession;
}

export interface GameSettings {
  difficulty: 'easy' | 'normal' | 'hard';
  pvp_enabled: boolean;
  max_players: number;
  language: string;
  dice_rules: {
    advantage_enabled: boolean;
    critical_threshold: number;
    house_rules: string[];
  };
}

export interface ServerInfo {
  uptime: number;
  playerCount: number;
  encounterCount: number;
  rollCount: number;
  lastUpdate: string;
  status: string;
  model: {
    name: string;
    type: string;
    version: string;
  };
  system: {
    memory: {
      heapUsed: number;
      heapTotal: number;
      external: number;
      usagePercent: number;
    };
    performance: {
      responseTime: number;
      activeSessions: number;
    };
  };
}
