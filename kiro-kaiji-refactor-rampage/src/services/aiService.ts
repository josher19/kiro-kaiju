/**
 * AI Service
 * 
 * Handles communication with AI providers (Kiro AI or OpenRouter API)
 * based on deployment mode and provides code assistance functionality
 */

import type { 
  AIChatMessage, 
  AIChatRequest, 
  AIChatResponse
} from '@/types/api';
import type { ChallengeContext } from '@/types/challenge';
import { errorHandler, handleAsyncError } from '@/utils/errorHandler';
import { networkService } from './networkService';
import { offlineStorageService } from './offlineStorageService';

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
    return handleAsyncError(async () => {
      const conversationId = this.getConversationId(challengeContext.challenge.id, userId);
      
      // Load conversation history from cache if available
      let history = this.getConversationHistory(conversationId);
      if (history.length === 0) {
        const cachedHistory = offlineStorageService.getCachedChatHistory(
          challengeContext.challenge.id, 
          userId
        );
        if (cachedHistory.length > 0) {
          this.conversationHistory.set(conversationId, cachedHistory);
          history = cachedHistory;
        }
      }

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

      // Check network status for cloud mode
      if (this.config.mode === 'cloud' && !networkService.isOnline.value) {
        // Provide offline fallback response
        response = this.generateOfflineFallbackResponse(request, challengeContext);
      } else {
        try {
          if (this.config.mode === 'local') {
            response = await this.sendToKiroAI(request, challengeContext);
          } else {
            response = await this.sendToOpenRouter(request, challengeContext);
          }
        } catch (error) {
          // If network request fails, provide fallback response
          if (this.isNetworkError(error)) {
            response = this.generateOfflineFallbackResponse(request, challengeContext);
          } else {
            throw error;
          }
        }
      }

      // Add AI response to history
      this.addMessageToHistory(conversationId, response);

      // Cache the updated conversation history
      const updatedHistory = this.getConversationHistory(conversationId);
      await offlineStorageService.cacheChatHistory(
        challengeContext.challenge.id,
        updatedHistory,
        userId
      );

      return {
        success: true,
        message: response
      };

    }, {
      context: 'ai_service_send_message',
      challengeId: challengeContext.challenge.id,
      userId
    }, {
      maxRetries: 2,
      retryDelay: 1000
    });
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
    try {
      // Check if we're in Kiro IDE environment
      if (!this.isKiroEnvironment()) {
        throw new Error('Not running in Kiro IDE environment');
      }

      const systemPrompt = this.buildSystemPrompt(challengeContext);
      
      // Use Kiro's built-in AI capabilities
      const kiroAIRequest = {
        message: request.message,
        systemPrompt,
        context: {
          challengeId: request.challengeId,
          currentCode: request.currentCode,
          challenge: challengeContext.challenge,
          conversationHistory: request.conversationHistory.map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        },
        options: {
          temperature: 0.7,
          maxTokens: 1000,
          includeCodeAnalysis: true,
          includeRefactoringSuggestions: true
        }
      };

      const response = await window.kiro!.ai!.chat(kiroAIRequest);
      
      if (!response.success) {
        throw new Error(response.error || 'Kiro AI request failed');
      }

      return {
        id: this.generateMessageId(),
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
        context: {
          challengeId: request.challengeId,
          currentCode: request.currentCode
        }
      };
    } catch (error) {
      console.error('Kiro AI integration error:', error);
      
      // Fallback to local processing if Kiro AI is not available
      return this.generateFallbackResponse(request, challengeContext);
    }
  }

  /**
   * Check if running in Kiro IDE environment
   */
  private isKiroEnvironment(): boolean {
    return typeof window !== 'undefined' && 
           window.kiro !== undefined &&
           window.kiro.ai !== undefined;
  }

  /**
   * Generate fallback response when Kiro AI is not available
   */
  private generateFallbackResponse(
    request: AIChatRequest,
    challengeContext: ChallengeContext
  ): AIChatMessage {
    const { challenge } = challengeContext;
    
    // Generate contextual response based on the request
    let content = '';
    
    if (request.message.toLowerCase().includes('refactor')) {
      content = `I can help you refactor this code to overcome ${challenge.kaiju.name}! Here are some general suggestions:

1. Look for the specific anti-patterns that ${challenge.kaiju.name} represents
2. Break down complex functions into smaller, more manageable pieces
3. Eliminate code duplication where possible
4. Improve variable and function naming for clarity
5. Add proper error handling

Would you like me to analyze a specific part of your code?`;
    } else if (request.message.toLowerCase().includes('test')) {
      content = `For testing this challenge, consider:

1. Write unit tests for each function
2. Test edge cases and error conditions
3. Verify that all requirements are met
4. Use meaningful test descriptions
5. Ensure good code coverage

The challenge includes ${challenge.testCases.length} test cases to validate your solution.`;
    } else if (request.message.toLowerCase().includes('bug') || request.message.toLowerCase().includes('error')) {
      content = `To debug this code effectively:

1. Check for syntax errors first
2. Look for logical errors in the algorithm
3. Verify variable scoping and initialization
4. Check for off-by-one errors in loops
5. Ensure proper error handling

${challenge.kaiju.name} is known for: ${challenge.kaiju.description}`;
    } else {
      content = `I'm here to help you tackle this ${challenge.kaiju.name} challenge! 

Current challenge: ${challenge.title}
Difficulty: ${challenge.config.difficulty}/5
Language: ${challenge.config.language}

You can ask me about:
- Refactoring strategies
- Code analysis
- Testing approaches
- Debugging techniques
- Best practices

What specific aspect would you like help with?`;
    }

    return {
      id: this.generateMessageId(),
      role: 'assistant',
      content,
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
   * Generate offline fallback response when network is unavailable
   */
  private generateOfflineFallbackResponse(
    request: AIChatRequest,
    challengeContext: ChallengeContext
  ): AIChatMessage {
    const { challenge } = challengeContext;
    
    const content = `🔌 **Offline Mode** - I'm currently working offline, but I can still help!

**${challenge.kaiju.name} Challenge Analysis:**
${challenge.kaiju.description}

**Based on your message:** "${request.message}"

Here are some offline suggestions:

${this.generateOfflineAdvice(request.message, challenge)}

💡 **Tip:** Your conversation will sync when you're back online!`;

    return {
      id: this.generateMessageId(),
      role: 'assistant',
      content,
      timestamp: new Date(),
      context: {
        challengeId: request.challengeId,
        currentCode: request.currentCode
      }
    };
  }

  /**
   * Generate context-aware offline advice
   */
  private generateOfflineAdvice(message: string, challenge: any): string {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('refactor') || lowerMessage.includes('improve')) {
      return `**Refactoring Strategy for ${challenge.kaiju.name}:**
• Identify the specific anti-pattern this Kaiju represents
• Break down complex functions into smaller, focused methods
• Look for repeated code patterns that can be extracted
• Improve naming conventions for better readability
• Add proper error handling and validation`;
    }
    
    if (lowerMessage.includes('test') || lowerMessage.includes('unit')) {
      return `**Testing Approach:**
• Start with happy path test cases
• Add edge case and error condition tests
• Test each function in isolation
• Verify all requirements are covered
• Use descriptive test names that explain the scenario`;
    }
    
    if (lowerMessage.includes('bug') || lowerMessage.includes('error') || lowerMessage.includes('fix')) {
      return `**Debugging Strategy:**
• Check for syntax errors first
• Verify variable initialization and scope
• Look for logical errors in conditionals
• Test with different input values
• Use console.log or debugger to trace execution`;
    }
    
    if (lowerMessage.includes('help') || lowerMessage.includes('start') || lowerMessage.includes('how')) {
      return `**Getting Started:**
• Read through all the requirements carefully
• Understand what ${challenge.kaiju.name} represents
• Identify the problematic patterns in the code
• Plan your refactoring approach step by step
• Test frequently as you make changes`;
    }
    
    return `**General Guidance:**
• Focus on the specific problems ${challenge.kaiju.name} introduces
• Make small, incremental changes
• Test after each change to ensure nothing breaks
• Keep the original functionality while improving the code structure
• Don't forget to handle edge cases and error conditions`;
  }

  /**
   * Check if error is network-related
   */
  private isNetworkError(error: any): boolean {
    if (!error) return false;
    
    const message = error.message?.toLowerCase() || '';
    const name = error.name?.toLowerCase() || '';
    
    return message.includes('network') ||
           message.includes('fetch') ||
           message.includes('timeout') ||
           message.includes('connection') ||
           name.includes('networkerror') ||
           error.code === 'NETWORK_ERROR';
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