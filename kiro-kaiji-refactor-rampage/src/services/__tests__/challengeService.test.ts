/**
 * Challenge Service Tests
 * 
 * Unit tests for the challenge generation service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ChallengeService } from '../challengeService';
import { 
  ProgrammingLanguage, 
  ChallengeCategory, 
  DifficultyLevel,
  Framework
} from '@/types/challenge';
import { KaijuType } from '@/types/kaiju';

describe('ChallengeService', () => {
  let challengeService: ChallengeService;

  beforeEach(() => {
    challengeService = new ChallengeService();
  });

  describe('generateChallenge', () => {
    it('should generate a complete challenge with valid configuration', async () => {
      const request = {
        config: {
          language: ProgrammingLanguage.JAVASCRIPT,
          category: ChallengeCategory.REFACTORING,
          difficulty: DifficultyLevel.BEGINNER
        }
      };

      const response = await challengeService.generateChallenge(request);

      expect(response).toBeDefined();
      expect(response.challenge).toBeDefined();
      expect(response.estimatedTime).toBeGreaterThan(0);
      expect(response.difficulty).toBeDefined();
      expect(response.difficulty.technical).toBeGreaterThan(0);
      expect(response.difficulty.conceptual).toBeGreaterThan(0);
      expect(response.difficulty.overall).toBeGreaterThan(0);
    });

    it('should generate challenge with appropriate Kaiju for bug fixing category', async () => {
      const request = {
        config: {
          language: ProgrammingLanguage.JAVASCRIPT,
          category: ChallengeCategory.BUG_FIXING,
          difficulty: DifficultyLevel.INTERMEDIATE
        }
      };

      const response = await challengeService.generateChallenge(request);

      expect(response.challenge.kaiju.type).toBe(KaijuType.HYDRA_BUG);
    });

    it('should generate challenge with framework-specific code when framework is specified', async () => {
      const request = {
        config: {
          language: ProgrammingLanguage.JAVASCRIPT,
          framework: Framework.VUE,
          category: ChallengeCategory.FEATURE_ADDITION,
          difficulty: DifficultyLevel.ADVANCED
        }
      };

      const response = await challengeService.generateChallenge(request);

      expect(response.challenge.initialCode.toLowerCase()).toContain('vue');
    });

    it('should include custom requirements when provided', async () => {
      const customRequirements = ['Add error logging', 'Implement caching'];
      const request = {
        config: {
          language: ProgrammingLanguage.TYPESCRIPT,
          category: ChallengeCategory.REFACTORING,
          difficulty: DifficultyLevel.EXPERT
        },
        customRequirements
      };

      const response = await challengeService.generateChallenge(request);

      const customReqs = response.challenge.requirements.filter(req => 
        req.id.startsWith('custom-req-')
      );
      expect(customReqs).toHaveLength(2);
      expect(customReqs[0].description).toBe('Add error logging');
      expect(customReqs[1].description).toBe('Implement caching');
    });

    it('should generate appropriate difficulty metrics based on challenge complexity', async () => {
      const beginnerRequest = {
        config: {
          language: ProgrammingLanguage.PYTHON,
          category: ChallengeCategory.REFACTORING,
          difficulty: DifficultyLevel.BEGINNER
        }
      };

      const expertRequest = {
        config: {
          language: ProgrammingLanguage.PYTHON,
          category: ChallengeCategory.REFACTORING,
          difficulty: DifficultyLevel.EXPERT
        }
      };

      const beginnerResponse = await challengeService.generateChallenge(beginnerRequest);
      const expertResponse = await challengeService.generateChallenge(expertRequest);

      expect(expertResponse.difficulty.technical).toBeGreaterThan(beginnerResponse.difficulty.technical);
      expect(expertResponse.estimatedTime).toBeGreaterThan(beginnerResponse.estimatedTime);
    });

    it('should generate unique challenge IDs', async () => {
      const request = {
        config: {
          language: ProgrammingLanguage.JAVA,
          category: ChallengeCategory.TESTING,
          difficulty: DifficultyLevel.INTERMEDIATE
        }
      };

      const response1 = await challengeService.generateChallenge(request);
      const response2 = await challengeService.generateChallenge(request);

      expect(response1.challenge.id).not.toBe(response2.challenge.id);
    });

    it('should throw error when no suitable Kaiju is found', async () => {
      // Mock the kaiju engine to return null
      const originalSelectKaiju = challengeService['kaijuEngine'].selectKaijuForChallenge;
      challengeService['kaijuEngine'].selectKaijuForChallenge = vi.fn().mockReturnValue(null);

      const request = {
        config: {
          language: ProgrammingLanguage.RUST,
          category: ChallengeCategory.ARCHITECTURE,
          difficulty: DifficultyLevel.LEGENDARY
        }
      };

      await expect(challengeService.generateChallenge(request)).rejects.toThrow(
        'No suitable Kaiju monster found for the given configuration'
      );

      // Restore original method
      challengeService['kaijuEngine'].selectKaijuForChallenge = originalSelectKaiju;
    });

    it('should generate test cases appropriate for the challenge', async () => {
      const request = {
        config: {
          language: ProgrammingLanguage.JAVASCRIPT,
          category: ChallengeCategory.BUG_FIXING,
          difficulty: DifficultyLevel.ADVANCED
        }
      };

      const response = await challengeService.generateChallenge(request);

      expect(response.challenge.testCases).toBeDefined();
      expect(response.challenge.testCases.length).toBeGreaterThan(0);
      
      // Should have basic, edge case, and Kaiju-specific tests
      const basicTest = response.challenge.testCases.find(test => test.name === 'Basic Functionality Test');
      const edgeTest = response.challenge.testCases.find(test => test.name === 'Edge Case Test');
      const hiddenTest = response.challenge.testCases.find(test => test.isHidden === true);

      expect(basicTest).toBeDefined();
      expect(edgeTest).toBeDefined();
      expect(hiddenTest).toBeDefined(); // Advanced difficulty should have hidden tests
    });

    it('should generate requirements with proper priorities', async () => {
      const request = {
        config: {
          language: ProgrammingLanguage.PYTHON,
          category: ChallengeCategory.PERFORMANCE_OPTIMIZATION,
          difficulty: DifficultyLevel.INTERMEDIATE
        }
      };

      const response = await challengeService.generateChallenge(request);

      const requirements = response.challenge.requirements;
      const mustRequirements = requirements.filter(req => req.priority === 'must');
      const shouldRequirements = requirements.filter(req => req.priority === 'should');

      expect(mustRequirements.length).toBeGreaterThan(0);
      expect(shouldRequirements.length).toBeGreaterThan(0);
    });

    it('should set appropriate time limits based on difficulty', async () => {
      const beginnerRequest = {
        config: {
          language: ProgrammingLanguage.JAVASCRIPT,
          category: ChallengeCategory.REFACTORING,
          difficulty: DifficultyLevel.BEGINNER
        }
      };

      const legendaryRequest = {
        config: {
          language: ProgrammingLanguage.JAVASCRIPT,
          category: ChallengeCategory.REFACTORING,
          difficulty: DifficultyLevel.LEGENDARY
        }
      };

      const beginnerResponse = await challengeService.generateChallenge(beginnerRequest);
      const legendaryResponse = await challengeService.generateChallenge(legendaryRequest);

      expect(legendaryResponse.challenge.timeLimit).toBeGreaterThan(beginnerResponse.challenge.timeLimit!);
    });

    it('should set appropriate max attempts based on difficulty', async () => {
      const beginnerRequest = {
        config: {
          language: ProgrammingLanguage.JAVASCRIPT,
          category: ChallengeCategory.REFACTORING,
          difficulty: DifficultyLevel.BEGINNER
        }
      };

      const legendaryRequest = {
        config: {
          language: ProgrammingLanguage.JAVASCRIPT,
          category: ChallengeCategory.REFACTORING,
          difficulty: DifficultyLevel.LEGENDARY
        }
      };

      const beginnerResponse = await challengeService.generateChallenge(beginnerRequest);
      const legendaryResponse = await challengeService.generateChallenge(legendaryRequest);

      expect(beginnerResponse.challenge.maxAttempts).toBeGreaterThan(legendaryResponse.challenge.maxAttempts!);
    });
  });

  describe('requirement generation', () => {
    it('should generate language-specific acceptance criteria', async () => {
      const jsRequest = {
        config: {
          language: ProgrammingLanguage.JAVASCRIPT,
          category: ChallengeCategory.REFACTORING,
          difficulty: DifficultyLevel.INTERMEDIATE
        }
      };

      const pythonRequest = {
        config: {
          language: ProgrammingLanguage.PYTHON,
          category: ChallengeCategory.REFACTORING,
          difficulty: DifficultyLevel.INTERMEDIATE
        }
      };

      const jsResponse = await challengeService.generateChallenge(jsRequest);
      const pythonResponse = await challengeService.generateChallenge(pythonRequest);

      const jsAcceptanceCriteria = jsResponse.challenge.requirements[0].acceptanceCriteria;
      const pythonAcceptanceCriteria = pythonResponse.challenge.requirements[0].acceptanceCriteria;

      expect(jsAcceptanceCriteria.some(criteria => 
        criteria.includes('JavaScript/TypeScript')
      )).toBe(true);

      expect(pythonAcceptanceCriteria.some(criteria => 
        criteria.includes('PEP 8')
      )).toBe(true);
    });

    it('should generate category-specific requirements', async () => {
      const refactoringRequest = {
        config: {
          language: ProgrammingLanguage.JAVASCRIPT,
          category: ChallengeCategory.REFACTORING,
          difficulty: DifficultyLevel.INTERMEDIATE
        }
      };

      const testingRequest = {
        config: {
          language: ProgrammingLanguage.JAVASCRIPT,
          category: ChallengeCategory.TESTING,
          difficulty: DifficultyLevel.INTERMEDIATE
        }
      };

      const refactoringResponse = await challengeService.generateChallenge(refactoringRequest);
      const testingResponse = await challengeService.generateChallenge(testingRequest);

      const refactoringReqs = refactoringResponse.challenge.requirements.map(req => req.description);
      const testingReqs = testingResponse.challenge.requirements.map(req => req.description);

      expect(refactoringReqs.some(req => 
        req.toLowerCase().includes('readability')
      )).toBe(true);

      expect(testingReqs.some(req => 
        req.toLowerCase().includes('test')
      )).toBe(true);
    });

    it('should generate Kaiju-specific requirements', async () => {
      const hydraBugRequest = {
        config: {
          language: ProgrammingLanguage.JAVASCRIPT,
          category: ChallengeCategory.BUG_FIXING,
          difficulty: DifficultyLevel.INTERMEDIATE
        }
      };

      const duplicatronRequest = {
        config: {
          language: ProgrammingLanguage.JAVASCRIPT,
          category: ChallengeCategory.REFACTORING,
          difficulty: DifficultyLevel.INTERMEDIATE
        }
      };

      const hydraBugResponse = await challengeService.generateChallenge(hydraBugRequest);
      const duplicatronResponse = await challengeService.generateChallenge(duplicatronRequest);

      const hydraBugReqs = hydraBugResponse.challenge.requirements.map(req => req.description);
      const duplicatronReqs = duplicatronResponse.challenge.requirements.map(req => req.description);

      expect(hydraBugReqs.some(req => 
        req.toLowerCase().includes('interconnected')
      )).toBe(true);

      expect(duplicatronReqs.some(req => 
        req.toLowerCase().includes('duplication')
      )).toBe(true);
    });
  });

  describe('test case generation', () => {
    it('should generate basic functionality tests for all challenges', async () => {
      const request = {
        config: {
          language: ProgrammingLanguage.JAVASCRIPT,
          category: ChallengeCategory.REFACTORING,
          difficulty: DifficultyLevel.BEGINNER
        }
      };

      const response = await challengeService.generateChallenge(request);
      const basicTest = response.challenge.testCases.find(test => 
        test.name === 'Basic Functionality Test'
      );

      expect(basicTest).toBeDefined();
      expect(basicTest!.isHidden).toBe(false);
      expect(basicTest!.weight).toBe(0.3);
    });

    it('should generate hidden tests for intermediate and higher difficulties', async () => {
      const intermediateRequest = {
        config: {
          language: ProgrammingLanguage.JAVASCRIPT,
          category: ChallengeCategory.REFACTORING,
          difficulty: DifficultyLevel.INTERMEDIATE
        }
      };

      const beginnerRequest = {
        config: {
          language: ProgrammingLanguage.JAVASCRIPT,
          category: ChallengeCategory.REFACTORING,
          difficulty: DifficultyLevel.BEGINNER
        }
      };

      const intermediateResponse = await challengeService.generateChallenge(intermediateRequest);
      const beginnerResponse = await challengeService.generateChallenge(beginnerRequest);

      const intermediateHiddenTests = intermediateResponse.challenge.testCases.filter(test => test.isHidden);
      const beginnerHiddenTests = beginnerResponse.challenge.testCases.filter(test => test.isHidden);

      expect(intermediateHiddenTests.length).toBeGreaterThan(0);
      expect(beginnerHiddenTests.length).toBe(0);
    });

    it('should generate Kaiju-specific tests', async () => {
      const hydraBugRequest = {
        config: {
          language: ProgrammingLanguage.JAVASCRIPT,
          category: ChallengeCategory.BUG_FIXING,
          difficulty: DifficultyLevel.INTERMEDIATE
        }
      };

      const response = await challengeService.generateChallenge(hydraBugRequest);
      const kaijuTest = response.challenge.testCases.find(test => 
        test.name === 'Bug Multiplication Prevention'
      );

      expect(kaijuTest).toBeDefined();
      expect(kaijuTest!.description).toContain('fixing bugs doesn\'t create new ones');
    });
  });

  describe('challenge metadata', () => {
    it('should generate appropriate challenge titles', async () => {
      const refactoringRequest = {
        config: {
          language: ProgrammingLanguage.JAVASCRIPT,
          category: ChallengeCategory.REFACTORING,
          difficulty: DifficultyLevel.INTERMEDIATE
        }
      };

      const bugFixingRequest = {
        config: {
          language: ProgrammingLanguage.JAVASCRIPT,
          category: ChallengeCategory.BUG_FIXING,
          difficulty: DifficultyLevel.INTERMEDIATE
        }
      };

      const refactoringResponse = await challengeService.generateChallenge(refactoringRequest);
      const bugFixingResponse = await challengeService.generateChallenge(bugFixingRequest);

      expect(refactoringResponse.challenge.title).toContain('Refactoring Rampage');
      expect(bugFixingResponse.challenge.title).toContain('Bug Hunt');
    });

    it('should generate descriptive challenge descriptions', async () => {
      const request = {
        config: {
          language: ProgrammingLanguage.PYTHON,
          framework: Framework.DJANGO,
          category: ChallengeCategory.FEATURE_ADDITION,
          difficulty: DifficultyLevel.ADVANCED
        }
      };

      const response = await challengeService.generateChallenge(request);

      expect(response.challenge.description).toContain(response.challenge.kaiju.name);
      expect(response.challenge.description).toContain('ADVANCED');
      expect(response.challenge.description).toContain('python');
      expect(response.challenge.description).toContain('django');
    });

    it('should set creation timestamp', async () => {
      const request = {
        config: {
          language: ProgrammingLanguage.JAVASCRIPT,
          category: ChallengeCategory.REFACTORING,
          difficulty: DifficultyLevel.BEGINNER
        }
      };

      const beforeGeneration = new Date();
      const response = await challengeService.generateChallenge(request);
      const afterGeneration = new Date();

      expect(response.challenge.createdAt.getTime()).toBeGreaterThanOrEqual(beforeGeneration.getTime());
      expect(response.challenge.createdAt.getTime()).toBeLessThanOrEqual(afterGeneration.getTime());
    });
  });
});