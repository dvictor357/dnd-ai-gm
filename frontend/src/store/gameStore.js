import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const initialState = {
  ws: null,
  messages: [],
  chatInput: '',
  isConnected: false,
  isCharacterCreated: false,
  character: {
    name: '',
    race: '',
    class: '',
    background: '',
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
  isGMTyping: false,
};

const useGameStore = create(
  persist(
    (set, get) => ({
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

          // If character exists, send character_created message to re-establish session
          const { character, isCharacterCreated } = get();
          if (isCharacterCreated && character.name) {
            websocket.send(JSON.stringify({
              type: 'character_created',
              data: character
            }));
          }
        };

        websocket.onclose = () => {
          set({ isConnected: false });
          get().addMessage({
            type: 'system',
            content: 'Disconnected from game server'
          });
          set({ ws: null });

          // Attempt to reconnect after a delay
          setTimeout(() => {
            get().initializeWebSocket();
          }, 3000);
        };

        websocket.onerror = (error) => {
          console.error('WebSocket error:', error);
          get().addMessage({
            type: 'system',
            content: 'Error connecting to game server'
          });
        };

        websocket.onmessage = (event) => {
          const data = JSON.parse(event.data);
          
          // Handle GM response
          if (data.type === 'gm_response') {
            get().addMessage({
              type: 'gm_response',
              content: data.content,
              character: get().character // Include character context in GM messages
            });
            window.dispatchEvent(new Event('gmResponse'));
          }
          
          // Handle system messages
          if (data.type === 'system') {
            get().addMessage({
              type: 'system',
              content: data.content
            });
          } else if (data.type === 'state_update') {
            get().setGameStats({
              playerCount: data.players,
              encounterCount: data.encounters,
              rollCount: data.rolls
            });
          } else if (data.type === 'gm_typing') {
            set({ isGMTyping: data.is_typing });
          }
        };

        set({ ws: websocket });
      },

      updateCharacterField: (field, value) => {
        if (field === 'stats') {
          set((state) => ({
            character: {
              ...state.character,
              stats: value,
            },
          }));
        } else {
          set((state) => ({
            character: {
              ...state.character,
              [field]: value,
            },
          }));
        }
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

      setChatInput: (input) => set({ chatInput: input }),

      setCharacter: (character) => set({ character }),

      setWebSocket: (ws) => set({ ws }),

      endGame: () => {
        const { ws, character } = get();
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'end_game',
            character: character
          }));
          ws.close();
        }
        get().resetStore();
      },

      // Reset store
      resetStore: () => {
        const { ws } = get();
        if (ws) {
          ws.close();
        }
        set({ ...initialState });
        get().initializeWebSocket(); // Re-initialize WebSocket after reset
      },
    }),
    {
      name: 'game-storage',
      partialize: (state) => ({
        messages: state.messages,
        isCharacterCreated: state.isCharacterCreated,
        character: state.character,
        gameStats: state.gameStats,
        isGMTyping: state.isGMTyping
      })
    }
  )
);

export default useGameStore;
