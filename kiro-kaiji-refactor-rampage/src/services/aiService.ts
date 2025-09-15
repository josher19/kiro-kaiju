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
import { handleAsyncError } from '@/utils/errorHandler';
import { networkService } from './networkService';
import { offlineStorageService } from './offlineStorageService';
import { getModelPreferenceHierarchy } from '@/utils/aiConfig';

export interface AIServiceConfig {
  mode: 'local' | 'cloud';
  provider?: 'kiro' | 'local-llm' | 'openrouter' | 'aws';
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  localLLM?: {
    endpoint: string;
    model?: string;
    timeout?: number;
    maxRetries?: number;
  };
  openRouter?: {
    preferredModels?: string[];
    useCase?: 'free' | 'coding' | 'quality' | 'balanced';
    maxRetries?: number;
    retryDelay?: number;
    enableFallback?: boolean;
  };
  aws?: {
    baseUrl: string;
    sessionId?: string;
    timeout?: number;
    maxRetries?: number;
  };
  requestDelay?: number;
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

      // Apply request delay to avoid quota issues
      if (this.config.requestDelay && this.config.requestDelay > 0) {
        await this.delay(this.config.requestDelay);
      }

      // Check network status for cloud mode
      if (this.config.mode === 'cloud' && !networkService.isOnline.value) {
        // Provide offline fallback response
        response = this.generateOfflineFallbackResponse(request, challengeContext);
      } else {
        try {
          // Determine provider based on config - default to AWS for cloud mode
          const provider = this.config.provider || (this.config.mode === 'local' ? 'kiro' : 'aws');

          switch (provider) {
            case 'kiro':
              //// Use local llm instead 
              // response = await this.sendToKiroAI(request, challengeContext);
              response = await this.sendToLocalLLM(request, challengeContext);
              break;
            case 'local-llm':
              response = await this.sendToLocalLLM(request, challengeContext);
              break;
            case 'openrouter':
              response = await this.sendToOpenRouter(request, challengeContext);
              break;
            case 'aws':
              response = await this.sendToAWS(request, challengeContext);
              break;
            default:
              throw new Error(`Unknown AI provider: ${provider}`);
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
   * Send request to Local LLM (OpenAI-compatible endpoint)
   */
  private async sendToLocalLLM(
    request: AIChatRequest,
    challengeContext: ChallengeContext
  ): Promise<AIChatMessage> {
    const localConfig = this.config.localLLM || {
      endpoint: 'http://localhost:1234/v1',
      timeout: 30000 * 10, // TODO: 5 minutes 
      maxRetries: 3
    };

    // Test connection first
    const isConnected = await this.testLocalLLMConnection(localConfig.endpoint);
    if (!isConnected) {
      throw new Error('Local LLM endpoint is not reachable');
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

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), localConfig.timeout || 30000);

    try {
      const response = await fetch(`${localConfig.endpoint}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': 'Bearer dummy-key' // Some local LLMs require this
        },
        body: JSON.stringify({
          model: localConfig.model || 'local-model',
          messages,
          temperature: 0.7,
          max_tokens: 240,
          stream: false
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Local LLM API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid response format from Local LLM');
      }

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
    } catch (error) {
      clearTimeout(timeoutId);

      if ((error as Error).name === 'AbortError') {
        throw new Error('Local LLM request timed out');
      }

      console.error('Local LLM integration error:', error);
      throw error;
    }
  }

  /**
   * Test connection to Local LLM endpoint
   */
  private async testLocalLLMConnection(endpoint: string): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout for connection test

      const response = await fetch(`${endpoint}/models`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.warn('Local LLM connection test failed:', error);
      return false;
    }
  }

  /**
   * Utility method to add delay
   */
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Send request to OpenRouter API (cloud mode) with model preference hierarchy and fallback
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

    // Get preferred models in order of preference
    const preferredModels = this.getPreferredModels();
    let lastError: Error | null = null;

    // Try each model in preference order
    for (const model of preferredModels) {
      try {
        const response = await this.makeOpenRouterRequest(model, messages);

        return {
          id: this.generateMessageId(),
          role: 'assistant',
          content: response.choices[0].message.content,
          timestamp: new Date(),
          context: {
            challengeId: request.challengeId,
            currentCode: request.currentCode,
            modelUsed: model
          }
        };
      } catch (error) {
        console.warn(`Model ${model} failed, trying next:`, error);
        lastError = error as Error;

        // Apply rate limiting delay between model attempts
        await this.delay(this.config.requestDelay || 1000);
        continue;
      }
    }

    // If all models failed, throw the last error
    throw new Error(`All OpenRouter models failed. Last error: ${lastError?.message}`);
  }

  /**
   * Get preferred models in order of preference for cost-aware selection
   */
  private getPreferredModels(): string[] {
    const openRouterConfig = this.config.openRouter;

    // Use custom preferred models if configured
    if (openRouterConfig?.preferredModels && openRouterConfig.preferredModels.length > 0) {
      return [...openRouterConfig.preferredModels];
    }

    // Use use case-based model selection
    const useCase = openRouterConfig?.useCase || 'balanced';
    const preferredModels = getModelPreferenceHierarchy(useCase);

    // If specific model is configured, prioritize it
    const configuredModel = this.config.model;
    if (configuredModel && !preferredModels.includes(configuredModel)) {
      return [configuredModel, ...preferredModels];
    } else if (configuredModel) {
      // Move configured model to front
      const filtered = preferredModels.filter(m => m !== configuredModel);
      return [configuredModel, ...filtered];
    }

    return preferredModels;
  }

  /**
   * Make OpenRouter API request with rate limiting and error handling
   */
  private async makeOpenRouterRequest(model: string, messages: any[]): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

    try {
      const response = await fetch(this.config.baseUrl || 'https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': typeof window !== 'undefined' ? (window.location?.origin ?? 'http://localhost:3000/') : 'https://kiro-kaiji.app',
          'X-Title': 'Kiro Kaiju: Refactor Rampage'
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.7,
          max_tokens: 1000,
          // Add cost optimization parameters
          top_p: 0.9,
          frequency_penalty: 0.1,
          presence_penalty: 0.1
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        // Handle specific OpenRouter errors
        if (response.status === 402) {
          throw new Error(`Model ${model} requires payment or credits`);
        } else if (response.status === 429) {
          throw new Error(`Rate limit exceeded for model ${model}`);
        } else if (response.status === 400 && errorData.error?.message?.includes('model')) {
          throw new Error(`Model ${model} is not available`);
        } else {
          throw new Error(`OpenRouter API error for model ${model}: ${response.status} ${response.statusText}`);
        }
      }

      const data = await response.json();

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error(`Invalid response format from OpenRouter for model ${model}`);
      }

      return data;
    } catch (error) {
      clearTimeout(timeoutId);

      if ((error as Error).name === 'AbortError') {
        throw new Error(`Request timeout for model ${model}`);
      }

      throw error;
    }
  }

  /**
   * Send request to AWS Cloud Services
   */
  private async sendToAWS(
    request: AIChatRequest,
    challengeContext: ChallengeContext
  ): Promise<AIChatMessage> {
    const awsConfig = this.config.aws || {
      baseUrl: 'https://wz1g0oat52.execute-api.us-west-2.amazonaws.com/dev',
      timeout: 60000,
      maxRetries: 3
    };

    // Check if we have a session ID, if not, authenticate first
    if (!awsConfig.sessionId) {
      await this.authenticateWithAWS(awsConfig);
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

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), awsConfig.timeout || 60000);

    try {
      const response = await fetch(`${awsConfig.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${awsConfig.sessionId}`
        },
        body: JSON.stringify({
          model: this.config.model || 'anthropic.claude-3-haiku-20240307-v1:0',
          messages,
          temperature: 0.7,
          max_tokens: 1000,
          stream: false
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Handle authentication errors by re-authenticating
        if (response.status === 401) {
          console.log('AWS session expired, re-authenticating...');
          await this.authenticateWithAWS(awsConfig);
          // Retry the request with new session
          return this.sendToAWS(request, challengeContext);
        }

        const errorData = await response.json().catch(() => ({}));
        throw new Error(`AWS API error: ${response.status} ${response.statusText} - ${errorData.error || 'Unknown error'}`);
      }

      const data = await response.json();

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid response format from AWS API');
      }

      return {
        id: this.generateMessageId(),
        role: 'assistant',
        content: data.choices[0].message.content,
        timestamp: new Date(),
        context: {
          challengeId: request.challengeId,
          currentCode: request.currentCode,
          modelUsed: data.model
        }
      };
    } catch (error) {
      clearTimeout(timeoutId);

      if ((error as Error).name === 'AbortError') {
        throw new Error('AWS API request timed out');
      }

      console.error('AWS API integration error:', error);
      throw error;
    }
  }

  /**
   * Authenticate with AWS and get session ID
   */
  private async authenticateWithAWS(awsConfig: NonNullable<AIServiceConfig['aws']>): Promise<void> {
    try {
      // Generate a user ID if not already stored
      let userId = localStorage.getItem('kiro-kaiju-user-id');
      if (!userId) {
        userId = `user-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
        localStorage.setItem('kiro-kaiju-user-id', userId);
      }

      const response = await fetch(`${awsConfig.baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId })
      });

      if (!response.ok) {
        throw new Error(`AWS authentication failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.sessionId) {
        throw new Error('No session ID received from AWS authentication');
      }

      // Store session ID in config and localStorage
      awsConfig.sessionId = data.sessionId;
      localStorage.setItem('kiro-kaiju-aws-session', data.sessionId);
      
      console.log('AWS authentication successful');
    } catch (error) {
      console.error('AWS authentication error:', error);
      throw new Error(`Failed to authenticate with AWS: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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
    return `msg-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
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


}

// Export singleton instance
let aiServiceInstance: AIService | null = null;

export function createAIService(config?: AIServiceConfig): AIService {
  // If no config provided, create from environment
  if (!config) {
    // Default to AWS cloud mode instead of Kiro
    config = {
      mode: 'cloud',
      provider: 'aws',
      requestDelay: 1000,
      aws: {
        baseUrl: 'https://wz1g0oat52.execute-api.us-west-2.amazonaws.com/dev',
        sessionId: localStorage.getItem('kiro-kaiju-aws-session') || undefined,
        timeout: 60000,
        maxRetries: 3
      }
    };
  }

  aiServiceInstance = new AIService(config);
  return aiServiceInstance;
}

export function getAIService(): AIService {
  if (!aiServiceInstance) {
    // Auto-initialize with environment config if not already created
    return createAIService();
  }
  return aiServiceInstance;
}

/**
 * Create AI service with Local LLM configuration
 */
export function createLocalLLMAIService(endpoint?: string, model?: string): AIService {
  const config: AIServiceConfig = {
    mode: 'local',
    provider: 'local-llm',
    requestDelay: 1000,
    localLLM: {
      endpoint: endpoint || 'http://localhost:1234/v1',
      model: model || 'local-model',
      timeout: 30000,
      maxRetries: 3
    }
  };

  console.info('Using Local LLM');
  return createAIService(config);
}

/**
 * Create AI service with OpenRouter configuration
 */
export function createOpenRouterAIService(
  apiKey: string,
  model?: string,
  options?: {
    useCase?: 'free' | 'coding' | 'quality' | 'balanced';
    preferredModels?: string[];
    enableFallback?: boolean;
    maxRetries?: number;
  }
): AIService {
  const config: AIServiceConfig = {
    mode: 'cloud',
    provider: 'openrouter',
    apiKey,
    baseUrl: 'https://openrouter.ai/api/v1/chat/completions',
    model: model || 'openai/gpt-oss-20b',
    requestDelay: 1000,
    openRouter: {
      useCase: options?.useCase || 'balanced',
      preferredModels: options?.preferredModels,
      enableFallback: options?.enableFallback !== false, // Default to true
      maxRetries: options?.maxRetries || 3,
      retryDelay: 1000
    }
  };

  return createAIService(config);
}

/**
 * Create AI service with cost-optimized OpenRouter configuration (free tier focus)
 */
export function createFreeOpenRouterAIService(apiKey: string): AIService {
  return createOpenRouterAIService(apiKey, undefined, {
    useCase: 'free',
    enableFallback: true,
    maxRetries: 5 // More retries for free tier
  });
}

/**
 * Create AI service with coding-focused OpenRouter configuration
 */
export function createCodingOpenRouterAIService(apiKey: string): AIService {
  return createOpenRouterAIService(apiKey, undefined, {
    useCase: 'coding',
    enableFallback: true,
    maxRetries: 3
  });
}

/**
 * Create AI service with AWS configuration
 */
export function createAWSAIService(
  baseUrl?: string,
  sessionId?: string,
  options?: {
    timeout?: number;
    maxRetries?: number;
  }
): AIService {
  const config: AIServiceConfig = {
    mode: 'cloud',
    provider: 'aws',
    requestDelay: 1000,
    aws: {
      baseUrl: baseUrl || 'https://wz1g0oat52.execute-api.us-west-2.amazonaws.com/dev',
      sessionId: sessionId || localStorage.getItem('kiro-kaiju-aws-session') || undefined,
      timeout: options?.timeout || 60000,
      maxRetries: options?.maxRetries || 3
    }
  };

  return createAIService(config);
}