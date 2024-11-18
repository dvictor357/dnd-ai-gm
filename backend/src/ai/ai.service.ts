import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AIModelFactory } from './models/ai.factory';
import { BaseAIModel } from './models/base.model';

@Injectable()
export class AIService implements OnModuleInit {
  private aiModel: BaseAIModel;

  constructor(
    private readonly configService: ConfigService,
    private readonly aiModelFactory: AIModelFactory,
  ) { }

  onModuleInit() {
    this.aiModel = this.aiModelFactory.createModel();
  }

  async getResponse(
    message: string,
    character?: any,
    conversationHistory?: any[],
  ): Promise<string> {
    try {
      const response = await this.aiModel.getResponse(
        message,
        character,
        conversationHistory,
      );
      return response.response;
    } catch (error) {
      console.error('Error getting AI response:', error);
      throw new Error('Failed to get AI response');
    }
  }

  async getModelInfo(): Promise<{ type: string; name: string }> {
    try {
      const modelType = this.configService.get<string>('AI_MODEL');
      const modelName = this.configService.get<string>('OPENROUTER_MODEL');

      if (modelType === 'openrouter' && modelName) {
        return {
          type: 'OPENROUTER',
          name: modelName,
        };
      } else if (modelType === 'deepseek') {
        return {
          type: 'DEEPSEEK',
          name: 'deepseek-chat',
        };
      }

      return {
        type: modelType?.toUpperCase() || 'Unknown',
        name: 'Unknown',
      };
    } catch (error) {
      console.error('Error getting model info:', error);
      return {
        type: 'Unknown',
        name: 'Unknown',
      };
    }
  }
}
