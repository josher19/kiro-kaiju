/**
 * KaijuEngine Unit Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { KaijuEngine, BaseKaijuMonster } from '../kaijuEngine';
import { KaijuType } from '@/types/kaiju';
import { ChallengeCategory, DifficultyLevel, ProgrammingLanguage } from '@/types/challenge';

describe('KaijuEngine', () => {
  let engine: KaijuEngine;

  beforeEach(() => {
    engine = new KaijuEngine();
    // Wait a bit for async monster registration
    return new Promise(resolve => setTimeout(resolve, 100));
  });

  describe('Monster Registration', () => {
    it('should register all Kaiju monsters', async () => {
      // Wait for async imports to complete
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const allMonsters = engine.getAllMonsters();
      expect(allMonsters.length).toBe(5);
      
      const monsterTypes = allMonsters.map(m => m.type);
      expect(monsterTypes).toContain(KaijuType.HYDRA_BUG);
      expect(monsterTypes).toContain(KaijuType.COMPLEXASAUR);
      expect(monsterTypes).toContain(KaijuType.DUPLICATRON);
      expect(monsterTypes).toContain(KaijuType.SPAGHETTIZILLA);
      expect(monsterTypes).toContain(KaijuType.MEMORYLEAK_ODACTYL);
    });

    it('should retrieve specific monsters by type', async () => {
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const hydraBug = engine.getMonster(KaijuType.HYDRA_BUG);
      expect(hydraBug).toBeDefined();
      expect(hydraBug?.type).toBe(KaijuType.HYDRA_BUG);
      expect(hydraBug?.name).toBe('HydraBug');
    });

    it('should return undefined for non-existent monster types', () => {
      const nonExistent = engine.getMonster('non-existent' as KaijuType);
      expect(nonExistent).toBeUndefined();
    });
  });

  describe('Challenge Monster Selection', () => {
    beforeEach(async () => {
      // Ensure monsters are loaded
      await new Promise(resolve => setTimeout(resolve, 200));
    });

    it('should select HydraBug for bug fixing challenges', () => {
      const monster = engine.selectKaijuForChallenge(
        ChallengeCategory.BUG_FIXING,
        DifficultyLevel.INTERMEDIATE
      );
      
      expect(monster).toBeDefined();
      expect(monster?.type).toBe(KaijuType.HYDRA_BUG);
    });

    it('should select appropriate monsters for refactoring challenges', () => {
      const monster = engine.selectKaijuForChallenge(
        ChallengeCategory.REFACTORING,
        DifficultyLevel.ADVANCED
      );
      
      expect(monster).toBeDefined();
      expect([
        KaijuType.COMPLEXASAUR,
        KaijuType.DUPLICATRON,
        KaijuType.SPAGHETTIZILLA
      ]).toContain(monster?.type);
    });

    it('should select Memoryleak-odactyl for performance optimization', () => {
      const monster = engine.selectKaijuForChallenge(
        ChallengeCategory.PERFORMANCE_OPTIMIZATION,
        DifficultyLevel.EXPERT
      );
      
      expect(monster).toBeDefined();
      expect(monster?.type).toBe(KaijuType.MEMORYLEAK_ODACTYL);
    });

    it('should return a fallback monster for unmapped categories', () => {
      // Create a new category that's not in the map
      const monster = engine.selectKaijuForChallenge(
        'unknown-category' as ChallengeCategory,
        DifficultyLevel.BEGINNER
      );
      
      expect(monster).toBeDefined();
      expect(monster?.type).toBeDefined();
    });
  });

  describe('Code Generation', () => {
    beforeEach(async () => {
      await new Promise(resolve => setTimeout(resolve, 200));
    });

    it('should generate code using specific Kaiju monster', () => {
      const generatedCode = engine.generateChallengeCode(
        KaijuType.HYDRA_BUG,
        {
          language: ProgrammingLanguage.JAVASCRIPT,
          category: ChallengeCategory.BUG_FIXING,
          difficulty: DifficultyLevel.INTERMEDIATE
        }
      );

      expect(generatedCode).toBeDefined();
      expect(generatedCode?.code).toBeDefined();
      expect(generatedCode?.problems).toBeDefined();
      expect(generatedCode?.hints).toBeDefined();
      expect(generatedCode?.requirements).toBeDefined();
      
      expect(generatedCode?.code.length).toBeGreaterThan(0);
      expect(generatedCode?.problems.length).toBeGreaterThan(0);
      expect(generatedCode?.hints.length).toBeGreaterThan(0);
      expect(generatedCode?.requirements.length).toBeGreaterThan(0);
    });

    it('should return null for non-existent monster type', () => {
      const generatedCode = engine.generateChallengeCode(
        'non-existent' as KaijuType,
        {
          language: ProgrammingLanguage.JAVASCRIPT,
          category: ChallengeCategory.BUG_FIXING,
          difficulty: DifficultyLevel.INTERMEDIATE
        }
      );

      expect(generatedCode).toBeNull();
    });
  });
});

describe('BaseKaijuMonster', () => {
  // Create a test implementation of BaseKaijuMonster
  class TestKaiju extends BaseKaijuMonster {
    id = 'test-kaiju';
    name = 'Test Kaiju';
    type = KaijuType.HYDRA_BUG;
    description = 'A test monster';
    avatar = '🧪';
    flavorText = 'Testing is fun!';
    specialAbilities = ['Testing'];
    weaknesses = ['Bugs'];
    codePatterns = [
      {
        id: 'test-pattern',
        name: 'Test Pattern',
        description: 'A test pattern',
        severity: 'medium' as const,
        examples: ['test example']
      }
    ];
    difficultyModifiers = [
      {
        factor: 1.0,
        description: 'Test modifier',
        affectedMetrics: ['pattern_complexity']
      }
    ];

    generateCode() {
      return {
        code: 'test code',
        problems: ['test problem'],
        hints: ['test hint'],
        requirements: ['test requirement']
      };
    }
  }

  it('should adjust pattern severity based on difficulty', () => {
    const testKaiju = new TestKaiju();
    
    // Access protected method through type assertion
    const adjustedPatterns = (testKaiju as any).getAdjustedPatterns(DifficultyLevel.EXPERT);
    
    expect(adjustedPatterns).toBeDefined();
    expect(adjustedPatterns.length).toBe(1);
    expect(adjustedPatterns[0].severity).toBe('high'); // Should be adjusted upward
  });

  it('should return original patterns when no modifier affects pattern_complexity', () => {
    const testKaiju = new TestKaiju();
    testKaiju.difficultyModifiers = [
      {
        factor: 1.0,
        description: 'Test modifier',
        affectedMetrics: ['other_metric']
      }
    ];
    
    const adjustedPatterns = (testKaiju as any).getAdjustedPatterns(DifficultyLevel.EXPERT);
    
    expect(adjustedPatterns).toEqual(testKaiju.codePatterns);
  });
});