import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import useGameStore from '../store/gameStore';
import CharacterForm from '../components/CharacterCreation/CharacterForm';
import StatsPanel from '../components/GameStats/StatsPanel';
import ServerStatus from '../components/ServerStatus';
import MobileNav from './MobileNav';

const MainLayout = () => {
  const { initializeWebSocket } = useGameStore();
  const isCharacterCreated = useGameStore((state) => state.isCharacterCreated);

  useEffect(() => {
    initializeWebSocket();
  }, [initializeWebSocket]);

  if (!isCharacterCreated) {
    return (
      <div className="h-full grid grid-cols-1 md:grid-cols-12 gap-4 p-4">
        <div className="md:col-span-8 md:col-start-3 lg:col-span-8 lg:col-start-3 bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <CharacterForm />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <MobileNav />

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 min-h-0 pb-16">
        {/* Desktop Character Form */}
        <div className="hidden lg:block lg:col-span-3 bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <CharacterForm />
        </div>

        {/* Mobile Routes + Desktop Chat */}
        <div className="w-full lg:col-span-6 bg-gray-800 shadow-lg overflow-hidden flex flex-col h-[calc(100vh-10rem)] lg:h-auto">
          <div className="flex-none bg-gray-800 border-b border-gray-700 shadow-lg">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-medieval text-center py-3 md:py-4 text-primary-300">
              D&D AI Game Master
            </h1>
          </div>
          <div className="flex-1 overflow-hidden">
            <Outlet />
          </div>
        </div>

        {/* Desktop Stats Panel */}
        <div className="hidden lg:block lg:col-span-3 bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <StatsPanel />
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex-none bg-gray-800 border-t border-gray-700 fixed bottom-0 left-0 right-0">
        <div className="container mx-auto">
          <ServerStatus />
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
