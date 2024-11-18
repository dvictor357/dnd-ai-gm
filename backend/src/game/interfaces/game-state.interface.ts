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
  conversations: Record<string, ChatMessage[]>;
  currentSession?: GameSession;
  lastUpdate: string;
  settings: GameSettings;
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
  status: string;
  activeConnections: number;
  encounters: number;
  rolls: number;
  uptime: number;
  model: {
    name: string;
    type: string;
    version: string;
  };
  memory: {
    heapUsed: number;
    heapTotal: number;
    external: number;
  };
  performance: {
    memory_usage: number;
    response_time: number;
    active_sessions: number;
  };
}
