import React, { useEffect } from 'react';
import useGameStore from './store/gameStore';
import CharacterForm from './components/CharacterCreation/CharacterForm';
import ChatWindow from './components/Chat/ChatWindow';
import StatsPanel from './components/GameStats/StatsPanel';

function App() {
  const { initializeWebSocket } = useGameStore();

  useEffect(() => {
    initializeWebSocket();
  }, [initializeWebSocket]);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="w-full px-6 py-8">
        <h1 className="text-4xl font-medieval text-center mb-8 text-primary-300">
          D&D AI Game Master
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column - Character Form */}
          <div className="lg:col-span-3 h-[800px]">
            <CharacterForm />
          </div>

          {/* Center Column - Chat Window */}
          <div className="lg:col-span-6 h-[800px]">
            <ChatWindow />
          </div>

          {/* Right Column - Stats Panel */}
          <div className="lg:col-span-3">
            <StatsPanel />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
