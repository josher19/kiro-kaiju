/**
 * AI Service Tests
 * 
 * Tests for AI service functionality including message handling,
 * conversation history, and integration with different AI providers
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { 
  AIService, 
  createAIService, 
  createLocalLLMAIService, 
  createOpenRouterAIService,
  createFreeOpenRouterAIService,
  createCodingOpenRouterAIService,
  type AIServiceConfig 
} from '../aiService';
import type { ChallengeContext } from '@/types/challenge';
import type { KaijuMonster } from '@/types/kaiju';
import { KaijuType } from '@/types/kaiju';
import { ProgrammingLanguage, ChallengeCategory, DifficultyLevel } from '@/types/challenge';

// Mock fetch globally
global.fetch = vi.fn();

describe('AIService', () => {
  let aiService: AIService;
  let mockChallengeContext: ChallengeContext;
  let mockConfig: AIServiceConfig;

  beforeEach(() => {
    // Reset fetch mock
    vi.resetAllMocks();

    // Mock configuration
    mockConfig = {
      mode: 'local',
      apiKey: 'test-key',
      baseUrl: 'http://localhost:3000',
      model: 'test-model'
    };

    // Create mock challenge context
    const mockKaiju: KaijuMonster = {
      id: 'hydra-bug',
      name: 'HydraBug',
      type: KaijuType.HYDRA_BUG,
      description: 'A monster that multiplies bugs',
      avatar: '/images/hydra-bug.png',
      codePatterns: [],
      difficultyModifiers: [],
      backstory: 'Ancient bug multiplier',
      weaknesses: ['proper testing'],
      strengths: ['chaos creation']
    };

    mockChallengeContext = {
      challenge: {
        id: 'test-challenge-1',
        kaiju: mockKaiju,
        config: {
          language: ProgrammingLanguage.JAVASCRIPT,
          category: ChallengeCategory.REFACTORING,
          difficulty: DifficultyLevel.INTERMEDIATE
        },
        title: 'Test Challenge',
        description: 'A test challenge',
        initialCode: 'function test() { return true; }',
        requirements: [
          {
            id: 'req-1',
            description: 'Fix the bugs',
            priority: 'must',
            testable: true,
            acceptanceCriteria: ['No bugs remain']
          }
        ],
        testCases: [],
        hints: [],
        createdAt: new Date()
      },
      currentCode: 'function test() { return true; }',
      attempts: 1,
      startTime: new Date(),
      lastModified: new Date()
    };

    aiService = new AIService(mockConfig);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with provided config', () => {
      expect(aiService).toBeInstanceOf(AIService);
    });
  });

  describe('sendMessage', () => {
    it('should send message to Kiro AI in local mode', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          message: 'AI response to your question'
        })
      };
      
      (global.fetch as any).mockResolvedValue(mockResponse);

      const result = await aiService.sendMessage(
        'Help me refactor this code',
        mockChallengeContext,
        'user-123'
      );

      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
      expect(result.message?.role).toBe('assistant');
      expect(result.message?.content).toBe('AI response to your question');
      
      expect(global.fetch).toHaveBeenCalledWith('/api/kiro-ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.stringContaining('Help me refactor this code')
      });
    });

    it('should send message to OpenRouter in cloud mode', async () => {
      const cloudConfig: AIServiceConfig = {
        mode: 'cloud',
        provider: 'openrouter',
        apiKey: 'openrouter-key',
        baseUrl: 'https://openrouter.ai/api/v1/chat/completions',
        model: 'anthropic/claude-3-haiku'
      };
      
      const cloudService = new AIService(cloudConfig);
      
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          choices: [{
            message: {
              content: 'OpenRouter AI response'
            }
          }]
        })
      };
      
      (global.fetch as any).mockResolvedValue(mockResponse);

      const result = await cloudService.sendMessage(
        'Help me with testing',
        mockChallengeContext,
        'user-123'
      );

      expect(result.success).toBe(true);
      expect(result.message?.content).toBe('OpenRouter AI response');
      
      expect(global.fetch).toHaveBeenCalledWith(
        'https://openrouter.ai/api/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer openrouter-key',
            'Content-Type': 'application/json'
          })
        })
      );
    });

    it('should handle API errors gracefully', async () => {
      const mockResponse = {
        ok: false,
        status: 500
      };
      
      (global.fetch as any).mockResolvedValue(mockResponse);

      const result = await aiService.sendMessage(
        'Test message',
        mockChallengeContext
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle network errors', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      const result = await aiService.sendMessage(
        'Test message',
        mockChallengeContext
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('An unexpected error occurred');
    });

    it('should add messages to conversation history', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          message: 'AI response'
        })
      };
      
      (global.fetch as any).mockResolvedValue(mockResponse);

      await aiService.sendMessage(
        'First message',
        mockChallengeContext,
        'user-123'
      );

      const history = aiService.getConversationHistory('test-challenge-1-user-123');
      
      expect(history).toHaveLength(2); // User message + AI response
      expect(history[0].role).toBe('user');
      expect(history[0].content).toBe('First message');
      expect(history[1].role).toBe('assistant');
      expect(history[1].content).toBe('AI response');
    });
  });

  describe('conversation history management', () => {
    it('should maintain separate histories for different conversations', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ message: 'Response' })
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      // Send messages for different users
      await aiService.sendMessage('Message 1', mockChallengeContext, 'user-1');
      await aiService.sendMessage('Message 2', mockChallengeContext, 'user-2');

      const history1 = aiService.getConversationHistory('test-challenge-1-user-1');
      const history2 = aiService.getConversationHistory('test-challenge-1-user-2');

      expect(history1).toHaveLength(2);
      expect(history2).toHaveLength(2);
      expect(history1[0].content).toBe('Message 1');
      expect(history2[0].content).toBe('Message 2');
    });

    it('should clear conversation history', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ message: 'Response' })
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      await aiService.sendMessage('Test message', mockChallengeContext, 'user-123');
      
      let history = aiService.getConversationHistory('test-challenge-1-user-123');
      expect(history).toHaveLength(2);

      aiService.clearConversationHistory('test-challenge-1', 'user-123');
      
      history = aiService.getConversationHistory('test-challenge-1-user-123');
      expect(history).toHaveLength(0);
    });

    it('should limit conversation history to 20 messages', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ message: 'Response' })
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      // Send 15 messages (30 total with responses)
      for (let i = 0; i < 15; i++) {
        await aiService.sendMessage(`Message ${i}`, mockChallengeContext, 'user-123');
      }

      const history = aiService.getConversationHistory('test-challenge-1-user-123');
      expect(history).toHaveLength(20); // Limited to 20 messages
      
      // Should keep the most recent messages
      expect(history[history.length - 1].role).toBe('assistant');
      expect(history[history.length - 2].content).toBe('Message 14');
    });
  });

  describe('error handling', () => {
    it('should format API key errors appropriately', async () => {
      (global.fetch as any).mockRejectedValue(new Error('API key invalid'));

      const result = await aiService.sendMessage('Test', mockChallengeContext);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('AI service configuration error');
    });

    it('should format network errors appropriately', async () => {
      (global.fetch as any).mockRejectedValue(new Error('fetch failed'));

      const result = await aiService.sendMessage('Test', mockChallengeContext);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });

    it('should handle missing OpenRouter API key', async () => {
      const cloudConfig: AIServiceConfig = {
        mode: 'cloud'
        // No API key provided
      };
      
      const cloudService = new AIService(cloudConfig);

      const result = await cloudService.sendMessage('Test', mockChallengeContext);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('AI service configuration error');
    });
  });

  describe('system prompt generation', () => {
    it('should include challenge context in system prompt', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ message: 'Response' })
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      await aiService.sendMessage('Help me', mockChallengeContext);

      const callArgs = (global.fetch as any).mock.calls[0][1];
      const requestBody = JSON.parse(callArgs.body);
      
      expect(requestBody.systemPrompt).toContain('HydraBug');
      expect(requestBody.systemPrompt).toContain('Test Challenge');
      expect(requestBody.systemPrompt).toContain('javascript');
      expect(requestBody.systemPrompt).toContain('refactoring');
    });
  });

  describe('Local LLM Integration', () => {
    let localLLMService: AIService;

    beforeEach(() => {
      const localConfig: AIServiceConfig = {
        mode: 'local',
        provider: 'local-llm',
        requestDelay: 500,
        localLLM: {
          endpoint: 'http://localhost:1234/v1',
          model: 'local-model',
          timeout: 30000,
          maxRetries: 3
        }
      };
      localLLMService = new AIService(localConfig);
    });

    it('should send message to Local LLM endpoint', async () => {
      // Mock connection test
      const connectionTestResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ data: [] })
      };
      
      // Mock chat completion response
      const chatResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          choices: [{
            message: {
              content: 'Local LLM response to your refactoring question'
            }
          }]
        })
      };
      
      (global.fetch as any)
        .mockResolvedValueOnce(connectionTestResponse) // Connection test
        .mockResolvedValueOnce(chatResponse); // Chat completion

      const result = await localLLMService.sendMessage(
        'Help me refactor this code',
        mockChallengeContext,
        'user-123'
      );

      expect(result.success).toBe(true);
      expect(result.message?.content).toBe('Local LLM response to your refactoring question');
      expect(result.message?.role).toBe('assistant');

      // Verify connection test call
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:1234/v1/models',
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })
      );

      // Verify chat completion call
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:1234/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer dummy-key'
          },
          body: expect.stringContaining('Help me refactor this code')
        })
      );
    });

    it('should handle Local LLM connection failure', async () => {
      // Mock failed connection test
      (global.fetch as any).mockRejectedValue(new Error('Connection refused'));

      const result = await localLLMService.sendMessage(
        'Test message',
        mockChallengeContext
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Local LLM endpoint is not reachable');
    });

    it('should handle Local LLM timeout', async () => {
      // Mock connection test success
      const connectionTestResponse = { ok: true };
      
      // Mock timeout for chat completion
      (global.fetch as any)
        .mockResolvedValueOnce(connectionTestResponse)
        .mockImplementation(() => new Promise(() => {})); // Never resolves (timeout)

      const result = await localLLMService.sendMessage(
        'Test message',
        mockChallengeContext
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Local LLM request timed out');
    });

    it('should handle Local LLM API errors', async () => {
      // Mock connection test success
      const connectionTestResponse = { ok: true };
      
      // Mock API error response
      const errorResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      };
      
      (global.fetch as any)
        .mockResolvedValueOnce(connectionTestResponse)
        .mockResolvedValueOnce(errorResponse);

      const result = await localLLMService.sendMessage(
        'Test message',
        mockChallengeContext
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Local LLM API error: 500');
    });

    it('should handle invalid Local LLM response format', async () => {
      // Mock connection test success
      const connectionTestResponse = { ok: true };
      
      // Mock invalid response format
      const invalidResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          // Missing choices array
          invalid: 'response'
        })
      };
      
      (global.fetch as any)
        .mockResolvedValueOnce(connectionTestResponse)
        .mockResolvedValueOnce(invalidResponse);

      const result = await localLLMService.sendMessage(
        'Test message',
        mockChallengeContext
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid response format from Local LLM');
    });

    it('should apply request delay before making requests', async () => {
      const startTime = Date.now();
      
      // Mock successful responses
      const connectionTestResponse = { ok: true };
      const chatResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          choices: [{ message: { content: 'Response' } }]
        })
      };
      
      (global.fetch as any)
        .mockResolvedValueOnce(connectionTestResponse)
        .mockResolvedValueOnce(chatResponse);

      await localLLMService.sendMessage('Test', mockChallengeContext);
      
      const endTime = Date.now();
      const elapsed = endTime - startTime;
      
      // Should have waited at least the request delay (500ms in test config)
      expect(elapsed).toBeGreaterThanOrEqual(450); // Allow some tolerance
    });

    it('should use custom endpoint and model from config', async () => {
      const customConfig: AIServiceConfig = {
        mode: 'local',
        provider: 'local-llm',
        localLLM: {
          endpoint: 'http://custom-endpoint:8080/v1',
          model: 'custom-model',
          timeout: 15000,
          maxRetries: 2
        }
      };
      
      const customService = new AIService(customConfig);
      
      const connectionTestResponse = { ok: true };
      const chatResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          choices: [{ message: { content: 'Custom response' } }]
        })
      };
      
      (global.fetch as any)
        .mockResolvedValueOnce(connectionTestResponse)
        .mockResolvedValueOnce(chatResponse);

      await customService.sendMessage('Test', mockChallengeContext);

      // Verify custom endpoint was used
      expect(global.fetch).toHaveBeenCalledWith(
        'http://custom-endpoint:8080/v1/models',
        expect.any(Object)
      );
      
      expect(global.fetch).toHaveBeenCalledWith(
        'http://custom-endpoint:8080/v1/chat/completions',
        expect.objectContaining({
          body: expect.stringContaining('"model":"custom-model"')
        })
      );
    });
  });

  describe('Request delay mechanism', () => {
    it('should apply request delay when configured', async () => {
      const delayConfig: AIServiceConfig = {
        mode: 'local',
        provider: 'kiro',
        requestDelay: 1000
      };
      
      const delayService = new AIService(delayConfig);
      const startTime = Date.now();
      
      // Mock Kiro environment
      (global as any).window = {
        kiro: {
          ai: {
            chat: vi.fn().mockResolvedValue({
              success: true,
              message: 'Delayed response'
            })
          }
        }
      };

      await delayService.sendMessage('Test', mockChallengeContext);
      
      const elapsed = Date.now() - startTime;
      expect(elapsed).toBeGreaterThanOrEqual(950); // Allow some tolerance
      
      // Cleanup
      delete (global as any).window;
    });

    it('should not apply delay when requestDelay is 0', async () => {
      const noDelayConfig: AIServiceConfig = {
        mode: 'local',
        provider: 'kiro',
        requestDelay: 0
      };
      
      const noDelayService = new AIService(noDelayConfig);
      const startTime = Date.now();
      
      // Mock Kiro environment
      (global as any).window = {
        kiro: {
          ai: {
            chat: vi.fn().mockResolvedValue({
              success: true,
              message: 'Immediate response'
            })
          }
        }
      };

      await noDelayService.sendMessage('Test', mockChallengeContext);
      
      const elapsed = Date.now() - startTime;
      expect(elapsed).toBeLessThan(100); // Should be very fast
      
      // Cleanup
      delete (global as any).window;
    });
  });

  describe('Enhanced OpenRouter Integration', () => {
    let openRouterService: AIService;

    beforeEach(() => {
      const openRouterConfig: AIServiceConfig = {
        mode: 'cloud',
        provider: 'openrouter',
        apiKey: 'test-openrouter-key',
        baseUrl: 'https://openrouter.ai/api/v1/chat/completions',
        requestDelay: 500,
        openRouter: {
          useCase: 'coding',
          enableFallback: true,
          maxRetries: 3,
          retryDelay: 1000
        }
      };
      openRouterService = new AIService(openRouterConfig);
    });

    it('should try preferred models in order and succeed with first available', async () => {
      const successResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          choices: [{
            message: {
              content: 'Response from preferred model'
            }
          }]
        })
      };
      
      (global.fetch as any).mockResolvedValue(successResponse);

      const result = await openRouterService.sendMessage(
        'Help me refactor this code',
        mockChallengeContext,
        'user-123'
      );

      expect(result.success).toBe(true);
      expect(result.message?.content).toBe('Response from preferred model');
      expect(result.message?.context?.modelUsed).toBeDefined();
      
      // Should only call once since first model succeeded
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should fallback to next model when first model fails', async () => {
      const failureResponse = {
        ok: false,
        status: 402,
        json: vi.fn().mockResolvedValue({
          error: { message: 'Model requires payment' }
        })
      };
      
      const successResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          choices: [{
            message: {
              content: 'Response from fallback model'
            }
          }]
        })
      };
      
      (global.fetch as any)
        .mockResolvedValueOnce(failureResponse) // First model fails
        .mockResolvedValueOnce(successResponse); // Second model succeeds

      const result = await openRouterService.sendMessage(
        'Help me with testing',
        mockChallengeContext,
        'user-123'
      );

      expect(result.success).toBe(true);
      expect(result.message?.content).toBe('Response from fallback model');
      
      // Should have tried 2 models
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should handle rate limiting with proper delays', async () => {
      const rateLimitResponse = {
        ok: false,
        status: 429,
        json: vi.fn().mockResolvedValue({
          error: { message: 'Rate limit exceeded' }
        })
      };
      
      const successResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          choices: [{
            message: {
              content: 'Response after rate limit'
            }
          }]
        })
      };
      
      (global.fetch as any)
        .mockResolvedValueOnce(rateLimitResponse) // Rate limited
        .mockResolvedValueOnce(successResponse); // Success after delay

      const startTime = Date.now();
      
      const result = await openRouterService.sendMessage(
        'Test rate limiting',
        mockChallengeContext
      );

      const elapsed = Date.now() - startTime;
      
      expect(result.success).toBe(true);
      expect(result.message?.content).toBe('Response after rate limit');
      
      // Should have applied delay between attempts (500ms request delay + retry delay)
      expect(elapsed).toBeGreaterThanOrEqual(1000);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should handle model unavailability errors', async () => {
      const modelUnavailableResponse = {
        ok: false,
        status: 400,
        json: vi.fn().mockResolvedValue({
          error: { message: 'Model not available' }
        })
      };
      
      const successResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          choices: [{
            message: {
              content: 'Response from available model'
            }
          }]
        })
      };
      
      (global.fetch as any)
        .mockResolvedValueOnce(modelUnavailableResponse) // Model unavailable
        .mockResolvedValueOnce(successResponse); // Fallback succeeds

      const result = await openRouterService.sendMessage(
        'Test model fallback',
        mockChallengeContext
      );

      expect(result.success).toBe(true);
      expect(result.message?.content).toBe('Response from available model');
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should fail when all preferred models are unavailable', async () => {
      const failureResponse = {
        ok: false,
        status: 402,
        json: vi.fn().mockResolvedValue({
          error: { message: 'Model requires payment' }
        })
      };
      
      // Mock all models to fail
      (global.fetch as any).mockResolvedValue(failureResponse);

      const result = await openRouterService.sendMessage(
        'Test all models fail',
        mockChallengeContext
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('All OpenRouter models failed');
      
      // Should have tried multiple models
      expect(global.fetch).toHaveBeenCalledTimes(7); // Default number of preferred models
    });

    it('should handle request timeouts', async () => {
      // Mock timeout by never resolving
      (global.fetch as any).mockImplementation(() => new Promise(() => {}));

      const result = await openRouterService.sendMessage(
        'Test timeout',
        mockChallengeContext
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Request timeout');
    });

    it('should include cost optimization parameters in requests', async () => {
      const successResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          choices: [{
            message: {
              content: 'Optimized response'
            }
          }]
        })
      };
      
      (global.fetch as any).mockResolvedValue(successResponse);

      await openRouterService.sendMessage(
        'Test cost optimization',
        mockChallengeContext
      );

      const callArgs = (global.fetch as any).mock.calls[0][1];
      const requestBody = JSON.parse(callArgs.body);
      
      expect(requestBody.top_p).toBe(0.9);
      expect(requestBody.frequency_penalty).toBe(0.1);
      expect(requestBody.presence_penalty).toBe(0.1);
      expect(requestBody.temperature).toBe(0.7);
      expect(requestBody.max_tokens).toBe(1000);
    });

    it('should use custom preferred models when configured', async () => {
      const customConfig: AIServiceConfig = {
        mode: 'cloud',
        provider: 'openrouter',
        apiKey: 'test-key',
        openRouter: {
          preferredModels: ['custom/model-1', 'custom/model-2'],
          enableFallback: true,
          maxRetries: 2
        }
      };
      
      const customService = new AIService(customConfig);
      
      const failureResponse = {
        ok: false,
        status: 402,
        json: vi.fn().mockResolvedValue({ error: { message: 'Payment required' } })
      };
      
      const successResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          choices: [{ message: { content: 'Custom model response' } }]
        })
      };
      
      (global.fetch as any)
        .mockResolvedValueOnce(failureResponse) // First custom model fails
        .mockResolvedValueOnce(successResponse); // Second custom model succeeds

      const result = await customService.sendMessage('Test custom models', mockChallengeContext);

      expect(result.success).toBe(true);
      expect(result.message?.content).toBe('Custom model response');
      
      // Verify the correct models were tried
      const firstCall = (global.fetch as any).mock.calls[0][1];
      const firstRequestBody = JSON.parse(firstCall.body);
      expect(firstRequestBody.model).toBe('custom/model-1');
      
      const secondCall = (global.fetch as any).mock.calls[1][1];
      const secondRequestBody = JSON.parse(secondCall.body);
      expect(secondRequestBody.model).toBe('custom/model-2');
    });

    it('should prioritize configured model over preferred models', async () => {
      const configWithSpecificModel: AIServiceConfig = {
        mode: 'cloud',
        provider: 'openrouter',
        apiKey: 'test-key',
        model: 'specific/configured-model',
        openRouter: {
          useCase: 'coding',
          enableFallback: true
        }
      };
      
      const specificModelService = new AIService(configWithSpecificModel);
      
      const successResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          choices: [{ message: { content: 'Configured model response' } }]
        })
      };
      
      (global.fetch as any).mockResolvedValue(successResponse);

      await specificModelService.sendMessage('Test specific model', mockChallengeContext);

      const callArgs = (global.fetch as any).mock.calls[0][1];
      const requestBody = JSON.parse(callArgs.body);
      
      // Should use the specifically configured model first
      expect(requestBody.model).toBe('specific/configured-model');
    });
  });

  describe('Provider selection logic', () => {
    it('should use kiro provider by default in local mode', async () => {
      const defaultConfig: AIServiceConfig = {
        mode: 'local'
        // No provider specified
      };
      
      const defaultService = new AIService(defaultConfig);
      
      // Mock Kiro environment
      (global as any).window = {
        kiro: {
          ai: {
            chat: vi.fn().mockResolvedValue({
              success: true,
              message: 'Kiro response'
            })
          }
        }
      };

      const result = await defaultService.sendMessage('Test', mockChallengeContext);
      
      expect(result.success).toBe(true);
      expect(result.message?.content).toBe('Kiro response');
      expect((global as any).window.kiro.ai.chat).toHaveBeenCalled();
      
      // Cleanup
      delete (global as any).window;
    });

    it('should use openrouter provider by default in cloud mode', async () => {
      const cloudConfig: AIServiceConfig = {
        mode: 'cloud',
        apiKey: 'test-key'
        // No provider specified
      };
      
      const cloudService = new AIService(cloudConfig);
      
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          choices: [{ message: { content: 'OpenRouter response' } }]
        })
      };
      
      (global.fetch as any).mockResolvedValue(mockResponse);

      const result = await cloudService.sendMessage('Test', mockChallengeContext);
      
      expect(result.success).toBe(true);
      expect(result.message?.content).toBe('OpenRouter response');
    });

    it('should throw error for unknown provider', async () => {
      const invalidConfig: AIServiceConfig = {
        mode: 'local',
        provider: 'unknown-provider' as any
      };
      
      const invalidService = new AIService(invalidConfig);

      const result = await invalidService.sendMessage('Test', mockChallengeContext);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown AI provider: unknown-provider');
    });
  });
});

describe('AIService factory functions', () => {
  it('should create and return AI service instance', () => {
    const config: AIServiceConfig = {
      mode: 'local'
    };

    const service = createAIService(config);
    expect(service).toBeInstanceOf(AIService);
  });

  it('should create Local LLM service with defaults', () => {
    const service = createLocalLLMAIService();
    expect(service).toBeInstanceOf(AIService);
  });

  it('should create Local LLM service with custom endpoint', () => {
    const service = createLocalLLMAIService('http://custom:8080/v1', 'custom-model');
    expect(service).toBeInstanceOf(AIService);
  });

  it('should create OpenRouter service with enhanced options', () => {
    const service = createOpenRouterAIService('test-key', 'test-model', {
      useCase: 'coding',
      enableFallback: true,
      maxRetries: 5
    });
    expect(service).toBeInstanceOf(AIService);
  });

  it('should create free tier optimized OpenRouter service', () => {
    const service = createFreeOpenRouterAIService('test-key');
    expect(service).toBeInstanceOf(AIService);
  });

  it('should create coding-focused OpenRouter service', () => {
    const service = createCodingOpenRouterAIService('test-key');
    expect(service).toBeInstanceOf(AIService);
  });

  it('should auto-initialize service when getting without creation', () => {
    const service = createAIService(); // Should use default config
    expect(service).toBeInstanceOf(AIService);
  });
});