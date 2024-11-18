import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseAIModel, AIModelResponse, ConversationMessage } from './base.model';
import { Character } from '../utils/character.utils';
import axios from 'axios';

@Injectable()
export class OpenRouterModel extends BaseAIModel {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly apiUrl = 'https://openrouter.ai/api/v1/chat/completions';

  constructor(private readonly configService: ConfigService) {
    super();
    this.apiKey = this.configService.get<string>('OPENROUTER_API_KEY');
    this.model = this.configService.get<string>('OPENROUTER_MODEL', 'mistralai/mistral-7b-instruct');
    
    if (!this.apiKey) {
      throw new Error('OPENROUTER_API_KEY is not set in environment variables');
    }
  }

  async getResponse(
    message: string,
    character?: Character,
    conversationHistory: ConversationMessage[] = [],
  ): Promise<AIModelResponse> {
    try {
      const messages = [
        ...this.createSystemMessages(character),
        ...this.formatConversationHistory(conversationHistory),
        { role: 'user', content: message },
      ];

      const response = await axios.post(
        this.apiUrl,
        {
          model: this.model,
          messages,
          temperature: this.config.temperature,
          max_tokens: this.config.maxTokens,
          top_p: this.config.topP,
          frequency_penalty: this.config.frequencyPenalty,
          presence_penalty: this.config.presencePenalty,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
            'HTTP-Referer': 'https://github.com/your-repo/dnd-ai', // Replace with your actual repo
            'X-Title': 'DND AI Master',
          },
        },
      );

      return {
        response: response.data.choices[0].message.content,
        usage: response.data.usage,
      };
    } catch (error) {
      console.error('Error calling OpenRouter API:', error.response?.data || error.message);
      throw new Error('Failed to get response from OpenRouter API');
    }
  }
}
