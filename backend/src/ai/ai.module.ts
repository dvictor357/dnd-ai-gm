import { Module } from '@nestjs/common';
import { AIService } from './ai.service';
import { AIModelFactory } from './models/ai.factory';
import { DeepseekModel } from './models/deepseek.model';
import { OpenRouterModel } from './models/openrouter.model';

@Module({
  providers: [AIService, AIModelFactory, DeepseekModel, OpenRouterModel],
  exports: [AIService],
})
export class AIModule {}
