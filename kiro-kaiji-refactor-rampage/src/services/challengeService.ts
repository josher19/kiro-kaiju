/**
 * Challenge Generation Service
 * 
 * Core service for generating coding challenges with Kaiju monsters,
 * code templates, requirements, and test cases.
 */

import { 
  type Challenge, 
  type ChallengeConfig, 
  type Requirement, 
  type TestCase,
  ProgrammingLanguage,
  ChallengeCategory,
  DifficultyLevel
} from '@/types/challenge';
import { KaijuEngine, type CodeGenerationOptions } from './kaijuEngine';
import { codeTemplateGenerator } from './codeTemplateGenerator';
import { KaijuType } from '@/types/kaiju';

export interface ChallengeGenerationRequest {
  config: ChallengeConfig;
  userId?: string;
  customRequirements?: string[];
}

export interface ChallengeGenerationResponse {
  challenge: Challenge;
  estimatedTime: number;
  difficulty: {
    technical: number;
    conceptual: number;
    overall: number;
  };
}

export class ChallengeService {
  private kaijuEngine: KaijuEngine;
  private challengeCounter = 0;

  constructor() {
    this.kaijuEngine = new KaijuEngine();
  }

  /**
   * Generate a complete challenge based on configuration
   */
  async generateChallenge(request: ChallengeGenerationRequest): Promise<ChallengeGenerationResponse> {
    const { config, customRequirements = [] } = request;
    
    // Ensure monsters are loaded
    await this.kaijuEngine.ensureMonstersLoaded();
    
    // Select appropriate Kaiju monster
    const kaiju = this.kaijuEngine.selectKaijuForChallenge(
      config.category,
      config.difficulty
    );

    if (!kaiju) {
      throw new Error('No suitable Kaiju monster found for the given configuration');
    }

    // Generate code using the selected Kaiju or template generator
    let generatedCode;
    let initialCode: string;

    if (config.framework) {
      // Use code template generator for framework-specific code
      const template = codeTemplateGenerator.generateBaseTemplate(
        config.language,
        config.framework,
        config.category
      );
      
      // Get problematic patterns from the Kaiju
      const patterns = codeTemplateGenerator.generateProblematicPatterns(
        kaiju.type,
        config.language,
        config.difficulty
      );

      initialCode = template.baseCode;
      generatedCode = {
        code: initialCode,
        problems: patterns.map(p => p.description),
        hints: [
          'Consider using framework-specific best practices',
          'Look for patterns that violate the framework conventions',
          'Focus on maintainability and code organization'
        ],
        requirements: [
          'Refactor the code to follow framework best practices',
          'Eliminate problematic patterns identified by the Kaiju',
          'Maintain functionality while improving code quality'
        ]
      };
    } else {
      // Use Kaiju engine for language-specific code
      const codeGenOptions: CodeGenerationOptions = {
        language: config.language,
        category: config.category,
        difficulty: config.difficulty,
        codeLength: this.getCodeLengthForDifficulty(config.difficulty),
        complexity: config.difficulty
      };

      generatedCode = this.kaijuEngine.generateChallengeCode(
        kaiju.type,
        codeGenOptions
      );

      if (!generatedCode) {
        throw new Error('Failed to generate code for the selected Kaiju');
      }
    }

    // Generate requirements
    const requirements = this.generateRequirements(
      config,
      kaiju.type,
      generatedCode.requirements,
      customRequirements
    );

    // Generate test cases
    const testCases = this.generateTestCases(config, kaiju.type, requirements);

    // Create challenge
    const challenge: Challenge = {
      id: this.generateChallengeId(),
      kaiju,
      config,
      title: this.generateChallengeTitle(kaiju.name, config.category),
      description: this.generateChallengeDescription(kaiju, config),
      initialCode: generatedCode.code,
      requirements,
      testCases,
      hints: generatedCode.hints,
      createdAt: new Date(),
      timeLimit: this.getTimeLimitForDifficulty(config.difficulty),
      maxAttempts: this.getMaxAttemptsForDifficulty(config.difficulty)
    };

    // Calculate difficulty metrics
    const difficultyMetrics = this.calculateDifficultyMetrics(challenge);
    const estimatedTime = this.estimateCompletionTime(challenge);

    return {
      challenge,
      estimatedTime,
      difficulty: difficultyMetrics
    };
  }

  /**
   * Generate requirements based on challenge configuration and Kaiju type
   */
  private generateRequirements(
    config: ChallengeConfig,
    kaijuType: KaijuType,
    baseRequirements: string[],
    customRequirements: string[]
  ): Requirement[] {
    const requirements: Requirement[] = [];

    // Base requirements from code generation
    baseRequirements.forEach((req, index) => {
      requirements.push({
        id: `req-${index + 1}`,
        description: req,
        priority: 'must',
        testable: true,
        acceptanceCriteria: this.generateAcceptanceCriteria(req, config.language)
      });
    });

    // Category-specific requirements
    const categoryRequirements = this.getCategorySpecificRequirements(config.category);
    categoryRequirements.forEach((req, index) => {
      requirements.push({
        id: `cat-req-${index + 1}`,
        description: req,
        priority: 'should',
        testable: true,
        acceptanceCriteria: this.generateAcceptanceCriteria(req, config.language)
      });
    });

    // Kaiju-specific requirements
    const kaijuRequirements = this.getKaijuSpecificRequirements(kaijuType);
    kaijuRequirements.forEach((req, index) => {
      requirements.push({
        id: `kaiju-req-${index + 1}`,
        description: req,
        priority: 'must',
        testable: true,
        acceptanceCriteria: this.generateAcceptanceCriteria(req, config.language)
      });
    });

    // Custom requirements
    customRequirements.forEach((req, index) => {
      requirements.push({
        id: `custom-req-${index + 1}`,
        description: req,
        priority: 'could',
        testable: false,
        acceptanceCriteria: []
      });
    });

    return requirements;
  }

  /**
   * Generate test cases for the challenge
   */
  private generateTestCases(
    config: ChallengeConfig,
    kaijuType: KaijuType,
    requirements: Requirement[]
  ): TestCase[] {
    const testCases: TestCase[] = [];

    // Basic functionality tests
    testCases.push({
      id: 'test-basic-1',
      name: 'Basic Functionality Test',
      description: 'Verify core functionality works correctly',
      input: this.generateBasicTestInput(config.language),
      expectedOutput: this.generateBasicTestOutput(config.language),
      isHidden: false,
      weight: 0.3
    });

    // Edge case tests
    testCases.push({
      id: 'test-edge-1',
      name: 'Edge Case Test',
      description: 'Test handling of edge cases and boundary conditions',
      input: this.generateEdgeCaseInput(config.language),
      expectedOutput: this.generateEdgeCaseOutput(config.language),
      isHidden: false,
      weight: 0.2
    });

    // Kaiju-specific tests
    const kaijuTests = this.generateKaijuSpecificTests(kaijuType, config.language);
    testCases.push(...kaijuTests);

    // Hidden tests for advanced validation
    if (config.difficulty >= DifficultyLevel.INTERMEDIATE) {
      testCases.push({
        id: 'test-hidden-1',
        name: 'Advanced Validation',
        description: 'Hidden test for advanced scenarios',
        input: this.generateAdvancedTestInput(config.language),
        expectedOutput: this.generateAdvancedTestOutput(config.language),
        isHidden: true,
        weight: 0.3
      });
    }

    return testCases;
  }

  /**
   * Generate acceptance criteria for a requirement
   */
  private generateAcceptanceCriteria(requirement: string, language: ProgrammingLanguage): string[] {
    const criteria: string[] = [];

    // Language-specific criteria
    switch (language) {
      case ProgrammingLanguage.JAVASCRIPT:
      case ProgrammingLanguage.TYPESCRIPT:
        criteria.push('Code should follow JavaScript/TypeScript best practices');
        criteria.push('Functions should be properly documented');
        break;
      case ProgrammingLanguage.PYTHON:
        criteria.push('Code should follow PEP 8 style guidelines');
        criteria.push('Functions should have proper docstrings');
        break;
      default:
        criteria.push('Code should follow language-specific best practices');
    }

    // Requirement-specific criteria
    if (requirement.toLowerCase().includes('test')) {
      criteria.push('All test cases should pass');
      criteria.push('Code coverage should be maintained');
    }

    if (requirement.toLowerCase().includes('refactor')) {
      criteria.push('Code readability should be improved');
      criteria.push('Code complexity should be reduced');
    }

    if (requirement.toLowerCase().includes('bug')) {
      criteria.push('All identified bugs should be fixed');
      criteria.push('No new bugs should be introduced');
    }

    return criteria;
  }

  /**
   * Get category-specific requirements
   */
  private getCategorySpecificRequirements(category: ChallengeCategory): string[] {
    const requirements: Record<ChallengeCategory, string[]> = {
      [ChallengeCategory.REFACTORING]: [
        'Improve code readability and maintainability',
        'Reduce code complexity and duplication',
        'Maintain existing functionality while improving structure'
      ],
      [ChallengeCategory.BUG_FIXING]: [
        'Identify and fix all bugs in the code',
        'Add appropriate error handling',
        'Ensure no new bugs are introduced'
      ],
      [ChallengeCategory.FEATURE_ADDITION]: [
        'Implement the requested new feature',
        'Maintain backward compatibility',
        'Follow existing code patterns and conventions'
      ],
      [ChallengeCategory.PERFORMANCE_OPTIMIZATION]: [
        'Improve code performance and efficiency',
        'Optimize memory usage',
        'Maintain correctness while improving speed'
      ],
      [ChallengeCategory.CODE_REVIEW]: [
        'Identify code quality issues',
        'Suggest improvements for maintainability',
        'Ensure code follows best practices'
      ],
      [ChallengeCategory.TESTING]: [
        'Write comprehensive test cases',
        'Achieve good code coverage',
        'Test edge cases and error conditions'
      ],
      [ChallengeCategory.ARCHITECTURE]: [
        'Improve overall code architecture',
        'Implement proper separation of concerns',
        'Design for scalability and maintainability'
      ]
    };

    return requirements[category] || [];
  }

  /**
   * Get Kaiju-specific requirements
   */
  private getKaijuSpecificRequirements(kaijuType: KaijuType): string[] {
    const requirements: Record<KaijuType, string[]> = {
      [KaijuType.HYDRA_BUG]: [
        'Fix interconnected bugs without creating new ones',
        'Implement proper error handling to prevent bug multiplication',
        'Add comprehensive testing to catch regression bugs'
      ],
      [KaijuType.COMPLEXASAUR]: [
        'Simplify overly complex code structures',
        'Break down large functions into smaller, manageable pieces',
        'Improve code readability and reduce cognitive complexity'
      ],
      [KaijuType.DUPLICATRON]: [
        'Eliminate code duplication through proper abstraction',
        'Create reusable functions and components',
        'Implement DRY (Don\'t Repeat Yourself) principles'
      ],
      [KaijuType.SPAGHETTIZILLA]: [
        'Untangle complex dependencies and improve code flow',
        'Implement proper separation of concerns',
        'Create clear, logical code organization'
      ],
      [KaijuType.MEMORYLEAK_ODACTYL]: [
        'Fix memory leaks and resource management issues',
        'Implement proper cleanup and disposal patterns',
        'Optimize memory usage and prevent resource exhaustion'
      ]
    };

    return requirements[kaijuType] || [];
  }

  // Helper methods for test generation
  private generateBasicTestInput(language: ProgrammingLanguage): any {
    switch (language) {
      case ProgrammingLanguage.JAVASCRIPT:
      case ProgrammingLanguage.TYPESCRIPT:
        return { items: [{ id: 1, name: 'Test Item', price: 10 }] };
      case ProgrammingLanguage.PYTHON:
        return { 'items': [{ 'id': 1, 'name': 'Test Item', 'price': 10 }] };
      default:
        return {};
    }
  }

  private generateBasicTestOutput(language: ProgrammingLanguage): any {
    return { success: true, total: 10 };
  }

  private generateEdgeCaseInput(language: ProgrammingLanguage): any {
    return { items: [] };
  }

  private generateEdgeCaseOutput(language: ProgrammingLanguage): any {
    return { success: true, total: 0 };
  }

  private generateAdvancedTestInput(language: ProgrammingLanguage): any {
    return { items: Array(100).fill({ id: 1, name: 'Item', price: 1 }) };
  }

  private generateAdvancedTestOutput(language: ProgrammingLanguage): any {
    return { success: true, total: 100 };
  }

  private generateKaijuSpecificTests(kaijuType: KaijuType, language: ProgrammingLanguage): TestCase[] {
    const tests: TestCase[] = [];

    switch (kaijuType) {
      case KaijuType.HYDRA_BUG:
        tests.push({
          id: 'test-hydra-1',
          name: 'Bug Multiplication Prevention',
          description: 'Ensure fixing bugs doesn\'t create new ones',
          input: { scenario: 'bug_fix_attempt' },
          expectedOutput: { bugs_created: 0 },
          isHidden: false,
          weight: 0.2
        });
        break;
      case KaijuType.DUPLICATRON:
        tests.push({
          id: 'test-duplicatron-1',
          name: 'Code Duplication Check',
          description: 'Verify code duplication has been eliminated',
          input: { check_type: 'duplication' },
          expectedOutput: { duplication_score: 0 },
          isHidden: false,
          weight: 0.2
        });
        break;
      // Add more Kaiju-specific tests as needed
    }

    return tests;
  }

  // Utility methods
  private generateChallengeId(): string {
    return `challenge-${Date.now()}-${++this.challengeCounter}`;
  }

  private generateChallengeTitle(kaijuName: string, category: ChallengeCategory): string {
    const categoryTitles: Record<ChallengeCategory, string> = {
      [ChallengeCategory.REFACTORING]: 'Refactoring Rampage',
      [ChallengeCategory.BUG_FIXING]: 'Bug Hunt',
      [ChallengeCategory.FEATURE_ADDITION]: 'Feature Forge',
      [ChallengeCategory.PERFORMANCE_OPTIMIZATION]: 'Performance Pursuit',
      [ChallengeCategory.CODE_REVIEW]: 'Code Critique',
      [ChallengeCategory.TESTING]: 'Test Trial',
      [ChallengeCategory.ARCHITECTURE]: 'Architecture Adventure'
    };

    return `${kaijuName} ${categoryTitles[category]}`;
  }

  private generateChallengeDescription(kaiju: any, config: ChallengeConfig): string {
    return `Face off against ${kaiju.name} in this ${config.category} challenge! ${kaiju.description} 

Your mission: ${kaiju.flavorText}

Difficulty: ${DifficultyLevel[config.difficulty]}
Language: ${config.language}${config.framework ? ` (${config.framework})` : ''}

Use your coding skills to overcome this monstrous challenge!`;
  }

  private getCodeLengthForDifficulty(difficulty: DifficultyLevel): number {
    const lengthMap: Record<DifficultyLevel, number> = {
      [DifficultyLevel.BEGINNER]: 50,
      [DifficultyLevel.INTERMEDIATE]: 100,
      [DifficultyLevel.ADVANCED]: 150,
      [DifficultyLevel.EXPERT]: 200,
      [DifficultyLevel.LEGENDARY]: 300
    };
    return lengthMap[difficulty];
  }

  private getTimeLimitForDifficulty(difficulty: DifficultyLevel): number {
    const timeMap: Record<DifficultyLevel, number> = {
      [DifficultyLevel.BEGINNER]: 30,
      [DifficultyLevel.INTERMEDIATE]: 45,
      [DifficultyLevel.ADVANCED]: 60,
      [DifficultyLevel.EXPERT]: 90,
      [DifficultyLevel.LEGENDARY]: 120
    };
    return timeMap[difficulty] * 60 * 1000; // Convert to milliseconds
  }

  private getMaxAttemptsForDifficulty(difficulty: DifficultyLevel): number {
    const attemptsMap: Record<DifficultyLevel, number> = {
      [DifficultyLevel.BEGINNER]: 5,
      [DifficultyLevel.INTERMEDIATE]: 4,
      [DifficultyLevel.ADVANCED]: 3,
      [DifficultyLevel.EXPERT]: 2,
      [DifficultyLevel.LEGENDARY]: 1
    };
    return attemptsMap[difficulty];
  }

  private calculateDifficultyMetrics(challenge: Challenge): { technical: number; conceptual: number; overall: number } {
    const technical = challenge.config.difficulty * 2;
    const conceptual = challenge.requirements.length * 0.5;
    const overall = (technical + conceptual) / 2;

    return {
      technical: Math.min(10, technical),
      conceptual: Math.min(10, conceptual),
      overall: Math.min(10, overall)
    };
  }

  private estimateCompletionTime(challenge: Challenge): number {
    const baseTime = challenge.timeLimit || 30 * 60 * 1000;
    const complexityMultiplier = challenge.requirements.length * 0.1;
    return Math.round(baseTime * (1 + complexityMultiplier));
  }
}

// Export singleton instance
export const challengeService = new ChallengeService();