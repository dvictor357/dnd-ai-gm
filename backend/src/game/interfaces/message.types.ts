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
  timestamp: string;
  type: 'user' | 'gm' | 'system';
  playerId?: string;
  character?: {
    name: string;
    race: string;
    class: string;
    background?: string;
    stats?: Record<string, number>;
    traits?: string[];
    abilities?: string[];
    equipment?: string[];
  };
  metadata?: Record<string, any>;
}

export interface AIResponse {
  content: string;
  type: 'gm';
  metadata?: Record<string, any>;
}

export interface TypingStatus {
  type: 'gm_typing';
  is_typing: boolean;
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
    character?: ChatMessage['character'];
  };
}

export interface GameEvent {
  type: 'roll' | 'encounter' | 'character_created' | 'system';
  timestamp: string;
  data: Record<string, any>;
}
