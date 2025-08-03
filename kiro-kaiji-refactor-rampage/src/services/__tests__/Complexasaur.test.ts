/**
 * Complexasaur Monster Unit Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Complexasaur } from '../monsters/Complexasaur';
import { KaijuType } from '@/types/kaiju';
import { ProgrammingLanguage, ChallengeCategory, DifficultyLevel } from '@/types/challenge';

describe('Complexasaur', () => {
  let complexasaur: Complexasaur;

  beforeEach(() => {
    complexasaur = new Complexasaur();
  });

  describe('Monster Properties', () => {
    it('should have correct basic properties', () => {
      expect(complexasaur.id).toBe('complexasaur-001');
      expect(complexasaur.name).toBe('Complexasaur');
      expect(complexasaur.type).toBe(KaijuType.COMPLEXASAUR);
      expect(complexasaur.avatar).toBe('🦕');
      expect(complexasaur.description).toContain('overly complex code');
      expect(complexasaur.flavorText).toContain('nest it 10 levels deep');
    });

    it('should have complexity-focused special abilities', () => {
      expect(complexasaur.specialAbilities).toContain('Nested Complexity: Creates deeply nested conditional structures');
      expect(complexasaur.specialAbilities).toContain('Logic Obfuscation: Makes simple operations unnecessarily complex');
      expect(complexasaur.specialAbilities).toContain('Cognitive Overload: Generates code that exceeds human comprehension limits');
    });

    it('should have simplification-focused weaknesses', () => {
      expect(complexasaur.weaknesses).toContain('Simplification: Breaking complex logic into smaller, focused functions');
      expect(complexasaur.weaknesses).toContain('Early Returns: Using guard clauses to reduce nesting');
      expect(complexasaur.weaknesses).toContain('Clear Naming: Descriptive variable and function names reveal intent');
    });

    it('should have complexity-related code patterns', () => {
      expect(complexasaur.codePatterns).toHaveLength(3);
      
      const patternIds = complexasaur.codePatterns.map(p => p.id);
      expect(patternIds).toContain('excessive-nesting');
      expect(patternIds).toContain('complex-conditionals');
      expect(patternIds).toContain('monolithic-functions');
    });
  });

  describe('JavaScript Code Generation', () => {
    it('should generate deeply nested user registration code', () => {
      const result = complexasaur.generateCode({
        language: ProgrammingLanguage.JAVASCRIPT,
        category: ChallengeCategory.REFACTORING,
        difficulty: DifficultyLevel.INTERMEDIATE
      });

      expect(result.code).toContain('User Registration System');
      expect(result.code).toContain('function processUserRegistration');
      expect(result.code).toContain('userData, systemConfig, validationRules, permissions');
    });

    it('should demonstrate excessive nesting', () => {
      const result = complexasaur.generateCode({
        language: ProgrammingLanguage.JAVASCRIPT,
        category: ChallengeCategory.REFACTORING,
        difficulty: DifficultyLevel.INTERMEDIATE
      });

      // Count nested if statements - should be deeply nested
      const ifMatches = result.code.match(/if \(/g);
      expect(ifMatches).toBeDefined();
      expect(ifMatches!.length).toBeGreaterThan(15); // Should have many nested ifs

      // Check for deep indentation patterns
      const deeplyIndentedLines = result.code.split('\n').filter(line => 
        line.match(/^\s{40,}/) // Lines with 40+ spaces of indentation
      );
      expect(deeplyIndentedLines.length).toBeGreaterThan(5);
    });

    it('should include complexity-related problems', () => {
      const result = complexasaur.generateCode({
        language: ProgrammingLanguage.JAVASCRIPT,
        category: ChallengeCategory.REFACTORING,
        difficulty: DifficultyLevel.INTERMEDIATE
      });

      expect(result.problems).toContain('Excessive nesting makes code difficult to read and maintain');
      expect(result.problems).toContain('Single function handles too many responsibilities');
      expect(result.problems).toContain('Complex conditional logic is hard to test');
      expect(result.problems).toContain('Function has too many parameters and dependencies');
    });

    it('should provide refactoring hints', () => {
      const result = complexasaur.generateCode({
        language: ProgrammingLanguage.JAVASCRIPT,
        category: ChallengeCategory.REFACTORING,
        difficulty: DifficultyLevel.INTERMEDIATE
      });

      expect(result.hints).toContain('Use early returns to reduce nesting levels');
      expect(result.hints).toContain('Extract validation logic into separate functions');
      expect(result.hints).toContain('Create a validation chain or pipeline pattern');
      expect(result.hints).toContain('Use guard clauses for error conditions');
    });

    it('should include clear refactoring requirements', () => {
      const result = complexasaur.generateCode({
        language: ProgrammingLanguage.JAVASCRIPT,
        category: ChallengeCategory.REFACTORING,
        difficulty: DifficultyLevel.INTERMEDIATE
      });

      expect(result.requirements).toContain('Reduce nesting depth to maximum 3 levels');
      expect(result.requirements).toContain('Split the monolithic function into smaller, focused functions');
      expect(result.requirements).toContain('Implement clear error handling strategy');
      expect(result.requirements).toContain('Ensure all validation rules are testable independently');
    });

    it('should generate additional complexity for higher difficulty', () => {
      const easyResult = complexasaur.generateCode({
        language: ProgrammingLanguage.JAVASCRIPT,
        category: ChallengeCategory.REFACTORING,
        difficulty: DifficultyLevel.BEGINNER
      });

      const hardResult = complexasaur.generateCode({
        language: ProgrammingLanguage.JAVASCRIPT,
        category: ChallengeCategory.REFACTORING,
        difficulty: DifficultyLevel.EXPERT
      });

      expect(hardResult.code.length).toBeGreaterThan(easyResult.code.length);
      expect(hardResult.code).toContain('validateUserPermissions');
      expect(hardResult.problems.some(p => p.includes('Permission validation logic'))).toBe(true);
    });
  });

  describe('Python Code Generation', () => {
    it('should generate Python code with deep nesting', () => {
      const result = complexasaur.generateCode({
        language: ProgrammingLanguage.PYTHON,
        category: ChallengeCategory.REFACTORING,
        difficulty: DifficultyLevel.INTERMEDIATE
      });

      expect(result.code).toContain('# User Registration System');
      expect(result.code).toContain('def process_user_registration');
      expect(result.code).toContain('user_data, system_config, validation_rules, permissions');
    });

    it('should demonstrate Python-specific nesting patterns', () => {
      const result = complexasaur.generateCode({
        language: ProgrammingLanguage.PYTHON,
        category: ChallengeCategory.REFACTORING,
        difficulty: DifficultyLevel.INTERMEDIATE
      });

      // Check for deeply nested if statements in Python
      const ifMatches = result.code.match(/if .+:/g);
      expect(ifMatches).toBeDefined();
      expect(ifMatches!.length).toBeGreaterThan(15);

      // Check for deep indentation (Python uses 4 spaces typically)
      const deeplyIndentedLines = result.code.split('\n').filter(line => 
        line.match(/^\s{60,}/) // Lines with 60+ spaces (15+ levels of 4-space indentation)
      );
      expect(deeplyIndentedLines.length).toBeGreaterThan(3);
    });

    it('should include Python-specific hints', () => {
      const result = complexasaur.generateCode({
        language: ProgrammingLanguage.PYTHON,
        category: ChallengeCategory.REFACTORING,
        difficulty: DifficultyLevel.INTERMEDIATE
      });

      expect(result.hints).toContain('Use early returns to reduce nesting');
      expect(result.hints).toContain('Extract validation into separate functions');
      expect(result.hints).toContain('Consider using decorators for validation');
    });
  });

  describe('Complexity Patterns', () => {
    it('should create monolithic functions', () => {
      const result = complexasaur.generateCode({
        language: ProgrammingLanguage.JAVASCRIPT,
        category: ChallengeCategory.REFACTORING,
        difficulty: DifficultyLevel.INTERMEDIATE
      });

      // The main function should be very long
      const functionStart = result.code.indexOf('function processUserRegistration');
      const functionEnd = result.code.indexOf('function createUser');
      const functionLength = functionEnd - functionStart;
      
      expect(functionLength).toBeGreaterThan(2000); // Should be a very long function
    });

    it('should demonstrate complex boolean logic', () => {
      const result = complexasaur.generateCode({
        language: ProgrammingLanguage.JAVASCRIPT,
        category: ChallengeCategory.REFACTORING,
        difficulty: DifficultyLevel.INTERMEDIATE
      });

      // Should have complex conditional expressions
      expect(result.code).toContain('userData.email.split(\'@\').length === 2');
      expect(result.code).toContain('userData.password.match(/[A-Z]/)');
      expect(result.code).toContain('userData.password === userData.confirmPassword');
    });

    it('should have excessive parameter lists', () => {
      const result = complexasaur.generateCode({
        language: ProgrammingLanguage.JAVASCRIPT,
        category: ChallengeCategory.REFACTORING,
        difficulty: DifficultyLevel.INTERMEDIATE
      });

      // Main function should have many parameters
      expect(result.code).toContain('userData, systemConfig, validationRules, permissions');
      
      // For higher difficulty, should have even more parameters
      const hardResult = complexasaur.generateCode({
        language: ProgrammingLanguage.JAVASCRIPT,
        category: ChallengeCategory.REFACTORING,
        difficulty: DifficultyLevel.EXPERT
      });

      expect(hardResult.code).toContain('user, action, resource, context, metadata, auditLog');
    });
  });

  describe('Cognitive Load Testing', () => {
    it('should create code that exceeds reasonable complexity', () => {
      const result = complexasaur.generateCode({
        language: ProgrammingLanguage.JAVASCRIPT,
        category: ChallengeCategory.REFACTORING,
        difficulty: DifficultyLevel.EXPERT
      });

      // Measure various complexity indicators
      const lines = result.code.split('\n');
      const nonEmptyLines = lines.filter(line => line.trim().length > 0);
      
      expect(nonEmptyLines.length).toBeGreaterThan(100); // Should be a long function
      
      // Should have many return statements (indicating complex branching)
      const returnStatements = result.code.match(/return \{/g);
      expect(returnStatements).toBeDefined();
      expect(returnStatements!.length).toBeGreaterThan(20);
    });

    it('should require significant refactoring effort', () => {
      const result = complexasaur.generateCode({
        language: ProgrammingLanguage.JAVASCRIPT,
        category: ChallengeCategory.REFACTORING,
        difficulty: DifficultyLevel.EXPERT
      });

      // Should have multiple types of complexity problems
      expect(result.problems.length).toBeGreaterThan(5);
      expect(result.hints.length).toBeGreaterThan(5);
      expect(result.requirements.length).toBeGreaterThan(4);
      
      // Should mention specific refactoring techniques
      expect(result.hints.some(h => h.includes('early returns'))).toBe(true);
      expect(result.hints.some(h => h.includes('Extract'))).toBe(true);
      expect(result.hints.some(h => h.includes('guard clauses'))).toBe(true);
    });
  });
});