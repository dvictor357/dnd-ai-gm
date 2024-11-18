export interface BaseResponse {
  error?: string;
  success?: boolean;
}

export interface ChatMessage {
  message: string;
  character?: any;
}

export interface CharacterData {
  data: {
    name: string;
    race: string;
    class: string;
    [key: string]: any;
  };
}

export interface TypingStatus {
  type: 'gm_typing';
  is_typing: boolean;
}

export interface RollResponse extends BaseResponse {
  total_rolls?: number;
}

export interface EncounterResponse extends BaseResponse {
  total_encounters?: number;
}

export interface CharacterCreatedResponse extends BaseResponse {
  event?: string;
  data?: {
    playerId: string;
  };
}

export interface AIResponse {
  response: string;
}
