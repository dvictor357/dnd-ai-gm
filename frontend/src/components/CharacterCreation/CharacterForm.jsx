import React from 'react';
import useGameStore from '../../store/gameStore';
import StatBlock from './StatBlock';

const races = [
  { name: "Human" },
  { name: "Elf" },
  { name: "Dwarf" },
  { name: "Halfling" },
  { name: "Dragonborn" },
  { name: "Gnome" },
  { name: "Half-Elf" },
  { name: "Half-Orc" },
  { name: "Tiefling" }
];

const classes = [
  { name: "Fighter" },
  { name: "Wizard" },
  { name: "Rogue" },
  { name: "Cleric" },
  { name: "Ranger" },
  { name: "Paladin" },
  { name: "Barbarian" },
  { name: "Bard" },
  { name: "Druid" },
  { name: "Monk" },
  { name: "Sorcerer" },
  { name: "Warlock" }
];

const backgrounds = [
  { name: "Acolyte" },
  { name: "Criminal" },
  { name: "Folk Hero" },
  { name: "Noble" },
  { name: "Sage" },
  { name: "Soldier" },
  { name: "Charlatan" },
  { name: "Entertainer" },
  { name: "Guild Artisan" },
  { name: "Hermit" },
  { name: "Outlander" },
  { name: "Sailor" },
  { name: "Urchin" }
];

const CharacterForm = () => {
  const {
    character,
    updateCharacterField,
    pointsRemaining,
    isCharacterCreated,
    setIsCharacterCreated,
    setPointsRemaining,
    setStat,
    ws
  } = useGameStore();

  // Point buy costs for each ability score
  const POINT_COSTS = {
    8: 0,
    9: 1,
    10: 2,
    11: 3,
    12: 4,
    13: 5,
    14: 7,
    15: 9
  };

  const getPointCost = (score) => POINT_COSTS[score] || 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted', { character, pointsRemaining });
    
    if (!character.name || !character.race || !character.class || pointsRemaining > 0) {
      console.log('Form validation failed', { 
        hasName: !!character.name, 
        hasRace: !!character.race, 
        hasClass: !!character.class, 
        pointsRemaining 
      });
      return;
    }

    if (ws && ws.connected) {
      console.log('Sending character data to server');
      setIsCharacterCreated(true);
      ws.emit('character_created', character);
    } else {
      console.error('WebSocket not connected');
    }
  };

  const handleStatChange = (stat, change) => {
    const currentValue = character.stats[stat];
    const newValue = currentValue + change;

    // Check if the new value is within bounds
    if (newValue < 8 || newValue > 15) return;

    // Calculate point difference
    const currentCost = getPointCost(currentValue);
    const newCost = getPointCost(newValue);
    const pointDifference = newCost - currentCost;

    // Check if we have enough points for increase
    if (pointDifference > pointsRemaining) return;

    // Update the stat and points
    setStat(stat, newValue);
    setPointsRemaining(pointsRemaining - pointDifference);
  };

  const stats = [
    { key: 'strength', label: 'Strength' },
    { key: 'dexterity', label: 'Dexterity' },
    { key: 'constitution', label: 'Constitution' },
    { key: 'intelligence', label: 'Intelligence' },
    { key: 'wisdom', label: 'Wisdom' },
    { key: 'charisma', label: 'Charisma' }
  ];

  const isFormValid = !isCharacterCreated && pointsRemaining === 0 && character.name && character.race && character.class;

  // Allow decreasing stats even when no points remaining
  const canIncreaseStats = !isCharacterCreated && pointsRemaining > 0;

  return (
    <form onSubmit={handleSubmit} className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto">
        {isCharacterCreated ? (
          <div className="p-6 space-y-6">
            {/* Character Overview Card */}
            <div className="bg-gray-900/50 p-6 rounded-lg border border-violet-700/20 backdrop-blur-sm">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Character Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medieval text-primary-200 border-b border-gray-700/50 pb-2">
                    Character Details
                  </h3>
                  <div className="grid gap-3">
                    <div className="bg-gray-800/40 p-3 rounded-lg backdrop-blur-sm">
                      <div className="text-sm text-gray-400 mb-1">Name</div>
                      <div className="text-lg text-violet-300 font-medieval">@{character.name}@</div>
                    </div>
                    <div className="bg-gray-800/40 p-3 rounded-lg backdrop-blur-sm">
                      <div className="text-sm text-gray-400 mb-1">Race</div>
                      <div className="text-lg text-violet-300 font-medieval">@{character.race}@</div>
                    </div>
                    <div className="bg-gray-800/40 p-3 rounded-lg backdrop-blur-sm">
                      <div className="text-sm text-gray-400 mb-1">Class</div>
                      <div className="text-lg text-violet-300 font-medieval">@{character.class}@</div>
                    </div>
                    <div className="bg-gray-800/40 p-3 rounded-lg backdrop-blur-sm">
                      <div className="text-sm text-gray-400 mb-1">Background</div>
                      <div className="text-lg text-violet-300 font-medieval">@{character.background}@</div>
                    </div>
                  </div>
                </div>
                {/* Character Stats */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medieval text-primary-200 border-b border-gray-700/50 pb-2">
                    Ability Scores
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {stats.map(({ key, label }) => (
                      <div key={key} className="bg-gray-800/40 p-3 rounded-lg backdrop-blur-sm">
                        <div className="text-sm text-gray-400 mb-1">{label}</div>
                        <div className="text-lg text-violet-300 font-medieval">{character.stats[key]}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6">
            {/* Title */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-medieval text-primary-300">Create Your Character</h2>
              <p className="text-gray-400 mt-2">Shape your destiny in this magical realm</p>
            </div>

            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Basic Info */}
                <div className="h-full">
                  <div className="bg-gray-900/50 p-6 rounded-lg border border-primary-700/20 backdrop-blur-sm h-full">
                    <h3 className="text-xl font-medieval text-primary-300 mb-4">Character Details</h3>
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medieval text-primary-200 mb-1">
                          Name
                        </label>
                        <input
                          type="text"
                          id="name"
                          value={character.name}
                          onChange={(e) => updateCharacterField('name', e.target.value)}
                          className="w-full px-4 py-2 bg-gray-800/80 border-2 border-primary-800/30 rounded-lg
                                   text-white placeholder-gray-500 font-medieval
                                   focus:border-primary-600/50 focus:outline-none focus:ring-0
                                   hover:border-primary-700/40 transition-colors"
                          placeholder="Enter your character's name"
                        />
                      </div>

                      <div>
                        <label htmlFor="race" className="block text-sm font-medieval text-primary-200 mb-1">
                          Race
                        </label>
                        <select
                          id="race"
                          value={character.race}
                          onChange={(e) => updateCharacterField('race', e.target.value)}
                          className="w-full px-4 py-2 bg-gray-800/80 border-2 border-primary-800/30 rounded-lg
                                   text-white font-medieval
                                   focus:border-primary-600/50 focus:outline-none focus:ring-0
                                   hover:border-primary-700/40 transition-colors"
                        >
                          <option value="" className="bg-gray-900">Choose your race</option>
                          {races.map((race) => (
                            <option key={race.name} value={race.name} className="bg-gray-900">
                              {race.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="class" className="block text-sm font-medieval text-primary-200 mb-1">
                          Class
                        </label>
                        <select
                          id="class"
                          value={character.class}
                          onChange={(e) => updateCharacterField('class', e.target.value)}
                          className="w-full px-4 py-2 bg-gray-800/80 border-2 border-primary-800/30 rounded-lg
                                   text-white font-medieval
                                   focus:border-primary-600/50 focus:outline-none focus:ring-0
                                   hover:border-primary-700/40 transition-colors"
                        >
                          <option value="" className="bg-gray-900">Choose your class</option>
                          {classes.map((cls) => (
                            <option key={cls.name} value={cls.name} className="bg-gray-900">
                              {cls.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="background" className="block text-sm font-medieval text-primary-200 mb-1">
                          Background
                        </label>
                        <select
                          id="background"
                          value={character.background}
                          onChange={(e) => updateCharacterField('background', e.target.value)}
                          className="w-full px-4 py-2 bg-gray-800/80 border-2 border-primary-800/30 rounded-lg
                                   text-white font-medieval
                                   focus:border-primary-600/50 focus:outline-none focus:ring-0
                                   hover:border-primary-700/40 transition-colors"
                        >
                          <option value="" className="bg-gray-900">Choose your background</option>
                          {backgrounds.map((bg) => (
                            <option key={bg.name} value={bg.name} className="bg-gray-900">
                              {bg.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ability Scores */}
                <div className="h-full">
                  <div className="bg-gray-900/50 p-6 rounded-lg border border-primary-700/20 backdrop-blur-sm h-full">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-medieval text-primary-300">Ability Scores</h3>
                      <div className="px-3 py-1 bg-gray-800/80 rounded-full border border-primary-700/30">
                        <span className="text-sm text-gray-400">Points: </span>
                        <span className="text-primary-300 font-bold">{pointsRemaining}</span>
                      </div>
                    </div>
                    <div className="grid gap-4">
                      {stats.map(({ key, label }) => (
                        <StatBlock
                          key={key}
                          stat={key}
                          label={label}
                          value={character.stats[key]}
                          onIncrease={() => handleStatChange(key, 1)}
                          onDecrease={() => handleStatChange(key, -1)}
                          canIncrease={canIncreaseStats}
                          canDecrease={!isCharacterCreated}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {!isCharacterCreated && (
        <div className="flex-none p-6 bg-gray-900/50 border-t border-gray-700">
          <div className="max-w-4xl mx-auto">
            <button
              type="submit"
              disabled={!isFormValid}
              className={`
                w-full py-3 px-6 rounded-lg font-medieval text-lg
                transition-all duration-200 transform hover:scale-[1.02]
                ${isFormValid
                  ? 'bg-gradient-to-r from-primary-900 to-primary-800 text-primary-100 hover:from-primary-800 hover:to-primary-700 border-2 border-primary-700/50'
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed border-2 border-gray-700/30'
                }
              `}
            >
              Begin Your Journey
            </button>
            {!isFormValid && (
              <p className="text-center text-sm text-gray-500 mt-2">
                Complete all fields and assign ability scores to continue
              </p>
            )}
          </div>
        </div>
      )}
    </form>
  );
};

export default CharacterForm;
