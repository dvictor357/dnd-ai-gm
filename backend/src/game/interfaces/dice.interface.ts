export interface DiceRoll {
  notation: string; // e.g., "2d6+2"
  results: number[]; // Individual die results
  total: number; // Sum + modifier
  modifier?: number; // Optional modifier
}

export interface DiceRollResult {
  processedText: string; // Text with rolls processed
  rolls: DiceRoll[]; // All rolls made
}
