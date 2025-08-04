/**
 * User Progress and Evaluation Types
 * 
 * Defines user progress tracking, achievements, and evaluation models
 */

import type { KaijuType } from './kaiju';
import type { DifficultyLevel, ChallengeCategory } from './challenge';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'kaiju-slayer' | 'skill-master' | 'streak' | 'milestone' | 'special';
  unlockedAt: Date;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface UserStats {
  totalChallenges: number;
  challengesCompleted: number;
  averageScore: number;
  bestScore: number;
  totalTimeSpent: number; // in minutes
  kaijuDefeated: Record<KaijuType, number>;
  categoriesCompleted: Record<ChallengeCategory, number>;
  improvementTrend: number[]; // last 10 challenge scores
  currentStreak: number;
  longestStreak: number;
}

export interface UserProgress {
  userId: string;
  username?: string;
  completedChallenges: string[];
  achievements: Achievement[];
  stats: UserStats;
  unlockedDifficulties: DifficultyLevel[];
  unlockedKaiju: KaijuType[];
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  notifications: boolean;
  soundEffects: boolean;
  autoSave: boolean;
  codeEditorSettings: {
    fontSize: number;
    tabSize: number;
    wordWrap: boolean;
    minimap: boolean;
  };
}

export interface EvaluationCriteria {
  readability: number;
  quality: number;
  defects: number;
  requirements: number;
  performance?: number;
}

export interface EvaluationFeedback {
  category: keyof EvaluationCriteria;
  score: number;
  maxScore: number;
  message: string;
  suggestions: string[];
  codeExamples?: {
    before: string;
    after: string;
    explanation: string;
  }[];
}

export interface EvaluationResult {
  challengeId: string;
  userId?: string;
  submittedCode: string;
  scores: EvaluationCriteria;
  overallScore: number;
  feedback: EvaluationFeedback[];
  achievements?: Achievement[];
  timeSpent: number;
  attempts: number;
  passed: boolean;
  evaluatedAt: Date;
  isOfflineEvaluation?: boolean;
}