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
import { Logger } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class GameService {
  @WebSocketServer() private server: Server;
  private readonly logger: Logger;
  private gameRooms: Map<string, string> = new Map(); // Track game rooms

  constructor(
    private readonly aiService: AIService,
    private readonly configService: ConfigService,
    private readonly diceService: DiceService,
    private readonly gameStateService: GameStateService,
    private readonly characterService: CharacterService,
    private readonly encounterService: EncounterService,
  ) {
    this.logger = new Logger('GameService');
  }

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
          const character = await this.getCharacter(playerId);
          if (!character) {
            throw new Error('Character not found');
          }

          // Parse the roll context
          const rollContext = message.content.toLowerCase();
          let abilityModifier = 0;
          let proficiencyBonus = Math.ceil((character.level || 1) / 4) + 1;
          let isSkillCheck = false;

          // Calculate ability modifier based on the check type
          if (rollContext.includes('strength') || rollContext.includes('str')) {
            abilityModifier = Math.floor((character.stats?.strength || 10) - 10) / 2;
          } else if (rollContext.includes('dexterity') || rollContext.includes('dex')) {
            abilityModifier = Math.floor((character.stats?.dexterity || 10) - 10) / 2;
          } else if (rollContext.includes('constitution') || rollContext.includes('con')) {
            abilityModifier = Math.floor((character.stats?.constitution || 10) - 10) / 2;
          } else if (rollContext.includes('intelligence') || rollContext.includes('int')) {
            abilityModifier = Math.floor((character.stats?.intelligence || 10) - 10) / 2;
          } else if (rollContext.includes('wisdom') || rollContext.includes('wis')) {
            abilityModifier = Math.floor((character.stats?.wisdom || 10) - 10) / 2;
          } else if (rollContext.includes('charisma') || rollContext.includes('cha')) {
            abilityModifier = Math.floor((character.stats?.charisma || 10) - 10) / 2;
          }

          // Check if this is a skill check
          const skillChecks = ['acrobatics', 'animal handling', 'arcana', 'athletics', 'deception',
            'history', 'insight', 'intimidation', 'investigation', 'medicine',
            'nature', 'perception', 'performance', 'persuasion', 'religion',
            'sleight of hand', 'stealth', 'survival'];
          isSkillCheck = skillChecks.some(skill => rollContext.includes(skill));

          // Add ability modifier and proficiency bonus if applicable
          let modifiedNotation = notation;
          if (abilityModifier !== 0 || (isSkillCheck && proficiencyBonus !== 0)) {
            const totalModifier = abilityModifier + (isSkillCheck ? proficiencyBonus : 0);
            modifiedNotation = `${notation}${totalModifier >= 0 ? '+' : ''}${totalModifier}`;
          }

          const result = await this.diceService.roll(modifiedNotation);

          // Extract DC if present
          const dcMatch = message.content.match(/DC\s*(\d+)/i);
          const dc = dcMatch ? parseInt(dcMatch[1]) : null;

          // Format the roll result
          let rollResult = `🎲 ${message.content.split('[')[0]}\n`;
          rollResult += `**Roll:** ${result.results[0]}`;
          if (abilityModifier !== 0) {
            rollResult += ` + ${abilityModifier} (ability modifier)`;
          }
          if (isSkillCheck && proficiencyBonus !== 0) {
            rollResult += ` + ${proficiencyBonus} (proficiency)`;
          }
          rollResult += `\n**Total:** ${result.total}`;

          if (dc !== null) {
            rollResult += `\n**DC:** ${dc}`;
            rollResult += `\n**Outcome:** ${result.total >= dc ? 'Success! ✅' : 'Failure ❌'}`;
          }

          // Generate narrative response using unified prompt
          const narrativeResponse = await this.generateResponse(playerId, character, message.content, {
            isRollResponse: true,
            rollDetails: {
              action: message.content.split('[')[0],
              result: result.results[0],
              abilityModifier,
              proficiencyBonus: isSkillCheck ? proficiencyBonus : 0,
              total: result.total,
              dc,
              isSuccess: dc !== null ? result.total >= dc : null
            }
          });

          // Combine roll result and narrative
          return `${rollResult}\n\n${narrativeResponse}`;
        }
      }

      // Get character info for non-roll actions
      const character = await this.getCharacter(playerId);
      if (!character) {
        throw new Error('Character not found');
      }

      // For non-roll actions, use the same unified prompt system
      return await this.generateResponse(playerId, character, message.content);
    } catch (error) {
      console.error('Error handling message:', error);
      throw error;
    }
  }

  private async generateResponse(
    playerId: string,
    character: Character,
    action: string,
    rollInfo?: {
      isRollResponse: boolean;
      rollDetails?: {
        action: string;
        result: number;
        abilityModifier: number;
        proficiencyBonus: number;
        total: number;
        dc: number | null;
        isSuccess: boolean | null;
      };
    },
  ): Promise<string> {
    // Get recent conversation history
    const recentMessages = this.gameStateService.getState().conversations[playerId] || [];
    const lastMessages = recentMessages.slice(-5).map(msg => ({
      role: msg.type === 'player' ? 'user' : 'assistant',
      content: msg.content
    }));

    const prompt = `
      As a Dungeon Master, ${rollInfo?.isRollResponse ? 'narrate the outcome of this roll' : 'respond to this player action'} in the context of D&D 5e:

      CHARACTER INFORMATION:
      Name: ${character.name}
      Race: ${character.race}
      Class: ${character.class}
      Level: ${character.level || 1}
      Background: ${character.background || 'Unknown'}

      ATTRIBUTES:
      Strength: ${character.stats?.strength || 10} (${Math.floor((character.stats?.strength || 10) - 10) / 2 >= 0 ? '+' : ''}${Math.floor((character.stats?.strength || 10) - 10) / 2})
      Dexterity: ${character.stats?.dexterity || 10} (${Math.floor((character.stats?.dexterity || 10) - 10) / 2 >= 0 ? '+' : ''}${Math.floor((character.stats?.dexterity || 10) - 10) / 2})
      Constitution: ${character.stats?.constitution || 10} (${Math.floor((character.stats?.constitution || 10) - 10) / 2 >= 0 ? '+' : ''}${Math.floor((character.stats?.constitution || 10) - 10) / 2})
      Intelligence: ${character.stats?.intelligence || 10} (${Math.floor((character.stats?.intelligence || 10) - 10) / 2 >= 0 ? '+' : ''}${Math.floor((character.stats?.intelligence || 10) - 10) / 2})
      Wisdom: ${character.stats?.wisdom || 10} (${Math.floor((character.stats?.wisdom || 10) - 10) / 2 >= 0 ? '+' : ''}${Math.floor((character.stats?.wisdom || 10) - 10) / 2})
      Charisma: ${character.stats?.charisma || 10} (${Math.floor((character.stats?.charisma || 10) - 10) / 2 >= 0 ? '+' : ''}${Math.floor((character.stats?.charisma || 10) - 10) / 2})

      COMBAT STATS:
      HP: ${character.hp?.current || 'Not specified'} / ${character.hp?.max || 'Not specified'}
      
      SKILLS & PROFICIENCIES:
      Proficiency Bonus: +${Math.ceil((character.level || 1) / 4) + 1}

      RECENT CONVERSATION:
      ${lastMessages.map(msg => `${msg.role === 'user' ? 'Player' : 'DM'}: ${msg.content}`).join('\n')}

      ${rollInfo?.isRollResponse ? `
      ROLL CONTEXT:
      Action: ${rollInfo.rollDetails?.action}
      Roll Result: ${rollInfo.rollDetails?.result}
      Modifiers: ${rollInfo.rollDetails?.abilityModifier !== 0 ? `Ability +${rollInfo.rollDetails?.abilityModifier}` : ''} ${rollInfo.rollDetails?.proficiencyBonus !== 0 ? `Proficiency +${rollInfo.rollDetails?.proficiencyBonus}` : ''}
      Total: ${rollInfo.rollDetails?.total}
      ${rollInfo.rollDetails?.dc !== null ? `DC: ${rollInfo.rollDetails?.dc}` : ''}
      ${rollInfo.rollDetails?.isSuccess !== null ? `Outcome: ${rollInfo.rollDetails?.isSuccess ? 'Success' : 'Failure'}` : ''}
      ` : `
      PLAYER ACTION:
      ${action}
      `}

      RESPONSE GUIDELINES:
      ${rollInfo?.isRollResponse ? `
      1. Acknowledge the roll result and total
      2. Describe the outcome in vivid narrative detail
      3. Explain how close they were to success/failure
      4. Detail the immediate consequences
      5. Set up the next action or choice
      ` : `
      1. Identify the type of action (combat, skill check, spell, social, etc.)
      2. Consider relevant attributes and modifiers
      3. Request rolls using [dice] notation when needed
      4. Specify DCs for checks
      5. Apply proficiency bonus if relevant
      `}

      STYLE GUIDE:
      - Use evocative, sensory-rich language
      - Blend mechanics with narrative seamlessly
      - Keep responses focused and engaging
      - Create anticipation for what comes next
      - Make each action feel meaningful
      - Maintain continuity with recent conversation
      - Reference previous actions when relevant

      Aim for 2-4 sentences that combine ${rollInfo?.isRollResponse ? 'the mechanical outcome' : 'game mechanics'} with rich narrative description.
    `;

    await this.broadcastTypingStatus(true);
    const response = await this.aiService.getResponse(prompt);
    await this.broadcastTypingStatus(false);

    // Store the response in conversation history
    await this.gameStateService.addMessage(playerId, {
      content: response,
      type: 'gm',
      timestamp: new Date().toISOString()
    });

    return response;
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
    return this.gameStateService.getState().players.size;
  }

  getEncounterCount(): number {
    const state = this.gameStateService.getState();
    return state?.encounters || 0;
  }

  getRollCount(): number {
    const state = this.gameStateService.getState();
    return state?.rolls || 0;
  }

  setServer(server: Server) {
    this.server = server;
  }

  async getOrCreateGameRoom(playerId: string): Promise<string> {
    // Check if player is already in a room
    let room = this.gameRooms.get(playerId);
    if (room) {
      return room;
    }

    // Check if there's an available room with space
    const availableRooms = Array.from(this.gameRooms.values());
    const uniqueRooms = [...new Set(availableRooms)];

    for (const existingRoom of uniqueRooms) {
      const sockets = await this.server.in(existingRoom).fetchSockets();
      if (sockets.length < 4) { // Limit 4 players per room
        this.gameRooms.set(playerId, existingRoom);
        return existingRoom;
      }
    }

    // Create new room if no available rooms
    const newRoom = `game_${crypto.randomUUID()}`;
    this.gameRooms.set(playerId, newRoom);
    return newRoom;
  }

  async removePlayerFromRoom(playerId: string): Promise<void> {
    this.gameRooms.delete(playerId);
  }

  async getPlayersInRoom(room: string): Promise<string[]> {
    const players: string[] = [];
    for (const [playerId, playerRoom] of this.gameRooms.entries()) {
      if (playerRoom === room) {
        players.push(playerId);
      }
    }
    return players;
  }
}
