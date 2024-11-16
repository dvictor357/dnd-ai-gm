import React from 'react';

const calculateModifier = (value) => {
  return Math.floor((value - 10) / 2);
};

const StatBlock = ({ 
  stat, 
  label, 
  value, 
  onIncrease, 
  onDecrease, 
  canIncrease, 
  canDecrease 
}) => {
  const modifier = calculateModifier(value);
  const modifierColor = modifier >= 0 ? 'text-emerald-400' : 'text-red-400';

  const buttonStyle = `w-6 h-6 flex items-center justify-center transition-all duration-200
    font-medieval text-xs font-bold transform hover:scale-105 outline-none focus:outline-none
    before:content-[''] before:absolute before:inset-0 
    before:border-2 before:border-amber-600/50
    before:bg-gradient-to-b from-amber-950/90 to-amber-900/90 
    before:rounded-sm before:-skew-x-12 before:transition-all before:duration-200
    disabled:before:from-gray-800/50 disabled:before:to-gray-900/50 
    disabled:before:border-gray-700/30 disabled:text-gray-600 disabled:cursor-not-allowed
    relative overflow-hidden group/btn
    hover:before:border-amber-500/80 hover:before:from-amber-900/90 hover:before:to-amber-800/90
    active:before:from-amber-950/90 active:before:to-amber-900/90
    disabled:hover:before:from-gray-800/50 disabled:hover:before:to-gray-900/50`;

  return (
    <div className="relative group">
      <div className="stat-block bg-gray-900/80 px-4 py-2 rounded-lg border-2 border-primary-800/50 backdrop-blur-sm 
                    transform transition-all duration-300 group-hover:border-primary-600/80
                    shadow-sm hover:shadow-primary-500/20">
        <div className="flex items-center justify-between">
          {/* Label */}
          <div className="text-sm font-medieval text-primary-300 uppercase tracking-wide w-28">
            {label}
          </div>

          <div className="flex items-center space-x-3">
            {/* Decrease Button */}
            <div className="relative group/tooltip">
              <button
                onClick={onDecrease}
                disabled={!canDecrease}
                className={buttonStyle}
              >
                <span className="relative z-10 text-primary-300 group-hover/btn:text-primary-200">−</span>
              </button>
              {!canDecrease && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs font-medieval
                              bg-gray-900/90 text-gray-300 rounded border border-gray-700
                              opacity-0 group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap">
                  Cannot decrease below 8
                </div>
              )}
            </div>

            {/* Value Display */}
            <div className="flex items-center space-x-2 w-16 justify-center">
              <div className="text-xl font-bold font-medieval text-white">
                {value}
              </div>
              <div className={`text-xs font-medieval ${modifierColor}`}>
                ({modifier >= 0 ? `+${modifier}` : modifier})
              </div>
            </div>

            {/* Increase Button */}
            <div className="relative group/tooltip">
              <button
                onClick={onIncrease}
                disabled={!canIncrease}
                className={buttonStyle}
              >
                <span className="relative z-10 text-primary-300 group-hover/btn:text-primary-200">+</span>
              </button>
              {!canIncrease && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs font-medieval
                              bg-gray-900/90 text-gray-300 rounded border border-gray-700
                              opacity-0 group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap">
                  {value >= 15 ? "Cannot increase above 15" : "Not enough points"}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatBlock;
