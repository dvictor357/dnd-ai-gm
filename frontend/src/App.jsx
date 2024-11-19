import React, { useEffect, useState } from 'react';
import useGameStore from './store/gameStore';
import CharacterForm from './components/CharacterCreation/CharacterForm';
import ChatWindow from './components/Chat/ChatWindow';
import StatsPanel from './components/GameStats/StatsPanel';
import ServerStatus from './components/ServerStatus';

function App() {
  const { initializeWebSocket } = useGameStore();
  const isCharacterCreated = useGameStore((state) => state.isCharacterCreated);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    initializeWebSocket();
  }, [initializeWebSocket]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-hidden">
        {/* Mobile Navigation (only visible on mobile) */}
        {isCharacterCreated && (
          <div className="lg:hidden bg-gray-800 border-b border-gray-700 p-4">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="flex items-center justify-center w-full p-2 text-gray-300 hover:text-white bg-gray-700 rounded-lg"
            >
              <span className="mr-2">{isMobileMenuOpen ? 'Hide' : 'Show'} Menu</span>
              <svg
                className={`w-6 h-6 transform transition-transform ${
                  isMobileMenuOpen ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          </div>
        )}

        {/* Main Content */}
        <div className={`h-full grid grid-cols-1 md:grid-cols-12 gap-4 p-4 lg:p-4 transition-all duration-300 ${
          isMobileMenuOpen && isCharacterCreated ? 'mt-0' : ''
        } ${!isMobileMenuOpen && isCharacterCreated ? 'p-0 md:p-0 lg:p-4' : ''}`}>
          {/* Character Form - Full width on mobile, adjusted for tablet/desktop */}
          <div
            className={`${
              isCharacterCreated
                ? 'md:col-span-12 lg:col-span-3 ' + 
                  (isMobileMenuOpen ? 'block' : 'hidden lg:block')
                : 'md:col-span-8 md:col-start-3 lg:col-span-8 lg:col-start-3'
            } bg-gray-800 rounded-lg shadow-lg overflow-hidden flex flex-col ${
              isCharacterCreated ? 'md:rounded-lg' : ''
            }`}
          >
            <CharacterForm />
          </div>

          {/* Center Column - Chat Window */}
          {isCharacterCreated && (
            <div className={`md:col-span-12 lg:col-span-6 bg-gray-800 shadow-lg overflow-hidden flex flex-col ${
              isMobileMenuOpen ? 'hidden lg:flex' : 'flex'
            } ${
              isMobileMenuOpen ? 'lg:rounded-lg' : 'rounded-none lg:rounded-lg'
            } h-[calc(100vh-4rem)] lg:h-auto`}>
              <div className="flex-none bg-gray-800 border-b border-gray-700 shadow-lg">
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-medieval text-center py-3 md:py-4 text-primary-300">
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
            <div className={`md:col-span-12 lg:col-span-3 bg-gray-800 rounded-lg shadow-lg overflow-hidden flex flex-col animate-fade-in ${
              isMobileMenuOpen ? 'block' : 'hidden lg:block'
            }`}>
              <StatsPanel />
            </div>
          )}
        </div>
      </div>

      {/* Server Status - Always at bottom */}
      <div className="flex-none">
        <ServerStatus />
      </div>
    </div>
  );
}

export default App;
