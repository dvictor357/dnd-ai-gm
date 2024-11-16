import { create } from 'zustand';

const initialState = {
  character: {
    name: '',
    race: '',
    class: '',
    stats: {
      strength: 8,
      dexterity: 8,
      constitution: 8,
      intelligence: 8,
      wisdom: 8,
      charisma: 8,
    },
  },
  pointsRemaining: 27,
  gameStats: {
    playerCount: 0,
    encounterCount: 0,
    rollCount: 0,
  },
  messages: [],
  isConnected: false,
  isCharacterCreated: false,
  ws: null,
};

const useGameStore = create((set, get) => ({
  ...initialState,

  // Actions
  initializeWebSocket: () => {
    const { ws } = get();
    if (ws && (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN)) {
      return;
    }

    const wsHost = import.meta.env.VITE_WS_HOST;
    const websocket = new WebSocket(`ws://${wsHost}/ws`);

    websocket.onopen = () => {
      set({ isConnected: true });
      get().addMessage({
        type: 'system',
        content: 'Connected to game server'
      });
    };

    websocket.onclose = () => {
      set({ isConnected: false });
      get().addMessage({
        type: 'system',
        content: 'Disconnected from game server'
      });
      set({ ws: null });
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      get().addMessage({
        type: 'system',
        content: 'Error connecting to game server'
      });
    };

    websocket.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (message.type === 'gm_response') {
        get().addMessage(message);
        window.dispatchEvent(new CustomEvent('gmResponse'));
      } else if (message.type === 'system') {
        get().addMessage(message);
      } else if (message.type === 'state_update') {
        get().setGameStats({
          playerCount: message.players,
          encounterCount: message.encounters,
          rollCount: message.rolls
        });
      }
    };

    set({ ws: websocket });
  },

  updateCharacterField: (field, value) => {
    set((state) => {
      const newState = {
        character: {
          ...state.character,
          [field]: value
        }
      };
      return newState;
    });
  },

  setStat: (stat, value) =>
    set((state) => ({
      character: {
        ...state.character,
        stats: { ...state.character.stats, [stat]: value }
      }
    })),

  setPointsRemaining: (points) =>
    set({ pointsRemaining: points }),

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message]
    })),

  setGameStats: (stats) =>
    set((state) => ({
      gameStats: { ...state.gameStats, ...stats }
    })),

  setIsConnected: (isConnected) =>
    set({ isConnected }),

  setIsCharacterCreated: (isCharacterCreated) =>
    set({ isCharacterCreated }),

  // Reset store
  resetStore: () => {
    const { ws } = get();
    if (ws) {
      ws.close();
    }
    set(initialState);
  },
}));

export default useGameStore;
