import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  Min,
  Max,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export enum CharacterClass {
  BARBARIAN = 'barbarian',
  BARD = 'bard',
  CLERIC = 'cleric',
  DRUID = 'druid',
  FIGHTER = 'fighter',
  MONK = 'monk',
  PALADIN = 'paladin',
  RANGER = 'ranger',
  ROGUE = 'rogue',
  SORCERER = 'sorcerer',
  WARLOCK = 'warlock',
  WIZARD = 'wizard',
}

export class AbilityScoresDto {
  @ApiProperty({ minimum: 1, maximum: 20 })
  @IsNumber()
  @Min(1)
  @Max(20)
  strength: number;

  @ApiProperty({ minimum: 1, maximum: 20 })
  @IsNumber()
  @Min(1)
  @Max(20)
  dexterity: number;

  @ApiProperty({ minimum: 1, maximum: 20 })
  @IsNumber()
  @Min(1)
  @Max(20)
  constitution: number;

  @ApiProperty({ minimum: 1, maximum: 20 })
  @IsNumber()
  @Min(1)
  @Max(20)
  intelligence: number;

  @ApiProperty({ minimum: 1, maximum: 20 })
  @IsNumber()
  @Min(1)
  @Max(20)
  wisdom: number;

  @ApiProperty({ minimum: 1, maximum: 20 })
  @IsNumber()
  @Min(1)
  @Max(20)
  charisma: number;
}

export class CreateCharacterDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ enum: CharacterClass })
  @IsEnum(CharacterClass)
  class: CharacterClass;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  @Max(20)
  level: number;

  @ApiProperty()
  @ValidateNested()
  @Type(() => AbilityScoresDto)
  abilityScores: AbilityScoresDto;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  equipment?: string[];

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  spells?: string[];

  @ApiProperty()
  @IsString()
  @IsOptional()
  background?: string;
}
