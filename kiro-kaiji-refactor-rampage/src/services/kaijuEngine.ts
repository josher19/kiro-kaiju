/**
 * Kaiju Monster Engine
 * 
 * Core engine for managing Kaiju monsters and their code generation patterns.
 * Each Kaiju represents a specific coding anti-pattern or challenge type.
 */

import { 
  KaijuType,
  type KaijuMonster, 
  type CodeAntiPattern, 
  type DifficultyModifier 
} from '@/types/kaiju';
import { 
  ProgrammingLanguage, 
  ChallengeCategory, 
  DifficultyLevel 
} from '@/types/challenge';

export interface CodeGenerationOptions {
  language: ProgrammingLanguage;
  category: ChallengeCategory;
  difficulty: DifficultyLevel;
  codeLength?: number;
  complexity?: number;
}

export interface GeneratedCode {
  code: string;
  problems: string[];
  hints: string[];
  requirements: string[];
}

export abstract class BaseKaijuMonster implements KaijuMonster {
  abstract id: string;
  abstract name: string;
  abstract type: KaijuType;
  abstract description: string;
  abstract avatar: string;
  abstract codePatterns: CodeAntiPattern[];
  abstract difficultyModifiers: DifficultyModifier[];
  abstract specialAbilities: string[];
  abstract weaknesses: string[];
  abstract flavorText: string;

  /**
   * Generate problematic code based on this Kaiju's patterns
   */
  abstract generateCode(options: CodeGenerationOptions): GeneratedCode;

  /**
   * Get difficulty-adjusted patterns for this monster
   */
  protected getAdjustedPatterns(difficulty: DifficultyLevel): CodeAntiPattern[] {
    const modifier = this.difficultyModifiers.find(m => 
      m.affectedMetrics.includes('pattern_complexity')
    );
    
    if (!modifier) return this.codePatterns;

    const adjustmentFactor = difficulty * modifier.factor;
    return this.codePatterns.map(pattern => ({
      ...pattern,
      severity: this.adjustSeverity(pattern.severity, adjustmentFactor)
    }));
  }

  private adjustSeverity(
    baseSeverity: 'low' | 'medium' | 'high', 
    factor: number
  ): 'low' | 'medium' | 'high' {
    const severityMap = { low: 1, medium: 2, high: 3 };
    const adjusted = Math.min(3, Math.max(1, severityMap[baseSeverity] + factor));
    
    return adjusted <= 1 ? 'low' : adjusted <= 2 ? 'medium' : 'high';
  }
}

export class KaijuEngine {
  private monsters: Map<KaijuType, BaseKaijuMonster> = new Map();

  constructor() {
    this.initializeMonsters();
  }

  private async initializeMonsters(): Promise<void> {
    try {
      // Import and register all Kaiju monsters
      const { HydraBug } = await import('./monsters/HydraBug');
      this.registerMonster(new HydraBug());
      
      const { Complexasaur } = await import('./monsters/Complexasaur');
      this.registerMonster(new Complexasaur());
      
      const { Duplicatron } = await import('./monsters/Duplicatron');
      this.registerMonster(new Duplicatron());
      
      const { Spaghettizilla } = await import('./monsters/Spaghettizilla');
      this.registerMonster(new Spaghettizilla());
      
      const { MemoryleakOdactyl } = await import('./monsters/Memoryleak-odactyl');
      this.registerMonster(new MemoryleakOdactyl());
    } catch (error) {
      console.warn('Failed to load some Kaiju monsters:', error);
    }
  }

  /**
   * Ensure all monsters are loaded (for testing)
   */
  async ensureMonstersLoaded(): Promise<void> {
    if (this.monsters.size === 0) {
      await this.initializeMonsters();
    }
  }

  /**
   * Register a Kaiju monster with the engine
   */
  registerMonster(monster: BaseKaijuMonster): void {
    this.monsters.set(monster.type, monster);
  }

  /**
   * Get a specific Kaiju monster by type
   */
  getMonster(type: KaijuType): BaseKaijuMonster | undefined {
    return this.monsters.get(type);
  }

  /**
   * Get all available Kaiju monsters
   */
  getAllMonsters(): BaseKaijuMonster[] {
    return Array.from(this.monsters.values());
  }

  /**
   * Select an appropriate Kaiju for the given challenge parameters
   */
  selectKaijuForChallenge(
    category: ChallengeCategory,
    difficulty: DifficultyLevel
  ): BaseKaijuMonster | null {
    const availableMonsters = this.getAllMonsters();
    
    // Simple selection logic based on category
    const categoryMap: Record<ChallengeCategory, KaijuType[]> = {
      [ChallengeCategory.BUG_FIXING]: [KaijuType.HYDRA_BUG],
      [ChallengeCategory.REFACTORING]: [
        KaijuType.COMPLEXASAUR, 
        KaijuType.DUPLICATRON, 
        KaijuType.SPAGHETTIZILLA
      ],
      [ChallengeCategory.PERFORMANCE_OPTIMIZATION]: [KaijuType.MEMORYLEAK_ODACTYL],
      [ChallengeCategory.FEATURE_ADDITION]: [
        KaijuType.COMPLEXASAUR, 
        KaijuType.SPAGHETTIZILLA
      ],
      [ChallengeCategory.CODE_REVIEW]: [
        KaijuType.DUPLICATRON, 
        KaijuType.SPAGHETTIZILLA
      ],
      [ChallengeCategory.TESTING]: [KaijuType.HYDRA_BUG],
      [ChallengeCategory.ARCHITECTURE]: [
        KaijuType.SPAGHETTIZILLA, 
        KaijuType.COMPLEXASAUR
      ]
    };

    const suitableTypes = categoryMap[category] || [];
    const suitableMonsters = availableMonsters.filter(monster => 
      suitableTypes.includes(monster.type)
    );

    if (suitableMonsters.length === 0) {
      // Fallback to any monster
      return availableMonsters[Math.floor(Math.random() * availableMonsters.length)] || null;
    }

    // Select randomly from suitable monsters
    return suitableMonsters[Math.floor(Math.random() * suitableMonsters.length)];
  }

  /**
   * Generate code using a specific Kaiju monster
   */
  generateChallengeCode(
    kaijuType: KaijuType,
    options: CodeGenerationOptions
  ): GeneratedCode | null {
    const monster = this.getMonster(kaijuType);
    if (!monster) return null;

    return monster.generateCode(options);
  }
}