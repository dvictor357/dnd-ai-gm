export interface Player {
  joined_at: string;
  character?: any;
}

export interface GameState {
  players: Record<string, Player>;
  encounters: number;
  rolls: number;
  conversations: Record<string, any[]>;
}

export interface ServerInfo {
  status: string;
  activeConnections: number;
  encounters: number;
  rolls: number;
  model: {
    type: string;
    name: string;
  };
}
