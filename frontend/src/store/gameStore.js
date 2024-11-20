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
  currentRoom: null,
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

        // Clean up existing socket if it exists
        if (ws) {
          console.log('Cleaning up existing socket connection');
          ws.disconnect();
          ws.removeAllListeners();
          set({ ws: null, isConnected: false, currentRoom: null });
        }

        const wsHost = import.meta.env.VITE_WS_HOST;
        console.log('Initializing WebSocket connection to:', wsHost);

        const socket = io(`http://${wsHost}`, {
          path: '/ws',
          transports: ['websocket'],
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionAttempts: 5,
          timeout: 20000,
          forceNew: true,
          query: {
            playerId: getOrCreatePlayerId()
          }
        });

        // Handle connection events
        socket.io.on("error", (error) => {
          console.error('Transport error:', error);
          get().addMessage({
            type: 'error',
            content: `🔌 Connection error: ${error.message}. Attempting to reconnect...`,
            timestamp: new Date().toISOString(),
          });
        });

        socket.io.on("reconnect_attempt", (attempt) => {
          console.log(`Reconnection attempt ${attempt}`);
          get().addMessage({
            type: 'system',
            content: `🔄 Attempting to reconnect (${attempt}/5)...`,
            timestamp: new Date().toISOString(),
          });
        });

        socket.io.on("reconnect_failed", () => {
          console.log('Reconnection failed');
          get().addMessage({
            type: 'error',
            content: '❌ Failed to reconnect. Please refresh the page.',
            timestamp: new Date().toISOString(),
          });
        });

        socket.on('connect', () => {
          console.log('WebSocket connection established with ID:', socket.id);
          set({ isConnected: true, ws: socket });
          socket.emit('get_stats');
          get().addMessage({
            type: 'system',
            content: '🟢 Connected to game server',
            timestamp: new Date().toISOString(),
          });
        });

        socket.on('disconnect', (reason) => {
          console.log('WebSocket disconnected:', reason);
          set({ isConnected: false });
          get().addMessage({
            type: 'system',
            content: `🔴 Disconnected from game server: ${reason}`,
            timestamp: new Date().toISOString(),
          });
        });

        socket.on('character_creation_success', (data) => {
          console.log('Character creation success received:', data);
          set({ isCharacterCreated: true });
        });

        socket.on('character_creation_error', (error) => {
          console.error('Character creation error:', error);
          get().addMessage({
            type: 'error',
            content: `Failed to create character: ${error.message}`,
            timestamp: new Date().toISOString(),
          });
        });

        socket.on('game_message', (message) => {
          try {
            console.log('Received game message:', message);
            const playerId = getOrCreatePlayerId();
            get().addMessage({
              ...message,
              senderId: message.playerId, // Sender's ID
              currentPlayerId: playerId // Current player's ID
            });
          } catch (error) {
            console.error('Error handling game message:', error);
          }
        });

        socket.on('typing_status', (status) => {
          try {
            console.log('Received typing status:', status);
            set({ isGMTyping: status.isTyping });
          } catch (error) {
            console.error('Error handling typing status:', error);
          }
        });

        socket.on('connect_error', (error) => {
          console.error('WebSocket error:', error);
          get().addMessage({
            type: 'error',
            content: `Connection error: ${error.message}`,
            timestamp: new Date().toISOString()
          });
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

        socket.on('stats_update', (stats) => {
          console.log('Stats update received:', stats);
          set((state) => ({
            gameStats: {
              playerCount: stats.playerCount || 0,
              encounterCount: stats.encounterCount || 0,
              rollCount: stats.rollCount || 0,
            }
          }));
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

      addMessage: (message) => {
        set((state) => ({
          messages: [...state.messages, {
            ...message,
            timestamp: message.timestamp || new Date().toISOString()
          }]
        }));
      },

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

      setCurrentRoom: (room) => set({ currentRoom: room }),

      endGame: () => {
        const { ws } = get();
        if (ws) {
          ws.disconnect();
        }
        get().resetStore();
      },

      // Reset store
      resetStore: () => {
        set({
          ...initialState,
          messages: [], // Clear messages
          currentRoom: null // Clear room
        });
        get().initializeWebSocket();
      },
    }),
    {
      name: 'game-storage',
      partialize: (state) => ({
        isCharacterCreated: state.isCharacterCreated,
        character: state.character,
      }),
    }
  )
);

export default useGameStore;
