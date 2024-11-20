import { Injectable } from '@nestjs/common';
import { Character } from '../../interfaces/game-state.interface';

@Injectable()
export class CharacterService {
  private characters: Map<string, Character> = new Map();

  async createCharacter(
    playerId: string,
    character: Character,
  ): Promise<Character> {
    if (!character.name || !character.race || !character.class) {
      throw new Error(
        'Invalid character data: name, race, and class are required',
      );
    }

    // Initialize default values if not provided
    const completeCharacter: Character = {
      ...character,
      name: character.name,
      race: character.race,
      class: character.class,
      background: character.background || 'Commoner',
      level: character.level || 1,
      stats: character.stats || {
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
      },
      hp: character.hp || {
        current: this.calculateStartingHP(character),
        max: this.calculateStartingHP(character),
      },
      status: character.status || [],
      inventory: character.inventory || [],
      abilities: character.abilities || [],
      traits: character.traits || [],
      created_at: new Date().toISOString(),
      last_updated: new Date().toISOString(),
    };

    this.characters.set(playerId, completeCharacter);
    return completeCharacter;
  }

  async getCharacter(playerId: string): Promise<Character | undefined> {
    return this.characters.get(playerId);
  }

  async updateCharacter(
    playerId: string,
    updates: Partial<Character>,
  ): Promise<Character> {
    const character = await this.getCharacter(playerId);
    if (!character) {
      throw new Error('Character not found');
    }

    const updatedCharacter: Character = {
      ...character,
      ...updates,
      last_updated: new Date().toISOString(),
    };

    this.characters.set(playerId, updatedCharacter);
    return updatedCharacter;
  }

  private calculateStartingHP(character: Character): number {
    // Base HP calculation based on class
    const baseHP: Record<string, number> = {
      Barbarian: 12,
      Fighter: 10,
      Paladin: 10,
      Ranger: 10,
      Cleric: 8,
      Druid: 8,
      Monk: 8,
      Rogue: 8,
      Warlock: 8,
      Bard: 8,
      Sorcerer: 6,
      Wizard: 6,
    };

    // Get base HP for class or default to 8
    const classHP = baseHP[character.class] || 8;

    // Add Constitution modifier (assuming default stats if not provided)
    const constitutionMod = Math.floor(
      ((character.stats?.constitution || 10) - 10) / 2,
    );

    return classHP + constitutionMod;
  }
}
