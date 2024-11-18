import { Injectable } from '@nestjs/common';

export interface CharacterStats {
  strength?: number;
  dexterity?: number;
  constitution?: number;
  intelligence?: number;
  wisdom?: number;
  charisma?: number;
  [key: string]: number | undefined;
}

export interface Character {
  name: string;
  race: string;
  class: string;
  background: string;
  stats?: CharacterStats;
  traits?: string[];
  abilities?: string[];
  equipment?: string[];
  [key: string]: any;
}

@Injectable()
export class CharacterUtils {
  /**
   * Calculate ability score modifier
   * @param score The ability score
   * @returns The calculated modifier
   */
  static calculateModifier(score: number): number {
    return Math.floor((score - 10) / 2);
  }

  /**
   * Create a formatted string of character stats with modifiers
   * @param stats Character stats object
   * @returns Formatted stats string
   */
  static formatStats(stats: CharacterStats): string {
    const statLines = Object.entries(stats).map(([stat, value]) => {
      const score = value || 10;
      const modifier = this.calculateModifier(score);
      return `- ${stat.charAt(0).toUpperCase() + stat.slice(1)}: ${score} (modifier: ${modifier})`;
    });

    return statLines.join('\n');
  }

  /**
   * Create a comprehensive character context for AI models
   * @param character Character object
   * @returns Formatted character context string
   */
  static createCharacterContext(character: Character): string {
    const { name, race, class: charClass, background, stats = {}, traits = [], abilities = [], equipment = [] } = character;
    
    let context = `You are interacting with ${name}, a ${race} ${charClass} with a ${background} background.\n\n`;
    
    // Add stats if available
    if (Object.keys(stats).length > 0) {
      context += 'Character Stats:\n';
      context += this.formatStats(stats);
      context += '\n\n';
    }

    // Add traits if available
    if (traits.length > 0) {
      context += 'Racial/Character Traits:\n';
      context += traits.map(trait => `- ${trait}`).join('\n');
      context += '\n\n';
    }

    // Add class abilities if available
    if (abilities.length > 0) {
      context += 'Class Abilities:\n';
      context += abilities.map(ability => `- ${ability}`).join('\n');
      context += '\n\n';
    }

    // Add equipment if available
    if (equipment.length > 0) {
      context += 'Equipment:\n';
      context += equipment.map(item => `- ${item}`).join('\n');
      context += '\n\n';
    }

    // Add guidance for the AI
    context += `
Important Guidelines:
- Address the character as "${name}"
- Consider racial traits and abilities when determining action outcomes
- Use appropriate ability checks based on the character's stats
- Consider class abilities and background elements in responses
- Maintain consistency with D&D 5e rules
- Provide immersive and engaging responses that fit the character's background`;

    return context;
  }
}
