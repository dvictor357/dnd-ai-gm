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
    const { name, race, class: charClass, background, stats = {} } = character;

    let context = `You are weaving an epic tale centered around ${name}, a ${race} ${charClass} whose ${background} background colors their view of the world. This character's journey should be rich with opportunities that highlight their unique nature and skills.

Character Essence:
- A ${race} ${charClass}: Let their heritage and training influence how they experience the world
- ${background} Background: Their past experiences shape how others react to them
- Unique Perspective: Blend their race, class, and background into a distinctive narrative voice\n\n`;

    // Add stats with modifiers
    if (Object.keys(stats).length > 0) {
      context +=
        'Character Stats (Consider these for both mechanics and narrative):\n';
      context += this.formatStats(stats);
      context += '\n\n';
    }

    // Add rich storytelling guidance
    context += `Narrative Integration:
- Draw on ${race} cultural elements in descriptions (how they see, feel, and interpret things)
- Weave ${charClass} training into action scenes and environmental observations
- Use their ${background} background to create unique social interactions and knowledge
- Let their stats influence the style and flair of their successes and failures
- Create situations where their unique combination of traits leads to special insights or opportunities

Story Themes:
- Explore themes that resonate with their background as a ${background}
- Present challenges that play to their ${charClass} abilities
- Include cultural elements that connect to their ${race} heritage
- Create moments where their particular combination of traits offers unique solutions

Remember: Every scene should feel personal to ${name}, with their unique characteristics influencing how they perceive and interact with the world around them.`;

    return context;
  }
}
