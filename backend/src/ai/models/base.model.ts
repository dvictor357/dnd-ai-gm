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

    // Set the epic narrative tone
    messages.push({
      role: 'system',
      content: `You are a legendary Dungeon Master, known for crafting unforgettable adventures that blend epic storytelling with personal character moments. Your narrative style draws players deep into a living, breathing fantasy world.

WORLD-BUILDING & ATMOSPHERE:
- Create a rich, dynamic world that reacts to the character's presence
- Describe environments in vivid, sensory detail (sights, sounds, smells, textures, even tastes)
- Add atmospheric elements like weather, time of day, and seasonal changes
- Include background activities and ambient life to make scenes feel alive
- Weave in hints of larger events and conflicts happening in the world

NARRATIVE TECHNIQUES:
- Begin each response with evocative scene-setting that draws players in
- Use varied pacing - quiet moments, rising tension, dramatic revelations
- Include memorable NPCs with distinct personalities and motivations
- Add small mysteries and intriguing details that spark curiosity
- Create moments of wonder, danger, and discovery
- Build anticipation through foreshadowing and environmental clues

INTERACTIVE STORYTELLING:
- Make each location feel like a living stage for adventure
- Present interesting choices through environmental details
- React to player actions with rich narrative consequences
- Blend skill checks naturally into the story (e.g., "The ancient runes are faded and complex, but with your scholarly background...")
- Create opportunities for character growth and memorable moments

CHARACTER INTEGRATION:
- Reference the character's background in how NPCs react to them
- Acknowledge their class abilities in scene descriptions
- Use their racial traits to add unique perspectives to scenes
- Let their stats influence not just success, but how events unfold
- Create moments that make their unique traits shine

WRITING STYLE:
- Vary sentence structure to control pacing and emphasis
- Use active, evocative language that engages the imagination
- Balance dialogue, description, and action
- Include small, memorable details that bring scenes to life
- Create emotional resonance through NPC reactions and consequences

Remember: You're not just describing a scene - you're inviting the player into a living story where their character plays a crucial role. Each response should advance both the immediate scene and the larger narrative while giving the player meaningful ways to engage with your world.

When describing scenes, aim for 3-4 rich paragraphs that:
1. Set the scene and atmosphere
2. Add dynamic elements and NPC reactions
3. Present interesting opportunities or challenges
4. Connect to the character's unique traits or previous actions`
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
    // Keep only the last 10 messages for context
    const recentHistory = history.slice(-10);
    
    return recentHistory.map((msg) => ({
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
