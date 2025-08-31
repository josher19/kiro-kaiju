import axios, { type AxiosInstance } from 'axios';
import type { Challenge, UserProgress, AIGradingRequest, AIGradingResponse } from '../types';

export interface CloudConfig {
  apiBaseUrl: string;
  sessionToken?: string;
  userId?: string;
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