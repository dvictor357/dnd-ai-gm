import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AIService } from '../ai/ai.service';
import { ServerInfo } from './interfaces/game-state.interface';
import { Socket } from 'socket.io';
import { ChatMessage, TypingStatus } from './interfaces/message.types';
import { DiceService } from './services/dice/dice.service';
import { GameStateService } from './services/state/game-state.service';
import { CharacterService } from './services/character/character.service';
import { EncounterService } from './services/encounter/encounter.service';
import { DiceRoll } from './interfaces/dice.interface';

@Injectable()
export class GameService {
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
    const message: TypingStatus = {
      type: 'gm_typing',
      is_typing: isTyping,
    };

    // Broadcast to all active players
    const state = this.gameStateService.getState();
    Object.entries(state.players)
      .filter(([playerId, player]) => player.status === 'active')
      .forEach(([playerId, player]) => {
        const socket = this.getSocket(playerId);
        if (socket) {
          socket.emit('typing_status', message);
        }
      });
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

  async handleMessage(playerId: string, message: ChatMessage): Promise<void> {
    try {
      // Process dice rolls in the message
      const diceResult = this.diceService.wrapDiceRolls(message.content);
      if (diceResult.rolls.length > 0) {
        this.gameStateService.incrementRolls(diceResult.rolls.length);
        message.content = diceResult.processedText;
        message.metadata = {
          ...message.metadata,
          diceRolls: diceResult.rolls,
        };
      }

      // Add user message to conversation
      await this.gameStateService.addMessage(playerId, message);

      // Get character context if available
      const character = message.character ? await this.characterService.getCharacter(playerId) : undefined;

      // Get AI response
      await this.broadcastTypingStatus(true);
      const aiResponseContent = await this.aiService.getResponse(
        message.content,
        character,
        this.gameStateService.getState().conversations[playerId] || [],
      );

      // Process dice rolls in AI response
      const aiDiceResult = this.diceService.wrapDiceRolls(aiResponseContent);
      if (aiDiceResult.rolls.length > 0) {
        this.gameStateService.incrementRolls(aiDiceResult.rolls.length);
      }

      // Create and send AI message
      const aiMessage: ChatMessage = {
        content: aiDiceResult.processedText,
        type: 'gm',
        timestamp: new Date().toISOString(),
        metadata: {
          diceRolls: aiDiceResult.rolls,
        },
      };

      // Add AI message to conversation
      await this.gameStateService.addMessage(playerId, aiMessage);

      // Send response to player
      const socket = this.getSocket(playerId);
      if (socket) {
        socket.emit('message', aiMessage);
      }
    } catch (error) {
      console.error('Error in handleMessage:', error);
      await this.broadcastTypingStatus(false);
      throw error;
    } finally {
      await this.broadcastTypingStatus(false);
    }
  }

  async setCharacter(playerId: string, character: any): Promise<void> {
    await this.characterService.setCharacter(playerId, character);
    await this.gameStateService.updatePlayer(playerId, {
      character_name: character.name,
      last_active: new Date().toISOString(),
    });
  }

  async generateWelcomeMessage(character: any): Promise<string> {
    const prompt = `
      As a Dungeon Master, create a warm and engaging welcome message for a new player.
      Their character is named ${character.name}, a ${character.race} ${character.class} with a ${character.background} background.
      Keep the message under 3 sentences and make it feel personal to their character choice.
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
}
