import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AIService } from '../ai/ai.service';
import { Character, Player, ServerInfo } from './interfaces/game-state.interface';
import { Server, Socket } from 'socket.io';
import { TypingStatus } from './interfaces/message.types';
import { DiceService } from './services/dice/dice.service';
import { GameStateService } from './services/state/game-state.service';
import { CharacterService } from './services/character/character.service';
import { EncounterService } from './services/encounter/encounter.service';
import { DiceRoll } from './interfaces/dice.interface';
import { WebSocketServer } from '@nestjs/websockets';

@Injectable()
export class GameService {
  @WebSocketServer() private server: Server;

  constructor(
    private readonly aiService: AIService,
    private readonly configService: ConfigService,
    private readonly diceService: DiceService,
    private readonly gameStateService: GameStateService,
    private readonly characterService: CharacterService,
    private readonly encounterService: EncounterService,
  ) { }

  async connect(socket: Socket, playerId: string): Promise<void> {
    await this.gameStateService.addPlayer(playerId, {
      joined_at: new Date().toISOString(),
      status: 'active',
      last_active: new Date().toISOString(),
      permissions: ['player'],
    });
  }

  async disconnect(playerId: string): Promise<void> {
    await this.gameStateService.removePlayer(playerId);
  }

  async generateWelcomeMessage(character: Character): Promise<string> {
    const prompt = `
      As a Dungeon Master, craft an immersive welcome scene for a new adventurer joining our tale:
      
      Character: ${character.name} (${character.race} ${character.class})
      Background: ${character.background || 'Unknown'}
      
      Create a rich, atmospheric introduction that:
      1. Sets the scene with vivid sensory details (sights, sounds, smells)
      2. Introduces their character naturally, acknowledging their race and class
      3. Hints at their background's influence on their arrival
      4. Presents an intriguing hook or situation that draws them into the world
      5. Ends with a subtle prompt for their first action
      
      Style Guide:
      - Use evocative, sensory-rich language
      - Create a sense of place and atmosphere
      - Blend their background naturally into the narrative
      - Keep the tone warm and inviting while maintaining mystery
      - Make their entrance feel meaningful to the world
      
      Remember: This is their first step into a grand adventure - make it memorable!
    `;

    await this.broadcastTypingStatus(true);
    const response = await this.aiService.getResponse(prompt);
    await this.broadcastTypingStatus(false);
    return response;
  }

  private async broadcastTypingStatus(isTyping: boolean): Promise<void> {
    const typingStatus: TypingStatus = {
      playerId: 'gm',
      isTyping
    };

    this.server?.emit('typing_status', typingStatus);
  }

  private getSocket(playerId: string): Socket | null {
    // This would be implemented based on your socket management strategy
    // For example, you might store sockets in a Map or get them from Socket.io server
    return null;
  }

  getPlayerCount(): number {
    const state = this.gameStateService.getState();
    return Object.values(state.players).filter(p => p.status === 'active').length;
  }

  async handleDiceRoll(playerId: string, notation: string): Promise<DiceRoll> {
    if (!this.diceService.validateDiceNotation(notation)) {
      throw new Error(`Invalid dice notation: ${notation}`);
    }

    const rollResult = this.diceService.wrapDiceRolls(notation);
    if (rollResult.rolls.length === 0) {
      throw new Error(`No valid dice rolls found in: ${notation}`);
    }

    this.gameStateService.incrementRolls(rollResult.rolls.length);
    return rollResult.rolls[0];
  }

  async generateEncounter(options: { type?: string; difficulty?: string }): Promise<any> {
    const encounter = await this.encounterService.generateEncounter(options);
    this.gameStateService.incrementEncounters();
    return encounter;
  }

  async handleMessage(playerId: string, message: any): Promise<string> {
    try {
      // Check if this is a roll command
      if (message.content.includes('[') && message.content.includes(']')) {
        const notation = message.content.match(/\[(.*?)\]/)?.[1];
        if (notation) {
          const result = await this.diceService.roll(notation);
          return `🎲 ${message.content.split('[')[0]}\n**Result:** ${result.total} (${result.results.join(' + ')}${result.modifier ? ` ${result.modifier >= 0 ? '+' : '-'} ${Math.abs(result.modifier)}` : ''})`;
        }
      }

      // Get character info
      const character = await this.getCharacter(playerId);
      if (!character) {
        throw new Error('Character not found');
      }

      // Generate AI response
      const prompt = `
        As a Dungeon Master, respond to this player action:
        Character: ${character.name} (${character.race} ${character.class})
        Action: ${message.content}
        Keep the response under 3 sentences and make it engaging and personal.
      `;

      await this.broadcastTypingStatus(true);
      const response = await this.aiService.getResponse(prompt);
      await this.broadcastTypingStatus(false);
      return response;
    } catch (error) {
      console.error('Error handling message:', error);
      throw error;
    }
  }

  async setCharacter(playerId: string, character: Character): Promise<void> {
    await this.gameStateService.setPlayerCharacter(playerId, character);
  }

  async getCharacter(playerId: string): Promise<Character | null> {
    const player = await this.gameStateService.getPlayer(playerId);
    return player?.character || null;
  }

  getServerInfo(): ServerInfo {
    return this.gameStateService.getServerInfo();
  }

  getActiveConnections(): number {
    return Object.values(this.gameStateService.getState().players)
      .filter(player => player.status === 'active')
      .length;
  }

  getEncounterCount(): number {
    return this.encounterService.getEncounterCount();
  }

  getRollCount(): number {
    return this.diceService.getRollCount();
  }

  setServer(server: Server) {
    this.server = server;
  }
}
