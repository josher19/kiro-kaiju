/**
 * Error Handler Tests
 * 
 * Comprehensive tests for error handling, categorization, and recovery
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { 
  ErrorHandler, 
  ErrorCategory, 
  ErrorSeverity, 
  handleError, 
  handleAsyncError,
  type AppError 
} from '../errorHandler';

describe('ErrorHandler', () => {
  let errorHandler: ErrorHandler;
  let consoleErrorSpy: any;
  let consoleWarnSpy: any;

  beforeEach(() => {
    errorHandler = ErrorHandler.getInstance();
    errorHandler.clearErrorHistory();
    
    // Mock console methods
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Error Creation and Categorization', () => {
    it('should create AppError from Error object', () => {
      const originalError = new Error('Network connection failed');
      const appError = errorHandler.handle(originalError);

      expect(appError.category).toBe(ErrorCategory.NETWORK);
      expect(appError.severity).toBe(ErrorSeverity.MEDIUM);
      expect(appError.message).toBe('Network connection failed');
      expect(appError.recoverable).toBe(true);
      expect(appError.retryable).toBe(true);
      expect(appError.originalError).toBe(originalError);
    });

    it('should create AppError from string', () => {
      const appError = errorHandler.handle('Validation failed: invalid input');

      expect(appError.category).toBe(ErrorCategory.VALIDATION);
      expect(appError.severity).toBe(ErrorSeverity.LOW);
      expect(appError.message).toBe('Validation failed: invalid input');
      expect(appError.recoverable).toBe(false);
      expect(appError.retryable).toBe(false);
    });

    it('should categorize network errors correctly', () => {
      const networkErrors = [
        'Network timeout occurred',
        'Fetch request failed',
        'Connection refused',
        'NETWORK_ERROR'
      ];

      networkErrors.forEach(errorMessage => {
        const appError = errorHandler.handle(errorMessage);
        expect(appError.category).toBe(ErrorCategory.NETWORK);
        expect(appError.retryable).toBe(true);
      });
    });

    it('should categorize AI service errors correctly', () => {
      const aiErrors = [
        'OpenRouter API failed',
        'AI service unavailable',
        'Kiro AI integration error'
      ];

      aiErrors.forEach(errorMessage => {
        const appError = errorHandler.handle(errorMessage);
        expect(appError.category).toBe(ErrorCategory.AI_SERVICE);
        expect(appError.severity).toBe(ErrorSeverity.HIGH);
      });
    });

    it('should categorize validation errors correctly', () => {
      const validationErrors = [
        'Invalid input provided',
        'Validation failed',
        'VALIDATION_ERROR'
      ];

      validationErrors.forEach(errorMessage => {
        const appError = errorHandler.handle(errorMessage);
        expect(appError.category).toBe(ErrorCategory.VALIDATION);
        expect(appError.recoverable).toBe(false);
        expect(appError.retryable).toBe(false);
      });
    });
  });

  describe('Error Severity Assessment', () => {
    it('should assign critical severity for fatal errors', () => {
      const appError = errorHandler.handle('Critical system failure');
      expect(appError.severity).toBe(ErrorSeverity.CRITICAL);
    });

    it('should assign high severity for Kiro integration errors', () => {
      const appError = errorHandler.handle('Kiro IDE connection lost');
      expect(appError.severity).toBe(ErrorSeverity.HIGH);
    });

    it('should assign medium severity for network errors', () => {
      const appError = errorHandler.handle('Network timeout');
      expect(appError.severity).toBe(ErrorSeverity.MEDIUM);
    });

    it('should assign low severity for unknown errors', () => {
      const appError = errorHandler.handle('Something happened');
      expect(appError.severity).toBe(ErrorSeverity.LOW);
    });
  });

  describe('User Message Generation', () => {
    it('should generate user-friendly messages for different categories', () => {
      const testCases = [
        {
          error: 'Network connection failed',
          expectedMessage: 'Network connection issue. Please check your internet connection and try again.'
        },
        {
          error: 'Validation failed: invalid input',
          expectedMessage: 'Please check your input and try again.'
        },
        {
          error: 'Challenge generation failed',
          expectedMessage: 'Failed to generate challenge. Please try selecting different options.'
        },
        {
          error: 'Code evaluation error',
          expectedMessage: 'Failed to evaluate your code. Please try submitting again.'
        },
        {
          error: 'AI service unavailable',
          expectedMessage: 'AI assistant is temporarily unavailable. Please try again later.'
        }
      ];

      testCases.forEach(({ error, expectedMessage }) => {
        const appError = errorHandler.handle(error);
        expect(appError.userMessage).toBe(expectedMessage);
      });
    });
  });

  describe('Error History Management', () => {
    it('should maintain error history', () => {
      const error1 = errorHandler.handle('First error');
      const error2 = errorHandler.handle('Second error');

      const history = errorHandler.getErrorHistory();
      expect(history).toHaveLength(2);
      expect(history[0]).toBe(error1);
      expect(history[1]).toBe(error2);
    });

    it('should limit error history to 100 entries', () => {
      // Add 150 errors
      for (let i = 0; i < 150; i++) {
        errorHandler.handle(`Error ${i}`);
      }

      const history = errorHandler.getErrorHistory();
      expect(history).toHaveLength(100);
      expect(history[0].message).toBe('Error 50'); // First 50 should be removed
    });

    it('should filter errors by category', () => {
      errorHandler.handle('Network error');
      errorHandler.handle('Validation error');
      errorHandler.handle('Another network error');

      const networkErrors = errorHandler.getErrorsByCategory(ErrorCategory.NETWORK);
      const validationErrors = errorHandler.getErrorsByCategory(ErrorCategory.VALIDATION);

      expect(networkErrors).toHaveLength(2);
      expect(validationErrors).toHaveLength(1);
    });

    it('should filter errors by severity', () => {
      errorHandler.handle('Critical system failure');
      errorHandler.handle('Network timeout');
      errorHandler.handle('Minor issue');

      const criticalErrors = errorHandler.getErrorsBySeverity(ErrorSeverity.CRITICAL);
      const mediumErrors = errorHandler.getErrorsBySeverity(ErrorSeverity.MEDIUM);

      expect(criticalErrors).toHaveLength(1);
      expect(mediumErrors).toHaveLength(1);
    });

    it('should clear error history', () => {
      errorHandler.handle('Test error');
      expect(errorHandler.getErrorHistory()).toHaveLength(1);

      errorHandler.clearErrorHistory();
      expect(errorHandler.getErrorHistory()).toHaveLength(0);
    });
  });

  describe('Error Listeners', () => {
    it('should notify error listeners', () => {
      const listener = vi.fn();
      errorHandler.addErrorListener(listener);

      const appError = errorHandler.handle('Test error');
      expect(listener).toHaveBeenCalledWith(appError);
    });

    it('should remove error listeners', () => {
      const listener = vi.fn();
      errorHandler.addErrorListener(listener);
      errorHandler.removeErrorListener(listener);

      errorHandler.handle('Test error');
      expect(listener).not.toHaveBeenCalled();
    });

    it('should handle listener errors gracefully', () => {
      const faultyListener = vi.fn().mockImplementation(() => {
        throw new Error('Listener error');
      });
      
      errorHandler.addErrorListener(faultyListener);
      
      // Should not throw
      expect(() => {
        errorHandler.handle('Test error');
      }).not.toThrow();

      expect(consoleWarnSpy).toHaveBeenCalledWith('Error listener failed:', expect.any(Error));
    });
  });

  describe('Async Error Handling', () => {
    it('should handle successful async operations', async () => {
      const operation = vi.fn().mockResolvedValue('success');
      
      const result = await handleAsyncError(operation);
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry failed async operations', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockResolvedValue('success');

      const result = await handleAsyncError(operation, {}, { maxRetries: 3, retryDelay: 10 });
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should fail after max retries', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Persistent error'));

      await expect(
        handleAsyncError(operation, {}, { maxRetries: 2, retryDelay: 10 })
      ).rejects.toThrow();

      expect(operation).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('should not retry non-retryable errors', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Validation failed'));

      await expect(
        handleAsyncError(operation, {}, { maxRetries: 3, retryDelay: 10 })
      ).rejects.toThrow();

      expect(operation).toHaveBeenCalledTimes(1); // No retries for validation errors
    });

    it('should apply exponential backoff', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockResolvedValue('success');

      const startTime = Date.now();
      await handleAsyncError(operation, {}, { maxRetries: 2, retryDelay: 100 });
      const endTime = Date.now();

      // Should take at least 100ms (first retry) + 200ms (second retry) = 300ms
      expect(endTime - startTime).toBeGreaterThan(250);
    });
  });

  describe('Context and Options', () => {
    it('should include context in error', () => {
      const context = { userId: '123', action: 'test' };
      const appError = errorHandler.handle('Test error', context);

      expect(appError.context).toEqual(context);
    });

    it('should respect logging options', () => {
      errorHandler.handle('Test error', {}, { logToConsole: false });
      expect(consoleErrorSpy).not.toHaveBeenCalled();

      errorHandler.handle('Test error', {}, { logToConsole: true });
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('Convenience Functions', () => {
    it('should work with handleError function', () => {
      const appError = handleError('Test error');
      expect(appError.message).toBe('Test error');
    });

    it('should work with handleAsyncError function', async () => {
      const operation = vi.fn().mockResolvedValue('success');
      const result = await handleAsyncError(operation);
      expect(result).toBe('success');
    });
  });

  describe('Error Code Generation', () => {
    it('should generate unique error codes', () => {
      const error1 = errorHandler.handle('Network error');
      const error2 = errorHandler.handle('Network error');

      expect(error1.code).not.toBe(error2.code);
      expect(error1.code).toMatch(/^NETWORK_/);
      expect(error2.code).toMatch(/^NETWORK_/);
    });

    it('should generate unique error IDs', () => {
      const error1 = errorHandler.handle('Test error');
      const error2 = errorHandler.handle('Test error');

      expect(error1.id).not.toBe(error2.id);
      expect(error1.id).toMatch(/^error-/);
      expect(error2.id).toMatch(/^error-/);
    });
  });

  describe('Retryable Error Detection', () => {
    it('should identify retryable errors', () => {
      const retryableErrors = [
        'Network timeout',
        'Fetch failed',
        'Connection error',
        'Challenge generation failed'
      ];

      retryableErrors.forEach(errorMessage => {
        const appError = errorHandler.handle(errorMessage);
        expect(appError.retryable).toBe(true);
      });
    });

    it('should identify non-retryable errors', () => {
      const nonRetryableErrors = [
        'Validation failed',
        'Invalid input',
        'API key missing',
        'Unauthorized access'
      ];

      nonRetryableErrors.forEach(errorMessage => {
        const appError = errorHandler.handle(errorMessage);
        expect(appError.retryable).toBe(false);
      });
    });
  });
});