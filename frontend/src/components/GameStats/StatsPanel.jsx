import React, { useEffect, useState, useMemo } from 'react';
import useGameStore from '../../store/gameStore';
import DiceRoller from '../DiceRoller/DiceRoller';

const StatCard = ({ label, value, icon, trend }) => (
  <div className="p-4 bg-gray-800/60 backdrop-blur-sm rounded-lg border border-gray-700/50 hover:border-primary-500/30 transition-all duration-300">
    <div className="flex items-center justify-between mb-2">
      <div className="text-sm text-gray-400 font-medieval">{label}</div>
      <div className="text-primary-400/70">{icon}</div>
    </div>
    <div className="flex items-end justify-between">
      <div className="text-2xl font-bold text-primary-300">{value}</div>
      {typeof trend === 'number' && (
        <div className={`text-sm ${trend > 0 ? 'text-green-400' : trend < 0 ? 'text-red-400' : 'text-gray-400'}`}>
          {trend > 0 ? '↑' : trend < 0 ? '↓' : '−'} {Math.abs(trend)}%
        </div>
      )}
    </div>
  </div>
);

const ACTION_KEYWORDS = ['attack', 'move', 'use', 'cast', 'search', 'check', 'investigate', 'interact'];
const DECISION_KEYWORDS = ['choose', 'decide', 'select', 'pick', 'option', 'choice'];
const ROLL_KEYWORDS = ['roll', 'rolling', 'd20', 'd12', 'd10', 'd8', 'd6', 'd4'];

const StatsPanel = () => {
  const { messages } = useGameStore();
  const [previousStats, setPreviousStats] = useState(null);
  const [trends, setTrends] = useState({});
  
  // Calculate all stats from messages
  const currentStats = useMemo(() => {
    const gmMessages = messages.filter(m => m.type === 'gm_response');
    const playerMessages = messages.filter(m => m.type === 'user_message');
    
    return {
      messageCount: gmMessages.length,
      actionCount: gmMessages.filter(m => 
        ACTION_KEYWORDS.some(keyword => 
          m.content.toLowerCase().includes(keyword)
        )
      ).length,
      decisionCount: gmMessages.filter(m => 
        DECISION_KEYWORDS.some(keyword => 
          m.content.toLowerCase().includes(keyword)
        )
      ).length,
      rollCount: gmMessages.filter(m => 
        ROLL_KEYWORDS.some(keyword => 
          m.content.toLowerCase().includes(keyword)
        )
      ).length
    };
  }, [messages]);
  
  // Check if the last GM message contains a roll request
  const shouldShowDiceRoller = messages.length > 0 && 
    [...messages].reverse().find(m => m.type === 'gm_response')?.content.toLowerCase().includes('roll');

  // Calculate trends when stats change
  useEffect(() => {
    if (previousStats) {
      const newTrends = {
        messageCount: calculateTrend(previousStats.messageCount, currentStats.messageCount),
        actionCount: calculateTrend(previousStats.actionCount, currentStats.actionCount),
        decisionCount: calculateTrend(previousStats.decisionCount, currentStats.decisionCount),
        rollCount: calculateTrend(previousStats.rollCount, currentStats.rollCount),
      };
      setTrends(newTrends);
    }
    setPreviousStats(currentStats);
  }, [currentStats]);

  // Helper function to calculate percentage change
  const calculateTrend = (previous, current) => {
    if (!previous || previous === 0) return 0;
    const change = ((current - previous) / previous) * 100;
    return Math.round(change);
  };

  const stats = [
    {
      label: "Messages",
      value: currentStats.messageCount,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
        </svg>
      ),
      trend: trends.messageCount
    },
    {
      label: "Actions",
      value: currentStats.actionCount,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M6.672 1.911a1 1 0 10-1.932.518l.259.966a1 1 0 001.932-.518l-.26-.966zM2.429 4.74a1 1 0 10-.517 1.932l.966.259a1 1 0 00.517-1.932l-.966-.26zm8.814-.569a1 1 0 00-1.415-1.414l-.707.707a1 1 0 101.415 1.415l.707-.708zm-7.071 7.072l.707-.707A1 1 0 003.465 9.12l-.708.707a1 1 0 001.415 1.415zm3.2-5.171a1 1 0 00-1.3 1.3l4 10a1 1 0 001.823.075l1.38-2.759 3.018 3.02a1 1 0 001.414-1.415l-3.019-3.02 2.76-1.379a1 1 0 00-.076-1.822l-10-4z" clipRule="evenodd" />
        </svg>
      ),
      trend: trends.actionCount
    },
    {
      label: "Decisions",
      value: currentStats.decisionCount,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
          <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
        </svg>
      ),
      trend: trends.decisionCount
    },
    {
      label: "Rolls",
      value: currentStats.rollCount,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" />
        </svg>
      ),
      trend: trends.rollCount
    }
  ];

  return (
    <div className="h-full flex flex-col bg-gray-900/30 backdrop-blur-sm">
      <div className="flex-none p-4 border-b border-gray-700/50">
        <h2 className="text-xl font-medieval text-primary-300 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
            <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
          </svg>
          Game Stats
        </h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          {stats.map((stat, index) => (
            <StatCard
              key={index}
              label={stat.label}
              value={stat.value}
              icon={stat.icon}
              trend={stat.trend}
            />
          ))}
        </div>

        {/* Dice Roller - Only show when a roll is requested */}
        {shouldShowDiceRoller && (
          <div className="transition-all duration-300 ease-in-out bg-gray-800/60 backdrop-blur-sm rounded-lg border border-gray-700/50 p-4">
            <h3 className="text-lg font-medieval text-primary-300 mb-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" />
              </svg>
              Dice Roller
            </h3>
            <DiceRoller />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsPanel;
