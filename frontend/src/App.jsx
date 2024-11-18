import React, { useEffect } from 'react';
import useGameStore from './store/gameStore';
import CharacterForm from './components/CharacterCreation/CharacterForm';
import ChatWindow from './components/Chat/ChatWindow';
import StatsPanel from './components/GameStats/StatsPanel';
import ServerStatus from './components/ServerStatus';

function App() {
  const { initializeWebSocket } = useGameStore();
  const isCharacterCreated = useGameStore((state) => state.isCharacterCreated);

  useEffect(() => {
    initializeWebSocket();
  }, [initializeWebSocket]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-hidden">
        <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 p-4">
          {/* Character Form - Centered and wider when no character */}
          <div className={`${
            isCharacterCreated
              ? 'lg:col-span-3'
              : 'lg:col-span-8 lg:col-start-3'
            } bg-gray-800 rounded-lg shadow-lg overflow-hidden flex flex-col`}>
            <CharacterForm />
          </div>

          {/* Center Column - Chat Window */}
          {isCharacterCreated && (
            <div className="lg:col-span-6 bg-gray-800 rounded-lg shadow-lg overflow-hidden flex flex-col">
              <div className="flex-none bg-gray-800 border-b border-gray-700 shadow-lg">
                <h1 className="text-4xl font-medieval text-center py-4 text-primary-300">
                  D&D AI Game Master
                </h1>
              </div>
              <div className="flex-1 overflow-hidden">
                <ChatWindow />
              </div>
            </div>
          )}

          {/* Right Column - Stats Panel */}
          {isCharacterCreated && (
            <div className="lg:col-span-3 bg-gray-800 rounded-lg shadow-lg overflow-hidden flex flex-col animate-fade-in">
              <StatsPanel />
            </div>
          )}
        </div>
      </div>
      <div className="flex-none">
        <ServerStatus />
      </div>
    </div>
  );
}

export default App;
