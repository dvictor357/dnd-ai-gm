import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { GameStateService } from './game-state.service';
import { Player, Character, GameSettings } from '../../interfaces/game-state.interface';
import { ChatMessage } from '../../interfaces/message.types';

describe('GameStateService', () => {
  let service: GameStateService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue: string) => defaultValue),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameStateService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<GameStateService>(GameStateService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Player Management', () => {
    const playerId = 'test-player-1';

    it('should add a new player', async () => {
      const player = await service.addPlayer(playerId);
      expect(player).toBeDefined();
      expect(player.status).toBe('active');
      expect(player.permissions).toContain('player');
    });

    it('should remove a player', async () => {
      await service.addPlayer(playerId);
      await service.removePlayer(playerId);
      expect(service.getPlayer(playerId)).toBeUndefined();
    });

    it('should update player status', async () => {
      await service.addPlayer(playerId);
      await service.updatePlayerStatus(playerId, 'away');
      const player = service.getPlayer(playerId);
      expect(player?.status).toBe('away');
    });
  });

  describe('Character Management', () => {
    const playerId = 'test-player-1';
    const mockCharacter: Character = {
      name: 'Test Character',
      race: 'Human',
      class: 'Fighter',
      background: 'Soldier',
      level: 1,
      stats: {
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
      },
      hp: {
        current: 10,
        max: 10,
      },
      status: [],
      inventory: [],
      abilities: [],
      traits: [],
    };

    beforeEach(async () => {
      await service.addPlayer(playerId);
    });

    it('should update character for player', async () => {
      await service.updateCharacter(playerId, mockCharacter);
      const player = service.getPlayer(playerId);
      expect(player?.character).toEqual(mockCharacter);
    });
  });

  describe('Session Management', () => {
    it('should start a new session', async () => {
      const session = await service.startNewSession('tavern', 'indoor');
      expect(session).toBeDefined();
      expect(session.scene).toBe('tavern');
      expect(session.environment).toBe('indoor');
    });

    it('should end current session', async () => {
      await service.startNewSession('tavern', 'indoor');
      await service.endCurrentSession();
      const state = service.getState();
      expect(state.currentSession).toBeUndefined();
    });
  });

  describe('Conversation Management', () => {
    const playerId = 'test-player-1';
    const mockMessage: ChatMessage = {
      content: 'Test message',
      timestamp: new Date().toISOString(),
      type: 'user',
      playerId,
      metadata: {
        testKey: 'testValue'
      }
    };

    beforeEach(async () => {
      await service.addPlayer(playerId);
    });

    it('should add message to conversation', async () => {
      await service.addMessage(playerId, mockMessage);
      const state = service.getState();
      expect(state.conversations[playerId]).toContainEqual(mockMessage);
    });

    it('should clear conversation', async () => {
      await service.addMessage(playerId, mockMessage);
      await service.clearConversation(playerId);
      const state = service.getState();
      expect(state.conversations[playerId]).toHaveLength(0);
    });
  });

  describe('Settings Management', () => {
    it('should update settings', () => {
      const newSettings: Partial<GameSettings> = {
        difficulty: 'hard',
        pvp_enabled: true,
      };
      service.updateSettings(newSettings);
      const state = service.getState();
      expect(state.settings.difficulty).toBe('hard');
      expect(state.settings.pvp_enabled).toBe(true);
    });

    it('should reset settings to default', () => {
      service.updateSettings({ difficulty: 'hard' });
      service.resetSettings();
      const state = service.getState();
      expect(state.settings.difficulty).toBe('normal');
    });
  });

  describe('Server Info', () => {
    it('should return server info', () => {
      const info = service.getServerInfo();
      expect(info).toBeDefined();
      expect(info.status).toBe('online');
      expect(info.model).toBeDefined();
      expect(info.performance).toBeDefined();
    });
  });
});
