import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseAIModel } from './base.model';
import { DeepseekModel } from './deepseek.model';
import { OpenRouterModel } from './openrouter.model';

@Injectable()
export class AIModelFactory {
  private readonly logger = new Logger(AIModelFactory.name);

  constructor(private readonly configService: ConfigService) {}

  createModel(): BaseAIModel {
    const modelType = this.configService.get<string>('AI_MODEL');

    switch (modelType?.toLowerCase()) {
      case 'deepseek':
        return new DeepseekModel(this.configService);
      case 'openrouter':
        return new OpenRouterModel(this.configService);
      default:
        throw new Error(`Unknown AI model type: ${modelType}`);
    }
  }
}
