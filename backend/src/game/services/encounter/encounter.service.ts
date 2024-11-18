import { Injectable } from '@nestjs/common';
import { DiceService } from '../dice/dice.service';

export interface Encounter {
  type: string;
  difficulty: string;
  description: string;
  enemies: Enemy[];
  rewards?: Reward[];
}

export interface Enemy {
  name: string;
  type: string;
  challengeRating: number;
  hitPoints: number;
  armorClass: number;
  stats?: Record<string, number>;
  abilities?: string[];
}

export interface Reward {
  type: 'gold' | 'item' | 'experience';
  value: number;
  description: string;
}

@Injectable()
export class EncounterService {
  private encounters: Map<string, Encounter> = new Map();
  private encounterCount = 0;

  constructor(private readonly diceService: DiceService) {}

  async generateEncounter(options: {
    type?: string;
    difficulty?: string;
    partyLevel?: number;
    partySize?: number;
  }): Promise<Encounter> {
    const {
      type = this.getRandomEncounterType(),
      difficulty = this.getRandomDifficulty(),
      partyLevel = 1,
      partySize = 4,
    } = options;

    const encounter: Encounter = {
      type,
      difficulty,
      description: this.generateDescription(type, difficulty),
      enemies: this.generateEnemies(difficulty, partyLevel, partySize),
      rewards: this.generateRewards(difficulty, partyLevel),
    };

    this.encounterCount++;
    const encounterId = `encounter_${this.encounterCount}`;
    this.encounters.set(encounterId, encounter);

    return encounter;
  }

  getEncounterCount(): number {
    return this.encounterCount;
  }

  private getRandomEncounterType(): string {
    const types = [
      'combat',
      'exploration',
      'social',
      'puzzle',
      'trap',
    ];
    return types[Math.floor(Math.random() * types.length)];
  }

  private getRandomDifficulty(): string {
    const difficulties = ['easy', 'medium', 'hard', 'deadly'];
    return difficulties[Math.floor(Math.random() * difficulties.length)];
  }

  private generateDescription(type: string, difficulty: string): string {
    // This would be enhanced with more detailed descriptions
    return `A ${difficulty} ${type} encounter awaits the party.`;
  }

  private generateEnemies(
    difficulty: string,
    partyLevel: number,
    partySize: number,
  ): Enemy[] {
    const difficultyMultiplier: Record<string, number> = {
      easy: 0.5,
      medium: 1,
      hard: 1.5,
      deadly: 2,
    };

    const multiplier = difficultyMultiplier[difficulty] || 1;
    const enemyCount = Math.max(1, Math.floor((partySize * multiplier) / 2));

    return Array(enemyCount).fill(null).map((_, index) => ({
      name: `Enemy ${index + 1}`,
      type: 'humanoid',
      challengeRating: Math.max(1, Math.floor(partyLevel * multiplier / 2)),
      hitPoints: this.diceService.roll(`${2 + index}d8+${partyLevel}`).total,
      armorClass: 10 + Math.floor(partyLevel / 3),
      stats: {
        strength: 10 + Math.floor(Math.random() * 8),
        dexterity: 10 + Math.floor(Math.random() * 8),
        constitution: 10 + Math.floor(Math.random() * 8),
        intelligence: 10 + Math.floor(Math.random() * 8),
        wisdom: 10 + Math.floor(Math.random() * 8),
        charisma: 10 + Math.floor(Math.random() * 8),
      },
      abilities: ['Attack'],
    }));
  }

  private generateRewards(difficulty: string, partyLevel: number): Reward[] {
    const difficultyMultiplier: Record<string, number> = {
      easy: 1,
      medium: 2,
      hard: 3,
      deadly: 4,
    };

    const multiplier = difficultyMultiplier[difficulty] || 1;
    const rewards: Reward[] = [];

    // Gold reward
    rewards.push({
      type: 'gold',
      value: this.diceService.roll(`${partyLevel}d10*${multiplier}`).total,
      description: 'Gold pieces',
    });

    // Experience reward
    rewards.push({
      type: 'experience',
      value: 100 * partyLevel * multiplier,
      description: 'Experience points',
    });

    // Random chance for item reward
    if (Math.random() < 0.3 * multiplier) {
      rewards.push({
        type: 'item',
        value: 1,
        description: 'A mysterious item',
      });
    }

    return rewards;
  }
}
