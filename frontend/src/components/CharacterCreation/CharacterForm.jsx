import React from 'react';
import useGameStore from '../../store/gameStore';
import StatBlock from './StatBlock';
import { races, classes } from '../../data/characterOptions';

const CharacterForm = () => {
  const {
    character,
    updateCharacterField,
    pointsRemaining,
    isCharacterCreated,
    setIsCharacterCreated,
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
        <h2 className="text-2xl font-medieval text-primary-300 mb-6">Create Your Character</h2>

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

        <div className="flex justify-end flex-col">
          <button
            type="submit"
            disabled={!isFormValid}
            className="px-6 py-3 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-medieval transition-colors"
          >
            Begin Adventure
          </button>
        </div>
      </div>
    </form>
  );
};

export default CharacterForm;
