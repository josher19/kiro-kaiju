/**
 * API Request and Response Types
 * 
 * Defines the interfaces for all API communications including
 * challenge generation, evaluation, AI assistance, and progress tracking
 */

import type { Challenge, ChallengeConfig } from './challenge';
import type { KaijuMonster } from './kaiju';
import type { EvaluationResult, Achievement } from './user';
import type { DialogResponse, DialogContext } from './team';

// Challenge Generation API
export interface ChallengeRequest {
  language: string;
  framework?: string;
  category: string;
  difficulty: number;
  userId?: string;
  excludeKaiju?: string[];
}

export interface ChallengeResponse {
  success: boolean;
  challenge?: Challenge;
  error?: string;
}

// Code Evaluation API
export interface EvaluationRequest {
  challengeId: string;
  submittedCode: string;
  userId?: string;
  timeSpent: number;
  attempts: number;
}

export interface EvaluationResponse {
  success: boolean;
  result?: EvaluationResult;
  error?: string;
}

// AI Chat API
export interface AIChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  context?: {
    challengeId: string;
    currentCode: string;
  };
}

export interface AIChatRequest {
  message: string;
  challengeId: string;
  currentCode: string;
  conversationHistory: AIChatMessage[];
  userId?: string;
}

export interface AIChatResponse {
  success: boolean;
  message?: AIChatMessage;
  error?: string;
}

// Zoom-a-Friend API
export interface ZoomRequest {
  teamMemberRole: string;
  context: DialogContext;
  userId?: string;
}

export interface ZoomResponse {
  success: boolean;
  dialog?: DialogResponse;
  error?: string;
}

// User Progress API
export interface ProgressUpdateRequest {
  userId: string;
  challengeId: string;
  result: EvaluationResult;
  newAchievements?: Achievement[];
}

export interface ProgressResponse {
  success: boolean;
  updatedProgress?: any;
  newAchievements?: Achievement[];
  error?: string;
}

// Generic API Response
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: Date;
}

// Error Types
export interface ApiError {
  code: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  recoverable: boolean;
  userMessage: string;
  timestamp: Date;
}