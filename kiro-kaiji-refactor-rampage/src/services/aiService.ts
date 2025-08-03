/**
 * AI Service
 * 
 * Handles communication with AI providers (Kiro AI or OpenRouter API)
 * based on deployment mode and provides code assistance functionality
 */

import type { 
  AIChatMessage, 
  AIChatRequest, 
  AIChatResponse, 
  ApiError 
} from '@/types/api';
import type { ChallengeContext } from '@/types/challenge';

export interface AIServiceConfig {
  mode: 'local' | 'cloud';
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}

export class AIService {
  private config: AIServiceConfig;
  private conversationHistory: Map<string, AIChatMessage[]> = new Map();

  constructor(config: AIServiceConfig) {
    this.config = config;
  }

  /**
   * Send a message to the AI and get a response
   */
  async sendMessage(
    message: string,
    challengeContext: ChallengeContext,
    userId?: string
  ): Promise<AIChatResponse> {
    try {
      const conversationId = this.getConversationId(challengeContext.challenge.id, userId);
      const history = this.getConversationHistory(conversationId);

      const userMessage: AIChatMessage = {
        id: this.generateMessageId(),
        role: 'user',
        content: message,
        timestamp: new Date(),
        context: {
          challengeId: challengeContext.challenge.id,
          currentCode: challengeContext.currentCode
        }
      };

      // Add user message to history
      this.addMessageToHistory(conversationId, userMessage);

      const request: AIChatRequest = {
        message,
        challengeId: challengeContext.challenge.id,
        currentCode: challengeContext.currentCode,
        conversationHistory: history,
        userId
      };

      let response: AIChatMessage;

      if (this.config.mode === 'local') {
        response = await this.sendToKiroAI(request, challengeContext);
      } else {
        response = await this.sendToOpenRouter(request, challengeContext);
      }

      // Add AI response to history
      this.addMessageToHistory(conversationId, response);

      return {
        success: true,
        message: response
      };

    } catch (error) {
      console.error('AI Service Error:', error);
      return {
        success: false,
        error: this.formatError(error)
      };
    }
  }

  /**
   * Get conversation history for a specific challenge and user
   */
  getConversationHistory(conversationId: string): AIChatMessage[] {
    return this.conversationHistory.get(conversationId) || [];
  }

  /**
   * Clear conversation history for a specific challenge
   */
  clearConversationHistory(challengeId: string, userId?: string): void {
    const conversationId = this.getConversationId(challengeId, userId);
    this.conversationHistory.delete(conversationId);
  }

  /**
   * Send request to Kiro AI (local mode)
   */
  private async sendToKiroAI(
    request: AIChatRequest,
    challengeContext: ChallengeContext
  ): Promise<AIChatMessage> {
    // In local mode, we integrate directly with Kiro's AI capabilities
    const systemPrompt = this.buildSystemPrompt(challengeContext);
    
    // This would integrate with Kiro's internal AI API
    // For now, we'll simulate the response structure
    const response = await fetch('/api/kiro-ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...request,
        systemPrompt,
        context: challengeContext
      })
    });

    if (!response.ok) {
      throw new Error(`Kiro AI API error: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      id: this.generateMessageId(),
      role: 'assistant',
      content: data.message,
      timestamp: new Date(),
      context: {
        challengeId: request.challengeId,
        currentCode: request.currentCode
      }
    };
  }

  /**
   * Send request to OpenRouter API (cloud mode)
   */
  private async sendToOpenRouter(
    request: AIChatRequest,
    challengeContext: ChallengeContext
  ): Promise<AIChatMessage> {
    if (!this.config.apiKey) {
      throw new Error('OpenRouter API key not configured');
    }

    const systemPrompt = this.buildSystemPrompt(challengeContext);
    const messages = [
      { role: 'system', content: systemPrompt },
      ...request.conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: request.message }
    ];

    const response = await fetch(this.config.baseUrl || 'https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Kiro Kaiju: Refactor Rampage'
      },
      body: JSON.stringify({
        model: this.config.model || 'anthropic/claude-3-haiku',
        messages,
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      id: this.generateMessageId(),
      role: 'assistant',
      content: data.choices[0].message.content,
      timestamp: new Date(),
      context: {
        challengeId: request.challengeId,
        currentCode: request.currentCode
      }
    };
  }

  /**
   * Build system prompt based on challenge context
   */
  private buildSystemPrompt(challengeContext: ChallengeContext): string {
    const { challenge } = challengeContext;
    
    return `You are Kiro AI, an expert coding assistant helping users with refactoring challenges in Kiro Kaiju: Refactor Rampage.

Current Challenge Context:
- Challenge: ${challenge.title}
- Kaiju Monster: ${challenge.kaiju.name} (${challenge.kaiju.description})
- Language: ${challenge.config.language}
- Framework: ${challenge.config.framework || 'None'}
- Category: ${challenge.config.category}
- Difficulty: ${challenge.config.difficulty}/5

Challenge Description:
${challenge.description}

Requirements:
${challenge.requirements.map(req => `- ${req.description}`).join('\n')}

Your role is to:
1. Help users refactor problematic code patterns introduced by the Kaiju monster
2. Provide specific, actionable suggestions for code improvement
3. Guide users through implementing new requirements
4. Suggest unit tests and testing strategies
5. Explain best practices and design patterns
6. Keep responses focused on the current challenge context

Always provide concrete, implementable advice rather than general guidance. Reference the specific Kaiju monster's anti-patterns when relevant.`;
  }

  /**
   * Generate unique conversation ID
   */
  private getConversationId(challengeId: string, userId?: string): string {
    return `${challengeId}-${userId || 'anonymous'}`;
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Add message to conversation history
   */
  private addMessageToHistory(conversationId: string, message: AIChatMessage): void {
    const history = this.conversationHistory.get(conversationId) || [];
    history.push(message);
    
    // Keep only last 20 messages to prevent memory issues
    if (history.length > 20) {
      history.splice(0, history.length - 20);
    }
    
    this.conversationHistory.set(conversationId, history);
  }

  /**
   * Format error for user display
   */
  private formatError(error: any): string {
    if (error.message?.includes('API key')) {
      return 'AI service configuration error. Please check your API settings.';
    }
    if (error.message?.includes('network') || error.message?.includes('fetch')) {
      return 'Network error. Please check your connection and try again.';
    }
    return 'An unexpected error occurred. Please try again.';
  }
}

// Export singleton instance
let aiServiceInstance: AIService | null = null;

export function createAIService(config: AIServiceConfig): AIService {
  aiServiceInstance = new AIService(config);
  return aiServiceInstance;
}

export function getAIService(): AIService {
  if (!aiServiceInstance) {
    throw new Error('AI Service not initialized. Call createAIService first.');
  }
  return aiServiceInstance;
}