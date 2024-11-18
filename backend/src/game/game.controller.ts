import { Controller, Get } from '@nestjs/common';
import { GameService } from './game.service';
import { AIService } from '../ai/ai.service';

@Controller()
export class GameController {
  constructor(
    private readonly gameService: GameService,
    private readonly aiService: AIService,
  ) {}

  @Get('server-info')
  async getServerInfo() {
    const info = this.gameService.getServerInfo();
    const model = await this.aiService.getModelInfo();
    
    return {
      status: 'ok',
      activeConnections: this.gameService.getActiveConnections(),
      encounters: this.gameService.getEncounterCount(),
      rolls: this.gameService.getRollCount(),
      model: {
        type: model.type || 'Unknown',
        name: model.name || 'Unknown',
      },
    };
  }
}
