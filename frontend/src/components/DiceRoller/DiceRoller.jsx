import React, { useState, useRef } from 'react';
import useGameStore from '../../store/gameStore';
import AnimatedDice from './AnimatedDice';
import { COMMON_ROLLS, DAMAGE_DICE } from '../../constants/gameConstants';

const DiceRoller = () => {
  const [modifier, setModifier] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [showDamage, setShowDamage] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  const [diceType, setDiceType] = useState('d20');
  const [rollType, setRollType] = useState('');
  const diceRef = useRef();
  const { setChatInput } = useGameStore();

  const handleRoll = (diceType, rollType, mod = modifier) => {
    if (isRolling) return;
    setIsRolling(true);
    setDiceType(diceType);
    setRollType(rollType);
    // Force a small delay to ensure state updates before animation
    setTimeout(() => {
      diceRef.current?.rollDice();
    }, 50);
  };

  const handleRollComplete = () => {
    setIsRolling(false);
    const rollNotation = `${rollType} [${quantity}${diceType}${modifier >= 0 ? '+' : ''}${modifier}]`;
    setChatInput(rollNotation);
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
            onClick={() => handleRoll(roll.dice, roll.label)}
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
