export const ROLL_REQUEST_KEYWORDS = [
  'roll', 'make a', 'give me a', 'throw', 'rolling',
  'check', 'saving throw', 'save', 'attack roll',
  'roll for', 'roll to'
];

export const COMMON_ROLLS = [
  { label: 'Attack', dice: 'd20', defaultModifier: 0, description: 'Roll to hit', keywords: ['attack', 'hit', 'strike', 'swing'] },
  { label: 'Ability Check', dice: 'd20', defaultModifier: 0, description: 'Roll for ability checks', keywords: ['check', 'ability', 'skill', 'try', 'attempt'] },
  { label: 'Saving Throw', dice: 'd20', defaultModifier: 0, description: 'Roll to save', keywords: ['save', 'resist', 'avoid'] },
  { label: 'Initiative', dice: 'd20', defaultModifier: 0, description: 'Roll for turn order', keywords: ['initiative', 'combat', 'battle', 'fight'] },
];

export const DAMAGE_DICE = [
  { label: 'd4', sides: 4, description: 'Dagger, dart', keywords: ['dagger', 'dart', 'small weapon'] },
  { label: 'd6', sides: 6, description: 'Short sword, mace', keywords: ['short sword', 'mace', 'shortsword'] },
  { label: 'd8', sides: 8, description: 'Long sword, rapier', keywords: ['longsword', 'long sword', 'rapier'] },
  { label: 'd10', sides: 10, description: 'Pike, glaive', keywords: ['pike', 'glaive', 'halberd'] },
  { label: 'd12', sides: 12, description: 'Greataxe', keywords: ['greataxe', 'great axe'] },
];

export const isRollRequest = (content) => {
  const lowerContent = content.toLowerCase();
  return ROLL_REQUEST_KEYWORDS.some(keyword => lowerContent.includes(keyword));
};
