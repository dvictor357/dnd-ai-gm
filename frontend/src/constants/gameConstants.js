export const ROLL_REQUEST_KEYWORDS = [
  'roll', 'make a', 'give me a', 'throw', 'rolling',
  'check', 'saving throw', 'save', 'attack roll',
  'roll for', 'roll to'
];

export const isRollRequest = (content) => {
  const lowerContent = content.toLowerCase();
  return ROLL_REQUEST_KEYWORDS.some(keyword => lowerContent.includes(keyword));
};
