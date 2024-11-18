import { Module } from '@nestjs/common';
import { GameGateway } from './game.gateway';
import { GameService } from './game.service';
import { AIModule } from '../ai/ai.module';

@Module({
  imports: [AIModule],
  providers: [GameGateway, GameService],
})
export class GameModule {}
