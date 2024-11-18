import React, { useState, useEffect, useRef } from 'react';
import useGameStore from '../../store/gameStore';
import AnimatedDice from './AnimatedDice';
import { ROLL_REQUEST_KEYWORDS, isRollRequest } from '../../constants/gameConstants';

const COMMON_ROLLS = [
  { label: 'Attack', dice: 'd20', defaultModifier: 0, description: 'Roll to hit', keywords: ['attack', 'hit', 'strike', 'swing'] },
  { label: 'Ability Check', dice: 'd20', defaultModifier: 0, description: 'Roll for ability checks', keywords: ['check', 'ability', 'skill', 'try', 'attempt'] },
  { label: 'Saving Throw', dice: 'd20', defaultModifier: 0, description: 'Roll to save', keywords: ['save', 'resist', 'avoid'] },
  { label: 'Initiative', dice: 'd20', defaultModifier: 0, description: 'Roll for turn order', keywords: ['initiative', 'combat', 'battle', 'fight'] },
];

const DAMAGE_DICE = [
  { label: 'd4', sides: 4, description: 'Dagger, dart', keywords: ['dagger', 'dart', 'small weapon'] },
  { label: 'd6', sides: 6, description: 'Short sword, mace', keywords: ['short sword', 'mace', 'shortsword'] },
  { label: 'd8', sides: 8, description: 'Long sword, rapier', keywords: ['longsword', 'long sword', 'rapier'] },
  { label: 'd10', sides: 10, description: 'Pike, glaive', keywords: ['pike', 'glaive', 'halberd'] },
  { label: 'd12', sides: 12, description: 'Greataxe', keywords: ['greataxe', 'great axe'] },
];

const DiceRoller = () => {
  const [modifier, setModifier] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [showDamage, setShowDamage] = useState(false);
  const [suggestedRoll, setSuggestedRoll] = useState(null);
  const [isRolling, setIsRolling] = useState(false);
  const [diceType, setDiceType] = useState('d20');
  const diceRef = useRef();
  const { messages, setChatInput, chatInput, ws } = useGameStore();

  // Check if GM is requesting a roll and determine which roll type
  useEffect(() => {
    if (messages.length > 0) {
      const lastGMMessage = [...messages].reverse().find(m => m.type === 'gm_response');
      if (lastGMMessage) {
        const content = lastGMMessage.content.toLowerCase();

        // Check if this is a roll request
        if (isRollRequest(content)) {
          // Check for common rolls first
          const commonRoll = COMMON_ROLLS.find(roll =>
            roll.keywords.some(keyword => content.includes(keyword))
          );

          if (commonRoll) {
            setSuggestedRoll({
              type: 'common',
              roll: commonRoll,
              message: `The GM is asking for a ${commonRoll.label.toLowerCase()} roll!`
            });
          }
          // Check for damage rolls
          else {
            const damageRoll = DAMAGE_DICE.find(roll =>
              roll.keywords.some(keyword => content.includes(keyword))
            );

            if (damageRoll) {
              setSuggestedRoll({
                type: 'damage',
                roll: damageRoll,
                message: `Roll ${damageRoll.label} for damage!`
              });
              setShowDamage(true);
            }
          }
        } else {
          setSuggestedRoll(null);
        }
      }
    }
  }, [messages]);

  const handleRoll = (type, mod = modifier) => {
    if (isRolling) return;
    setIsRolling(true);
    setDiceType(type);
    // Force a small delay to ensure state updates before animation
    setTimeout(() => {
      diceRef.current?.rollDice();
    }, 50);
  };

  const handleRollComplete = () => {
    setIsRolling(false);
    // Now send the roll message
    const rollNotation = `[${quantity}${diceType}${modifier >= 0 ? '+' : ''}${modifier}]`;
    setChatInput(rollNotation);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'message',
        content: rollNotation
      }));
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-center">
        <AnimatedDice
          ref={diceRef}
          diceType={diceType}
          onRollComplete={handleRollComplete}
          initialRotation={{ x: Math.random() * Math.PI, y: Math.random() * Math.PI, z: Math.random() * Math.PI }}
        />
      </div>

      {/* Common Rolls */}
      <div className="grid grid-cols-2 gap-2">
        {COMMON_ROLLS.map((roll) => (
          <button
            key={roll.label}
            onClick={() => handleRoll(roll.dice)}
            disabled={isRolling}
            className={`px-3 py-2 bg-purple-700 rounded hover:bg-purple-600 transition-colors ${isRolling ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {roll.label}
          </button>
        ))}
      </div>

      {/* Damage Dice Toggle */}
      <button
        onClick={() => setShowDamage(!showDamage)}
        className="w-full px-3 py-2 bg-red-700 rounded hover:bg-red-600 transition-colors"
      >
        {showDamage ? 'Hide Damage Dice' : 'Show Damage Dice'}
      </button>

      {/* Damage Dice */}
      {showDamage && (
        <div className="grid grid-cols-2 gap-2">
          {DAMAGE_DICE.map((die) => (
            <button
              key={die.label}
              onClick={() => handleRoll(die.label)}
              disabled={isRolling}
              className={`px-3 py-2 bg-red-700 rounded hover:bg-red-600 transition-colors ${isRolling ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {die.label}
            </button>
          ))}
        </div>
      )}

      {/* Modifier Controls */}
      <div className="flex gap-2 items-center justify-center">
        <button
          onClick={() => setModifier(mod => mod - 1)}
          disabled={isRolling}
          className="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600 transition-colors"
        >
          -
        </button>
        <span className="w-20 text-center">
          Modifier: {modifier >= 0 ? '+' : ''}{modifier}
        </span>
        <button
          onClick={() => setModifier(mod => mod + 1)}
          disabled={isRolling}
          className="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600 transition-colors"
        >
          +
        </button>
      </div>

      {/* Quantity Controls */}
      <div className="flex gap-2 items-center justify-center">
        <button
          onClick={() => setQuantity(q => Math.max(1, q - 1))}
          disabled={isRolling}
          className="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600 transition-colors"
        >
          -
        </button>
        <span className="w-20 text-center">
          Quantity: {quantity}
        </span>
        <button
          onClick={() => setQuantity(q => q + 1)}
          disabled={isRolling}
          className="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600 transition-colors"
        >
          +
        </button>
      </div>
    </div>
  );
};

export default DiceRoller;
