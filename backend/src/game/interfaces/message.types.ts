import { Character } from './game-state.interface';

export interface BaseResponse {
  error?: string;
  success?: boolean;
}

export interface ConversationMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface ChatMessage {
  content: string;
  type: 'player' | 'gm' | 'system';
  timestamp: string;
  metadata?: any;
}

export interface AIResponse {
  content: string;
  type: 'gm';
  metadata?: Record<string, any>;
}

export interface TypingStatus {
  playerId: string;
  isTyping: boolean;
}

export interface DiceRoll {
  notation: string;
  result: number;
  breakdown: string;
}

export interface DiceRollResult {
  rolls: DiceRoll[];
  processedText: string;
}

export interface RollResponse extends BaseResponse {
  total_rolls?: number;
  rolls?: DiceRoll[];
}

export interface EncounterResponse extends BaseResponse {
  total_encounters?: number;
  encounter_type?: string;
  difficulty?: string;
}

export interface CharacterCreatedResponse extends BaseResponse {
  event?: string;
  data?: {
    playerId: string;
    character?: Character;
  };
}

export interface GameEvent {
  type: 'roll' | 'encounter' | 'character_created' | 'system';
  timestamp: string;
  data: Record<string, any>;
}
