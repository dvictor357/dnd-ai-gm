import React, { useEffect } from 'react';
import useGameStore from './store/gameStore';
import CharacterForm from './components/CharacterCreation/CharacterForm';
import ChatWindow from './components/Chat/ChatWindow';
import StatsPanel from './components/GameStats/StatsPanel';

function App() {
  const { initializeWebSocket } = useGameStore();
  const isCharacterCreated = useGameStore((state) => state.isCharacterCreated);

  useEffect(() => {
    initializeWebSocket();
  }, [initializeWebSocket]);

  return (
    <div className="w-full min-h-screen bg-gray-900 text-gray-100 mx-auto">
      <div className="w-full px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 h-screen">
          {/* Character Form - Centered and wider when no character */}
          <div className={`${isCharacterCreated
            ? 'lg:col-span-3'
            : 'lg:col-span-8 lg:col-start-3'
            } bg-gray-800 rounded-lg shadow-lg overflow-auto transition-all duration-300 ease-in-out`}>
            <CharacterForm />
          </div>

          {/* Center Column - Chat Window */}
          {isCharacterCreated && (
            <div className="lg:col-span-6 bg-gray-800 rounded-lg shadow-lg overflow-hidden">
              <div className="sticky top-0 z-10 bg-gray-800 border-b border-gray-700 shadow-lg">
                <h1 className="text-4xl font-medieval text-center py-4 text-primary-300">
                  D&D AI Game Master
                </h1>
              </div>
              <div className="overflow-auto h-[calc(100%-5rem)]">
                <ChatWindow />
              </div>
            </div>
          )}

          {/* Show title in center when no character */}
          {!isCharacterCreated && (
            <h1 className="absolute top-14 left-1/2 -translate-x-1/2 text-4xl font-medieval text-center text-primary-300">
              D&D AI Game Master
            </h1>
          )}

          {/* Right Column - Stats Panel */}
          {isCharacterCreated && (
            <div className="lg:col-span-3 bg-gray-800 rounded-lg shadow-lg overflow-auto animate-fade-in">
              <StatsPanel />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
