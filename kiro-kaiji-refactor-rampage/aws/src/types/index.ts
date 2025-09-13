export interface Challenge {
  id: string;
  kaiju: KaijuMonster;
  initialCode: string;
  requirements: string[];
  language: string;
  framework?: string;
  difficulty: number;
  createdAt: string;
}

export interface KaijuMonster {
  id: string;
  name: string;
  type: KaijuType;
  description: string;
  avatar: string;
}

export enum KaijuType {
  HYDRA_BUG = 'hydra-bug',
  COMPLEXASAUR = 'complexasaur',
  DUPLICATRON = 'duplicatron',
  SPAGHETTIZILLA = 'spaghettizilla',
  MEMORYLEAK_ODACTYL = 'memoryleak-odactyl'
}

export interface UserProgress {
  userId: string;
  challengeId?: string;
  completedChallenges: string[];
  achievements: Achievement[];
  stats: {
    totalChallenges: number;
    averageScore: number;
    kaijuDefeated: Record<KaijuType, number>;
  };
  gradingHistory: GradingHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlockedAt: string;
}

export interface GradingHistoryEntry {
  challengeId: string;
  gradingTimestamp: string;
  roleScores: Record<GradingRole, number>;
  averageScore: number;
  modelUsed: string;
}

export enum GradingRole {
  DEVELOPER = 'developer',
  ARCHITECT = 'architect',
  SQA = 'sqa',
  PRODUCT_OWNER = 'product-owner'
}

export interface AIGradingRequest {
  challengeId: string;
  submittedCode: string;
  requirements: string[];
  userId?: string;
}

export interface AIGradingResponse {
  challengeId: string;
  modelUsed: string;
  roleEvaluations: Record<GradingRole, RoleEvaluation>;
  averageScore: number;
  gradingTimestamp: string;
}

export interface RoleEvaluation {
  role: GradingRole;
  score: number;
  feedback: string;
}

export interface AuthSession {
  userId: string;
  sessionId: string;
  expiresAt: string;
  createdAt: string;
}

// Cost Management Types
export interface BudgetConfig {
  monthlyLimit: number;
  alertThresholds: number[];
  automaticShutoff: boolean;
  gracePeriodHours: number;
  snsTopicArn?: string;
  costOptimization: {
    prioritizeFreeTier: boolean;
    maxCostPerRequest: number;
    preferredModels: string[];
  };
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

export interface CostAlert {
  timestamp: string;
  alertLevel: number;
  currentSpending: number;
  budgetLimit: number;
  percentageUsed: number;
  message: string;
  severity: 'info' | 'warning' | 'critical' | 'emergency';
}

export interface CostMetrics {
  service: string;
  dailySpending: number;
  monthlySpending: number;
  requestCount: number;
  averageCostPerRequest: number;
  timestamp: string;
}