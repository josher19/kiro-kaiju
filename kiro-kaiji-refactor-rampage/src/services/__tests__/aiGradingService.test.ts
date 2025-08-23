/**
 * AI Grading Service Tests
 * 
 * Comprehensive tests for AI-based multi-role grading system
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { AIGradingService, createAIGradingService } from '../aiGradingService';
import { useUserProgressStore } from '@/stores/userProgressStore';
import { GradingRole } from '@/types/api';
import type { Challenge } from '@/types/challenge';
import type { KaijuMonster } from '@/types/kaiju';
import { KaijuType } from '@/types/kaiju';
import { ProgrammingLanguage, ChallengeCategory, DifficultyLevel } from '@/types/challenge';

// Mock the AI service
vi.mock('../aiService', () => ({
  getAIService: vi.fn(() => ({
    sendMessage: vi.fn(),
    config: {
      provider: 'local-llm',
      localLLM: {
        endpoint: 'http://localhost:1234/v1'
      }
    }
  }))
}));

// Mock fetch for API calls
global.fetch = vi.fn();

describe('AIGradingService', () => {
  let gradingService: AIGradingService;
  let userProgressStore: ReturnType<typeof useUserProgressStore>;
  let mockChallenge: Challenge;
  let mockKaiju: KaijuMonster;

  beforeEach(() => {
    // Setup Pinia
    const pinia = createPinia();
    setActivePinia(pinia);
    userProgressStore = useUserProgressStore();

    // Initialize user progress
    userProgressStore.initializeProgress('test-user', 'Test User');

    // Create grading service instance
    gradingService = createAIGradingService(100); // Short delay for tests

    // Mock challenge data
    mockKaiju = {
      id: 'hydra-bug',
      name: 'HydraBug',
      type: KaijuType.HYDRA_BUG,
      description: 'A monster that creates bugs when you fix bugs',
      avatar: '/images/kaiju/hydra-bug.png',
      difficulty: 2,
      codePatterns: [],
      hints: []
    };

    mockChallenge = {
      id: 'test-challenge-1',
      kaiju: mockKaiju,
      config: {
        language: ProgrammingLanguage.JAVASCRIPT,
        category: ChallengeCategory.BUG_FIXING,
        difficulty: DifficultyLevel.INTERMEDIATE
      },
      title: 'Fix the HydraBug',
      description: 'Fix bugs without creating new ones',
      initialCode: 'function buggyCode() { return "bugs"; }',
      requirements: [
        {
          id: 'req-1',
          description: 'Fix all existing bugs',
          priority: 'must',
          testable: true,
          acceptanceCriteria: ['No runtime errors', 'All tests pass']
        },
        {
          id: 'req-2',
          description: 'Maintain existing functionality',
          priority: 'must',
          testable: true,
          acceptanceCriteria: ['Original behavior preserved']
        }
      ],
      testCases: [],
      hints: [],
      createdAt: new Date()
    };

    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Model Detection and Selection', () => {
    it('should query /v1/models endpoint for local LLM', async () => {
      const mockModelsResponse = {
        data: [
          { id: 'local-model-1' },
          { id: 'local-model-2' }
        ]
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockModelsResponse)
      });

      const models = await gradingService['getAvailableModels']();
      
      expect(fetch).toHaveBeenCalledWith('http://localhost:1234/v1/models');
      expect(models).toEqual(['local-model-1', 'local-model-2']);
    });

    it('should handle single model scenario', () => {
      const availableModels = ['single-model'];
      const strategy = gradingService['selectModelsForRoles'](availableModels);

      expect(strategy.modelAssignments[GradingRole.DEVELOPER]).toBe('single-model');
      expect(strategy.modelAssignments[GradingRole.ARCHITECT]).toBe('single-model');
      expect(strategy.modelAssignments[GradingRole.SQA]).toBe('single-model');
      expect(strategy.modelAssignments[GradingRole.PRODUCT_OWNER]).toBe('single-model');
    });

    it('should handle multiple model scenario', () => {
      const availableModels = ['model-1', 'model-2', 'model-3'];
      const strategy = gradingService['selectModelsForRoles'](availableModels);

      expect(strategy.modelAssignments[GradingRole.DEVELOPER]).toBe('model-1');
      expect(strategy.modelAssignments[GradingRole.ARCHITECT]).toBe('model-2');
      expect(strategy.modelAssignments[GradingRole.SQA]).toBe('model-3');
      expect(strategy.modelAssignments[GradingRole.PRODUCT_OWNER]).toBe('model-1'); // Cycles back
    });

    it('should fallback to default model when API fails', async () => {
      (fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const models = await gradingService['getAvailableModels']();
      
      expect(models).toEqual(['default-model']);
    });
  });

  describe('Role-Specific Evaluation', () => {
    it('should build correct prompt for Developer role', () => {
      const code = 'function test() { return "hello"; }';
      const requirements = ['Fix bugs', 'Add tests'];
      const promptConfig = gradingService['gradingPrompts'][GradingRole.DEVELOPER];

      const prompt = gradingService['buildRoleEvaluationPrompt'](
        code,
        GradingRole.DEVELOPER,
        requirements,
        mockChallenge,
        promptConfig
      );

      expect(prompt).toContain('Senior Software Developer');
      expect(prompt).toContain('code quality');
      expect(prompt).toContain('best practices');
      expect(prompt).toContain('maintainability');
      expect(prompt).toContain('SCORE: [0-100]');
      expect(prompt).toContain(code);
    });

    it('should build correct prompt for Architect role', () => {
      const code = 'function test() { return "hello"; }';
      const requirements = ['Design scalable solution'];
      const promptConfig = gradingService['gradingPrompts'][GradingRole.ARCHITECT];

      const prompt = gradingService['buildRoleEvaluationPrompt'](
        code,
        GradingRole.ARCHITECT,
        requirements,
        mockChallenge,
        promptConfig
      );

      expect(prompt).toContain('Software Architect');
      expect(prompt).toContain('system design');
      expect(prompt).toContain('scalability');
      expect(prompt).toContain('design patterns');
      expect(prompt).toContain('architectural decisions');
    });

    it('should build correct prompt for SQA role', () => {
      const code = 'function test() { return "hello"; }';
      const requirements = ['Ensure quality'];
      const promptConfig = gradingService['gradingPrompts'][GradingRole.SQA];

      const prompt = gradingService['buildRoleEvaluationPrompt'](
        code,
        GradingRole.SQA,
        requirements,
        mockChallenge,
        promptConfig
      );

      expect(prompt).toContain('Quality Assurance Engineer');
      expect(prompt).toContain('defect detection');
      expect(prompt).toContain('edge cases');
      expect(prompt).toContain('testing coverage');
      expect(prompt).toContain('quality assurance');
    });

    it('should build correct prompt for Product Owner role', () => {
      const code = 'function test() { return "hello"; }';
      const requirements = ['Meet user needs'];
      const promptConfig = gradingService['gradingPrompts'][GradingRole.PRODUCT_OWNER];

      const prompt = gradingService['buildRoleEvaluationPrompt'](
        code,
        GradingRole.PRODUCT_OWNER,
        requirements,
        mockChallenge,
        promptConfig
      );

      expect(prompt).toContain('Product Owner');
      expect(prompt).toContain('requirement fulfillment');
      expect(prompt).toContain('user experience');
      expect(prompt).toContain('business value');
      expect(prompt).toContain('feature completeness');
    });
  });

  describe('AI Response Parsing', () => {
    it('should parse well-formatted AI response', () => {
      const aiResponse = `
SCORE: 85

FEEDBACK:
The code demonstrates good practices with clear variable naming and proper error handling. However, there are opportunities for improvement in modularity and test coverage.

DETAILED ANALYSIS:
The implementation shows solid understanding of the requirements. The code structure is clean and follows most best practices. Areas for improvement include:
1. Adding more comprehensive error handling
2. Improving code modularity
3. Adding unit tests
      `;

      const result = gradingService['parseAIEvaluationResponse'](aiResponse, GradingRole.DEVELOPER);

      expect(result.score).toBe(85);
      expect(result.feedback).toContain('good practices');
      expect(result.detailedAnalysis).toContain('solid understanding');
    });

    it('should handle malformed AI response gracefully', () => {
      const aiResponse = 'This is a malformed response without proper sections';

      const result = gradingService['parseAIEvaluationResponse'](aiResponse, GradingRole.DEVELOPER);

      expect(result.score).toBe(50); // Fallback score
      expect(result.feedback).toContain('developer evaluation completed');
      expect(result.detailedAnalysis).toContain(aiResponse);
    });

    it('should clamp scores to valid range', () => {
      const aiResponse = 'SCORE: 150\nFEEDBACK: Great work!';

      const result = gradingService['parseAIEvaluationResponse'](aiResponse, GradingRole.DEVELOPER);

      expect(result.score).toBe(100); // Clamped to maximum
    });

    it('should handle negative scores', () => {
      const aiResponse = 'SCORE: -10\nFEEDBACK: Needs work';

      const result = gradingService['parseAIEvaluationResponse'](aiResponse, GradingRole.DEVELOPER);

      expect(result.score).toBe(0); // Clamped to minimum
    });
  });

  describe('Score Calculation', () => {
    it('should calculate correct average score', () => {
      const roleEvaluations = [
        { role: GradingRole.DEVELOPER, score: 80 },
        { role: GradingRole.ARCHITECT, score: 75 },
        { role: GradingRole.SQA, score: 85 },
        { role: GradingRole.PRODUCT_OWNER, score: 90 }
      ] as any[];

      const average = gradingService['calculateAverageScore'](roleEvaluations);

      expect(average).toBe(83); // (80 + 75 + 85 + 90) / 4 = 82.5, rounded to 83
    });

    it('should handle empty evaluations array', () => {
      const average = gradingService['calculateAverageScore']([]);
      expect(average).toBe(0);
    });
  });

  describe('Overall Feedback Generation', () => {
    it('should generate excellent feedback for high scores', () => {
      const roleEvaluations = [
        { 
          role: GradingRole.DEVELOPER, 
          score: 95, 
          feedback: 'Excellent code quality and structure.'
        },
        { 
          role: GradingRole.ARCHITECT, 
          score: 92, 
          feedback: 'Outstanding architectural decisions.'
        }
      ] as any[];

      const feedback = gradingService['generateOverallFeedback'](roleEvaluations, 94);

      expect(feedback).toContain('🌟 Excellent work!');
      expect(feedback).toContain('Overall Score: 94/100');
      expect(feedback).toContain('developer: 95');
      expect(feedback).toContain('architect: 92');
    });

    it('should generate improvement feedback for low scores', () => {
      const roleEvaluations = [
        { 
          role: GradingRole.DEVELOPER, 
          score: 35, 
          feedback: 'Code needs significant improvement.'
        },
        { 
          role: GradingRole.SQA, 
          score: 30, 
          feedback: 'Many quality issues found.'
        }
      ] as any[];

      const feedback = gradingService['generateOverallFeedback'](roleEvaluations, 33);

      expect(feedback).toContain('🔧 Significant improvements needed');
      expect(feedback).toContain('Overall Score: 33/100');
    });
  });

  describe('Grading History', () => {
    it('should record grading history in user progress', async () => {
      const roleEvaluations = [
        {
          role: GradingRole.DEVELOPER,
          modelUsed: 'test-model',
          score: 80,
          feedback: 'Good work',
          detailedAnalysis: 'Detailed analysis',
          focusAreas: ['code quality'],
          timestamp: new Date()
        }
      ];

      await gradingService['recordGradingHistory'](
        'test-user',
        'test-challenge-1',
        roleEvaluations,
        mockChallenge
      );

      expect(userProgressStore.userProgress?.gradingHistory).toHaveLength(1);
      expect(userProgressStore.userProgress?.gradingHistory[0].challengeId).toBe('test-challenge-1');
      expect(userProgressStore.userProgress?.gradingHistory[0].roleScores[GradingRole.DEVELOPER]).toBe(80);
    });

    it('should limit grading history to 50 entries', async () => {
      // Fill history with 51 entries
      const entries = Array.from({ length: 51 }, (_, i) => ({
        challengeId: `challenge-${i}`,
        gradingTimestamp: new Date(),
        roleScores: { [GradingRole.DEVELOPER]: 80 } as any,
        averageScore: 80,
        modelsUsed: ['test-model'],
        challengeType: 'bug-fixing',
        kaijuType: 'HydraBug'
      }));

      userProgressStore.userProgress!.gradingHistory = entries;

      const roleEvaluations = [
        {
          role: GradingRole.DEVELOPER,
          modelUsed: 'test-model',
          score: 85,
          feedback: 'Good work',
          detailedAnalysis: 'Detailed analysis',
          focusAreas: ['code quality'],
          timestamp: new Date()
        }
      ];

      await gradingService['recordGradingHistory'](
        'test-user',
        'new-challenge',
        roleEvaluations,
        mockChallenge
      );

      expect(userProgressStore.userProgress?.gradingHistory).toHaveLength(50);
      expect(userProgressStore.userProgress?.gradingHistory[49].challengeId).toBe('new-challenge');
    });
  });

  describe('Grading Statistics', () => {
    beforeEach(() => {
      // Add some mock grading history
      const mockHistory = [
        {
          challengeId: 'challenge-1',
          gradingTimestamp: new Date('2024-01-01'),
          roleScores: {
            [GradingRole.DEVELOPER]: 80,
            [GradingRole.ARCHITECT]: 75,
            [GradingRole.SQA]: 85,
            [GradingRole.PRODUCT_OWNER]: 90
          },
          averageScore: 83,
          modelsUsed: ['model-1'],
          challengeType: 'bug-fixing',
          kaijuType: 'HydraBug'
        },
        {
          challengeId: 'challenge-2',
          gradingTimestamp: new Date('2024-01-02'),
          roleScores: {
            [GradingRole.DEVELOPER]: 85,
            [GradingRole.ARCHITECT]: 80,
            [GradingRole.SQA]: 90,
            [GradingRole.PRODUCT_OWNER]: 88
          },
          averageScore: 86,
          modelsUsed: ['model-2'],
          challengeType: 'refactoring',
          kaijuType: 'Complexasaur'
        }
      ];

      userProgressStore.userProgress!.gradingHistory = mockHistory;
    });

    it('should calculate correct grading statistics', () => {
      const stats = gradingService.getGradingStatistics('test-user');

      expect(stats.totalGradings).toBe(2);
      expect(stats.averageOverallScore).toBe(85); // (83 + 86) / 2 = 84.5, rounded to 85
      expect(stats.averageRoleScores[GradingRole.DEVELOPER]).toBe(83); // (80 + 85) / 2 = 82.5, rounded to 83
      expect(stats.bestScore).toBe(86);
      expect(stats.recentGradings).toHaveLength(2);
    });

    it('should return empty statistics for user with no history', () => {
      userProgressStore.userProgress!.gradingHistory = [];
      
      const stats = gradingService.getGradingStatistics('test-user');

      expect(stats.totalGradings).toBe(0);
      expect(stats.averageOverallScore).toBe(0);
      expect(stats.bestScore).toBe(0);
      expect(stats.improvementTrend).toBe('stable');
    });

    it('should detect improvement trend', () => {
      // Add more history to test trend detection
      const trendHistory = [
        { averageScore: 70 },
        { averageScore: 72 },
        { averageScore: 75 },
        { averageScore: 80 },
        { averageScore: 85 },
        { averageScore: 88 }
      ] as any[];

      userProgressStore.userProgress!.gradingHistory = trendHistory;
      
      const stats = gradingService.getGradingStatistics('test-user');

      expect(stats.improvementTrend).toBe('improving');
    });
  });

  describe('Error Handling', () => {
    it('should handle AI service errors gracefully', async () => {
      const { getAIService } = await import('../aiService');
      const mockAIService = getAIService();
      
      (mockAIService.sendMessage as any).mockRejectedValueOnce(new Error('AI service error'));

      // Mock models endpoint
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [{ id: 'test-model' }] })
      });

      const result = await gradingService.submitForGrading(
        'test-challenge',
        'function test() {}',
        mockChallenge,
        'test-user'
      );

      expect(result.success).toBe(true);
      expect(result.roleEvaluations).toHaveLength(4);
      
      // Should have fallback evaluations
      const failedEvaluations = result.roleEvaluations.filter(evaluation => evaluation.modelUsed === 'fallback');
      expect(failedEvaluations.length).toBeGreaterThan(0);
    });

    it('should handle network errors during model detection', async () => {
      (fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const models = await gradingService['getAvailableModels']();
      
      expect(models).toEqual(['default-model']);
    });
  });

  describe('Integration Tests', () => {
    it('should complete full grading workflow', async () => {
      // Mock successful AI responses
      const { getAIService } = await import('../aiService');
      const mockAIService = getAIService();
      
      (mockAIService.sendMessage as any).mockImplementation(() => Promise.resolve({
        success: true,
        message: {
          content: `
SCORE: 85

FEEDBACK:
Good implementation with room for improvement.

DETAILED ANALYSIS:
The code shows solid understanding of the requirements with proper structure and error handling.
          `
        }
      }));

      // Mock models endpoint
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ 
          data: [
            { id: 'model-1' },
            { id: 'model-2' },
            { id: 'model-3' },
            { id: 'model-4' }
          ] 
        })
      });

      const result = await gradingService.submitForGrading(
        'test-challenge',
        'function improvedCode() { return "fixed"; }',
        mockChallenge,
        'test-user'
      );

      expect(result.success).toBe(true);
      expect(result.roleEvaluations).toHaveLength(4);
      expect(result.averageScore).toBe(85);
      expect(result.overallFeedback).toContain('Overall Score: 85/100');
      
      // Verify all roles were evaluated
      const roles = result.roleEvaluations.map(evaluation => evaluation.role);
      expect(roles).toContain(GradingRole.DEVELOPER);
      expect(roles).toContain(GradingRole.ARCHITECT);
      expect(roles).toContain(GradingRole.SQA);
      expect(roles).toContain(GradingRole.PRODUCT_OWNER);

      // Verify grading history was recorded
      expect(userProgressStore.userProgress?.gradingHistory).toHaveLength(1);
    });
  });
});