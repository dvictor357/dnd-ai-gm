import React from 'react';

const DiceRollCode = ({ content }) => {
  // Clean up the content by removing extra backticks
  const cleanContent = content.replace(/^`+|`+$/g, '');

  // Check if this is a dice roll
  const isDiceRoll = /^\[(\d*d\d+(?:[+-]\d+)?)\]$/.test(cleanContent);

  if (isDiceRoll) {
    return (
      <code className="text-purple-400 bg-purple-900/30 px-1.5 py-0.5 rounded font-medieval glow-sm">
        {cleanContent}
      </code>
    );
  }

  // For non-dice roll code blocks, use cyan styling
  return (
    <code className="text-cyan-300 bg-cyan-900/30 px-1.5 py-0.5 rounded">
      {cleanContent}
    </code>
  );
};

export default DiceRollCode;
