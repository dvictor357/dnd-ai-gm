import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GameController } from './game.controller';
import { GameService } from './game.service';
import { GameGateway } from './game.gateway';
import { AIModule } from '../ai/ai.module';
import { DiceService } from './services/dice/dice.service';
import { GameStateService } from './services/state/game-state.service';
import { CharacterService } from './services/character/character.service';
import { EncounterService } from './services/encounter/encounter.service';

@Module({
  imports: [
    ConfigModule.forRoot(),
    AIModule,
  ],
  controllers: [GameController],
  providers: [
    GameService,
    GameGateway,
    DiceService,
    GameStateService,
    CharacterService,
    EncounterService,
  ],
  exports: [GameService],
})
export class GameModule { }
