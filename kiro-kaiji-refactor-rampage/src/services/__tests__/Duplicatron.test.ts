/**
 * Duplicatron Monster Unit Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Duplicatron } from '../monsters/Duplicatron';
import { KaijuType } from '@/types/kaiju';
import { ProgrammingLanguage, ChallengeCategory, DifficultyLevel } from '@/types/challenge';

describe('Duplicatron', () => {
  let duplicatron: Duplicatron;

  beforeEach(() => {
    duplicatron = new Duplicatron();
  });

  describe('Monster Properties', () => {
    it('should have correct basic properties', () => {
      expect(duplicatron.id).toBe('duplicatron-001');
      expect(duplicatron.name).toBe('Duplicatron');
      expect(duplicatron.type).toBe(KaijuType.DUPLICATRON);
      expect(duplicatron.avatar).toBe('👥');
      expect(duplicatron.description).toContain('identical code patterns');
      expect(duplicatron.flavorText).toContain('Copy, paste, repeat');
    });

    it('should have duplication-focused abilities and weaknesses', () => {
      expect(duplicatron.specialAbilities).toContain('Code Replication: Creates identical logic in multiple places');
      expect(duplicatron.weaknesses).toContain('DRY Principle: Don\'t Repeat Yourself - extract common functionality');
    });

    it('should have duplication-related code patterns', () => {
      const patternIds = duplicatron.codePatterns.map(p => p.id);
      expect(patternIds).toContain('identical-functions');
      expect(patternIds).toContain('similar-with-variations');
      expect(patternIds).toContain('copy-paste-blocks');
    });
  });

  describe('Code Generation', () => {
    it('should generate JavaScript code with massive duplication', () => {
      const result = duplicatron.generateCode({
        language: ProgrammingLanguage.JAVASCRIPT,
        category: ChallengeCategory.REFACTORING,
        difficulty: DifficultyLevel.INTERMEDIATE
      });

      expect(result.code).toContain('E-commerce Product Management');
      expect(result.code).toContain('function validateBook');
      expect(result.code).toContain('function validateMovie');
      expect(result.code).toContain('function validateGame');
    });

    it('should demonstrate identical function patterns', () => {
      const result = duplicatron.generateCode({
        language: ProgrammingLanguage.JAVASCRIPT,
        category: ChallengeCategory.REFACTORING,
        difficulty: DifficultyLevel.INTERMEDIATE
      });

      // Should have nearly identical validation functions
      expect(result.code).toContain('if (!book) {');
      expect(result.code).toContain('if (!movie) {');
      expect(result.code).toContain('if (!game) {');
      
      // Should have similar error messages
      expect(result.code).toContain('console.error(\'Book data is required\')');
      expect(result.code).toContain('console.error(\'Movie data is required\')');
      expect(result.code).toContain('console.error(\'Game data is required\')');
    });

    it('should include DRY-violation problems', () => {
      const result = duplicatron.generateCode({
        language: ProgrammingLanguage.JAVASCRIPT,
        category: ChallengeCategory.REFACTORING,
        difficulty: DifficultyLevel.INTERMEDIATE
      });

      expect(result.problems).toContain('Validation functions are nearly identical with only field names different');
      expect(result.problems).toContain('Product creation functions duplicate the same structure and logic');
      expect(result.problems).toContain('Update functions repeat the same find-and-update pattern');
    });

    it('should provide DRY-focused hints', () => {
      const result = duplicatron.generateCode({
        language: ProgrammingLanguage.JAVASCRIPT,
        category: ChallengeCategory.REFACTORING,
        difficulty: DifficultyLevel.INTERMEDIATE
      });

      expect(result.hints).toContain('Extract common validation logic into a generic validator');
      expect(result.hints).toContain('Create a base product factory with type-specific extensions');
      expect(result.hints).toContain('Implement a generic find-by-id-and-type function');
    });

    it('should generate more duplication for higher difficulty', () => {
      const hardResult = duplicatron.generateCode({
        language: ProgrammingLanguage.JAVASCRIPT,
        category: ChallengeCategory.REFACTORING,
        difficulty: DifficultyLevel.EXPERT
      });

      expect(hardResult.code).toContain('function deleteBook');
      expect(hardResult.code).toContain('function deleteMovie');
      expect(hardResult.code).toContain('function deleteGame');
      expect(hardResult.code).toContain('function searchBooks');
      expect(hardResult.code).toContain('function searchMovies');
      expect(hardResult.code).toContain('function searchGames');
    });

    it('should generate Python code with similar duplication patterns', () => {
      const result = duplicatron.generateCode({
        language: ProgrammingLanguage.PYTHON,
        category: ChallengeCategory.REFACTORING,
        difficulty: DifficultyLevel.INTERMEDIATE
      });

      expect(result.code).toContain('def validate_book');
      expect(result.code).toContain('def validate_movie');
      expect(result.code).toContain('def validate_game');
      expect(result.code).toContain('def create_book');
      expect(result.code).toContain('def create_movie');
      expect(result.code).toContain('def create_game');
    });
  });

  describe('Duplication Patterns', () => {
    it('should create functions with only minor variations', () => {
      const result = duplicatron.generateCode({
        language: ProgrammingLanguage.JAVASCRIPT,
        category: ChallengeCategory.REFACTORING,
        difficulty: DifficultyLevel.INTERMEDIATE
      });

      // Check that validation functions follow the same pattern
      const bookValidation = result.code.substring(
        result.code.indexOf('function validateBook'),
        result.code.indexOf('function validateMovie')
      );
      
      const movieValidation = result.code.substring(
        result.code.indexOf('function validateMovie'),
        result.code.indexOf('function validateGame')
      );

      // Should have similar structure but different field names
      expect(bookValidation).toContain('book.title');
      expect(bookValidation).toContain('book.price');
      expect(movieValidation).toContain('movie.title');
      expect(movieValidation).toContain('movie.price');
      
      // Should have similar validation patterns
      expect(bookValidation).toContain('trim() === \'\'');
      expect(movieValidation).toContain('trim() === \'\'');
    });

    it('should demonstrate copy-paste code blocks', () => {
      const result = duplicatron.generateCode({
        language: ProgrammingLanguage.JAVASCRIPT,
        category: ChallengeCategory.REFACTORING,
        difficulty: DifficultyLevel.INTERMEDIATE
      });

      // Should have repeated object creation patterns
      expect(result.code).toContain('Math.random().toString(36).substr(2, 9)');
      expect(result.code).toContain('createdAt: new Date()');
      expect(result.code).toContain('updatedAt: new Date()');
      expect(result.code).toContain('isActive: true');
      
      // These patterns should appear multiple times
      const randomIdMatches = result.code.match(/Math\.random\(\)\.toString\(36\)\.substr\(2, 9\)/g);
      expect(randomIdMatches).toBeDefined();
      expect(randomIdMatches!.length).toBeGreaterThan(2);
    });

    it('should require significant refactoring to eliminate duplication', () => {
      const result = duplicatron.generateCode({
        language: ProgrammingLanguage.JAVASCRIPT,
        category: ChallengeCategory.REFACTORING,
        difficulty: DifficultyLevel.INTERMEDIATE
      });

      expect(result.requirements).toContain('Eliminate duplicate validation logic across product types');
      expect(result.requirements).toContain('Create reusable functions for common operations (create, update, find)');
      expect(result.requirements).toContain('Reduce code duplication to less than 20% similarity between functions');
    });
  });
});