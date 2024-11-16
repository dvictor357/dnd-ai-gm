import React from 'react';
import useGameStore from '../../store/gameStore';

const ActionSelector = ({ actions }) => {
  const { ws } = useGameStore();

  const handleActionSelect = (action) => {
    if (ws) {
      ws.send(JSON.stringify({
        type: 'action',
        content: action
      }));
    }
  };

  return (
    <div className="flex flex-col gap-2 my-4 w-full max-w-2xl">
      {actions.map((action, index) => (
        <button
          key={index}
          onClick={() => handleActionSelect(action)}
          className="text-left p-4 bg-gray-800/50 hover:bg-gray-700/50 border border-primary-600/30 hover:border-primary-500/50 rounded-lg transition-all duration-200 transform hover:scale-[1.02] hover:translate-x-1 group"
        >
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 flex items-center justify-center rounded-full bg-primary-900/50 border border-primary-600/50 group-hover:bg-primary-800/50 group-hover:border-primary-500/50 text-primary-400 font-medieval">
              {index + 1}
            </div>
            <span className="text-primary-100 font-medieval leading-relaxed">{action}</span>
          </div>
        </button>
      ))}
    </div>
  );
};

export default ActionSelector;
