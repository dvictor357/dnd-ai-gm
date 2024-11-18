import { Character, CharacterUtils } from '../utils/character.utils';

export interface AIModelResponse {
  response: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

export interface ConversationMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIModelConfig {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

export abstract class BaseAIModel {
  protected config: AIModelConfig = {
    temperature: 0.75,
    maxTokens: 800,
    topP: 1,
    frequencyPenalty: 0,
    presencePenalty: 0,
  };

  /**
   * Get a response from the AI model
   * @param message User's message
   * @param character Optional character information
   * @param conversationHistory Optional conversation history
   * @returns Promise with the AI's response
   */
  abstract getResponse(
    message: string,
    character?: Character,
    conversationHistory?: ConversationMessage[],
  ): Promise<AIModelResponse>;

  /**
   * Create system messages for the AI
   * @param character Optional character information
   * @returns Array of system messages
   */
  protected createSystemMessages(character?: Character): ConversationMessage[] {
    const messages: ConversationMessage[] = [];

    // Add base D&D context
    messages.push({
      role: 'system',
      content: `You are an AI Dungeon Master for D&D 5e. Your responses should be:
- In character as a DM
- Follow D&D 5e rules
- Be descriptive and engaging
- Consider character abilities and stats
- Use appropriate skill checks
- Be consistent with fantasy setting`,
    });

    // Add character-specific context if available
    if (character) {
      messages.push({
        role: 'system',
        content: CharacterUtils.createCharacterContext(character),
      });
    }

    return messages;
  }

  /**
   * Format conversation history for the AI
   * @param history Array of previous messages
   * @returns Formatted conversation history
   */
  protected formatConversationHistory(
    history: ConversationMessage[],
  ): ConversationMessage[] {
    return history.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));
  }

  /**
   * Update model configuration
   * @param config New configuration options
   */
  setConfig(config: Partial<AIModelConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };
  }
}
