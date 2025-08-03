/**
 * Kaiju Monster Types and Interfaces
 * 
 * Defines the different types of coding monsters and their characteristics
 * Each Kaiju represents a specific coding anti-pattern or challenge type
 */

export enum KaijuType {
  HYDRA_BUG = 'hydra-bug',
  COMPLEXASAUR = 'complexasaur', 
  DUPLICATRON = 'duplicatron',
  SPAGHETTIZILLA = 'spaghettizilla',
  MEMORYLEAK_ODACTYL = 'memoryleak-odactyl'
}

export interface CodeAntiPattern {
  id: string;
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  examples: string[];
}

export interface DifficultyModifier {
  factor: number;
  description: string;
  affectedMetrics: string[];
}

export interface KaijuMonster {
  id: string;
  name: string;
  type: KaijuType;
  description: string;
  avatar: string;
  codePatterns: CodeAntiPattern[];
  difficultyModifiers: DifficultyModifier[];
  specialAbilities: string[];
  weaknesses: string[];
  flavorText: string;
}