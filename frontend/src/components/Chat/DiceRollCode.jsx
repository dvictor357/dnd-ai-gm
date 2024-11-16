import React from 'react';

const DiceRollCode = ({ content }) => {
  // Remove any leading/trailing whitespace and extract the actual roll
  const cleanContent = content.toString().trim();
  
  // Check if this is a roll with a label (e.g., "Attack Roll: [1d20+5]")
  const labelMatch = cleanContent.match(/^(.+?):\s*(\[.+?\])$/);
  if (labelMatch) {
    const [_, label, roll] = labelMatch;
    const rollContent = roll.slice(1, -1); // Remove brackets
    const parts = rollContent.match(/^(\d+)?d(\d+)(?:\s*([+-])\s*(\d+))?$/i);
    
    if (parts) {
      const [_, numDice = '1', diceType, modifier, modValue] = parts;
      return (
        <span className="inline-flex items-center gap-2">
          <span className="text-amber-200/90">{label}:</span>
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
        </span>
      );
    }
  }
  
  // Check for just a dice roll without label (e.g., "[1d20+5]")
  const rollMatch = cleanContent.match(/^\[(.+?)\]$/);
  if (rollMatch) {
    const roll = rollMatch[1];
    const parts = roll.match(/^(\d+)?d(\d+)(?:\s*([+-])\s*(\d+))?$/i);
    
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
  
  // Fallback for non-dice content
  return (
    <code className="inline-block px-1.5 py-0.5 bg-cyan-900/30 text-cyan-300 font-medieval glow-sm rounded">
      {cleanContent}
    </code>
  );
};

export default DiceRollCode;
