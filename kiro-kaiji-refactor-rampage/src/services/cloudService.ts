import axios, { type AxiosInstance } from 'axios';
import type { Challenge, UserProgress, AIGradingRequest, AIGradingResponse } from '../types';

export interface CloudConfig {
  apiBaseUrl: string;
  sessionToken?: string;
  userId?: string;
}

export interface BudgetStatus {
  currentSpending: number;
  budgetLimit: number;
  percentageUsed: number;
  status: 'ok' | 'warning' | 'critical' | 'exceeded';
  alertLevel: number;
  remainingBudget: number;
  isShutdownRequired: boolean;
}

export interface BudgetConstraints {
  shouldBlock: boolean;
  budgetStatus: BudgetStatus;
  fallbackOptions: {
    switchToLocalMode: boolean;
    requireOpenRouterKey: boolean;
    disableAIFeatures: boolean;
  };
}

export class CloudService {
  private api: AxiosInstance;
  private config: CloudConfig;

  constructor(config: CloudConfig) {
    this.config = config;
    this.api = axios.create({
      baseURL: config.apiBaseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Add request interceptor for authentication
    this.api.interceptors.request.use((config) => {
      if (this.config.sessionToken) {
        config.headers.Authorization = `Bearer ${this.config.sessionToken}`;
      }
      return config;
    });

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('Cloud service error:', error);
        if (error.response?.status === 401) {
          // Handle authentication errors
          this.clearSession();
        } else if (error.response?.status === 429) {
          // Handle budget limit exceeded
          const errorData = error.response.data;
          if (errorData.reason?.includes('budget')) {
            this.handleBudgetExceeded(errorData.fallbackOptions);
          }
        }
        throw error;
      }
    );
  }

  // Authentication
  async login(userId: string): Promise<{ sessionId: string; expiresAt: string }> {
    try {
      const response = await this.api.post('/api/auth/login', { userId });
      const { sessionId, expiresAt } = response.data;
      
      this.config.sessionToken = sessionId;
      this.config.userId = userId;
      
      // Store session in localStorage
      localStorage.setItem('kiro-session', JSON.stringify({
        sessionId,
        userId,
        expiresAt
      }));

      return { sessionId, expiresAt };
    } catch (error) {
      throw new Error('Failed to authenticate with cloud service');
    }
  }

  async validateSession(): Promise<boolean> {
    try {
      if (!this.config.sessionToken) {
        return false;
      }

      await this.api.get('/api/auth/session');
      return true;
    } catch (error) {
      this.clearSession();
      return false;
    }
  }

  clearSession(): void {
    this.config.sessionToken = undefined;
    this.config.userId = undefined;
    localStorage.removeItem('kiro-session');
  }

  // Challenge Generation
  async generateChallenge(params: {
    language: string;
    framework?: string;
    category: string;
    difficulty: number;
  }): Promise<Challenge> {
    try {
      // Add small delay to avoid quota issues
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const response = await this.api.post('/api/challenges/generate', params);
      return response.data;
    } catch (error) {
      throw new Error('Failed to generate challenge');
    }
  }

  // AI Grading
  async submitForGrading(request: AIGradingRequest): Promise<AIGradingResponse> {
    try {
      // Add small delay to avoid quota issues
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const response = await this.api.post('/api/grading/submit', {
        ...request,
        userId: this.config.userId
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to submit code for grading');
    }
  }

  // User Progress
  async getUserProgress(): Promise<UserProgress | null> {
    try {
      if (!this.config.userId) {
        throw new Error('User not authenticated');
      }

      const response = await this.api.get(`/api/progress/${this.config.userId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get user progress:', error);
      return null;
    }
  }

  async updateUserProgress(progress: UserProgress): Promise<void> {
    try {
      if (!this.config.userId) {
        throw new Error('User not authenticated');
      }

      await this.api.put(`/api/progress/${this.config.userId}`, progress);
    } catch (error) {
      throw new Error('Failed to update user progress');
    }
  }

  // OpenAI-compatible AI API
  async getAvailableModels(): Promise<string[]> {
    try {
      const response = await this.api.get('/v1/models');
      return response.data.data.map((model: any) => model.id);
    } catch (error) {
      console.error('Failed to get available models:', error);
      return ['anthropic.claude-3-haiku-20240307-v1:0']; // Fallback
    }
  }

  async chatCompletion(messages: any[], model?: string): Promise<string> {
    try {
      // Add small delay to avoid quota issues
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const response = await this.api.post('/v1/chat/completions', {
        messages,
        model: model || 'anthropic.claude-3-haiku-20240307-v1:0',
        max_tokens: 2000,
        temperature: 0.7
      });

      return response.data.choices[0].message.content;
    } catch (error) {
      throw new Error('Failed to get AI response');
    }
  }

  // Utility methods
  isAuthenticated(): boolean {
    return !!this.config.sessionToken && !!this.config.userId;
  }

  getCurrentUserId(): string | undefined {
    return this.config.userId;
  }

  // Budget Management
  async getBudgetStatus(): Promise<BudgetStatus> {
    try {
      const response = await this.api.get('/api/budget/status');
      return response.data.data;
    } catch (error) {
      console.error('Failed to get budget status:', error);
      // Return safe default
      return {
        currentSpending: 0,
        budgetLimit: 15,
        percentageUsed: 0,
        status: 'ok',
        alertLevel: 0,
        remainingBudget: 15,
        isShutdownRequired: false
      };
    }
  }

  async checkBudgetConstraints(): Promise<BudgetConstraints> {
    try {
      const response = await this.api.get('/api/budget/constraints');
      return response.data.data;
    } catch (error) {
      console.error('Failed to check budget constraints:', error);
      // Return safe default that allows operations
      return {
        shouldBlock: false,
        budgetStatus: {
          currentSpending: 0,
          budgetLimit: 15,
          percentageUsed: 0,
          status: 'ok',
          alertLevel: 0,
          remainingBudget: 15,
          isShutdownRequired: false
        },
        fallbackOptions: {
          switchToLocalMode: true,
          requireOpenRouterKey: true,
          disableAIFeatures: false
        }
      };
    }
  }

  async getCostOptimizedModel(availableModels: string[]): Promise<string> {
    try {
      const response = await this.api.post('/api/budget/model', { availableModels });
      return response.data.data.recommendedModel;
    } catch (error) {
      console.error('Failed to get cost-optimized model:', error);
      // Return cheapest fallback
      return 'anthropic.claude-3-haiku-20240307-v1:0';
    }
  }

  async setupBudgetMonitoring(): Promise<boolean> {
    try {
      const response = await this.api.post('/api/budget/setup');
      return response.data.success;
    } catch (error) {
      console.error('Failed to setup budget monitoring:', error);
      return false;
    }
  }

  async enforceBudgetConstraints(): Promise<{
    enforcement: any;
    budgetStatus: BudgetStatus;
    fallbackOptions: any;
  }> {
    try {
      const response = await this.api.post('/api/budget/enforce');
      return response.data.data;
    } catch (error) {
      console.error('Failed to enforce budget constraints:', error);
      throw error;
    }
  }

  async getCostOptimizationStrategies(): Promise<{
    strategies: string[];
    recommendedActions: string[];
    emergencyMode: boolean;
    budgetStatus: string;
    remainingBudget: number;
    percentageUsed: number;
  }> {
    try {
      const response = await this.api.get('/api/budget/strategies');
      return response.data.data;
    } catch (error) {
      console.error('Failed to get cost optimization strategies:', error);
      return {
        strategies: ['Switch to local mode'],
        recommendedActions: ['Use local LLM or OpenRouter API key'],
        emergencyMode: true,
        budgetStatus: 'unknown',
        remainingBudget: 0,
        percentageUsed: 100
      };
    }
  }

  private handleBudgetExceeded(fallbackOptions: any): void {
    console.warn('AWS budget exceeded, handling fallback options:', fallbackOptions);
    
    // Store budget exceeded state
    localStorage.setItem('kiro-budget-exceeded', JSON.stringify({
      timestamp: new Date().toISOString(),
      fallbackOptions
    }));

    // Emit custom event for UI to handle
    window.dispatchEvent(new CustomEvent('kiro-budget-exceeded', {
      detail: { fallbackOptions }
    }));
  }

  /**
   * Handle graceful degradation when budget is exceeded
   */
  async handleGracefulDegradation(): Promise<{
    shouldSwitchToLocal: boolean;
    requiresOpenRouterKey: boolean;
    disableFeatures: string[];
    message: string;
  }> {
    try {
      const constraints = await this.checkBudgetConstraints();
      
      if (constraints.shouldBlock) {
        const strategies = await this.getCostOptimizationStrategies();
        
        return {
          shouldSwitchToLocal: constraints.fallbackOptions.switchToLocalMode,
          requiresOpenRouterKey: constraints.fallbackOptions.requireOpenRouterKey,
          disableFeatures: strategies.emergencyMode ? ['ai-grading', 'challenge-generation'] : [],
          message: this.getBudgetExceededMessage(constraints.budgetStatus, strategies)
        };
      }

      return {
        shouldSwitchToLocal: false,
        requiresOpenRouterKey: false,
        disableFeatures: [],
        message: ''
      };
    } catch (error) {
      console.error('Failed to handle graceful degradation:', error);
      return {
        shouldSwitchToLocal: true,
        requiresOpenRouterKey: true,
        disableFeatures: ['ai-grading', 'challenge-generation'],
        message: 'Unable to check budget status. Please switch to local mode or provide OpenRouter API key.'
      };
    }
  }

  private getBudgetExceededMessage(budgetStatus: BudgetStatus, strategies: any): string {
    if (budgetStatus.status === 'exceeded') {
      return `Monthly budget of $${budgetStatus.budgetLimit} has been exceeded (current: $${budgetStatus.currentSpending.toFixed(2)}). Please switch to local mode or provide an OpenRouter API key to continue using AI features.`;
    } else if (budgetStatus.percentageUsed > 95) {
      return `Budget is ${budgetStatus.percentageUsed.toFixed(1)}% used ($${budgetStatus.currentSpending.toFixed(2)} of $${budgetStatus.budgetLimit}). Consider switching to local mode to avoid service interruption.`;
    } else if (budgetStatus.percentageUsed > 80) {
      return `Budget is ${budgetStatus.percentageUsed.toFixed(1)}% used. AI features may be limited to conserve costs.`;
    }
    return '';
  }

  static isBudgetExceeded(): boolean {
    const budgetState = localStorage?.getItem('kiro-budget-exceeded');
    if (!budgetState) return false;

    try {
      const { timestamp } = JSON.parse(budgetState);
      const exceededTime = new Date(timestamp);
      const now = new Date();
      
      // Consider budget exceeded for current day
      return exceededTime.toDateString() === now.toDateString();
    } catch {
      return false;
    }
  }

  static clearBudgetExceededState(): void {
    localStorage.removeItem('kiro-budget-exceeded');
  }

  // Initialize from stored session
  static async fromStoredSession(apiBaseUrl: string): Promise<CloudService> {
    const storedSession = localStorage.getItem('kiro-session');
    
    if (storedSession) {
      try {
        const { sessionId, userId, expiresAt } = JSON.parse(storedSession);
        
        // Check if session is expired
        if (new Date(expiresAt) > new Date()) {
          const service = new CloudService({
            apiBaseUrl,
            sessionToken: sessionId,
            userId
          });

          // Validate session with server
          const isValid = await service.validateSession();
          if (isValid) {
            return service;
          }
        }
      } catch (error) {
        console.error('Failed to restore session:', error);
      }
    }

    // Return service without authentication
    return new CloudService({ apiBaseUrl });
  }
}