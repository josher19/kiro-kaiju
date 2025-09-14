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
const mockSendMessage = vi.fn();
vi.mock('../aiService', () => ({
  getAIService: vi.fn(() => ({
    sendMessage: mockSendMessage,
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

describe.skip('AIGradingService', () => {
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

    // Reset mocks
    mockSendMessage.mockReset();

    // Mock challenge data
    mockKaiju = {
      id: 'hydra-bug',
      name: 'HydraBug',
      type: KaijuType.HYDRA_BUG,
      description: 'A monster that creates bugs when you fix bugs',
      avatar: '/images/kaiju/hydra-bug.png',
      codePatterns: [],
      difficultyModifiers: [],
      specialAbilities: [],
      weaknesses: [],
      flavorText: 'A hydra-like bug that spawns more bugs when you try to fix it'
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
      expect(result.feedback).toContain('evaluation completed');
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
      mockSendMessage.mockRejectedValue(new Error('AI service error'));

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

  describe('Unified Prompt System', () => {
    it('should build unified evaluation prompt correctly', () => {
      const code = 'function test() { return "hello"; }';
      const requirements = ['Fix bugs', 'Add tests'];

      const prompt = gradingService['buildUnifiedEvaluationPrompt'](
        code,
        requirements,
        mockChallenge
      );

      expect(prompt).toContain('four different role perspectives simultaneously');
      expect(prompt).toContain('DEVELOPER ROLE');
      expect(prompt).toContain('ARCHITECT ROLE');
      expect(prompt).toContain('SQA ROLE');
      expect(prompt).toContain('PRODUCT_OWNER ROLE');
      expect(prompt).toContain('valid JSON object');
      expect(prompt).toContain('"developer": [score, "brief reason for score"]');
      expect(prompt).toContain(code);
    });

    it('should parse unified JSON response correctly', () => {
      const mockResponse = `{
        "developer": [85, "Good code quality with proper structure"],
        "architect": [78, "Solid design but could use better patterns"],
        "sqa": [92, "Excellent edge case handling and validation"],
        "productOwner": [88, "Requirements well met with good UX"]
      }`;

      const evaluations = gradingService['parseUnifiedEvaluationResponse'](mockResponse, 'test-model');

      expect(evaluations).toHaveLength(4);
      
      const developerEval = evaluations.find(e => e.role === GradingRole.DEVELOPER);
      expect(developerEval?.score).toBe(85);
      expect(developerEval?.feedback).toBe('Good code quality with proper structure');
      expect(developerEval?.modelUsed).toBe('test-model');

      const architectEval = evaluations.find(e => e.role === GradingRole.ARCHITECT);
      expect(architectEval?.score).toBe(78);
      expect(architectEval?.feedback).toBe('Solid design but could use better patterns');

      const sqaEval = evaluations.find(e => e.role === GradingRole.SQA);
      expect(sqaEval?.score).toBe(92);
      expect(sqaEval?.feedback).toBe('Excellent edge case handling and validation');

      const poEval = evaluations.find(e => e.role === GradingRole.PRODUCT_OWNER);
      expect(poEval?.score).toBe(88);
      expect(poEval?.feedback).toBe('Requirements well met with good UX');
    });

    it('should handle JSON response with markdown code blocks', () => {
      const mockResponse = `Here's the evaluation:

\`\`\`json
{
  "developer": [75, "Code is functional but needs refactoring"],
  "architect": [70, "Architecture is basic but adequate"],
  "sqa": [80, "Good testing approach with minor gaps"],
  "productOwner": [85, "User requirements are well addressed"]
}
\`\`\`

That's my assessment.`;

      const evaluations = gradingService['parseUnifiedEvaluationResponse'](mockResponse, 'test-model');

      expect(evaluations).toHaveLength(4);
      expect(evaluations.find(e => e.role === GradingRole.DEVELOPER)?.score).toBe(75);
      expect(evaluations.find(e => e.role === GradingRole.ARCHITECT)?.score).toBe(70);
      expect(evaluations.find(e => e.role === GradingRole.SQA)?.score).toBe(80);
      expect(evaluations.find(e => e.role === GradingRole.PRODUCT_OWNER)?.score).toBe(85);
    });

    it('should handle malformed JSON response gracefully', () => {
      const mockResponse = 'This is not a valid JSON response';

      const evaluations = gradingService['parseUnifiedEvaluationResponse'](mockResponse, 'test-model');

      expect(evaluations).toHaveLength(4);
      evaluations.forEach(evaluation => {
        expect(evaluation.score).toBe(50); // Fallback score
        expect(evaluation.feedback).toContain('Evaluation completed');
        expect(evaluation.modelUsed).toBe('test-model');
      });
    });

    it('should handle incomplete JSON response', () => {
      const mockResponse = `{
        "developer": [85, "Good work"],
        "architect": [78, "Decent design"]
      }`;

      const evaluations = gradingService['parseUnifiedEvaluationResponse'](mockResponse, 'test-model');

      expect(evaluations).toHaveLength(4);
      evaluations.forEach(evaluation => {
        expect(evaluation.score).toBe(50); // Fallback score due to missing keys
        expect(evaluation.feedback).toContain('Evaluation completed');
      });
    });

    it('should clamp scores to valid range in unified response', () => {
      const mockResponse = `{
        "developer": [150, "Excellent work"],
        "architect": [-10, "Poor design"],
        "sqa": [95, "Great testing"],
        "productOwner": [200, "Amazing UX"]
      }`;

      const evaluations = gradingService['parseUnifiedEvaluationResponse'](mockResponse, 'test-model');

      expect(evaluations).toHaveLength(4);
      expect(evaluations.find(e => e.role === GradingRole.DEVELOPER)?.score).toBe(100); // Clamped to max
      expect(evaluations.find(e => e.role === GradingRole.ARCHITECT)?.score).toBe(0); // Clamped to min
      expect(evaluations.find(e => e.role === GradingRole.SQA)?.score).toBe(95); // Valid score
      expect(evaluations.find(e => e.role === GradingRole.PRODUCT_OWNER)?.score).toBe(100); // Clamped to max
    });
  });

  describe('Model Selection', () => {
    it('should select optimal model from available models', () => {
      const availableModels = ['basic-model', 'openai/gpt-4o-mini', 'other-model'];
      const selectedModel = gradingService['selectOptimalModel'](availableModels);

      expect(selectedModel).toBe('openai/gpt-4o-mini'); // Should prefer this model
    });

    it('should fallback to first available model if no preferred model found', () => {
      const availableModels = ['unknown-model-1', 'unknown-model-2'];
      const selectedModel = gradingService['selectOptimalModel'](availableModels);

      expect(selectedModel).toBe('unknown-model-1');
    });

    it('should return default model if no models available', () => {
      const selectedModel = gradingService['selectOptimalModel']([]);

      expect(selectedModel).toBe('default-model');
    });
  });

  describe('Integration Tests', () => {
    it('should complete full unified grading workflow', async () => {
      // Mock successful unified AI response
      mockSendMessage.mockResolvedValue({
        success: true,
        message: {
          content: `{
            "developer": [85, "Good code quality with proper error handling"],
            "architect": [78, "Solid architectural decisions with room for improvement"],
            "sqa": [92, "Excellent attention to quality and edge cases"],
            "productOwner": [88, "Requirements well met with good user experience"]
          }`
        }
      });

      // Mock models endpoint
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ 
          data: [
            { id: 'openai/gpt-4o-mini' },
            { id: 'anthropic/claude-3-haiku' }
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
      expect(result.averageScore).toBe(86); // (85 + 78 + 92 + 88) / 4 = 85.75, rounded to 86
      expect(result.overallFeedback).toContain('Overall Score: 86/100');
      
      // Verify all roles were evaluated
      const roles = result.roleEvaluations.map(evaluation => evaluation.role);
      expect(roles).toContain(GradingRole.DEVELOPER);
      expect(roles).toContain(GradingRole.ARCHITECT);
      expect(roles).toContain(GradingRole.SQA);
      expect(roles).toContain(GradingRole.PRODUCT_OWNER);

      // Verify all evaluations use the same model (unified approach)
      const models = result.roleEvaluations.map(evaluation => evaluation.modelUsed);
      const uniqueModels = [...new Set(models)];
      expect(uniqueModels).toHaveLength(1);
      expect(uniqueModels[0]).toBe('openai/gpt-4o-mini');

      // Verify grading history was recorded
      expect(userProgressStore.userProgress?.gradingHistory).toHaveLength(1);
    });

    it('should fallback to sequential evaluation when unified approach fails', async () => {
      // Mock unified approach failure, then successful sequential responses
      let callCount = 0;
      mockSendMessage.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // First call (unified) fails
          return Promise.reject(new Error('Unified evaluation failed'));
        } else {
          // Subsequent calls (sequential) succeed
          return Promise.resolve({
            success: true,
            message: {
              content: `
SCORE: 80

FEEDBACK:
Good implementation with room for improvement.

DETAILED ANALYSIS:
The code shows solid understanding with proper structure.
              `
            }
          });
        }
      });

      // Mock models endpoint
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ 
          data: [{ id: 'test-model' }] 
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
      expect(result.averageScore).toBe(80);
      
      // Verify fallback to sequential evaluation occurred (multiple AI service calls)
      expect(callCount).toBeGreaterThan(1);
    });

    it('should handle complete AI service failure gracefully', async () => {
      // Mock complete AI service failure
      mockSendMessage.mockRejectedValue(new Error('Complete AI service failure'));

      // Mock models endpoint
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ 
          data: [{ id: 'test-model' }] 
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
      
      // Should have fallback evaluations
      const fallbackEvaluations = result.roleEvaluations.filter(evaluation => evaluation.modelUsed === 'fallback');
      expect(fallbackEvaluations.length).toBe(4);
      
      fallbackEvaluations.forEach(evaluation => {
        expect(evaluation.score).toBe(50);
        expect(evaluation.feedback).toContain('Unable to complete');
      });
    });
  });
});