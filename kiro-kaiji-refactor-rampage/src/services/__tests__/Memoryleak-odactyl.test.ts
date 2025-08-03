/**
 * Memoryleak-odactyl Monster Unit Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryleakOdactyl } from '../monsters/Memoryleak-odactyl';
import { KaijuType } from '@/types/kaiju';
import { ProgrammingLanguage, ChallengeCategory, DifficultyLevel } from '@/types/challenge';

describe('MemoryleakOdactyl', () => {
  let memoryleakOdactyl: MemoryleakOdactyl;

  beforeEach(() => {
    memoryleakOdactyl = new MemoryleakOdactyl();
  });

  describe('Monster Properties', () => {
    it('should have correct basic properties', () => {
      expect(memoryleakOdactyl.id).toBe('memoryleak-odactyl-001');
      expect(memoryleakOdactyl.name).toBe('Memoryleak-odactyl');
      expect(memoryleakOdactyl.type).toBe(KaijuType.MEMORYLEAK_ODACTYL);
      expect(memoryleakOdactyl.avatar).toBe('🦕💾');
      expect(memoryleakOdactyl.description).toContain('hoards resources');
      expect(memoryleakOdactyl.flavorText).toContain('My memory is eternal');
    });

    it('should have memory-focused abilities and weaknesses', () => {
      expect(memoryleakOdactyl.specialAbilities).toContain('Resource Hoarding: Creates references that are never cleaned up');
      expect(memoryleakOdactyl.specialAbilities).toContain('Event Listener Accumulation: Adds listeners without removing them');
      expect(memoryleakOdactyl.weaknesses).toContain('Proper Cleanup: Explicitly removing references and listeners');
      expect(memoryleakOdactyl.weaknesses).toContain('Weak References: Using weak references where appropriate');
    });

    it('should have memory leak code patterns', () => {
      const patternIds = memoryleakOdactyl.codePatterns.map(p => p.id);
      expect(patternIds).toContain('uncleaned-event-listeners');
      expect(patternIds).toContain('circular-references');
      expect(patternIds).toContain('closure-memory-leaks');
    });
  });

  describe('Code Generation', () => {
    it('should generate JavaScript code with memory leaks', () => {
      const result = memoryleakOdactyl.generateCode({
        language: ProgrammingLanguage.JAVASCRIPT,
        category: ChallengeCategory.PERFORMANCE_OPTIMIZATION,
        difficulty: DifficultyLevel.INTERMEDIATE
      });

      expect(result.code).toContain('Data Visualization Dashboard');
      expect(result.code).toContain('class DataDashboard');
      expect(result.code).toContain('addEventListener');
      expect(result.code).toContain('setInterval');
    });

    it('should demonstrate uncleaned event listeners', () => {
      const result = memoryleakOdactyl.generateCode({
        language: ProgrammingLanguage.JAVASCRIPT,
        category: ChallengeCategory.PERFORMANCE_OPTIMIZATION,
        difficulty: DifficultyLevel.INTERMEDIATE
      });

      // Should have event listeners that are never removed
      expect(result.code).toContain('window.addEventListener(\'resize\'');
      expect(result.code).toContain('document.addEventListener(\'click\'');
      expect(result.code).toContain('chart.element.addEventListener(\'mouseover\'');
      
      // Should NOT have corresponding removeEventListener calls
      expect(result.code).not.toContain('removeEventListener');
    });

    it('should demonstrate timer leaks', () => {
      const result = memoryleakOdactyl.generateCode({
        language: ProgrammingLanguage.JAVASCRIPT,
        category: ChallengeCategory.PERFORMANCE_OPTIMIZATION,
        difficulty: DifficultyLevel.INTERMEDIATE
      });

      // Should have timers that are never cleared
      expect(result.code).toContain('setInterval(');
      expect(result.code).toContain('setTimeout(');
      
      // Should NOT have corresponding clear calls
      expect(result.code).not.toContain('clearInterval');
      expect(result.code).not.toContain('clearTimeout');
    });

    it('should demonstrate circular references', () => {
      const result = memoryleakOdactyl.generateCode({
        language: ProgrammingLanguage.JAVASCRIPT,
        category: ChallengeCategory.PERFORMANCE_OPTIMIZATION,
        difficulty: DifficultyLevel.INTERMEDIATE
      });

      // Should create circular references
      expect(result.code).toContain('dashboard: this');
      expect(result.code).toContain('chart.neighbors = this.charts.filter');
      expect(result.code).toContain('charts: this.charts');
    });

    it('should include memory leak problems', () => {
      const result = memoryleakOdactyl.generateCode({
        language: ProgrammingLanguage.JAVASCRIPT,
        category: ChallengeCategory.PERFORMANCE_OPTIMIZATION,
        difficulty: DifficultyLevel.INTERMEDIATE
      });

      expect(result.problems).toContain('Event listeners added but never removed (window, document, DOM elements)');
      expect(result.problems).toContain('Timers and intervals that run indefinitely');
      expect(result.problems).toContain('Circular references between objects preventing garbage collection');
      expect(result.problems).toContain('Data cache that grows indefinitely without cleanup');
    });

    it('should provide memory management hints', () => {
      const result = memoryleakOdactyl.generateCode({
        language: ProgrammingLanguage.JAVASCRIPT,
        category: ChallengeCategory.PERFORMANCE_OPTIMIZATION,
        difficulty: DifficultyLevel.INTERMEDIATE
      });

      expect(result.hints).toContain('Implement a destroy/cleanup method that removes all listeners and references');
      expect(result.hints).toContain('Use WeakMap and WeakSet for caches that should allow garbage collection');
      expect(result.hints).toContain('Clear timers and intervals when components are destroyed');
      expect(result.hints).toContain('Disconnect MutationObservers when no longer needed');
    });

    it('should generate additional complexity for higher difficulty', () => {
      const hardResult = memoryleakOdactyl.generateCode({
        language: ProgrammingLanguage.JAVASCRIPT,
        category: ChallengeCategory.PERFORMANCE_OPTIMIZATION,
        difficulty: DifficultyLevel.EXPERT
      });

      expect(hardResult.code).toContain('class DataProcessor');
      expect(hardResult.code).toContain('new Worker');
      expect(hardResult.code).toContain('Promise.resolve');
      expect(hardResult.problems.some(p => p.includes('Web Workers that are never terminated'))).toBe(true);
    });

    it('should generate Python code with memory leaks', () => {
      const result = memoryleakOdactyl.generateCode({
        language: ProgrammingLanguage.PYTHON,
        category: ChallengeCategory.PERFORMANCE_OPTIMIZATION,
        difficulty: DifficultyLevel.INTERMEDIATE
      });

      expect(result.code).toContain('class DataProcessor:');
      expect(result.code).toContain('threading.Thread');
      expect(result.code).toContain('threading.Timer');
      expect(result.code).toContain('while True:');
    });
  });

  describe('Memory Leak Patterns', () => {
    it('should demonstrate cache that grows indefinitely', () => {
      const result = memoryleakOdactyl.generateCode({
        language: ProgrammingLanguage.JAVASCRIPT,
        category: ChallengeCategory.PERFORMANCE_OPTIMIZATION,
        difficulty: DifficultyLevel.INTERMEDIATE
      });

      // Should show cache being populated but never cleaned
      expect(result.code).toContain('this.dataCache.set');
      expect(result.code).toContain('Cache size:');
      
      // Should NOT have cache cleanup logic
      expect(result.code).not.toContain('dataCache.delete');
      expect(result.code).not.toContain('dataCache.clear');
    });

    it('should demonstrate DOM element accumulation', () => {
      const result = memoryleakOdactyl.generateCode({
        language: ProgrammingLanguage.JAVASCRIPT,
        category: ChallengeCategory.PERFORMANCE_OPTIMIZATION,
        difficulty: DifficultyLevel.INTERMEDIATE
      });

      // Should create DOM elements
      expect(result.code).toContain('document.createElement');
      expect(result.code).toContain('document.body.appendChild');
      
      // Should NOT remove them
      expect(result.code).not.toContain('removeChild');
      expect(result.code).not.toContain('element.remove()');
    });

    it('should demonstrate closure memory leaks', () => {
      const result = memoryleakOdactyl.generateCode({
        language: ProgrammingLanguage.JAVASCRIPT,
        category: ChallengeCategory.PERFORMANCE_OPTIMIZATION,
        difficulty: DifficultyLevel.INTERMEDIATE
      });

      // Should show closures capturing large objects
      expect(result.code).toContain('() => {');
      expect(result.code).toContain('this.handleResize');
      expect(result.code).toContain('this.handleGlobalClick');
      
      // Should capture 'this' and other large objects in closures
      expect(result.code).toContain('dashboard: this');
      expect(result.code).toContain('charts: this.charts');
    });

    it('should demonstrate observer leaks', () => {
      const result = memoryleakOdactyl.generateCode({
        language: ProgrammingLanguage.JAVASCRIPT,
        category: ChallengeCategory.PERFORMANCE_OPTIMIZATION,
        difficulty: DifficultyLevel.INTERMEDIATE
      });

      // Should create observers
      expect(result.code).toContain('new MutationObserver');
      expect(result.code).toContain('observer.observe');
      expect(result.code).toContain('this.observers.push(observer)');
      
      // Should NOT disconnect them
      expect(result.code).not.toContain('observer.disconnect');
    });

    it('should show missing cleanup method', () => {
      const result = memoryleakOdactyl.generateCode({
        language: ProgrammingLanguage.JAVASCRIPT,
        category: ChallengeCategory.PERFORMANCE_OPTIMIZATION,
        difficulty: DifficultyLevel.INTERMEDIATE
      });

      // Should have a commented out destroy method to highlight the missing cleanup
      expect(result.code).toContain('// Missing cleanup method!');
      expect(result.code).toContain('// destroy() {');
      expect(result.code).toContain('// Should clean up all references, listeners, timers, observers');
    });

    it('should require comprehensive cleanup implementation', () => {
      const result = memoryleakOdactyl.generateCode({
        language: ProgrammingLanguage.JAVASCRIPT,
        category: ChallengeCategory.PERFORMANCE_OPTIMIZATION,
        difficulty: DifficultyLevel.INTERMEDIATE
      });

      expect(result.requirements).toContain('Implement proper cleanup for all event listeners');
      expect(result.requirements).toContain('Add bounds to data caches and implement cleanup strategies');
      expect(result.requirements).toContain('Fix circular references between objects');
      expect(result.requirements).toContain('Properly manage DOM element lifecycle');
      expect(result.requirements).toContain('Implement a destroy method that cleans up all resources');
    });
  });

  describe('Advanced Memory Leaks', () => {
    it('should demonstrate Web Worker leaks for higher difficulty', () => {
      const result = memoryleakOdactyl.generateCode({
        language: ProgrammingLanguage.JAVASCRIPT,
        category: ChallengeCategory.PERFORMANCE_OPTIMIZATION,
        difficulty: DifficultyLevel.EXPERT
      });

      expect(result.code).toContain('new Worker(\'data-worker.js\')');
      expect(result.code).toContain('this.workers.push(worker)');
      expect(result.code).toContain('// Workers never terminated!');
      
      expect(result.problems).toContain('Web Workers that are never terminated');
      expect(result.hints).toContain('Terminate Web Workers when processing is complete');
    });

    it('should demonstrate Promise chain leaks for higher difficulty', () => {
      const result = memoryleakOdactyl.generateCode({
        language: ProgrammingLanguage.JAVASCRIPT,
        category: ChallengeCategory.PERFORMANCE_OPTIMIZATION,
        difficulty: DifficultyLevel.EXPERT
      });

      expect(result.code).toContain('Promise.resolve(processedData)');
      expect(result.code).toContain('.then(result => {');
      expect(result.code).toContain('// Captures this, worker, dashboard');
      
      expect(result.problems).toContain('Promise chains that capture large scope objects');
    });
  });

  describe('Python Memory Leaks', () => {
    it('should demonstrate thread leaks in Python', () => {
      const result = memoryleakOdactyl.generateCode({
        language: ProgrammingLanguage.PYTHON,
        category: ChallengeCategory.PERFORMANCE_OPTIMIZATION,
        difficulty: DifficultyLevel.INTERMEDIATE
      });

      expect(result.code).toContain('threading.Thread(target=self.continuous_processing)');
      expect(result.code).toContain('worker_thread.daemon = False');
      expect(result.code).toContain('while True:  # Infinite loop - never stops!');
      
      expect(result.problems).toContain('Threads that run infinite loops without stop conditions');
    });

    it('should demonstrate timer accumulation in Python', () => {
      const result = memoryleakOdactyl.generateCode({
        language: ProgrammingLanguage.PYTHON,
        category: ChallengeCategory.PERFORMANCE_OPTIMIZATION,
        difficulty: DifficultyLevel.INTERMEDIATE
      });

      expect(result.code).toContain('threading.Timer(1.0, self.periodic_cleanup)');
      expect(result.code).toContain('self.timers.append(timer)  # Accumulating timers!');
      
      expect(result.problems).toContain('Timers that accumulate without being cancelled');
    });
  });
});