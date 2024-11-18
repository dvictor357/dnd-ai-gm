import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { io } from 'socket.io-client';

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
        if (ws && ws.connected) {
          console.log('WebSocket already connected, skipping initialization');
          return;
        }

        if (ws) {
          console.log('Cleaning up existing socket connection');
          ws.disconnect();
          set({ ws: null, isConnected: false });
        }

        const wsHost = import.meta.env.VITE_WS_HOST;
        console.log('Initializing WebSocket connection to:', wsHost);
        
        const socket = io(`http://${wsHost}`, {
          path: '/ws',
          transports: ['websocket'],
          reconnection: true,
          reconnectionDelay: 5000,
          reconnectionAttempts: Infinity,
          timeout: 45000,
          forceNew: true,
        });

        socket.io.on("error", (error) => {
          console.error('Transport error:', error);
          get().addMessage({
            type: 'error',
            content: `🔌 Transport error: ${error.message}`,
            timestamp: new Date().toISOString(),
          });
        });

        socket.on('connect', () => {
          console.log('WebSocket connection established with ID:', socket.id);
          set({ isConnected: true, ws: socket });
          get().addMessage({
            type: 'system',
            content: '🟢 Connected to server',
            timestamp: new Date().toISOString(),
          });
        });

        socket.on('disconnect', (reason) => {
          console.log('WebSocket connection closed:', reason, 'Socket ID:', socket.id);
          set({ isConnected: false });
          get().addMessage({
            type: 'system',
            content: `🔴 Disconnected from server: ${reason}`,
            timestamp: new Date().toISOString(),
          });
        });

        socket.on('connect_error', (error) => {
          console.error('WebSocket error:', error, 'Socket ID:', socket.id);
          get().addMessage({
            type: 'error',
            content: `❌ Connection error: ${error.message}`,
            timestamp: new Date().toISOString(),
          });
        });

        socket.on('message', (data) => {
          try {
            console.log('Received message:', data, 'Socket ID:', socket.id);
            get().addMessage(data);
          } catch (error) {
            console.error('Error handling message:', error);
          }
        });

        set({ ws: socket });
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
        isGMTyping: state.isGMTyping,
        pointsRemaining: state.pointsRemaining
      })
    }
  )
);

export default useGameStore;
