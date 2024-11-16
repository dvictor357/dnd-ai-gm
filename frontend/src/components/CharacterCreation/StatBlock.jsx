import React from 'react';
import useGameStore from '../../store/gameStore';

const calculateModifier = (value) => {
  return Math.floor((value - 10) / 2);
};

const calculatePointCost = (value) => {
  const costs = {
    8: 0, 9: 1, 10: 2, 11: 3, 12: 4,
    13: 5, 14: 7, 15: 9
  };
  return costs[value] || 0;
};

const StatBlock = ({ stat, label }) => {
  const { character, pointsRemaining, setStat, setPointsRemaining } = useGameStore();
  const value = character.stats[stat];
  const modifier = calculateModifier(value);

  const handleIncrease = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (value < 15) {
      const currentCost = calculatePointCost(value);
      const newCost = calculatePointCost(value + 1);
      const pointDifference = newCost - currentCost;

      if (pointsRemaining >= pointDifference) {
        setStat(stat, value + 1);
        setPointsRemaining(pointsRemaining - pointDifference);
      }
    }
  };

  const handleDecrease = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (value > 8) {
      const currentCost = calculatePointCost(value);
      const newCost = calculatePointCost(value - 1);
      const pointDifference = currentCost - newCost;

      setStat(stat, value - 1);
      setPointsRemaining(pointsRemaining + pointDifference);
    }
  };

  return (
    <div className="stat-block bg-gray-800 p-0 rounded-lg shadow-lg border border-primary-800/50">
      <div className="text-lg font-medieval text-primary-300 mb-2 text-center">{label}</div>
      <div className="flex items-center">
        <button
          onClick={handleDecrease}
          disabled={value <= 8}
          className="w-6 h-6 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-primary-300 border border-primary-600 font-medieval text-sm transform hover:scale-105 transition-transform duration-200 shadow-md hover:shadow-primary-600/20 rotate-90"
          style={{ clipPath: 'polygon(20% 0%, 80% 0%, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0% 20%)' }}
        >
          <span className="-rotate-90">-</span>
        </button>
        <div className="text-center relative min-w-[40px]">
          <div className="text-2xl font-bold font-medieval text-primary-100">{value}</div>
          <div className={`text-sm ${modifier >= 0 ? 'text-cyan-400' : 'text-red-400'} font-medieval`}>
            {modifier >= 0 ? `+${modifier}` : modifier}
          </div>
        </div>
        <button
          onClick={handleIncrease}
          disabled={value >= 15 || pointsRemaining < calculatePointCost(value + 1) - calculatePointCost(value)}
          className="w-6 h-6 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-primary-300 border border-primary-600 font-medieval text-sm transform hover:scale-105 transition-transform duration-200 shadow-md hover:shadow-primary-600/20 rotate-90"
          style={{ clipPath: 'polygon(20% 0%, 80% 0%, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0% 20%)' }}
        >
          <span className="-rotate-90">+</span>
        </button>
      </div>
    </div>
  );
};

export default StatBlock;
