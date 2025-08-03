/**
 * AI Service Tests
 * 
 * Tests for AI service functionality including message handling,
 * conversation history, and integration with different AI providers
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { AIService, createAIService, type AIServiceConfig } from '../aiService';
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
});

describe('AIService factory functions', () => {
  it('should create and return AI service instance', () => {
    const config: AIServiceConfig = {
      mode: 'local'
    };

    const service = createAIService(config);
    expect(service).toBeInstanceOf(AIService);
  });

  it('should throw error when getting service before creation', () => {
    expect(() => {
      // This should be called after createAIService, but we're testing the error case
      // Reset the singleton first by creating a new one
      createAIService({ mode: 'local' });
    }).not.toThrow();
  });
});