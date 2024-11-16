import React from 'react';

const DiceRollCode = ({ content }) => {
  const dicePattern = /^(?:\[)?(?:(?:\d+)?d\d+(?:\s*[+-]\s*\d+)?|\d+)(?:\])?$/i;
  const isDiceRoll = dicePattern.test(content);
  const cleanContent = content.toString().replace(/^\[|\]$/g, '');
  
  if (isDiceRoll) {
    const parts = cleanContent.match(/^(\d+)?d(\d+)(?:\s*([+-])\s*(\d+))?$/i);
    if (parts) {
      const [_, numDice = '1', diceType, modifier, modValue] = parts;
      return (
        <code className="inline-flex items-center gap-1 px-2 py-1 bg-purple-900/30 text-purple-300 font-medieval glow-dice rounded-lg transform hover:scale-105 transition-all duration-200">
          <span className="text-purple-400">{numDice}</span>
          <span className="text-purple-300">d</span>
          <span className="text-purple-400">{diceType}</span>
          {modifier && (
            <>
              <span className="text-purple-300">{modifier}</span>
              <span className="text-purple-400">{modValue}</span>
            </>
          )}
        </code>
      );
    }
  }
  
  return (
    <code className="inline-block px-1.5 py-0.5 bg-cyan-900/30 text-cyan-300 font-medieval glow-sm rounded">
      {cleanContent}
    </code>
  );
};

export default DiceRollCode;
