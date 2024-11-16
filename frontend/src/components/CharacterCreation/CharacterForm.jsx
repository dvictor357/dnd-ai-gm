import React from 'react';
import useGameStore from '../../store/gameStore';
import StatBlock from './StatBlock';
import ColorLegend from '../Character/ColorLegend';
import { races, classes } from '../../data/characterOptions';

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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!character.name || !character.race || !character.class || pointsRemaining > 0) {
      return;
    }
    if (ws && ws.readyState === WebSocket.OPEN) {
      setIsCharacterCreated(true); // Set this before sending to avoid race conditions
      ws.send(JSON.stringify({
        type: 'character_created',
        data: character
      }));
    }
  };

  const handleRandomize = () => {
    // Random race
    const randomRace = races[Math.floor(Math.random() * races.length)].name;
    updateCharacterField('race', randomRace);

    // Random class
    const randomClass = classes[Math.floor(Math.random() * classes.length)].name;
    updateCharacterField('class', randomClass);

    // Random stats (keeping total points at 27)
    const stats = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
    let remainingPoints = 27;
    
    // First set all stats to 8 (minimum)
    stats.forEach(stat => setStat(stat, 8));
    remainingPoints -= 6; // 6 stats * 0 points (for 8)

    // Randomly distribute remaining points
    while (remainingPoints > 0) {
      const randomStat = stats[Math.floor(Math.random() * stats.length)];
      const currentValue = character.stats[randomStat];
      
      // Cost to increase:
      // 9-13: 1 point
      // 14-15: 2 points
      let maxIncrease = 1;
      if (currentValue < 13) maxIncrease = Math.min(13 - currentValue, remainingPoints);
      else if (currentValue < 15 && remainingPoints >= 2) maxIncrease = 1;
      
      if (maxIncrease > 0 && currentValue < 15) {
        const increase = Math.floor(Math.random() * maxIncrease) + 1;
        const cost = currentValue >= 13 ? increase * 2 : increase;
        if (cost <= remainingPoints) {
          setStat(randomStat, currentValue + increase);
          remainingPoints -= cost;
        }
      }
    }
    setPointsRemaining(0);
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

  return (
    <form onSubmit={handleSubmit} className="h-full flex flex-col">
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg flex-1 overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-medieval text-primary-300">Create Your Character</h2>
          {!isCharacterCreated && (
            <button
              type="button"
              onClick={handleRandomize}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-md shadow-md transition-colors"
            >
              Randomize
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-primary-200 mb-2">
              Character Name
            </label>
            <input
              type="text"
              value={character.name}
              onChange={(e) => updateCharacterField('name', e.target.value)}
              className="w-full bg-gray-700 border-gray-600 rounded-md text-white focus:ring-primary-500 focus:border-primary-500"
              required
              disabled={isCharacterCreated}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-200 mb-2">
              Race
            </label>
            <select
              value={character.race}
              onChange={(e) => updateCharacterField('race', e.target.value)}
              className="w-full bg-gray-700 border-gray-600 rounded-md text-white focus:ring-primary-500 focus:border-primary-500"
              required
              disabled={isCharacterCreated}
            >
              <option value="">Select a race</option>
              {races.map((race) => (
                <option key={race.name} value={race.name}>
                  {race.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-200 mb-2">
              Class
            </label>
            <select
              value={character.class}
              onChange={(e) => updateCharacterField('class', e.target.value)}
              className="w-full bg-gray-700 border-gray-600 rounded-md text-white focus:ring-primary-500 focus:border-primary-500"
              required
              disabled={isCharacterCreated}
            >
              <option value="">Select a class</option>
              {classes.map((cls) => (
                <option key={cls.name} value={cls.name}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-medieval text-primary-300">Ability Scores</h3>
            <div className="text-primary-300">
              Points Remaining: <span className="font-bold">{pointsRemaining}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {stats.map(({ key, label }) => (
              <StatBlock
                key={key}
                stat={key}
                label={label}
              />
            ))}
          </div>
        </div>

        {!isCharacterCreated && (
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!isFormValid}
              className="px-6 py-3 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-medieval transition-colors"
            >
              Begin Adventure
            </button>
          </div>
        )}
        
        {isCharacterCreated && <ColorLegend />}
      </div>
    </form>
  );
};

export default CharacterForm;
