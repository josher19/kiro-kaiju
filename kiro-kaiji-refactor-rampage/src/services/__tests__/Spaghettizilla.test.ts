/**
 * Spaghettizilla Monster Unit Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Spaghettizilla } from '../monsters/Spaghettizilla';
import { KaijuType } from '@/types/kaiju';
import { ProgrammingLanguage, ChallengeCategory, DifficultyLevel } from '@/types/challenge';

describe('Spaghettizilla', () => {
  let spaghettizilla: Spaghettizilla;

  beforeEach(() => {
    spaghettizilla = new Spaghettizilla();
  });

  describe('Monster Properties', () => {
    it('should have correct basic properties', () => {
      expect(spaghettizilla.id).toBe('spaghettizilla-001');
      expect(spaghettizilla.name).toBe('Spaghettizilla');
      expect(spaghettizilla.type).toBe(KaijuType.SPAGHETTIZILLA);
      expect(spaghettizilla.avatar).toBe('🍝');
      expect(spaghettizilla.description).toContain('interdependent code');
      expect(spaghettizilla.flavorText).toContain('Everything is connected to everything else');
    });

    it('should have dependency-focused abilities and weaknesses', () => {
      expect(spaghettizilla.specialAbilities).toContain('Dependency Tangling: Creates circular and unclear dependencies between components');
      expect(spaghettizilla.specialAbilities).toContain('Data Flow Obfuscation: Makes it impossible to track how data moves through the system');
      expect(spaghettizilla.weaknesses).toContain('Separation of Concerns: Clear boundaries between different responsibilities');
      expect(spaghettizilla.weaknesses).toContain('Dependency Injection: Explicit and manageable dependencies');
    });

    it('should have tangled dependency code patterns', () => {
      const patternIds = spaghettizilla.codePatterns.map(p => p.id);
      expect(patternIds).toContain('circular-dependencies');
      expect(patternIds).toContain('global-state-mutation');
      expect(patternIds).toContain('unclear-data-flow');
    });
  });

  describe('Code Generation', () => {
    it('should generate JavaScript code with circular dependencies', () => {
      const result = spaghettizilla.generateCode({
        language: ProgrammingLanguage.JAVASCRIPT,
        category: ChallengeCategory.ARCHITECTURE,
        difficulty: DifficultyLevel.INTERMEDIATE
      });

      expect(result.code).toContain('Task Management System');
      expect(result.code).toContain('class UserManager');
      expect(result.code).toContain('class TaskManager');
      expect(result.code).toContain('class ProjectManager');
    });

    it('should demonstrate circular dependencies', () => {
      const result = spaghettizilla.generateCode({
        language: ProgrammingLanguage.JAVASCRIPT,
        category: ChallengeCategory.ARCHITECTURE,
        difficulty: DifficultyLevel.INTERMEDIATE
      });

      // Should show circular references being set up
      expect(result.code).toContain('this.taskManager = new TaskManager()');
      expect(result.code).toContain('this.projectManager = new ProjectManager()');
      expect(result.code).toContain('taskManager.setUserManager(userManager)');
      expect(result.code).toContain('userManager.taskManager = taskManager');
    });

    it('should demonstrate global state mutations', () => {
      const result = spaghettizilla.generateCode({
        language: ProgrammingLanguage.JAVASCRIPT,
        category: ChallengeCategory.ARCHITECTURE,
        difficulty: DifficultyLevel.INTERMEDIATE
      });

      // Should have global variables modified by multiple classes
      expect(result.code).toContain('let globalTasks = []');
      expect(result.code).toContain('let globalUsers = []');
      expect(result.code).toContain('let globalProjects = []');
      expect(result.code).toContain('let currentUser = null');
      
      // Should show these being modified from different places
      expect(result.code).toContain('globalTasks.push(task)');
      expect(result.code).toContain('globalUsers.push(user)');
      expect(result.code).toContain('globalProjects.push(project)');
    });

    it('should include tangled dependency problems', () => {
      const result = spaghettizilla.generateCode({
        language: ProgrammingLanguage.JAVASCRIPT,
        category: ChallengeCategory.ARCHITECTURE,
        difficulty: DifficultyLevel.INTERMEDIATE
      });

      expect(result.problems).toContain('Circular dependencies between UserManager, TaskManager, and ProjectManager');
      expect(result.problems).toContain('Global state modified by multiple classes unpredictably');
      expect(result.problems).toContain('Side effects scattered throughout all methods');
      expect(result.problems).toContain('Data flow is impossible to track due to cross-cutting modifications');
    });

    it('should provide architectural refactoring hints', () => {
      const result = spaghettizilla.generateCode({
        language: ProgrammingLanguage.JAVASCRIPT,
        category: ChallengeCategory.ARCHITECTURE,
        difficulty: DifficultyLevel.INTERMEDIATE
      });

      expect(result.hints).toContain('Use dependency injection instead of circular references');
      expect(result.hints).toContain('Implement event-driven architecture for loose coupling');
      expect(result.hints).toContain('Create clear data flow patterns (unidirectional)');
      expect(result.hints).toContain('Separate state management from business logic');
    });

    it('should generate additional complexity for higher difficulty', () => {
      const hardResult = spaghettizilla.generateCode({
        language: ProgrammingLanguage.JAVASCRIPT,
        category: ChallengeCategory.ARCHITECTURE,
        difficulty: DifficultyLevel.EXPERT
      });

      expect(hardResult.code).toContain('class NotificationManager');
      expect(hardResult.code).toContain('setInterval');
      expect(hardResult.problems.some(p => p.includes('NotificationManager creates additional circular dependencies'))).toBe(true);
    });

    it('should generate Python code with similar tangled patterns', () => {
      const result = spaghettizilla.generateCode({
        language: ProgrammingLanguage.PYTHON,
        category: ChallengeCategory.ARCHITECTURE,
        difficulty: DifficultyLevel.INTERMEDIATE
      });

      expect(result.code).toContain('class UserManager:');
      expect(result.code).toContain('class TaskManager:');
      expect(result.code).toContain('class ProjectManager:');
      expect(result.code).toContain('self.task_manager.user_manager = self');
    });
  });

  describe('Spaghetti Patterns', () => {
    it('should create unclear data flow', () => {
      const result = spaghettizilla.generateCode({
        language: ProgrammingLanguage.JAVASCRIPT,
        category: ChallengeCategory.ARCHITECTURE,
        difficulty: DifficultyLevel.INTERMEDIATE
      });

      // Should show data being modified in unexpected places
      expect(result.code).toContain('currentUser = user');
      expect(result.code).toContain('user.tasks.push(task.id)');
      expect(result.code).toContain('this.updateSystemSettings(user)');
      
      // Should show side effects
      expect(result.code).toContain('notificationQueue.push');
      expect(result.code).toContain('systemSettings.lastUserCreated');
    });

    it('should demonstrate tight coupling', () => {
      const result = spaghettizilla.generateCode({
        language: ProgrammingLanguage.JAVASCRIPT,
        category: ChallengeCategory.ARCHITECTURE,
        difficulty: DifficultyLevel.INTERMEDIATE
      });

      // Each class should reference the others
      expect(result.code).toContain('this.taskManager.assignDefaultTasks');
      expect(result.code).toContain('this.projectManager.createDefaultProject');
      expect(result.code).toContain('this.projectManager.addTaskToProject');
      expect(result.code).toContain('this.projectManager.updateProjectStats');
    });

    it('should create cascading side effects', () => {
      const result = spaghettizilla.generateCode({
        language: ProgrammingLanguage.JAVASCRIPT,
        category: ChallengeCategory.ARCHITECTURE,
        difficulty: DifficultyLevel.INTERMEDIATE
      });

      // Should show how one operation triggers many others
      expect(result.code).toContain('this.taskManager.assignDefaultTasks(user)');
      expect(result.code).toContain('this.projectManager.createDefaultProject(user)');
      expect(result.code).toContain('this.updateSystemSettings(user)');
      
      // And those operations should trigger more operations
      expect(result.code).toContain('this.projectManager.updateProjectStats()');
      expect(result.code).toContain('this.updateTaskStats()');
    });

    it('should require significant architectural refactoring', () => {
      const result = spaghettizilla.generateCode({
        language: ProgrammingLanguage.JAVASCRIPT,
        category: ChallengeCategory.ARCHITECTURE,
        difficulty: DifficultyLevel.INTERMEDIATE
      });

      expect(result.requirements).toContain('Eliminate circular dependencies between classes');
      expect(result.requirements).toContain('Implement clear separation of concerns');
      expect(result.requirements).toContain('Create predictable data flow patterns');
      expect(result.requirements).toContain('Reduce coupling between components');
      expect(result.requirements).toContain('Make the system testable by isolating dependencies');
    });
  });

  describe('Global State Chaos', () => {
    it('should show multiple classes modifying the same global state', () => {
      const result = spaghettizilla.generateCode({
        language: ProgrammingLanguage.JAVASCRIPT,
        category: ChallengeCategory.ARCHITECTURE,
        difficulty: DifficultyLevel.INTERMEDIATE
      });

      // Count how many times global variables are modified
      const globalTasksModifications = result.code.match(/globalTasks\s*[=\[\]\.]/g);
      const globalUsersModifications = result.code.match(/globalUsers\s*[=\[\]\.]/g);
      const globalProjectsModifications = result.code.match(/globalProjects\s*[=\[\]\.]/g);
      
      expect(globalTasksModifications).toBeDefined();
      expect(globalUsersModifications).toBeDefined();
      expect(globalProjectsModifications).toBeDefined();
      
      expect(globalTasksModifications!.length).toBeGreaterThan(3);
      expect(globalUsersModifications!.length).toBeGreaterThan(3);
      expect(globalProjectsModifications!.length).toBeGreaterThan(3);
    });

    it('should demonstrate unpredictable state changes', () => {
      const result = spaghettizilla.generateCode({
        language: ProgrammingLanguage.JAVASCRIPT,
        category: ChallengeCategory.ARCHITECTURE,
        difficulty: DifficultyLevel.INTERMEDIATE
      });

      // Should show state being modified as side effects
      expect(result.code).toContain('currentUser = user');
      expect(result.code).toContain('systemSettings.lastUserCreated = user.id');
      expect(result.code).toContain('systemSettings.totalUsers = globalUsers.length');
    });
  });
});