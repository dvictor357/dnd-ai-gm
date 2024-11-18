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
      const character = await this.characterService.getCharacter(playerId);
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
    const player = await this.gameStateService.getPlayer(playerId);
    if (!player) {
      throw new Error('Player not found');
    }

    const updatedPlayer: Player = {
      ...player,
      character,
      last_active: new Date().toISOString(),
    };

    await this.gameStateService.updatePlayer(playerId, updatedPlayer);
  }

  async generateWelcomeMessage(character: any): Promise<string> {
    const prompt = `
      As a Dungeon Master, create a warm and engaging welcome message for a new player.
      Character: ${character.name} (${character.race} ${character.class})
      Background: ${character.background || 'Unknown'}
      Keep it under 3 sentences and make it personal to the character.
    `;

    try {
      const response = await this.aiService.getResponse(prompt);
      return response || `Welcome, brave ${character.name}! Your journey as a ${character.race} ${character.class} begins now.`;
    } catch (error) {
      console.error('Error generating welcome message:', error);
      return `Welcome, brave ${character.name}! Your journey as a ${character.race} ${character.class} begins now.`;
    }
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
