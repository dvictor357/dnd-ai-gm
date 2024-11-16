import React from 'react';
import useGameStore from '../../store/gameStore';
import DiceRoller from '../DiceRoller/DiceRoller';

const StatCard = ({ label, value }) => (
  <div className="p-3 bg-gray-800 rounded-lg">
    <div className="text-sm text-gray-400">{label}</div>
    <div className="text-2xl font-bold text-primary-300">{value}</div>
  </div>
);

const StatsPanel = () => {
  const { gameStats } = useGameStore();

  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-medieval text-primary-300">Game Stats</h2>
        <div className="grid grid-cols-2 gap-4">
          <StatCard
            label="Messages"
            value={gameStats.messageCount}
          />
          <StatCard
            label="Actions"
            value={gameStats.actionCount}
          />
          <StatCard
            label="Decisions"
            value={gameStats.decisionCount}
          />
          <StatCard
            label="Rolls"
            value={gameStats.rollCount}
          />
        </div>
      </div>

      {/* Dice Roller */}
      <div className="transition-all duration-300 ease-in-out">
        <DiceRoller />
      </div>
    </div>
  );
};

export default StatsPanel;
