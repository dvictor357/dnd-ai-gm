import { Injectable } from '@nestjs/common';
import { Character } from '../../interfaces/game-state.interface';

@Injectable()
export class CharacterService {
  private characters: Map<string, Character> = new Map();

  async createCharacter(playerId: string, character: Character): Promise<Character> {
    if (!character.name || !character.race || !character.class) {
      throw new Error('Invalid character data: name, race, and class are required');
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
    };

    this.characters.set(playerId, completeCharacter);
    return completeCharacter;
  }

  async getCharacter(playerId: string): Promise<Character | undefined> {
    return this.characters.get(playerId);
  }

  async updateCharacter(playerId: string, updates: Partial<Character>): Promise<Character> {
    const character = await this.getCharacter(playerId);
    if (!character) {
      throw new Error('Character not found');
    }

    const updatedCharacter = {
      ...character,
      ...updates,
      stats: {
        ...character.stats,
        ...updates.stats,
      },
    };

    this.characters.set(playerId, updatedCharacter);
    return updatedCharacter;
  }

  async deleteCharacter(playerId: string): Promise<void> {
    this.characters.delete(playerId);
  }

  private calculateStartingHP(character: Character): number {
    // Base HP calculation based on class
    const baseHP: Record<string, number> = {
      barbarian: 12,
      fighter: 10,
      paladin: 10,
      ranger: 10,
      cleric: 8,
      druid: 8,
      monk: 8,
      rogue: 8,
      warlock: 8,
      bard: 8,
      sorcerer: 6,
      wizard: 6,
    };

    const classHP = baseHP[character.class.toLowerCase()] || 8;
    const constitutionMod = Math.floor((character.stats?.constitution || 10) - 10) / 2;

    return classHP + constitutionMod;
  }
}
