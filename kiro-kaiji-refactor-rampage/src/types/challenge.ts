/**
 * Challenge Configuration and Challenge Types
 * 
 * Defines the structure for coding challenges, their configuration,
 * requirements, and test cases
 */

import type { KaijuMonster } from './kaiju';

export enum ProgrammingLanguage {
  JAVASCRIPT = 'javascript',
  TYPESCRIPT = 'typescript',
  PYTHON = 'python',
  JAVA = 'java',
  CSHARP = 'csharp',
  CPP = 'cpp',
  GO = 'go',
  RUST = 'rust'
}

export enum Framework {
  // JavaScript/TypeScript frameworks
  VUE = 'vue',
  REACT = 'react',
  ANGULAR = 'angular',
  SVELTE = 'svelte',
  NODE = 'node',
  EXPRESS = 'express',
  
  // Python frameworks
  DJANGO = 'django',
  FLASK = 'flask',
  FASTAPI = 'fastapi',
  
  // Java frameworks
  SPRING = 'spring',
  SPRING_BOOT = 'spring-boot',
  
  // C# frameworks
  DOTNET = 'dotnet',
  ASP_NET = 'asp-net'
}

export enum ChallengeCategory {
  REFACTORING = 'refactoring',
  BUG_FIXING = 'bug-fixing',
  FEATURE_ADDITION = 'feature-addition',
  PERFORMANCE_OPTIMIZATION = 'performance-optimization',
  CODE_REVIEW = 'code-review',
  TESTING = 'testing',
  ARCHITECTURE = 'architecture'
}

export enum DifficultyLevel {
  BEGINNER = 1,
  INTERMEDIATE = 2,
  ADVANCED = 3,
  EXPERT = 4,
  LEGENDARY = 5
}

export interface ChallengeConfig {
  language: ProgrammingLanguage;
  framework?: Framework;
  category: ChallengeCategory;
  difficulty: DifficultyLevel;
}

export interface Requirement {
  id: string;
  description: string;
  priority: 'must' | 'should' | 'could';
  testable: boolean;
  acceptanceCriteria: string[];
}

export interface TestCase {
  id: string;
  name: string;
  description: string;
  input: any;
  expectedOutput: any;
  isHidden: boolean;
  weight: number;
}

export interface Challenge {
  id: string;
  kaiju: KaijuMonster;
  config: ChallengeConfig;
  title: string;
  description: string;
  initialCode: string;
  requirements: Requirement[];
  testCases: TestCase[];
  hints: string[];
  createdAt: Date;
  timeLimit?: number;
  maxAttempts?: number;
}

export interface ChallengeContext {
  challenge: Challenge;
  currentCode: string;
  attempts: number;
  startTime: Date;
  lastModified: Date;
}