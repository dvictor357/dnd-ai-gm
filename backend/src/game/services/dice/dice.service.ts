import { Injectable } from '@nestjs/common';
import { DiceRoll, DiceRollResult } from '../../interfaces/dice.interface';

@Injectable()
export class DiceService {
  private readonly diceRegex = /\b(\d+)d(\d+)([+-]\d+)?\b/g;

  /**
   * Process text and replace dice notation with roll results
   * @param text Text containing dice notation (e.g., "I roll 2d6+2 for damage")
   */
  wrapDiceRolls(text: string): DiceRollResult {
    const rolls: DiceRoll[] = [];
    const processedText = text.replace(this.diceRegex, (match) => {
      const roll = this.processDiceNotation(match);
      rolls.push(roll);
      return this.formatRollResult(roll);
    });

    return {
      processedText,
      rolls,
    };
  }

  /**
   * Roll dice based on standard notation (XdY+Z)
   * @param count Number of dice
   * @param sides Number of sides per die
   * @param modifier Optional modifier to add to total
   */
  rollDice(count: number, sides: number, modifier = 0): DiceRoll {
    const results = Array.from({ length: count }, () =>
      Math.floor(Math.random() * sides) + 1
    );

    return {
      notation: `${count}d${sides}${modifier >= 0 ? '+' + modifier : modifier}`,
      results,
      total: this.calculateTotal(results, modifier),
      modifier,
    };
  }

  /**
   * Roll dice using standard notation
   * @param notation Dice notation (e.g., "2d6+2")
   */
  roll(notation: string): DiceRoll {
    const match = notation.match(this.diceRegex);
    if (!match) {
      throw new Error(`Invalid dice notation: ${notation}`);
    }
    return this.processDiceNotation(match[0]);
  }

  /**
   * Validate dice notation string
   * @param notation Dice notation to validate (e.g., "2d6+2")
   */
  validateDiceNotation(notation: string): boolean {
    return this.diceRegex.test(notation);
  }

  /**
   * Process a dice notation string into a roll result
   * @param notation Dice notation to process (e.g., "2d6+2")
   */
  private processDiceNotation(notation: string): DiceRoll {
    const match = notation.match(/(\d+)d(\d+)([+-]\d+)?/);
    if (!match) {
      throw new Error(`Invalid dice notation: ${notation}`);
    }

    const count = parseInt(match[1], 10);
    const sides = parseInt(match[2], 10);
    const modifier = match[3] ? parseInt(match[3], 10) : 0;

    return this.rollDice(count, sides, modifier);
  }

  /**
   * Calculate total of dice results plus modifier
   * @param results Array of individual die results
   * @param modifier Modifier to add to sum
   */
  private calculateTotal(results: number[], modifier = 0): number {
    return results.reduce((sum, roll) => sum + roll, 0) + modifier;
  }

  /**
   * Format roll result for display
   * @param roll Dice roll to format
   */
  private formatRollResult(roll: DiceRoll): string {
    return `${roll.total} [${roll.results.join(', ')}]${
      roll.modifier ? (roll.modifier >= 0 ? '+' : '') + roll.modifier : ''
    }`;
  }
}
