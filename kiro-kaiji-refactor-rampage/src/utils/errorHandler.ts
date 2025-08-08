/**
 * Error Handler Utility
 * 
 * Comprehensive error handling system with user-friendly messages,
 * error categorization, and recovery strategies
 */

import type { ApiError } from '@/types/api';

export enum ErrorCategory {
  NETWORK = 'network',
  VALIDATION = 'validation',
  GENERATION = 'generation',
  EVALUATION = 'evaluation',
  AI_SERVICE = 'ai_service',
  KIRO_INTEGRATION = 'kiro_integration',
  STORAGE = 'storage',
  UNKNOWN = 'unknown'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface AppError {
  id: string;
  code: string;
  category: ErrorCategory;
  message: string;
  severity: ErrorSeverity;
  recoverable: boolean;
  userMessage: string;
  timestamp: Date;
  context?: Record<string, any>;
  originalError?: Error;
  retryable: boolean;
  retryCount?: number;
  maxRetries?: number;
}

export interface ErrorHandlerOptions {
  showToUser?: boolean;
  logToConsole?: boolean;
  reportToService?: boolean;
  enableRetry?: boolean;
  maxRetries?: number;
  retryDelay?: number;
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorLog: AppError[] = [];
  private errorListeners: Array<(error: AppError) => void> = [];
  private retryQueue: Map<string, { error: AppError; retryFn: () => Promise<any>; options: ErrorHandlerOptions }> = new Map();

  private constructor() {}

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Handle an error with comprehensive processing
   */
  handle(
    error: Error | string | ApiError,
    context?: Record<string, any>,
    options: ErrorHandlerOptions = {}
  ): AppError {
    const appError = this.createAppError(error, context);
    
    // Add to error log
    this.errorLog.push(appError);
    
    // Keep only last 100 errors to prevent memory issues
    if (this.errorLog.length > 100) {
      this.errorLog.splice(0, this.errorLog.length - 100);
    }

    // Apply default options
    const finalOptions: ErrorHandlerOptions = {
      showToUser: true,
      logToConsole: true,
      reportToService: false,
      enableRetry: appError.retryable,
      maxRetries: 3,
      retryDelay: 1000,
      ...options
    };

    // Log to console if enabled
    if (finalOptions.logToConsole) {
      this.logToConsole(appError);
    }

    // Notify listeners
    this.notifyListeners(appError);

    // Report to service if enabled (for cloud mode)
    if (finalOptions.reportToService) {
      this.reportToService(appError);
    }

    return appError;
  }

  /**
   * Handle async operations with automatic retry logic
   */
  async handleAsync<T>(
    operation: () => Promise<T>,
    context?: Record<string, any>,
    options: ErrorHandlerOptions = {}
  ): Promise<T> {
    const maxRetries = options.maxRetries || 3;
    const retryDelay = options.retryDelay || 1000;
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        const appError = this.createAppError(error as Error, { 
          ...context, 
          attempt: attempt + 1,
          maxRetries: maxRetries + 1
        });

        // Don't retry on the last attempt or if not retryable
        if (attempt === maxRetries || !appError.retryable) {
          this.handle(appError.originalError || new Error(appError.message), context, { ...options, enableRetry: false });
          throw appError;
        }

        // Log retry attempt
        console.warn(`Operation failed, retrying in ${retryDelay}ms (attempt ${attempt + 1}/${maxRetries + 1}):`, error);

        // Wait before retry with exponential backoff
        await this.delay(retryDelay * Math.pow(2, attempt));
      }
    }

    throw lastError!;
  }

  /**
   * Create standardized AppError from various error types
   */
  private createAppError(
    error: Error | string | ApiError,
    context?: Record<string, any>
  ): AppError {
    const id = this.generateErrorId();
    const timestamp = new Date();

    // Handle ApiError
    if (this.isApiError(error)) {
      return {
        id,
        code: error.code,
        category: this.categorizeError(error.code, error.message),
        message: error.message,
        severity: error.severity as ErrorSeverity,
        recoverable: error.recoverable,
        userMessage: error.userMessage,
        timestamp,
        context,
        retryable: this.isRetryable(error.code, error.message),
        retryCount: 0,
        maxRetries: 3
      };
    }

    // Handle Error object
    if (error instanceof Error) {
      const category = this.categorizeError('', error.message);
      return {
        id,
        code: this.generateErrorCode(error.name, category),
        category,
        message: error.message,
        severity: this.determineSeverity(error.message, category),
        recoverable: this.isRecoverable(error.message, category),
        userMessage: this.generateUserMessage(error.message, category),
        timestamp,
        context,
        originalError: error,
        retryable: this.isRetryable('', error.message),
        retryCount: 0,
        maxRetries: 3
      };
    }

    // Handle string error
    const category = this.categorizeError('', error);
    return {
      id,
      code: this.generateErrorCode('GenericError', category),
      category,
      message: error,
      severity: this.determineSeverity(error, category),
      recoverable: this.isRecoverable(error, category),
      userMessage: this.generateUserMessage(error, category),
      timestamp,
      context,
      retryable: this.isRetryable('', error),
      retryCount: 0,
      maxRetries: 3
    };
  }

  /**
   * Categorize error based on code and message
   */
  private categorizeError(code: string, message: string): ErrorCategory {
    const lowerMessage = message.toLowerCase();
    const lowerCode = code.toLowerCase();

    if (lowerMessage.includes('network') || lowerMessage.includes('fetch') || 
        lowerMessage.includes('timeout') || lowerCode.includes('network')) {
      return ErrorCategory.NETWORK;
    }

    if (lowerMessage.includes('validation') || lowerMessage.includes('invalid') ||
        lowerCode.includes('validation')) {
      return ErrorCategory.VALIDATION;
    }

    if (lowerMessage.includes('generation') || lowerMessage.includes('challenge') ||
        lowerCode.includes('generation')) {
      return ErrorCategory.GENERATION;
    }

    if (lowerMessage.includes('evaluation') || lowerMessage.includes('scoring') ||
        lowerCode.includes('evaluation')) {
      return ErrorCategory.EVALUATION;
    }

    if (lowerMessage.includes('ai') || lowerMessage.includes('openrouter') ||
        lowerCode.includes('ai')) {
      return ErrorCategory.AI_SERVICE;
    }

    if (lowerMessage.includes('kiro') || lowerMessage.includes('ide') ||
        lowerCode.includes('kiro')) {
      return ErrorCategory.KIRO_INTEGRATION;
    }

    if (lowerMessage.includes('storage') || lowerMessage.includes('localstorage') ||
        lowerCode.includes('storage')) {
      return ErrorCategory.STORAGE;
    }

    return ErrorCategory.UNKNOWN;
  }

  /**
   * Determine error severity
   */
  private determineSeverity(message: string, category: ErrorCategory): ErrorSeverity {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('critical') || lowerMessage.includes('fatal')) {
      return ErrorSeverity.CRITICAL;
    }

    if (category === ErrorCategory.KIRO_INTEGRATION || 
        category === ErrorCategory.AI_SERVICE) {
      return ErrorSeverity.HIGH;
    }

    if (category === ErrorCategory.NETWORK || 
        category === ErrorCategory.GENERATION ||
        category === ErrorCategory.EVALUATION) {
      return ErrorSeverity.MEDIUM;
    }

    return ErrorSeverity.LOW;
  }

  /**
   * Check if error is recoverable
   */
  private isRecoverable(message: string, category: ErrorCategory): boolean {
    const lowerMessage = message.toLowerCase();

    // Non-recoverable errors
    if (lowerMessage.includes('fatal') || lowerMessage.includes('critical')) {
      return false;
    }

    // Validation errors are usually not recoverable without user action
    if (category === ErrorCategory.VALIDATION) {
      return false;
    }

    // Most other errors are recoverable
    return true;
  }

  /**
   * Check if error is retryable
   */
  private isRetryable(code: string, message: string): boolean {
    const lowerMessage = message.toLowerCase();
    const lowerCode = code.toLowerCase();

    // Network errors are usually retryable
    if (lowerMessage.includes('network') || lowerMessage.includes('timeout') ||
        lowerMessage.includes('fetch') || lowerCode.includes('network')) {
      return true;
    }

    // AI service errors might be retryable
    if (lowerMessage.includes('ai') || lowerMessage.includes('openrouter')) {
      return !lowerMessage.includes('api key') && !lowerMessage.includes('unauthorized');
    }

    // Generation errors might be retryable
    if (lowerMessage.includes('generation') || lowerMessage.includes('challenge')) {
      return true;
    }

    // Validation errors are not retryable
    if (lowerMessage.includes('validation') || lowerMessage.includes('invalid')) {
      return false;
    }

    return false;
  }

  /**
   * Generate user-friendly error message
   */
  private generateUserMessage(message: string, category: ErrorCategory): string {
    switch (category) {
      case ErrorCategory.NETWORK:
        return 'Network connection issue. Please check your internet connection and try again.';
      
      case ErrorCategory.VALIDATION:
        return 'Please check your input and try again.';
      
      case ErrorCategory.GENERATION:
        return 'Failed to generate challenge. Please try selecting different options.';
      
      case ErrorCategory.EVALUATION:
        return 'Failed to evaluate your code. Please try submitting again.';
      
      case ErrorCategory.AI_SERVICE:
        return 'AI assistant is temporarily unavailable. Please try again later.';
      
      case ErrorCategory.KIRO_INTEGRATION:
        return 'Kiro IDE integration issue. Some features may be limited.';
      
      case ErrorCategory.STORAGE:
        return 'Failed to save data. Your progress may not be saved.';
      
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  /**
   * Generate error code
   */
  private generateErrorCode(errorName: string, category: ErrorCategory): string {
    const timestamp = Date.now().toString().slice(-6);
    return `${category.toUpperCase()}_${errorName.toUpperCase()}_${timestamp}`;
  }

  /**
   * Generate unique error ID
   */
  private generateErrorId(): string {
    return `error-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Check if error is ApiError
   */
  private isApiError(error: any): error is ApiError {
    return error && typeof error === 'object' && 
           'code' in error && 'message' in error && 'severity' in error;
  }

  /**
   * Log error to console with formatting
   */
  private logToConsole(error: AppError): void {
    const style = this.getConsoleStyle(error.severity);
    
    console.group(`%c[${error.severity.toUpperCase()}] ${error.category}`, style);
    console.log('Code:', error.code);
    console.log('Message:', error.message);
    console.log('User Message:', error.userMessage);
    console.log('Timestamp:', error.timestamp.toISOString());
    
    if (error.context) {
      console.log('Context:', error.context);
    }
    
    if (error.originalError) {
      console.log('Original Error:', error.originalError);
    }
    
    console.groupEnd();
  }

  /**
   * Get console style for error severity
   */
  private getConsoleStyle(severity: ErrorSeverity): string {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        return 'color: white; background-color: #dc2626; font-weight: bold; padding: 2px 4px;';
      case ErrorSeverity.HIGH:
        return 'color: white; background-color: #ea580c; font-weight: bold; padding: 2px 4px;';
      case ErrorSeverity.MEDIUM:
        return 'color: black; background-color: #facc15; font-weight: bold; padding: 2px 4px;';
      case ErrorSeverity.LOW:
        return 'color: white; background-color: #3b82f6; font-weight: bold; padding: 2px 4px;';
      default:
        return 'color: black; background-color: #e5e7eb; font-weight: bold; padding: 2px 4px;';
    }
  }

  /**
   * Report error to external service (for cloud mode)
   */
  private async reportToService(error: AppError): Promise<void> {
    try {
      // Only report in production and cloud mode
      if (typeof window !== 'undefined' && import.meta.env?.MODE !== 'production') {
        return;
      }

      // Implement error reporting to external service
      // This would typically send to a service like Sentry, LogRocket, etc.
      console.log('Would report error to service:', error);
    } catch (reportError) {
      console.warn('Failed to report error to service:', reportError);
    }
  }

  /**
   * Add error listener
   */
  addErrorListener(listener: (error: AppError) => void): void {
    this.errorListeners.push(listener);
  }

  /**
   * Remove error listener
   */
  removeErrorListener(listener: (error: AppError) => void): void {
    const index = this.errorListeners.indexOf(listener);
    if (index > -1) {
      this.errorListeners.splice(index, 1);
    }
  }

  /**
   * Notify all error listeners
   */
  private notifyListeners(error: AppError): void {
    this.errorListeners.forEach(listener => {
      try {
        listener(error);
      } catch (listenerError) {
        console.warn('Error listener failed:', listenerError);
      }
    });
  }

  /**
   * Get error history
   */
  getErrorHistory(): AppError[] {
    return [...this.errorLog];
  }

  /**
   * Clear error history
   */
  clearErrorHistory(): void {
    this.errorLog = [];
  }

  /**
   * Get errors by category
   */
  getErrorsByCategory(category: ErrorCategory): AppError[] {
    return this.errorLog.filter(error => error.category === category);
  }

  /**
   * Get errors by severity
   */
  getErrorsBySeverity(severity: ErrorSeverity): AppError[] {
    return this.errorLog.filter(error => error.severity === severity);
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance();

// Convenience functions
export function handleError(
  error: Error | string | ApiError,
  context?: Record<string, any>,
  options?: ErrorHandlerOptions
): AppError {
  return errorHandler.handle(error, context, options);
}

export async function handleAsyncError<T>(
  operation: () => Promise<T>,
  context?: Record<string, any>,
  options?: ErrorHandlerOptions
): Promise<T> {
  return errorHandler.handleAsync(operation, context, options);
}