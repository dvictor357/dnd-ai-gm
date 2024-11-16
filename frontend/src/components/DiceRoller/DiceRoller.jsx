import React, { useState, useEffect } from 'react';
import useGameStore from '../../store/gameStore';

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

const ROLL_REQUEST_KEYWORDS = [
  'roll', 'make a', 'give me a', 'throw', 'rolling',
  'check', 'saving throw', 'save', 'attack roll',
  'roll for', 'roll to'
];

const DiceRoller = () => {
  const [modifier, setModifier] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [showDamage, setShowDamage] = useState(false);
  const [suggestedRoll, setSuggestedRoll] = useState(null);
  const [shouldShow, setShouldShow] = useState(false);
  const { messages, setChatInput, chatInput } = useGameStore();

  // Check if GM is requesting a roll and determine which roll type
  useEffect(() => {
    if (messages.length > 0) {
      const lastGMMessage = [...messages].reverse().find(m => m.type === 'gm_response');
      if (lastGMMessage) {
        const content = lastGMMessage.content.toLowerCase();
        
        // Check if this is a roll request
        const isRollRequest = ROLL_REQUEST_KEYWORDS.some(keyword => content.includes(keyword));
        setShouldShow(isRollRequest);

        if (isRollRequest) {
          // Check for common rolls first
          const commonRoll = COMMON_ROLLS.find(roll => 
            roll.keywords.some(keyword => content.includes(keyword))
          );
          if (commonRoll) {
            setSuggestedRoll({
              type: 'common',
              roll: commonRoll,
              message: `Suggested: ${commonRoll.label} roll`
            });
            return;
          }

          // Check for damage rolls
          const damageRoll = DAMAGE_DICE.find(roll =>
            roll.keywords.some(keyword => content.includes(keyword))
          );
          if (damageRoll) {
            setSuggestedRoll({
              type: 'damage',
              roll: damageRoll,
              message: `Suggested: ${damageRoll.label} damage`
            });
            setShowDamage(true);
            return;
          }

          // If no specific roll type is found but it's a roll request,
          // default to showing a generic suggestion
          setSuggestedRoll({
            type: 'common',
            roll: COMMON_ROLLS[1], // Default to Ability Check
            message: 'Suggested: Make a roll'
          });
        } else {
          setSuggestedRoll(null);
        }
      }
    }
  }, [messages]);

  const handleRoll = (sides, label = '') => {
    const diceNotation = `[${quantity}d${sides}${modifier > 0 ? '+' + modifier : modifier < 0 ? modifier : ''}]`;
    const description = label ? `${label}: ` : '🎲 Rolling ';
    
    // Append the roll to the chat input
    const rollText = `${description}${diceNotation}`;
    setChatInput((chatInput ? chatInput + ' ' : '') + rollText);

    // Hide the dice roller after appending
    setShouldShow(false);
  };

  // Don't render anything if we shouldn't show the dice roller
  if (!shouldShow) return null;

  return (
    <div className="p-4 bg-gray-800 rounded-lg border border-gray-700 shadow-lg animate-fadeIn">
      <div className="flex flex-col gap-4">
        {suggestedRoll && (
          <div className="px-3 py-2 bg-primary-900/30 border border-primary-700/50 rounded-lg text-primary-300 text-sm animate-pulse">
            {suggestedRoll.message}
          </div>
        )}
        
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-300">Modifier:</label>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setModifier(modifier - 1)}
              className="w-6 h-6 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded-md text-gray-300"
            >
              -
            </button>
            <span className="w-8 text-center text-gray-200">{modifier >= 0 ? '+' + modifier : modifier}</span>
            <button
              onClick={() => setModifier(modifier + 1)}
              className="w-6 h-6 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded-md text-gray-300"
            >
              +
            </button>
          </div>
        </div>

        {/* Common D&D Rolls */}
        <div className="grid grid-cols-2 gap-2">
          {COMMON_ROLLS.map(({ label, dice, description }) => (
            <button
              key={label}
              onClick={() => handleRoll(20, label)}
              className={`px-3 py-2 ${
                suggestedRoll?.type === 'common' && suggestedRoll.roll.label === label
                ? 'bg-amber-700/50 text-amber-200 ring-2 ring-amber-500/50'
                : 'bg-amber-900/30 text-amber-300'
              } font-medieval rounded-lg hover:bg-amber-800/40 transform hover:scale-105 transition-all duration-200 flex flex-col items-center justify-center gap-1`}
              title={description}
            >
              <span className="text-lg">🎲</span>
              {label}
            </button>
          ))}
        </div>

        {/* Toggle for damage dice */}
        <button
          onClick={() => setShowDamage(!showDamage)}
          className="text-sm text-gray-400 hover:text-gray-300 underline"
        >
          {showDamage ? 'Hide Damage Dice' : 'Show Damage Dice'}
        </button>

        {/* Damage Dice */}
        {showDamage && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 mb-2">
              <label className="text-sm text-gray-300">Quantity:</label>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-6 h-6 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded-md text-gray-300"
                >
                  -
                </button>
                <span className="w-8 text-center text-gray-200">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-6 h-6 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded-md text-gray-300"
                >
                  +
                </button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {DAMAGE_DICE.map(({ label, sides, description }) => (
                <button
                  key={label}
                  onClick={() => handleRoll(sides)}
                  className={`px-3 py-2 ${
                    suggestedRoll?.type === 'damage' && suggestedRoll.roll.label === label
                    ? 'bg-red-700/50 text-red-200 ring-2 ring-red-500/50'
                    : 'bg-red-900/30 text-red-300'
                  } font-medieval rounded-lg hover:bg-red-800/40 transform hover:scale-105 transition-all duration-200 flex flex-col items-center justify-center gap-1`}
                  title={description}
                >
                  <span className="text-lg">⚔️</span>
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiceRoller;
