import { ChatMessage } from './message.types';

export interface Character {
  name: string;
  race: string;
  class: string;
  background: string;
  level: number;
  stats: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
  hp: {
    current: number;
    max: number;
  };
  status: CharacterStatus[];
  inventory: InventoryItem[];
  abilities: string[];
  traits: string[];
}

export interface InventoryItem {
  name: string;
  quantity: number;
  description?: string;
  type: 'weapon' | 'armor' | 'potion' | 'tool' | 'other';
  properties?: string[];
}

export interface CharacterStatus {
  type: 'buff' | 'debuff' | 'condition';
  name: string;
  duration?: number;
  description?: string;
}

export interface Player {
  joined_at: string;
  character?: Character;
  status: 'active' | 'inactive' | 'away';
  last_active: string;
  permissions: string[];
}

export interface GameSession {
  id: string;
  started_at: string;
  scene: string;
  environment: string;
  active_players: string[];
  current_turn?: string;
}

export interface GameState {
  players: Record<string, Player>;
  encounters: number;
  rolls: number;
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
    type: string;
    name: string;
    status: 'ready' | 'busy' | 'error';
    queue_size?: number;
  };
  performance: {
    memory_usage: number;
    response_time: number;
    active_sessions: number;
  };
}
