import React from 'react';

const ColorLegend = () => {
  const legendItems = [
    {
      color: 'text-emerald-400 font-medieval',
      label: 'Locations',
      example: '#The Misty Tavern#',
      bgColor: 'bg-emerald-400/20'
    },
    {
      color: 'text-violet-300 font-medieval',
      label: 'Characters & NPCs',
      example: '@Eldric the Wise@',
      bgColor: 'bg-violet-300/20'
    },
    {
      color: 'text-amber-100 italic',
      label: 'Dialogue',
      example: '"Welcome, traveler"',
      bgColor: 'bg-amber-100/20'
    },
    {
      color: 'text-cyan-300 font-medieval',
      label: 'Game Terms',
      example: '**Wisdom Check**',
      bgColor: 'bg-cyan-300/20'
    },
    {
      color: 'text-amber-200/90 italic',
      label: 'Descriptions',
      example: '*The torch flickers*',
      bgColor: 'bg-amber-200/20'
    },
    {
      color: 'text-purple-400 font-medieval',
      label: 'Dice Rolls',
      example: '`[d20+5]`',
      bgColor: 'bg-purple-400/20'
    },
  ];

  return (
    <div className="mt-4 bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-gray-700/30">
      <h3 className="text-sm font-medieval text-primary-300 mb-3">Message Color Guide</h3>
      <div className="space-y-2">
        {legendItems.map(({ color, label, example, bgColor }, index) => (
          <div key={index} className="flex items-center justify-between bg-gray-900/30 rounded-md p-2">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${bgColor} ring-1 ring-inset ring-white/10`} />
              <span className="text-gray-300 text-sm">{label}</span>
            </div>
            <code className={`${color} text-xs px-2 py-1 rounded bg-gray-900/50`}>
              {example}
            </code>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ColorLegend;
