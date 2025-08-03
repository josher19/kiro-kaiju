/**
 * HydraBug Monster Unit Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { HydraBug } from '../monsters/HydraBug';
import { KaijuType } from '@/types/kaiju';
import { ProgrammingLanguage, ChallengeCategory, DifficultyLevel } from '@/types/challenge';

describe('HydraBug', () => {
  let hydraBug: HydraBug;

  beforeEach(() => {
    hydraBug = new HydraBug();
  });

  describe('Monster Properties', () => {
    it('should have correct basic properties', () => {
      expect(hydraBug.id).toBe('hydra-bug-001');
      expect(hydraBug.name).toBe('HydraBug');
      expect(hydraBug.type).toBe(KaijuType.HYDRA_BUG);
      expect(hydraBug.avatar).toBe('🐲');
      expect(hydraBug.description).toContain('multiplies when fixed incorrectly');
      expect(hydraBug.flavorText).toContain('Cut off one bug');
    });

    it('should have appropriate special abilities', () => {
      expect(hydraBug.specialAbilities).toContain('Bug Multiplication: Fixing one bug incorrectly creates two new bugs');
      expect(hydraBug.specialAbilities).toContain('Hidden Dependencies: Bugs are interconnected in unexpected ways');
      expect(hydraBug.specialAbilities).toContain('Regression Spawning: Changes in one area break seemingly unrelated functionality');
    });

    it('should have appropriate weaknesses', () => {
      expect(hydraBug.weaknesses).toContain('Systematic Testing: Comprehensive test coverage prevents bug multiplication');
      expect(hydraBug.weaknesses).toContain('Root Cause Analysis: Understanding the underlying issue prevents new bugs');
      expect(hydraBug.weaknesses).toContain('Incremental Fixes: Small, careful changes limit the blast radius');
    });

    it('should have relevant code patterns', () => {
      expect(hydraBug.codePatterns).toHaveLength(3);
      
      const patternIds = hydraBug.codePatterns.map(p => p.id);
      expect(patternIds).toContain('interconnected-bugs');
      expect(patternIds).toContain('hidden-side-effects');
      expect(patternIds).toContain('fragile-conditionals');
    });

    it('should have difficulty modifiers', () => {
      expect(hydraBug.difficultyModifiers).toHaveLength(1);
      expect(hydraBug.difficultyModifiers[0].factor).toBe(0.5);
      expect(hydraBug.difficultyModifiers[0].affectedMetrics).toContain('pattern_complexity');
    });
  });

  describe('JavaScript Code Generation', () => {
    it('should generate JavaScript code with shopping cart bugs', () => {
      const result = hydraBug.generateCode({
        language: ProgrammingLanguage.JAVASCRIPT,
        category: ChallengeCategory.BUG_FIXING,
        difficulty: DifficultyLevel.INTERMEDIATE
      });

      expect(result.code).toContain('Shopping Cart System');
      expect(result.code).toContain('let cart = []');
      expect(result.code).toContain('let totalPrice = 0');
      expect(result.code).toContain('function addItem');
      expect(result.code).toContain('function removeItem');
      expect(result.code).toContain('function updateDisplay');
    });

    it('should include interconnected bugs in generated code', () => {
      const result = hydraBug.generateCode({
        language: ProgrammingLanguage.JAVASCRIPT,
        category: ChallengeCategory.BUG_FIXING,
        difficulty: DifficultyLevel.INTERMEDIATE
      });

      expect(result.problems).toContain('Discount logic creates hidden state dependencies');
      expect(result.problems).toContain('Removing items doesn\'t recalculate discounts properly');
      expect(result.problems).toContain('Display update function modifies cart data');
      expect(result.problems).toContain('Multiple functions can apply discounts simultaneously');
    });

    it('should provide helpful hints', () => {
      const result = hydraBug.generateCode({
        language: ProgrammingLanguage.JAVASCRIPT,
        category: ChallengeCategory.BUG_FIXING,
        difficulty: DifficultyLevel.INTERMEDIATE
      });

      expect(result.hints).toContain('Consider separating calculation logic from display logic');
      expect(result.hints).toContain('Track discount state more explicitly');
      expect(result.hints).toContain('Implement proper state management for cart operations');
    });

    it('should include clear requirements', () => {
      const result = hydraBug.generateCode({
        language: ProgrammingLanguage.JAVASCRIPT,
        category: ChallengeCategory.BUG_FIXING,
        difficulty: DifficultyLevel.INTERMEDIATE
      });

      expect(result.requirements).toContain('Fix the discount calculation to work correctly when items are added/removed');
      expect(result.requirements).toContain('Ensure display updates don\'t modify cart data');
      expect(result.requirements).toContain('Prevent multiple discount applications');
    });

    it('should generate more complex code for higher difficulty', () => {
      const easyResult = hydraBug.generateCode({
        language: ProgrammingLanguage.JAVASCRIPT,
        category: ChallengeCategory.BUG_FIXING,
        difficulty: DifficultyLevel.BEGINNER
      });

      const hardResult = hydraBug.generateCode({
        language: ProgrammingLanguage.JAVASCRIPT,
        category: ChallengeCategory.BUG_FIXING,
        difficulty: DifficultyLevel.EXPERT
      });

      expect(hardResult.code.length).toBeGreaterThan(easyResult.code.length);
      expect(hardResult.problems.length).toBeGreaterThan(easyResult.problems.length);
      expect(hardResult.hints.length).toBeGreaterThan(easyResult.hints.length);
    });
  });

  describe('TypeScript Code Generation', () => {
    it('should generate TypeScript code (same as JavaScript)', () => {
      const result = hydraBug.generateCode({
        language: ProgrammingLanguage.TYPESCRIPT,
        category: ChallengeCategory.BUG_FIXING,
        difficulty: DifficultyLevel.INTERMEDIATE
      });

      expect(result.code).toContain('Shopping Cart System');
      expect(result.code).toContain('let cart = []');
      expect(result.problems.length).toBeGreaterThan(0);
      expect(result.hints.length).toBeGreaterThan(0);
      expect(result.requirements.length).toBeGreaterThan(0);
    });
  });

  describe('Python Code Generation', () => {
    it('should generate Python code with shopping cart bugs', () => {
      const result = hydraBug.generateCode({
        language: ProgrammingLanguage.PYTHON,
        category: ChallengeCategory.BUG_FIXING,
        difficulty: DifficultyLevel.INTERMEDIATE
      });

      expect(result.code).toContain('# Shopping Cart System');
      expect(result.code).toContain('cart = []');
      expect(result.code).toContain('total_price = 0');
      expect(result.code).toContain('def add_item');
      expect(result.code).toContain('def remove_item');
      expect(result.code).toContain('def update_display');
    });

    it('should include Python-specific problems', () => {
      const result = hydraBug.generateCode({
        language: ProgrammingLanguage.PYTHON,
        category: ChallengeCategory.BUG_FIXING,
        difficulty: DifficultyLevel.INTERMEDIATE
      });

      expect(result.problems).toContain('Global state modifications cause unexpected side effects');
      expect(result.problems).toContain('Discount calculation doesn\'t handle item removal correctly');
      expect(result.problems).toContain('Display function modifies cart data');
    });

    it('should provide Python-specific hints', () => {
      const result = hydraBug.generateCode({
        language: ProgrammingLanguage.PYTHON,
        category: ChallengeCategory.BUG_FIXING,
        difficulty: DifficultyLevel.INTERMEDIATE
      });

      expect(result.hints).toContain('Use classes to encapsulate state');
      expect(result.hints).toContain('Separate calculation from display logic');
    });
  });

  describe('Fallback Language Support', () => {
    it('should fallback to JavaScript for unsupported languages', () => {
      const result = hydraBug.generateCode({
        language: ProgrammingLanguage.JAVA,
        category: ChallengeCategory.BUG_FIXING,
        difficulty: DifficultyLevel.INTERMEDIATE
      });

      // Should generate JavaScript code as fallback
      expect(result.code).toContain('let cart = []');
      expect(result.code).toContain('function addItem');
    });
  });

  describe('Bug Multiplication Patterns', () => {
    it('should demonstrate interconnected bugs', () => {
      const result = hydraBug.generateCode({
        language: ProgrammingLanguage.JAVASCRIPT,
        category: ChallengeCategory.BUG_FIXING,
        difficulty: DifficultyLevel.INTERMEDIATE
      });

      // Check for patterns that show how fixing one bug creates others
      expect(result.code).toContain('discountApplied');
      expect(result.code).toContain('totalPrice');
      expect(result.code).toContain('updateDisplay');
      
      // Should have bugs that are interconnected
      expect(result.problems.some(p => p.includes('hidden state dependencies'))).toBe(true);
      expect(result.problems.some(p => p.includes('race conditions'))).toBe(true);
    });

    it('should include fragile conditional logic', () => {
      const result = hydraBug.generateCode({
        language: ProgrammingLanguage.JAVASCRIPT,
        category: ChallengeCategory.BUG_FIXING,
        difficulty: DifficultyLevel.INTERMEDIATE
      });

      // Should contain conditional logic that breaks easily
      expect(result.code).toContain('if (cart.length > 2');
      expect(result.code).toContain('!discountApplied');
      expect(result.code).toContain('if (totalPrice < 0)');
    });
  });
});