import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { io } from 'socket.io-client';

// Function to get or create a persistent player ID
const getOrCreatePlayerId = () => {
  const storedId = localStorage.getItem('playerId');
  if (storedId) return storedId;
  
  const newId = crypto.randomUUID();
  localStorage.setItem('playerId', newId);
  return newId;
};

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
          query: {
            playerId: getOrCreatePlayerId()
          }
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
        });

        socket.on('character_creation_success', (data) => {
          console.log('Character creation success received:', data);
          set((state) => {
            console.log('Setting isCharacterCreated to true. Previous state:', state.isCharacterCreated);
            return { isCharacterCreated: true };
          });
          console.log('State after character creation:', get());
        });

        socket.on('character_creation_error', (error) => {
          console.error('Character creation error:', error);
          get().addMessage({
            type: 'error',
            content: `Failed to create character: ${error.message}`,
            timestamp: new Date().toISOString(),
          });
        });

        socket.on('game_message', (data) => {
          try {
            console.log('Received game message:', data, 'Socket ID:', socket.id);
            get().addMessage(data);
          } catch (error) {
            console.error('Error handling game message:', error);
          }
        });

        socket.on('message', (data) => {
          try {
            console.log('Received legacy message:', data, 'Socket ID:', socket.id);
            get().addMessage(data);
          } catch (error) {
            console.error('Error handling legacy message:', error);
          }
        });

        socket.on('disconnect', (reason) => {
          console.log('WebSocket connection closed:', reason, 'Socket ID:', socket.id);
          set({ isConnected: false });
          // Removed disconnect message since we have ServerStatus indicator
        });

        socket.on('connect_error', (error) => {
          console.error('WebSocket error:', error, 'Socket ID:', socket.id);
          // Only log connection errors to console, ServerStatus will show the state
          console.error(`Connection error: ${error.message}`);
        });

        socket.on('typing_status', (status) => {
          console.log('Typing status:', status);
          set({ isGMTyping: status.isTyping });
        });

        socket.on('error', (error) => {
          console.error('Server error:', error);
          get().addMessage({
            type: 'error',
            content: error.message,
            timestamp: new Date().toISOString(),
          });

          // If it's a NO_CHARACTER_FOUND error, reset character creation state
          if (error.code === 'NO_CHARACTER_FOUND') {
            set({ 
              isCharacterCreated: false,
              messages: [], // Clear messages
              ws: null // Clear socket connection
            });
            // Reconnect after a brief delay
            setTimeout(() => {
              get().initializeWebSocket();
            }, 1000);
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
        if (ws && ws.connected) {
          ws.emit('end_game', { character });
          ws.disconnect();
        }
        get().resetStore();
      },

      // Reset store
      resetStore: () => {
        const { ws } = get();
        if (ws) {
          ws.disconnect();
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
