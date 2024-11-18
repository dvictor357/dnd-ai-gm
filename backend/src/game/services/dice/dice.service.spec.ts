import { Test, TestingModule } from '@nestjs/testing';
import { DiceService } from './dice.service';
import { DiceRoll } from '../../interfaces/dice.interface';

describe('DiceService', () => {
  let service: DiceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DiceService],
    }).compile();

    service = module.get<DiceService>(DiceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateDiceNotation', () => {
    it('should validate correct dice notation', () => {
      expect(service.validateDiceNotation('2d6')).toBeTruthy();
      expect(service.validateDiceNotation('1d20+5')).toBeTruthy();
      expect(service.validateDiceNotation('3d8-2')).toBeTruthy();
    });

    it('should reject invalid dice notation', () => {
      expect(service.validateDiceNotation('d20')).toBeFalsy();
      expect(service.validateDiceNotation('2d')).toBeFalsy();
      expect(service.validateDiceNotation('2d6+')).toBeFalsy();
    });
  });

  describe('rollDice', () => {
    it('should return correct structure', () => {
      const roll = service.rollDice(2, 6, 1);
      expect(roll).toHaveProperty('notation', '2d6+1');
      expect(roll).toHaveProperty('results');
      expect(roll).toHaveProperty('total');
      expect(roll).toHaveProperty('modifier', 1);
      expect(roll.results).toHaveLength(2);
    });

    it('should generate numbers within correct range', () => {
      const roll = service.rollDice(100, 20);
      roll.results.forEach(result => {
        expect(result).toBeGreaterThanOrEqual(1);
        expect(result).toBeLessThanOrEqual(20);
      });
    });
  });

  describe('wrapDiceRolls', () => {
    it('should process single dice roll in text', () => {
      const result = service.wrapDiceRolls('I attack with 1d20+5');
      expect(result.rolls).toHaveLength(1);
      expect(result.processedText).toMatch(/I attack with \[\d+d\d+\+\d+ = \d+ \(\d+\) \+\d+\]/);
    });

    it('should process multiple dice rolls in text', () => {
      const result = service.wrapDiceRolls('I roll 2d6+2 and then 1d8');
      expect(result.rolls).toHaveLength(2);
      expect(result.processedText).toMatch(/I roll \[\d+d\d+\+\d+ = \d+ \(\d+, \d+\) \+\d+\] and then \[\d+d\d+ = \d+ \(\d+\)\]/);
    });

    it('should handle text without dice notation', () => {
      const text = 'No dice rolls here';
      const result = service.wrapDiceRolls(text);
      expect(result.rolls).toHaveLength(0);
      expect(result.processedText).toBe(text);
    });
  });
});
