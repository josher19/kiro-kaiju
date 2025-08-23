/**
 * AI Grading Service
 * 
 * Handles AI-based multi-role grading system with model detection,
 * role-specific evaluation, and grading history tracking
 */

import type {
  AIGradingRequest,
  AIGradingResponse,
  RoleEvaluation,
  GradingHistoryEntry
} from '@/types/api';
import { GradingRole } from '@/types/api';
import type { Challenge } from '@/types/challenge';
import { handleAsyncError } from '@/utils/errorHandler';
import { getAIService } from './aiService';
import { useUserProgressStore } from '@/stores/userProgressStore';

export interface GradingPromptConfig {
  role: GradingRole;
  systemPrompt: string;
  focusAreas: string[];
  evaluationCriteria: string[];
  scoreWeights: Record<string, number>;
}

export interface ModelSelectionStrategy {
  availableModels: string[];
  modelAssignments: Record<GradingRole, string>;
  fallbackModel?: string;
}

export class AIGradingService {
  private gradingPrompts: Record<GradingRole, GradingPromptConfig>;
  private requestDelay: number;

  constructor(requestDelay: number = 2000) {
    this.requestDelay = requestDelay;
    this.gradingPrompts = this.initializeGradingPrompts();
  }

  /**
   * Initialize detailed grading prompts for each role
   */
  private initializeGradingPrompts(): Record<GradingRole, GradingPromptConfig> {
    return {
      [GradingRole.DEVELOPER]: {
        role: GradingRole.DEVELOPER,
        systemPrompt: `You are an experienced Senior Software Developer evaluating code quality and technical implementation. 

Your evaluation should focus on:
- Code quality and cleanliness
- Best practices and coding standards
- Maintainability and readability
- Technical implementation correctness
- Error handling and edge cases
- Performance considerations
- Code organization and structure

Provide a score from 0-100 and detailed feedback explaining your assessment. Be constructive but thorough in identifying areas for improvement.`,
        focusAreas: [
          'code quality',
          'best practices',
          'maintainability',
          'technical implementation',
          'error handling',
          'performance',
          'code organization'
        ],
        evaluationCriteria: [
          'clean code principles',
          'SOLID principles',
          'proper error handling',
          'performance optimization',
          'code readability',
          'naming conventions',
          'function/method design'
        ],
        scoreWeights: {
          'code_quality': 0.25,
          'best_practices': 0.20,
          'maintainability': 0.20,
          'technical_correctness': 0.20,
          'error_handling': 0.15
        }
      },

      [GradingRole.ARCHITECT]: {
        role: GradingRole.ARCHITECT,
        systemPrompt: `You are a Software Architect evaluating system design and architectural decisions.

Your evaluation should focus on:
- System design and architecture patterns
- Scalability and extensibility
- Separation of concerns
- Design patterns usage
- Modularity and component design
- Architectural decisions and trade-offs
- System integration and dependencies

Provide a score from 0-100 and detailed feedback on architectural aspects. Consider both current implementation and future scalability.`,
        focusAreas: [
          'system design',
          'scalability',
          'design patterns',
          'architectural decisions',
          'modularity',
          'separation of concerns',
          'extensibility'
        ],
        evaluationCriteria: [
          'design pattern implementation',
          'separation of concerns',
          'modularity and cohesion',
          'scalability considerations',
          'architectural consistency',
          'dependency management',
          'system boundaries'
        ],
        scoreWeights: {
          'design_patterns': 0.25,
          'separation_of_concerns': 0.20,
          'scalability': 0.20,
          'modularity': 0.20,
          'architectural_consistency': 0.15
        }
      },

      [GradingRole.SQA]: {
        role: GradingRole.SQA,
        systemPrompt: `You are a Senior Quality Assurance Engineer evaluating code for defects and quality issues.

Your evaluation should focus on:
- Bug detection and potential defects
- Edge case handling
- Testing coverage and testability
- Input validation and security
- Error scenarios and recovery
- Quality assurance concerns
- Risk assessment

Provide a score from 0-100 and detailed feedback on quality issues. Identify potential bugs, missing edge cases, and testing gaps.`,
        focusAreas: [
          'defect detection',
          'edge cases',
          'testing coverage',
          'quality assurance',
          'input validation',
          'error scenarios',
          'risk assessment'
        ],
        evaluationCriteria: [
          'bug identification',
          'edge case coverage',
          'test completeness',
          'input validation',
          'error handling robustness',
          'security considerations',
          'quality metrics'
        ],
        scoreWeights: {
          'defect_detection': 0.30,
          'edge_case_handling': 0.25,
          'testing_coverage': 0.20,
          'input_validation': 0.15,
          'error_robustness': 0.10
        }
      },

      [GradingRole.PRODUCT_OWNER]: {
        role: GradingRole.PRODUCT_OWNER,
        systemPrompt: `You are a Product Owner evaluating requirement fulfillment and business value delivery.

Your evaluation should focus on:
- Requirement fulfillment and completeness
- User experience and usability
- Business value delivery
- Feature completeness
- User story satisfaction
- Acceptance criteria compliance
- Product quality from user perspective

Provide a score from 0-100 and detailed feedback on how well the solution meets business requirements and delivers user value.`,
        focusAreas: [
          'requirement fulfillment',
          'user experience',
          'business value delivery',
          'feature completeness',
          'usability',
          'acceptance criteria',
          'user satisfaction'
        ],
        evaluationCriteria: [
          'requirement compliance',
          'user experience quality',
          'feature completeness',
          'business value alignment',
          'acceptance criteria satisfaction',
          'usability considerations',
          'user story fulfillment'
        ],
        scoreWeights: {
          'requirement_compliance': 0.30,
          'user_experience': 0.25,
          'feature_completeness': 0.20,
          'business_value': 0.15,
          'usability': 0.10
        }
      }
    };
  }

  /**
   * Submit code for comprehensive AI grading from multiple role perspectives
   */
  async submitForGrading(
    challengeId: string,
    submittedCode: string,
    challenge: Challenge,
    userId?: string
  ): Promise<AIGradingResponse> {
    return handleAsyncError(async () => {
      const requirements = challenge.requirements.map(req => req.description);

      // Step 1: Query available models
      const availableModels = await this.getAvailableModels();

      // Step 2: Determine model assignment strategy
      const modelStrategy = this.selectModelsForRoles(availableModels);

      // Step 3: Perform sequential role evaluations
      const roleEvaluations: RoleEvaluation[] = [];
      const evaluationOrder = [
        GradingRole.DEVELOPER,
        GradingRole.ARCHITECT,
        GradingRole.SQA,
        GradingRole.PRODUCT_OWNER
      ];

      for (const role of evaluationOrder) {
        try {
          const evaluation = await this.evaluateWithRole(
            submittedCode,
            role,
            modelStrategy.modelAssignments[role],
            requirements,
            challenge
          );
          roleEvaluations.push(evaluation);

          // Apply delay between role evaluations to avoid rate limits
          if (role !== GradingRole.PRODUCT_OWNER) { // Don't delay after last evaluation
            await this.delay(this.requestDelay);
          }
        } catch (error) {
          console.error(`Failed to evaluate with ${role} role:`, error);

          // Create fallback evaluation for failed role
          const fallbackEvaluation: RoleEvaluation = {
            role,
            modelUsed: 'fallback',
            score: 50, // Neutral score for failed evaluation
            feedback: `Unable to complete ${role} evaluation due to technical issues. Please try again later.`,
            detailedAnalysis: `The ${role} evaluation could not be completed. This may be due to model availability or network issues.`,
            focusAreas: this.gradingPrompts[role].focusAreas,
            timestamp: new Date()
          };
          roleEvaluations.push(fallbackEvaluation);
        }
      }

      // Step 4: Calculate average score
      const averageScore = this.calculateAverageScore(roleEvaluations);

      // Step 5: Generate overall feedback
      const overallFeedback = this.generateOverallFeedback(roleEvaluations, averageScore);

      // Step 6: Record grading history
      if (userId) {
        await this.recordGradingHistory(userId, challengeId, roleEvaluations, challenge);
      }

      const response: AIGradingResponse = {
        success: true,
        challengeId,
        roleEvaluations,
        averageScore,
        overallFeedback,
        gradingTimestamp: new Date()
      };

      return response;

    }, {
      context: 'ai_grading_service_submit',
      challengeId,
      userId
    });
  }

  /**
   * Query /v1/models endpoint to determine available models
   */
  private async getAvailableModels(): Promise<string[]> {
    try {
      const aiService = getAIService();

      // Try to get models from the AI service configuration
      if (aiService['config']?.provider === 'local-llm') {
        const endpoint = aiService['config'].localLLM?.endpoint || 'http://localhost:1234/v1';
        const response = await fetch(`${endpoint}/models`);

        if (response.ok) {
          const data = await response.json();
          return data.data?.map((model: any) => model.id) || ['local-model'];
        }
      } else if (aiService['config']?.provider === 'openrouter') {
        // For OpenRouter, we'll use a predefined list of preferred models
        return [
          'openai/gpt-4o-mini',
          'anthropic/claude-3-haiku',
          'meta-llama/llama-3.1-8b-instruct:free',
          'microsoft/wizardlm-2-8x22b',
          'google/gemma-2-9b-it:free'
        ];
      }

      // Fallback for Kiro AI or unknown providers
      return ['kiro-ai'];
    } catch (error) {
      console.warn('Failed to query available models:', error);
      return ['default-model'];
    }
  }

  /**
   * Select models for each role based on available models
   */
  private selectModelsForRoles(availableModels: string[]): ModelSelectionStrategy {
    const modelAssignments: Record<GradingRole, string> = {} as Record<GradingRole, string>;

    if (availableModels.length === 1) {
      // Single model scenario - use same model for all roles
      const model = availableModels[0];
      modelAssignments[GradingRole.DEVELOPER] = model;
      modelAssignments[GradingRole.ARCHITECT] = model;
      modelAssignments[GradingRole.SQA] = model;
      modelAssignments[GradingRole.PRODUCT_OWNER] = model;
    } else {
      // Multiple models scenario - assign different models to each role
      const roles = [GradingRole.DEVELOPER, GradingRole.ARCHITECT, GradingRole.SQA, GradingRole.PRODUCT_OWNER];

      roles.forEach((role, index) => {
        const modelIndex = index % availableModels.length;
        modelAssignments[role] = availableModels[modelIndex];
      });
    }

    return {
      availableModels,
      modelAssignments,
      fallbackModel: availableModels[0]
    };
  }

  /**
   * Evaluate code with specific role perspective using assigned model
   */
  private async evaluateWithRole(
    code: string,
    role: GradingRole,
    model: string,
    requirements: string[],
    challenge: Challenge
  ): Promise<RoleEvaluation> {
    const promptConfig = this.gradingPrompts[role];

    const evaluationPrompt = this.buildRoleEvaluationPrompt(
      code,
      role,
      requirements,
      challenge,
      promptConfig
    );

    const aiService = getAIService();

    // Create a mock challenge context for the AI service
    const challengeContext = {
      challenge,
      currentCode: code,
      attempts: 1,
      startTime: new Date(),
      lastModified: new Date()
    };

    try {
      const response = await aiService.sendMessage(
        evaluationPrompt,
        challengeContext
      );

      if (!response.success || !response.message) {
        throw new Error('AI service returned unsuccessful response');
      }

      // Parse the AI response to extract score and feedback
      const { score, feedback, detailedAnalysis } = this.parseAIEvaluationResponse(
        response.message.content,
        role
      );

      return {
        role,
        modelUsed: model,
        score,
        feedback,
        detailedAnalysis,
        focusAreas: promptConfig.focusAreas,
        timestamp: new Date()
      };
    } catch (error) {
      console.error(`Role evaluation failed for ${role}:`, error);
      throw error;
    }
  }

  /**
   * Build role-specific evaluation prompt
   */
  private buildRoleEvaluationPrompt(
    code: string,
    role: GradingRole,
    requirements: string[],
    challenge: Challenge,
    promptConfig: GradingPromptConfig
  ): string {
    return `${promptConfig.systemPrompt}

**Challenge Context:**
- Challenge: ${challenge.title}
- Kaiju Monster: ${challenge.kaiju.name} (${challenge.kaiju.description})
- Language: ${challenge.config.language}
- Category: ${challenge.config.category}
- Difficulty: ${challenge.config.difficulty}/5

**Requirements to Evaluate Against:**
${requirements.map((req, index) => `${index + 1}. ${req}`).join('\n')}

**Focus Areas for ${role.toUpperCase()} Evaluation:**
${promptConfig.focusAreas.map(area => `- ${area}`).join('\n')}

**Evaluation Criteria:**
${promptConfig.evaluationCriteria.map(criteria => `- ${criteria}`).join('\n')}

**Code to Evaluate:**
\`\`\`${challenge.config.language}
${code}
\`\`\`

**Instructions:**
1. Evaluate the code from the perspective of a ${role.replace('-', ' ')}
2. Provide a numerical score from 0-100
3. Give detailed feedback explaining your assessment
4. Focus specifically on the areas listed above for your role
5. Be constructive and specific in your feedback
6. Identify both strengths and areas for improvement

**Response Format:**
SCORE: [0-100]

FEEDBACK:
[Your detailed feedback here]

DETAILED ANALYSIS:
[Your in-depth analysis covering the specific focus areas for your role]`;
  }

  /**
   * Parse AI evaluation response to extract score and feedback
   */
  private parseAIEvaluationResponse(
    aiResponse: string,
    role: GradingRole
  ): { score: number; feedback: string; detailedAnalysis: string } {
    try {
      // Extract score using regex (handle negative numbers)
      const scoreMatch = aiResponse.match(/SCORE:\s*(-?\d+)/i);
      const score = scoreMatch ? Math.min(100, Math.max(0, parseInt(scoreMatch[1]))) : 50;

      // Extract feedback section
      const feedbackMatch = aiResponse.match(/FEEDBACK:\s*(.*?)(?=DETAILED ANALYSIS:|$)/is);
      const feedback = feedbackMatch ? feedbackMatch[1].trim() :
        `${role} evaluation completed. Please review the detailed analysis for specific insights.`;

      // Extract detailed analysis section
      const analysisMatch = aiResponse.match(/DETAILED ANALYSIS:\s*(.*?)$/is);
      const detailedAnalysis = analysisMatch ? analysisMatch[1].trim() :
        `Detailed analysis from ${role} perspective: ${aiResponse.substring(0, 500)}...`;

      return {
        score,
        feedback,
        detailedAnalysis
      };
    } catch (error) {
      console.error('Failed to parse AI evaluation response:', error);

      // Fallback parsing
      return {
        score: 50,
        feedback: `${role} evaluation completed with parsing issues. Raw response available in detailed analysis.`,
        detailedAnalysis: aiResponse
      };
    }
  }

  /**
   * Calculate average score from all role evaluations
   */
  private calculateAverageScore(roleEvaluations: RoleEvaluation[]): number {
    if (roleEvaluations.length === 0) return 0;

    const totalScore = roleEvaluations.reduce((sum, evaluation) => sum + evaluation.score, 0);
    return Math.round(totalScore / roleEvaluations.length);
  }

  /**
   * Generate overall feedback summary from all role evaluations
   */
  private generateOverallFeedback(
    roleEvaluations: RoleEvaluation[],
    averageScore: number
  ): string {
    const scoreRanges = {
      excellent: averageScore >= 90,
      good: averageScore >= 75,
      satisfactory: averageScore >= 60,
      needsImprovement: averageScore >= 40,
      poor: averageScore < 40
    };

    let overallAssessment = '';
    if (scoreRanges.excellent) {
      overallAssessment = '🌟 Excellent work! Your code demonstrates strong technical skills across all evaluation areas.';
    } else if (scoreRanges.good) {
      overallAssessment = '👍 Good job! Your code shows solid understanding with room for some improvements.';
    } else if (scoreRanges.satisfactory) {
      overallAssessment = '✅ Satisfactory implementation. There are several areas where you can enhance your code quality.';
    } else if (scoreRanges.needsImprovement) {
      overallAssessment = '📈 Your code needs improvement in multiple areas. Focus on the feedback provided by each role.';
    } else {
      overallAssessment = '🔧 Significant improvements needed. Review the detailed feedback carefully and consider refactoring.';
    }

    const roleScores = roleEvaluations.map(evaluation => `${evaluation.role}: ${evaluation.score}`).join(', ');

    return `${overallAssessment}

**Overall Score: ${averageScore}/100**
**Individual Role Scores:** ${roleScores}

**Key Insights:**
${roleEvaluations.map(evaluation =>
      `• **${evaluation.role.toUpperCase()}**: ${evaluation.feedback.split('.')[0]}.`
    ).join('\n')}

Review the detailed analysis from each role to understand specific areas for improvement and build upon your strengths.`;
  }

  /**
   * Record grading history in user progress
   */
  private async recordGradingHistory(
    userId: string,
    challengeId: string,
    roleEvaluations: RoleEvaluation[],
    challenge: Challenge
  ): Promise<void> {
    try {
      const userProgressStore = useUserProgressStore();

      if (!userProgressStore.userProgress) {
        console.warn('User progress not initialized, cannot record grading history');
        return;
      }

      const roleScores: Record<GradingRole, number> = {} as Record<GradingRole, number>;
      const modelsUsed: string[] = [];

      roleEvaluations.forEach(evaluation => {
        roleScores[evaluation.role] = evaluation.score;
        if (!modelsUsed.includes(evaluation.modelUsed)) {
          modelsUsed.push(evaluation.modelUsed);
        }
      });

      const averageScore = this.calculateAverageScore(roleEvaluations);

      const gradingEntry: GradingHistoryEntry = {
        challengeId,
        gradingTimestamp: new Date(),
        roleScores,
        averageScore,
        modelsUsed,
        challengeType: challenge.config.category,
        kaijuType: challenge.kaiju.name
      };

      if (!userProgressStore.userProgress.gradingHistory) {
        userProgressStore.userProgress.gradingHistory = [];
      }
      userProgressStore.userProgress.gradingHistory.push(gradingEntry);

      // Keep only last 50 grading entries to prevent excessive storage
      if (userProgressStore.userProgress.gradingHistory.length > 50) {
        userProgressStore.userProgress.gradingHistory =
          userProgressStore.userProgress.gradingHistory.slice(-50);
      }

      await userProgressStore.saveProgress();
    } catch (error) {
      console.error('Failed to record grading history:', error);
    }
  }

  /**
   * Utility method to add delay between requests
   */
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get grading history for a user
   */
  getGradingHistory(userId: string): GradingHistoryEntry[] {
    const userProgressStore = useUserProgressStore();
    return userProgressStore.userProgress?.gradingHistory || [];
  }

  /**
   * Get grading statistics for a user
   */
  getGradingStatistics(userId: string) {
    const history = this.getGradingHistory(userId);

    if (history.length === 0) {
      return {
        totalGradings: 0,
        averageOverallScore: 0,
        averageRoleScores: {} as Record<GradingRole, number>,
        improvementTrend: 'stable' as 'improving' | 'declining' | 'stable',
        bestScore: 0,
        recentGradings: []
      };
    }

    const totalGradings = history.length;
    const averageOverallScore = Math.round(
      history.reduce((sum, entry) => sum + entry.averageScore, 0) / totalGradings
    );

    // Calculate average scores per role
    const averageRoleScores: Record<GradingRole, number> = {} as Record<GradingRole, number>;
    const roleScoreSums: Record<GradingRole, number> = {} as Record<GradingRole, number>;
    const roleCounts: Record<GradingRole, number> = {} as Record<GradingRole, number>;

    history.forEach(entry => {
      if (entry.roleScores) {
        Object.entries(entry.roleScores).forEach(([role, score]) => {
          const gradingRole = role as GradingRole;
          roleScoreSums[gradingRole] = (roleScoreSums[gradingRole] || 0) + score;
          roleCounts[gradingRole] = (roleCounts[gradingRole] || 0) + 1;
        });
      }
    });

    Object.keys(roleScoreSums).forEach(role => {
      const gradingRole = role as GradingRole;
      averageRoleScores[gradingRole] = Math.round(
        roleScoreSums[gradingRole] / roleCounts[gradingRole]
      );
    });

    // Determine improvement trend
    let improvementTrend: 'improving' | 'declining' | 'stable' = 'stable';
    if (history.length >= 3) {
      const recent = history.slice(-3).map(h => h.averageScore);
      const older = history.slice(-6, -3).map(h => h.averageScore);

      if (older.length > 0) {
        const recentAvg = recent.reduce((sum, score) => sum + score, 0) / recent.length;
        const olderAvg = older.reduce((sum, score) => sum + score, 0) / older.length;

        if (recentAvg > olderAvg + 5) improvementTrend = 'improving';
        else if (recentAvg < olderAvg - 5) improvementTrend = 'declining';
      }
    }

    const bestScore = Math.max(...history.map(h => h.averageScore));
    const recentGradings = history.slice(-5).reverse();

    return {
      totalGradings,
      averageOverallScore,
      averageRoleScores,
      improvementTrend,
      bestScore,
      recentGradings
    };
  }
}

// Export singleton instance
let aiGradingServiceInstance: AIGradingService | null = null;

export function createAIGradingService(requestDelay?: number): AIGradingService {
  aiGradingServiceInstance = new AIGradingService(requestDelay);
  return aiGradingServiceInstance;
}

export function getAIGradingService(): AIGradingService {
  if (!aiGradingServiceInstance) {
    aiGradingServiceInstance = new AIGradingService();
  }
  return aiGradingServiceInstance;
}