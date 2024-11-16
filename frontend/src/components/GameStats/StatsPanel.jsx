import React from 'react';
import useGameStore from '../../store/gameStore';
import { UsersIcon, SparklesIcon, CubeIcon } from '@heroicons/react/24/solid';

const StatItem = ({ icon: Icon, label, value }) => (
  <div className="stat-item bg-gray-700 p-3 rounded-lg transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-lg border border-transparent hover:border-primary-500">
    <div className="flex items-center space-x-3">
      <div className="p-2 bg-primary-900 rounded-lg">
        <Icon className="w-5 h-5 text-primary-400" />
      </div>
      <div>
        <div className="text-sm font-medium text-primary-300">{label}</div>
        <div className="text-lg font-bold text-white">{value}</div>
      </div>
    </div>
  </div>
);

const StatsPanel = () => {
  const { gameStats } = useGameStore();

  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-4 rounded-lg shadow-lg">
      <h2 className="text-xl font-medieval text-primary-300 mb-4">Game Statistics</h2>
      <div className="grid grid-cols-3 gap-4">
        <StatItem
          icon={UsersIcon}
          label="Players"
          value={gameStats.playerCount}
        />
        <StatItem
          icon={SparklesIcon}
          label="Encounters"
          value={gameStats.encounterCount}
        />
        <StatItem
          icon={CubeIcon}
          label="Rolls"
          value={gameStats.rollCount}
        />
      </div>
    </div>
  );
};

export default StatsPanel;
