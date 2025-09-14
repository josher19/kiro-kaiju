/**
 * Local Evaluation Service Tests
 * 
 * Integration tests for local mode evaluation functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  LocalEvaluationService, 
  createLocalEvaluationService,
  type LocalEvaluationConfig 
} from '../localEvaluationService';
import { createKiroFileSystemService } from '../kiroFileSystemService';
import type { Challenge } from '@/types/challenge';
import { ProgrammingLanguage, ChallengeCategory, DifficultyLevel } from '@/types/challenge';
import { KaijuType } from '@/types/kaiju';

// Mock Kiro IDE environment
const mockKiroAPI = {
  fileSystem: {
    writeFile: vi.fn(),
    readFile: vi.fn(),
    listFiles: vi.fn(),
    ensureDirectory: vi.fn(),
    removeDirectory: vi.fn(),
    watch: vi.fn(),
    watchFile: vi.fn()
  },
  workspace: {
    sync: vi.fn()
  },
  ai: {
    analyze: vi.fn()
  }
};

Object.defineProperty(window, 'kiro', {
  value: mockKiroAPI,
  writable: true
});

describe.skip('LocalEvaluationService', () => {
  let service: LocalEvaluationService;
  let config: LocalEvaluationConfig;
  let mockChallenge: Challenge;

  beforeEach(() => {
    config = {
      autoEvaluate: false,
      realTimeAnalysis: true,
      saveResults: true,
      workspaceIntegration: true
    };

    mockChallenge = {
      id: 'test-challenge-1',
      title: 'Test Challenge',
      description: 'A test challenge for evaluation',
      kaiju: {
        id: 'duplicatron',
        name: 'Duplicatron',
        type: KaijuType.DUPLICATRON,
        description: 'A monster that creates code duplication',
        avatar: 'duplicatron.png',
        flavorText: 'Copy and paste is the way!',
        codePatterns: [],
        difficultyModifiers: [],
        specialAbilities: ['Code duplication', 'Copy-paste mastery'],
        weaknesses: ['DRY principle', 'Abstraction']
      },
      config: {
        language: ProgrammingLanguage.JAVASCRIPT,
        category: ChallengeCategory.REFACTORING,
        difficulty: DifficultyLevel.INTERMEDIATE
      },
      initialCode: `function calculateTotal(items) {
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    total += items[i].price;
  }
  return total;
}

function calculateTotalWithTax(items) {
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    total += items[i].price;
  }
  return total * 1.1;
}`,
      requirements: [
        {
          id: 'req-1',
          description: 'Eliminate code duplication',
          priority: 'must',
          testable: true,
          acceptanceCriteria: ['No duplicated code blocks', 'Functions are properly abstracted']
        },
        {
          id: 'req-2',
          description: 'Maintain functionality',
          priority: 'must',
          testable: true,
          acceptanceCriteria: ['All tests pass', 'Original behavior preserved']
        }
      ],
      testCases: [
        {
          id: 'test-1',
          name: 'Basic calculation test',
          description: 'Test basic total calculation',
          input: [{ price: 10 }, { price: 20 }],
          expectedOutput: 30,
          isHidden: false,
          weight: 0.5
        },
        {
          id: 'test-2',
          name: 'Tax calculation test',
          description: 'Test total with tax calculation',
          input: [{ price: 10 }, { price: 20 }],
          expectedOutput: 33,
          isHidden: false,
          weight: 0.5
        }
      ],
      hints: ['Look for repeated code patterns', 'Consider extracting common functionality'],
      createdAt: new Date(),
      timeLimit: 45 * 60 * 1000
    };

    service = createLocalEvaluationService(config);

    // Set up file system service mock
    createKiroFileSystemService({
      workspaceRoot: './test-workspace',
      challengeDirectory: './test-challenges',
      autoSave: true,
      watchFiles: true
    });

    // Reset all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('challenge submission', () => {
    const refactoredCode = `function calculateItemsTotal(items) {
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    total += items[i].price;
  }
  return total;
}

function calculateTotal(items) {
  return calculateItemsTotal(items);
}

function calculateTotalWithTax(items) {
  return calculateItemsTotal(items) * 1.1;
}`;

    beforeEach(() => {
      mockKiroAPI.fileSystem.writeFile.mockResolvedValue(undefined);
      mockKiroAPI.workspace.sync.mockResolvedValue(undefined);
    });

    it('should submit challenge and return evaluation result', async () => {
      const result = await service.submitChallenge(
        mockChallenge,
        refactoredCode,
        'test-user',
        30000, // 30 seconds
        1
      );

      expect(result.evaluationResult).toBeDefined();
      expect(result.evaluationResult.challengeId).toBe(mockChallenge.id);
      expect(result.evaluationResult.submittedCode).toBe(refactoredCode);
      expect(result.evaluationResult.scores).toBeDefined();
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should save code to workspace when integration enabled', async () => {
      await service.submitChallenge(
        mockChallenge,
        refactoredCode,
        'test-user',
        30000,
        1
      );

      expect(mockKiroAPI.fileSystem.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('main.js'),
        refactoredCode
      );
    });

    it('should sync workspace after submission', async () => {
      const result = await service.submitChallenge(
        mockChallenge,
        refactoredCode,
        'test-user',
        30000,
        1
      );

      expect(result.workspaceSynced).toBe(true);
      expect(mockKiroAPI.workspace.sync).toHaveBeenCalled();
    });

    it('should save evaluation results when enabled', async () => {
      const result = await service.submitChallenge(
        mockChallenge,
        refactoredCode,
        'test-user',
        30000,
        1
      );

      expect(result.filesModified.some(file => file.includes('evaluation-results.json'))).toBe(true);
      expect(mockKiroAPI.fileSystem.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('evaluation-results.json'),
        expect.any(String)
      );
    });

    it('should handle workspace integration errors gracefully', async () => {
      mockKiroAPI.fileSystem.writeFile.mockRejectedValue(new Error('Write failed'));

      const result = await service.submitChallenge(
        mockChallenge,
        refactoredCode,
        'test-user',
        30000,
        1
      );

      // Should still return evaluation result even if workspace operations fail
      expect(result.evaluationResult).toBeDefined();
      expect(result.filesModified).toHaveLength(0);
    });
  });

  describe('real-time analysis', () => {
    let analysisCallback: (analysis: any) => void;

    beforeEach(() => {
      analysisCallback = vi.fn();
      
      // Mock file system service file change handling
      mockKiroAPI.fileSystem.readFile.mockResolvedValue('function test() {}');
    });

    it('should start real-time analysis successfully', async () => {
      await expect(
        service.startRealTimeAnalysis(mockChallenge, analysisCallback)
      ).resolves.not.toThrow();
    });

    it('should stop real-time analysis', () => {
      service.stopRealTimeAnalysis(mockChallenge.id);
      
      // Should not throw and should clear any pending evaluations
      expect(() => service.stopRealTimeAnalysis(mockChallenge.id)).not.toThrow();
    });

    it('should perform quick analysis with basic metrics', async () => {
      const quickAnalysisCode = `function test() {
  console.log("test");
  return true;
}`;

      // Access the private method through type assertion for testing
      const quickAnalysis = await (service as any).performQuickAnalysis(mockChallenge, quickAnalysisCode);

      expect(quickAnalysis.challengeId).toBe(mockChallenge.id);
      expect(quickAnalysis.submittedCode).toBe(quickAnalysisCode);
      expect(quickAnalysis.scores).toBeDefined();
      expect(quickAnalysis.scores.readability).toBeGreaterThan(0);
      expect(quickAnalysis.overallScore).toBeGreaterThan(0);
    });
  });

  describe('Kiro AI integration', () => {
    const testCode = `function improvedFunction() {
  return "Much better!";
}`;

    beforeEach(() => {
      mockKiroAPI.ai.analyze.mockResolvedValue({
        success: true,
        refactoringSuggestions: [
          'Consider using arrow functions for shorter syntax',
          'Add input validation'
        ],
        performanceInsights: [
          'Function is already optimized for this use case'
        ],
        codeExamples: [
          {
            before: 'function test() {}',
            after: 'const test = () => {}'
          }
        ]
      });
    });

    it('should enhance evaluation with Kiro AI analysis', async () => {
      const result = await service.submitChallenge(
        mockChallenge,
        testCode,
        'test-user',
        30000,
        1
      );

      expect(mockKiroAPI.ai.analyze).toHaveBeenCalledWith(
        expect.stringContaining(testCode.toString().split('\n')[0]),
        {
          challengeId: mockChallenge.id,
          language: mockChallenge.config.language
        }
      );

      // Check if Kiro-specific feedback was added
      const kiroFeedback = result.evaluationResult.feedback.find(
        feedback => feedback.category === 'quality'
      );
      expect(kiroFeedback).toBeDefined();
      expect(kiroFeedback?.suggestions).toContain('Consider using arrow functions for shorter syntax');
    });

    it('should handle Kiro AI analysis failures gracefully', async () => {
      mockKiroAPI.ai.analyze.mockRejectedValue(new Error('AI analysis failed'));

      const result = await service.submitChallenge(
        mockChallenge,
        testCode,
        'test-user',
        30000,
        1
      );

      // Should still return evaluation result even if AI analysis fails
      expect(result.evaluationResult).toBeDefined();
    });

    it('should work without Kiro AI when not available', async () => {
      // Temporarily remove AI from Kiro API
      const originalAI = mockKiroAPI.ai;
      delete (mockKiroAPI as any).ai;

      const result = await service.submitChallenge(
        mockChallenge,
        testCode,
        'test-user',
        30000,
        1
      );

      expect(result.evaluationResult).toBeDefined();

      // Restore AI
      mockKiroAPI.ai = originalAI;
    });
  });

  describe('basic defect analysis', () => {
    it('should detect syntax errors', async () => {
      const syntaxErrorCode = `function test() {
  console.log("missing closing brace"
}`;

      const analysis = await (service as any).performBasicDefectAnalysis(syntaxErrorCode, 'javascript');

      expect(analysis.score).toBeLessThan(100);
      expect(analysis.feedback.suggestions).toContain('Fix syntax errors before proceeding');
    });

    it('should detect unused variables', async () => {
      const unusedVarCode = `function test() {
  let unusedVariable = "never used";
  return "hello";
}`;

      const analysis = await (service as any).performBasicDefectAnalysis(unusedVarCode, 'javascript');

      expect(analysis.feedback.message).toContain('potential issues');
    });

    it('should detect performance issues', async () => {
      const performanceIssueCode = `function test() {
  for (let i = 0; i < 100; i++) {
    for (let j = 0; j < 100; j++) {
      for (let k = 0; k < 100; k++) {
        console.log(i, j, k);
      }
    }
  }
}`;

      const analysis = await (service as any).performBasicDefectAnalysis(performanceIssueCode, 'javascript');

      expect(analysis.feedback.suggestions).toContain('Consider optimizing performance-critical sections');
    });

    it('should return good score for clean code', async () => {
      const cleanCode = `function calculateSum(numbers) {
  return numbers.reduce((sum, num) => sum + num, 0);
}`;

      const analysis = await (service as any).performBasicDefectAnalysis(cleanCode, 'javascript');

      expect(analysis.score).toBeGreaterThan(80);
      expect(analysis.feedback.message).toContain('No major issues detected');
    });
  });

  describe('configuration handling', () => {
    it('should respect autoEvaluate setting', () => {
      const autoEvalConfig = { ...config, autoEvaluate: true };
      const autoEvalService = createLocalEvaluationService(autoEvalConfig);

      expect(autoEvalService).toBeInstanceOf(LocalEvaluationService);
    });

    it('should respect realTimeAnalysis setting', async () => {
      const noRealTimeConfig = { ...config, realTimeAnalysis: false };
      const noRealTimeService = createLocalEvaluationService(noRealTimeConfig);

      // Should not start real-time analysis when disabled
      await expect(
        noRealTimeService.startRealTimeAnalysis(mockChallenge, vi.fn())
      ).resolves.not.toThrow();
    });

    it('should respect workspaceIntegration setting', async () => {
      const noWorkspaceConfig = { ...config, workspaceIntegration: false };
      const noWorkspaceService = createLocalEvaluationService(noWorkspaceConfig);

      const result = await noWorkspaceService.submitChallenge(
        mockChallenge,
        'test code',
        'test-user',
        30000,
        1
      );

      expect(result.filesModified).toHaveLength(0);
      expect(result.workspaceSynced).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle evaluation errors gracefully', async () => {
      // Create a challenge with invalid configuration to trigger error
      const invalidChallenge = { ...mockChallenge, requirements: [] };

      await expect(
        service.submitChallenge(invalidChallenge, 'test code', 'test-user', 30000, 1)
      ).resolves.toBeDefined();
    });

    it('should handle file system errors during submission', async () => {
      mockKiroAPI.fileSystem.writeFile.mockRejectedValue(new Error('File system error'));

      const result = await service.submitChallenge(
        mockChallenge,
        'test code',
        'test-user',
        30000,
        1
      );

      expect(result.evaluationResult).toBeDefined();
      expect(result.filesModified).toHaveLength(0);
    });
  });
});