import React from 'react';
import useGameStore from '../../store/gameStore';
import StatBlock from './StatBlock';
import ColorLegend from '../Character/ColorLegend';

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
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg flex-1 overflow-y-auto">
        {isCharacterCreated ? (
          <div className="space-y-6">
            {/* Character Overview Card */}
            <div className="bg-gray-900/50 p-4 rounded-lg border border-violet-700/20 backdrop-blur-sm">
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
                      <div className="text-lg text-emerald-400 font-medieval">{character.race}</div>
                    </div>
                    <div className="bg-gray-800/40 p-3 rounded-lg backdrop-blur-sm">
                      <div className="text-sm text-gray-400 mb-1">Class</div>
                      <div className="text-lg text-amber-400 font-medieval">{character.class}</div>
                    </div>
                  </div>
                </div>

                {/* Ability Scores */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medieval text-primary-200 border-b border-gray-700/50 pb-2">
                    Ability Scores
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {stats.map(({ key, label }) => {
                      const score = character.stats[key];
                      const modifier = Math.floor((score - 10) / 2);
                      const modifierText = modifier >= 0 ? `+${modifier}` : modifier;

                      return (
                        <div
                          key={key}
                          className="bg-gray-800/40 p-3 rounded-lg backdrop-blur-sm flex flex-col items-center"
                        >
                          <div className="text-sm text-gray-400 mb-1">{label}</div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-primary-300">{score}</span>
                            <span className="text-sm text-gray-500">({modifierText})</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <h2 className="text-3xl font-medieval text-primary-300 border-b border-gray-700/50 pb-2 mb-2 text-center">Character Creation</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Left Column */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medieval text-primary-300 uppercase tracking-wide mb-2">
                    Character Name
                  </label>
                  <input
                    type="text"
                    value={character.name}
                    onChange={(e) => updateCharacterField('name', e.target.value)}
                    className="w-full px-4 py-2 bg-gray-900/80 border-2 border-primary-800/50 
                             text-white font-medieval placeholder-gray-500
                             focus:border-primary-600/80 focus:outline-none
                             rounded-lg backdrop-blur-sm transition-all duration-300
                             hover:border-primary-700/60"
                    placeholder="Enter your character's name"
                    required
                    disabled={isCharacterCreated}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medieval text-primary-300 uppercase tracking-wide mb-2">
                    Race
                  </label>
                  <select
                    value={character.race}
                    onChange={(e) => updateCharacterField('race', e.target.value)}
                    className="w-full px-4 py-2 bg-gray-900/80 border-2 border-primary-800/50 
                             text-white font-medieval
                             focus:border-primary-600/80 focus:outline-none
                             rounded-lg backdrop-blur-sm transition-all duration-300
                             hover:border-primary-700/60"
                    required
                    disabled={isCharacterCreated}
                  >
                    <option value="" className="bg-gray-900">Select a race</option>
                    {races.map((race) => (
                      <option key={race.name} value={race.name} className="bg-gray-900">
                        {race.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medieval text-primary-300 uppercase tracking-wide mb-2">
                    Class
                  </label>
                  <select
                    value={character.class}
                    onChange={(e) => updateCharacterField('class', e.target.value)}
                    className="w-full px-4 py-2 bg-gray-900/80 border-2 border-primary-800/50 
                             text-white font-medieval
                             focus:border-primary-600/80 focus:outline-none
                             rounded-lg backdrop-blur-sm transition-all duration-300
                             hover:border-primary-700/60"
                    required
                    disabled={isCharacterCreated}
                  >
                    <option value="" className="bg-gray-900">Select a class</option>
                    {classes.map((cls) => (
                      <option key={cls.name} value={cls.name} className="bg-gray-900">
                        {cls.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medieval text-primary-300 uppercase tracking-wide mb-2">
                    Background
                  </label>
                  <select
                    value={character.background}
                    onChange={(e) => updateCharacterField('background', e.target.value)}
                    className="w-full px-4 py-2 bg-gray-900/80 border-2 border-primary-800/50 
                             text-white font-medieval
                             focus:border-primary-600/80 focus:outline-none
                             rounded-lg backdrop-blur-sm transition-all duration-300
                             hover:border-primary-700/60"
                    required
                    disabled={isCharacterCreated}
                  >
                    <option value="" className="bg-gray-900">Select a background</option>
                    {backgrounds.map((bg) => (
                      <option key={bg.name} value={bg.name} className="bg-gray-900">
                        {bg.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Ability Scores Section */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-medieval text-primary-300">Ability Scores</h3>
                <div className="text-sm text-primary-300 font-medieval">
                  Points: <span className="font-bold text-base">{pointsRemaining}</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {stats.map(({ key, label }) => (
                  <StatBlock
                    key={key}
                    stat={key}
                    label={label}
                    value={character.stats[key]}
                    onIncrease={() => handleStatChange(key, 1)}
                    onDecrease={() => handleStatChange(key, -1)}
                    canIncrease={canIncreaseStats && character.stats[key] < 15}
                    canDecrease={!isCharacterCreated && character.stats[key] > 8}
                  />
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <div className="relative group/tooltip">
                <button
                  type="submit"
                  disabled={!isFormValid}
                  className="group relative px-6 py-2 font-medieval text-base font-bold outline-none focus:outline-none
                           transform transition-all duration-200 hover:scale-105
                           before:content-[''] before:absolute before:inset-0 
                           before:border-2 before:border-emerald-600/50
                           before:bg-gradient-to-b before:from-emerald-950/90 before:to-emerald-900/90 
                           before:rounded-sm before:-skew-x-12 
                           before:transition-all before:duration-200
                           hover:before:border-emerald-500/80
                           hover:before:from-emerald-900/90 
                           hover:before:to-emerald-800/90
                           active:before:from-emerald-950/90 
                           active:before:to-emerald-900/90
                           disabled:before:from-gray-800/50 
                           disabled:before:to-gray-900/50 
                           disabled:before:border-gray-700/30 
                           disabled:cursor-not-allowed
                           overflow-hidden"
                >
                  <span className="relative z-10 text-emerald-300 group-hover:text-emerald-200
                                 disabled:text-gray-500">
                    Begin Your Journey
                  </span>
                </button>
                {!isFormValid && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs font-medieval
                                bg-gray-900/90 text-gray-300 rounded border border-gray-700
                                opacity-0 group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap">
                    Please fill in all required fields
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        <div className="mt-6">
          <ColorLegend />
        </div>
      </div>
    </form>
  );
};

export default CharacterForm;
