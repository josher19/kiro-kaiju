/**
 * AI Configuration Utility
 * 
 * Handles environment-based configuration for AI providers
 * including Local LLM, OpenRouter, and Kiro AI settings
 */

import type { AIServiceConfig } from '@/services/aiService';

export interface EnvironmentConfig {
  // Local LLM Configuration
  LOCAL_LLM_ENDPOINT?: string;
  LOCAL_LLM_MODEL?: string;
  LOCAL_LLM_TIMEOUT?: string;
  LOCAL_LLM_MAX_RETRIES?: string;
  
  // OpenRouter Configuration
  OPENROUTER_API_KEY?: string;
  OPENROUTER_MODEL?: string;
  OPENROUTER_BASE_URL?: string;
  
  // General AI Configuration
  AI_PROVIDER?: 'kiro' | 'local-llm' | 'openrouter';
  AI_REQUEST_DELAY?: string;
  AI_MODE?: 'local' | 'cloud';
}

/**
 * Get environment configuration with fallbacks
 */
export function getEnvironmentConfig(testEnv?: any): EnvironmentConfig {
  // Use test environment if provided (for testing)
  if (testEnv) {
    return {
      LOCAL_LLM_ENDPOINT: testEnv.VITE_LOCAL_LLM_ENDPOINT,
      LOCAL_LLM_MODEL: testEnv.VITE_LOCAL_LLM_MODEL,
      LOCAL_LLM_TIMEOUT: testEnv.VITE_LOCAL_LLM_TIMEOUT,
      LOCAL_LLM_MAX_RETRIES: testEnv.VITE_LOCAL_LLM_MAX_RETRIES,
      OPENROUTER_API_KEY: testEnv.VITE_OPENROUTER_API_KEY,
      OPENROUTER_MODEL: testEnv.VITE_OPENROUTER_MODEL,
      OPENROUTER_BASE_URL: testEnv.VITE_OPENROUTER_BASE_URL,
      AI_PROVIDER: testEnv.VITE_AI_PROVIDER as any,
      AI_REQUEST_DELAY: testEnv.VITE_AI_REQUEST_DELAY,
      AI_MODE: testEnv.VITE_AI_MODE as any
    };
  }
  
  // Check for test environment first (when import.meta is mocked)
  if (typeof globalThis !== 'undefined' && 
      (globalThis as any).import && 
      (globalThis as any).import.meta && 
      (globalThis as any).import.meta.env) {
    const env = (globalThis as any).import.meta.env;
    return {
      LOCAL_LLM_ENDPOINT: env.VITE_LOCAL_LLM_ENDPOINT,
      LOCAL_LLM_MODEL: env.VITE_LOCAL_LLM_MODEL,
      LOCAL_LLM_TIMEOUT: env.VITE_LOCAL_LLM_TIMEOUT,
      LOCAL_LLM_MAX_RETRIES: env.VITE_LOCAL_LLM_MAX_RETRIES,
      OPENROUTER_API_KEY: env.VITE_OPENROUTER_API_KEY,
      OPENROUTER_MODEL: env.VITE_OPENROUTER_MODEL,
      OPENROUTER_BASE_URL: env.VITE_OPENROUTER_BASE_URL,
      AI_PROVIDER: env.VITE_AI_PROVIDER as any,
      AI_REQUEST_DELAY: env.VITE_AI_REQUEST_DELAY,
      AI_MODE: env.VITE_AI_MODE as any
    };
  }
  
  // In browser environment, use import.meta.env
  try {
    if (import.meta && import.meta.env) {
      return {
        LOCAL_LLM_ENDPOINT: import.meta.env.VITE_LOCAL_LLM_ENDPOINT,
        LOCAL_LLM_MODEL: import.meta.env.VITE_LOCAL_LLM_MODEL,
        LOCAL_LLM_TIMEOUT: import.meta.env.VITE_LOCAL_LLM_TIMEOUT,
        LOCAL_LLM_MAX_RETRIES: import.meta.env.VITE_LOCAL_LLM_MAX_RETRIES,
        OPENROUTER_API_KEY: import.meta.env.VITE_OPENROUTER_API_KEY,
        OPENROUTER_MODEL: import.meta.env.VITE_OPENROUTER_MODEL,
        OPENROUTER_BASE_URL: import.meta.env.VITE_OPENROUTER_BASE_URL,
        AI_PROVIDER: import.meta.env.VITE_AI_PROVIDER as any,
        AI_REQUEST_DELAY: import.meta.env.VITE_AI_REQUEST_DELAY,
        AI_MODE: import.meta.env.VITE_AI_MODE as any
      };
    }
  } catch (error) {
    // import.meta might not be available in all environments
    console.warn('import.meta.env not available:', error);
  }
  
  // Fallback to empty config if environment is not available
  return {};
}

/**
 * Create AI service configuration from environment variables
 */
export function createAIConfigFromEnvironment(testEnv?: any): AIServiceConfig {
  const env = getEnvironmentConfig(testEnv);
  
  // Determine mode - default to 'local' for Kiro IDE integration
  const mode = env.AI_MODE || 'local';
  
  // Determine provider based on environment or mode
  let provider = env.AI_PROVIDER;
  if (!provider) {
    // Auto-detect provider based on available configuration
    if (env.OPENROUTER_API_KEY) {
      provider = 'openrouter';
    } else if (env.LOCAL_LLM_ENDPOINT) {
      provider = 'local-llm';
    } else {
      provider = mode === 'local' ? 'kiro' : 'openrouter';
    }
  }
  
  const config: AIServiceConfig = {
    mode,
    provider,
    requestDelay: env.AI_REQUEST_DELAY ? parseInt(env.AI_REQUEST_DELAY, 10) : 1000
  };
  
  // Configure Local LLM settings
  if (provider === 'local-llm' || env.LOCAL_LLM_ENDPOINT) {
    config.localLLM = {
      endpoint: env.LOCAL_LLM_ENDPOINT || 'http://localhost:1234/v1',
      model: env.LOCAL_LLM_MODEL || 'local-model',
      timeout: env.LOCAL_LLM_TIMEOUT ? parseInt(env.LOCAL_LLM_TIMEOUT, 10) : 30000,
      maxRetries: env.LOCAL_LLM_MAX_RETRIES ? parseInt(env.LOCAL_LLM_MAX_RETRIES, 10) : 3
    };
  }
  
  // Configure OpenRouter settings
  if (provider === 'openrouter') {
    config.apiKey = env.OPENROUTER_API_KEY;
    config.baseUrl = env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1/chat/completions';
    config.model = env.OPENROUTER_MODEL || 'openai/gpt-oss-20b';
  }
  
  return config;
}

/**
 * Validate AI configuration
 */
export function validateAIConfig(config: AIServiceConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Validate provider-specific requirements
  switch (config.provider) {
    case 'local-llm':
      if (!config.localLLM?.endpoint) {
        errors.push('Local LLM endpoint is required when using local-llm provider');
      } else {
        // Validate endpoint URL format
        try {
          new URL(config.localLLM.endpoint);
        } catch {
          errors.push('Local LLM endpoint must be a valid URL');
        }
      }
      break;
      
    case 'openrouter':
      if (!config.apiKey) {
        errors.push('OpenRouter API key is required when using openrouter provider');
      }
      if (config.baseUrl) {
        try {
          new URL(config.baseUrl);
        } catch {
          errors.push('OpenRouter base URL must be a valid URL');
        }
      }
      break;
      
    case 'kiro':
      // Kiro provider doesn't require additional configuration
      break;
      
    default:
      errors.push(`Unknown AI provider: ${config.provider}`);
  }
  
  // Validate request delay
  if (config.requestDelay !== undefined && (config.requestDelay < 0 || config.requestDelay > 10000)) {
    errors.push('Request delay must be between 0 and 10000 milliseconds');
  }
  
  // Validate local LLM timeout
  if (config.localLLM?.timeout !== undefined && (config.localLLM.timeout < 1000 || config.localLLM.timeout > 120000)) {
    errors.push('Local LLM timeout must be between 1000 and 120000 milliseconds');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Get recommended models for different providers
 */
export function getRecommendedModels(): Record<string, string[]> {
  return {
    'openrouter': [
      'openai/gpt-oss-20b',
      'anthropic/claude-3-haiku',
      'anthropic/claude-3-sonnet',
      'meta-llama/codellama-34b-instruct',
      'codellama/codellama-70b-instruct',
      'microsoft/wizardcoder-34b'
    ],
    'local-llm': [
      'local-model',
      'codellama',
      'deepseek-coder',
      'starcoder',
      'wizardcoder'
    ]
  };
}

/**
 * Create development configuration for testing
 */
export function createDevelopmentConfig(): AIServiceConfig {
  return {
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
}

/**
 * Create production configuration
 */
export function createProductionConfig(apiKey?: string): AIServiceConfig {
  return {
    mode: 'cloud',
    provider: 'openrouter',
    apiKey: apiKey || process.env.OPENROUTER_API_KEY,
    baseUrl: 'https://openrouter.ai/api/v1/chat/completions',
    model: 'openai/gpt-oss-20b',
    requestDelay: 1000
  };
}