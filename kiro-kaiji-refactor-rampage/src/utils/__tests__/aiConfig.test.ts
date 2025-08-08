/**
 * AI Configuration Utility Tests
 * 
 * Tests for environment-based AI configuration including
 * Local LLM, OpenRouter, and Kiro AI settings
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  getEnvironmentConfig,
  createAIConfigFromEnvironment,
  validateAIConfig,
  getRecommendedModels,
  createDevelopmentConfig,
  createProductionConfig,
  type EnvironmentConfig
} from '../aiConfig';
import type { AIServiceConfig } from '@/services/aiService';

describe('aiConfig', () => {
  beforeEach(() => {
    // Clear any existing environment mocks
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    // Clean up globalThis mock
    delete (globalThis as any).import;
  });

  describe('getEnvironmentConfig', () => {
    it('should return environment variables when available', () => {
      const testEnv = {
        VITE_LOCAL_LLM_ENDPOINT: 'http://localhost:8080/v1',
        VITE_LOCAL_LLM_MODEL: 'test-model',
        VITE_LOCAL_LLM_TIMEOUT: '15000',
        VITE_LOCAL_LLM_MAX_RETRIES: '2',
        VITE_OPENROUTER_API_KEY: 'test-api-key',
        VITE_OPENROUTER_MODEL: 'test-openrouter-model',
        VITE_OPENROUTER_BASE_URL: 'https://test.openrouter.ai/v1',
        VITE_AI_PROVIDER: 'local-llm',
        VITE_AI_REQUEST_DELAY: '2000',
        VITE_AI_MODE: 'cloud'
      };

      const config = getEnvironmentConfig(testEnv);

      expect(config).toEqual({
        LOCAL_LLM_ENDPOINT: 'http://localhost:8080/v1',
        LOCAL_LLM_MODEL: 'test-model',
        LOCAL_LLM_TIMEOUT: '15000',
        LOCAL_LLM_MAX_RETRIES: '2',
        OPENROUTER_API_KEY: 'test-api-key',
        OPENROUTER_MODEL: 'test-openrouter-model',
        OPENROUTER_BASE_URL: 'https://test.openrouter.ai/v1',
        AI_PROVIDER: 'local-llm',
        AI_REQUEST_DELAY: '2000',
        AI_MODE: 'cloud'
      });
    });

    it('should return empty config when environment is not available', () => {
      // Don't mock import.meta.env
      const config = getEnvironmentConfig();
      expect(config).toEqual({});
    });

    it('should handle partial environment configuration', () => {
      const testEnv = {
        VITE_LOCAL_LLM_ENDPOINT: 'http://localhost:1234/v1',
        VITE_AI_MODE: 'local'
        // Other variables undefined
      };

      const config = getEnvironmentConfig(testEnv);

      expect(config.LOCAL_LLM_ENDPOINT).toBe('http://localhost:1234/v1');
      expect(config.AI_MODE).toBe('local');
      expect(config.OPENROUTER_API_KEY).toBeUndefined();
    });
  });

  describe('createAIConfigFromEnvironment', () => {
    it('should create config with default values when no environment variables', () => {
      const config = createAIConfigFromEnvironment();

      expect(config).toEqual({
        mode: 'local',
        provider: 'kiro',
        requestDelay: 1000
      });
    });

    it('should auto-detect OpenRouter provider when API key is available', () => {
      const testEnv = {
        VITE_OPENROUTER_API_KEY: 'test-key'
      };

      const config = createAIConfigFromEnvironment(testEnv);

      expect(config.provider).toBe('openrouter');
      expect(config.apiKey).toBe('test-key');
      expect(config.baseUrl).toBe('https://openrouter.ai/api/v1/chat/completions');
      expect(config.model).toBe('openai/gpt-oss-20b');
    });

    it('should auto-detect Local LLM provider when endpoint is available', () => {
      const testEnv = {
        VITE_LOCAL_LLM_ENDPOINT: 'http://localhost:8080/v1'
      };

      const config = createAIConfigFromEnvironment(testEnv);

      expect(config.provider).toBe('local-llm');
      expect(config.localLLM).toEqual({
        endpoint: 'http://localhost:8080/v1',
        model: 'local-model',
        timeout: 30000,
        maxRetries: 3
      });
    });

    it('should use explicit provider when specified', () => {
      const testEnv = {
        VITE_AI_PROVIDER: 'kiro',
        VITE_OPENROUTER_API_KEY: 'test-key' // This would normally auto-detect openrouter
      };

      const config = createAIConfigFromEnvironment(testEnv);

      expect(config.provider).toBe('kiro'); // Should use explicit provider
    });

    it('should configure Local LLM with custom settings', () => {
      const testEnv = {
        VITE_AI_PROVIDER: 'local-llm',
        VITE_LOCAL_LLM_ENDPOINT: 'http://custom:9000/v1',
        VITE_LOCAL_LLM_MODEL: 'custom-model',
        VITE_LOCAL_LLM_TIMEOUT: '45000',
        VITE_LOCAL_LLM_MAX_RETRIES: '5',
        VITE_AI_REQUEST_DELAY: '500'
      };

      const config = createAIConfigFromEnvironment(testEnv);

      expect(config.provider).toBe('local-llm');
      expect(config.requestDelay).toBe(500);
      expect(config.localLLM).toEqual({
        endpoint: 'http://custom:9000/v1',
        model: 'custom-model',
        timeout: 45000,
        maxRetries: 5
      });
    });

    it('should configure OpenRouter with custom settings', () => {
      const testEnv = {
        VITE_AI_PROVIDER: 'openrouter',
        VITE_OPENROUTER_API_KEY: 'custom-key',
        VITE_OPENROUTER_MODEL: 'anthropic/claude-3-sonnet',
        VITE_OPENROUTER_BASE_URL: 'https://custom.openrouter.ai/v1',
        VITE_AI_REQUEST_DELAY: '1500'
      };

      const config = createAIConfigFromEnvironment(testEnv);

      expect(config.provider).toBe('openrouter');
      expect(config.apiKey).toBe('custom-key');
      expect(config.model).toBe('anthropic/claude-3-sonnet');
      expect(config.baseUrl).toBe('https://custom.openrouter.ai/v1');
      expect(config.requestDelay).toBe(1500);
    });

    it('should handle cloud mode configuration', () => {
      const testEnv = {
        VITE_AI_MODE: 'cloud',
        VITE_OPENROUTER_API_KEY: 'cloud-key'
      };

      const config = createAIConfigFromEnvironment(testEnv);

      expect(config.mode).toBe('cloud');
      expect(config.provider).toBe('openrouter');
    });
  });

  describe('validateAIConfig', () => {
    it('should validate valid Kiro provider config', () => {
      const config: AIServiceConfig = {
        mode: 'local',
        provider: 'kiro',
        requestDelay: 1000
      };

      const result = validateAIConfig(config);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate valid Local LLM config', () => {
      const config: AIServiceConfig = {
        mode: 'local',
        provider: 'local-llm',
        localLLM: {
          endpoint: 'http://localhost:1234/v1',
          model: 'local-model',
          timeout: 30000,
          maxRetries: 3
        },
        requestDelay: 1000
      };

      const result = validateAIConfig(config);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate valid OpenRouter config', () => {
      const config: AIServiceConfig = {
        mode: 'cloud',
        provider: 'openrouter',
        apiKey: 'valid-api-key',
        baseUrl: 'https://openrouter.ai/api/v1/chat/completions',
        model: 'openai/gpt-oss-20b',
        requestDelay: 1000
      };

      const result = validateAIConfig(config);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject Local LLM config without endpoint', () => {
      const config: AIServiceConfig = {
        mode: 'local',
        provider: 'local-llm'
        // Missing localLLM.endpoint
      };

      const result = validateAIConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Local LLM endpoint is required when using local-llm provider');
    });

    it('should reject Local LLM config with invalid endpoint URL', () => {
      const config: AIServiceConfig = {
        mode: 'local',
        provider: 'local-llm',
        localLLM: {
          endpoint: 'invalid-url',
          model: 'local-model'
        }
      };

      const result = validateAIConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Local LLM endpoint must be a valid URL');
    });

    it('should reject OpenRouter config without API key', () => {
      const config: AIServiceConfig = {
        mode: 'cloud',
        provider: 'openrouter'
        // Missing apiKey
      };

      const result = validateAIConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('OpenRouter API key is required when using openrouter provider');
    });

    it('should reject OpenRouter config with invalid base URL', () => {
      const config: AIServiceConfig = {
        mode: 'cloud',
        provider: 'openrouter',
        apiKey: 'valid-key',
        baseUrl: 'invalid-url'
      };

      const result = validateAIConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('OpenRouter base URL must be a valid URL');
    });

    it('should reject unknown provider', () => {
      const config: AIServiceConfig = {
        mode: 'local',
        provider: 'unknown-provider' as any
      };

      const result = validateAIConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Unknown AI provider: unknown-provider');
    });

    it('should reject invalid request delay', () => {
      const config: AIServiceConfig = {
        mode: 'local',
        provider: 'kiro',
        requestDelay: -100 // Invalid negative delay
      };

      const result = validateAIConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Request delay must be between 0 and 10000 milliseconds');
    });

    it('should reject invalid Local LLM timeout', () => {
      const config: AIServiceConfig = {
        mode: 'local',
        provider: 'local-llm',
        localLLM: {
          endpoint: 'http://localhost:1234/v1',
          timeout: 500 // Too short
        }
      };

      const result = validateAIConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Local LLM timeout must be between 1000 and 120000 milliseconds');
    });

    it('should collect multiple validation errors', () => {
      const config: AIServiceConfig = {
        mode: 'local',
        provider: 'local-llm',
        requestDelay: 15000, // Too high
        localLLM: {
          endpoint: 'invalid-url',
          timeout: 200000 // Too high
        }
      };

      const result = validateAIConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(3);
      expect(result.errors).toContain('Local LLM endpoint must be a valid URL');
      expect(result.errors).toContain('Request delay must be between 0 and 10000 milliseconds');
      expect(result.errors).toContain('Local LLM timeout must be between 1000 and 120000 milliseconds');
    });
  });

  describe('getRecommendedModels', () => {
    it('should return recommended models for each provider', () => {
      const models = getRecommendedModels();

      expect(models).toHaveProperty('openrouter');
      expect(models).toHaveProperty('local-llm');

      expect(models.openrouter).toContain('openai/gpt-oss-20b');
      expect(models.openrouter).toContain('anthropic/claude-3-haiku');
      expect(models.openrouter).toContain('anthropic/claude-3-sonnet');

      expect(models['local-llm']).toContain('local-model');
      expect(models['local-llm']).toContain('codellama');
      expect(models['local-llm']).toContain('deepseek-coder');
    });

    it('should return arrays of strings', () => {
      const models = getRecommendedModels();

      Object.values(models).forEach(modelList => {
        expect(Array.isArray(modelList)).toBe(true);
        modelList.forEach(model => {
          expect(typeof model).toBe('string');
        });
      });
    });
  });

  describe('createDevelopmentConfig', () => {
    it('should create development configuration', () => {
      const config = createDevelopmentConfig();

      expect(config).toEqual({
        mode: 'local',
        provider: 'local-llm',
        requestDelay: 500,
        localLLM: {
          endpoint: 'http://localhost:1234/v1',
          model: 'local-model',
          timeout: 30000,
          maxRetries: 3
        }
      });
    });

    it('should create valid development configuration', () => {
      const config = createDevelopmentConfig();
      const validation = validateAIConfig(config);

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });
  });

  describe('createProductionConfig', () => {
    it('should create production configuration with provided API key', () => {
      const config = createProductionConfig('prod-api-key');

      expect(config).toEqual({
        mode: 'cloud',
        provider: 'openrouter',
        apiKey: 'prod-api-key',
        baseUrl: 'https://openrouter.ai/api/v1/chat/completions',
        model: 'openai/gpt-oss-20b',
        requestDelay: 1000
      });
    });

    it('should create production configuration without API key', () => {
      const config = createProductionConfig();

      expect(config.mode).toBe('cloud');
      expect(config.provider).toBe('openrouter');
      expect(config.apiKey).toBeUndefined();
      expect(config.baseUrl).toBe('https://openrouter.ai/api/v1/chat/completions');
      expect(config.model).toBe('openai/gpt-oss-20b');
      expect(config.requestDelay).toBe(1000);
    });

    it('should create valid production configuration', () => {
      const config = createProductionConfig('valid-key');
      const validation = validateAIConfig(config);

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });
  });
});