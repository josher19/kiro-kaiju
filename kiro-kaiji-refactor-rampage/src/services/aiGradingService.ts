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
   * Uses unified prompt system that requests evaluation from all four roles in one API call
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

      // Step 2: Select single optimal model for unified evaluation
      const selectedModel = this.selectOptimalModel(availableModels);

      // Step 3: Perform unified role evaluation with single API call
      let roleEvaluations: RoleEvaluation[] = [];

      try {
        // Use unified prompt system for single API call
        roleEvaluations = await this.evaluateWithUnifiedPrompt(
          submittedCode,
          selectedModel,
          requirements,
          challenge
        );
      } catch (error) {
        console.error('Unified evaluation failed, falling back to sequential evaluation:', error);

        // Fallback to sequential evaluation if unified approach fails
        roleEvaluations = await this.fallbackToSequentialEvaluation(
          submittedCode,
          availableModels,
          requirements,
          challenge
        );
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
   * Select single optimal model from available models for unified evaluation
   */
  private selectOptimalModel(availableModels: string[]): string {
    if (availableModels.length === 0) {
      return 'default-model';
    }

    // Preferred model order for coding tasks
    const preferredModels = [
      'openai/gpt-4o-mini',
      'anthropic/claude-3-haiku',
      'meta-llama/llama-3.1-8b-instruct:free',
      'microsoft/wizardlm-2-8x22b',
      'google/gemma-2-9b-it:free',
      'local-model',
      'kiro-ai'
    ];

    // Find the first preferred model that's available
    for (const preferred of preferredModels) {
      if (availableModels.includes(preferred)) {
        return preferred;
      }
    }

    // If no preferred model is found, use the first available
    return availableModels[0];
  }

  /**
   * Select models for each role based on available models (fallback method)
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
   * Evaluate code using unified prompt system that requests all four role perspectives in one API call
   */
  private async evaluateWithUnifiedPrompt(
    code: string,
    model: string,
    requirements: string[],
    challenge: Challenge
  ): Promise<RoleEvaluation[]> {
    const unifiedPrompt = this.buildUnifiedEvaluationPrompt(code, requirements, challenge);
    const aiService = getAIService();

    // Create challenge context for the AI service
    const challengeContext = {
      challenge,
      currentCode: code,
      attempts: 1,
      startTime: new Date(),
      lastModified: new Date()
    };

    // Apply delay before calling LLM to avoid quotas
    await this.delay(this.requestDelay);

    const response = await aiService.sendMessage(unifiedPrompt, challengeContext);

    if (!response.success || !response.message) {
      throw new Error('AI service returned unsuccessful response');
    }

    // Parse the unified JSON response
    const roleEvaluations = this.parseUnifiedEvaluationResponse(
      response.message.content,
      model
    );

    return roleEvaluations;
  }

  /**
   * Fallback to sequential evaluation if unified approach fails
   */
  private async fallbackToSequentialEvaluation(
    code: string,
    availableModels: string[],
    requirements: string[],
    challenge: Challenge
  ): Promise<RoleEvaluation[]> {
    const modelStrategy = this.selectModelsForRoles(availableModels);
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
          code,
          role,
          modelStrategy.modelAssignments[role],
          requirements,
          challenge
        );
        roleEvaluations.push(evaluation);

        // Apply delay between role evaluations to avoid rate limits
        if (role !== GradingRole.PRODUCT_OWNER) {
          await this.delay(this.requestDelay);
        }
      } catch (error) {
        console.error(`Failed to evaluate with ${role} role:`, error);

        // Create fallback evaluation for failed role
        const fallbackEvaluation: RoleEvaluation = {
          role,
          modelUsed: 'fallback',
          score: 50,
          feedback: `Unable to complete ${role} evaluation due to technical issues. Please try again later.`,
          detailedAnalysis: `The ${role} evaluation could not be completed. This may be due to model availability or network issues.`,
          focusAreas: this.gradingPrompts[role].focusAreas,
          timestamp: new Date()
        };
        roleEvaluations.push(fallbackEvaluation);
      }
    }

    return roleEvaluations;
  }

  /**
   * Evaluate code with specific role perspective using assigned model (fallback method)
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
   * Build unified evaluation prompt that requests all four role perspectives in one request
   */
  private buildUnifiedEvaluationPrompt(
    code: string,
    requirements: string[],
    challenge: Challenge
  ): string {
    return `You are an AI code evaluation system that provides comprehensive feedback from multiple professional perspectives. 
    You will return JSON with { role: [score, reason] }, such as: {"developer": [85, "Good code structure with minor improvements needed"], "architect": [78, "Solid design but could use better patterns"], "sqa": [92, "Excellent testing and quality measures"], "productOwner": [88, "Requirements well addressed with good UX"]}
    You will evaluate the provided code from four different role perspectives simultaneously and return a structured JSON response.

**Challenge Context:**
- Challenge: ${challenge.title || 'Code Evaluation Challenge'}
- Kaiju Monster: ${challenge.kaiju.name} (${challenge.kaiju.description})
- Language: ${challenge.config.language}
- Category: ${challenge.config.category}
- Difficulty: ${challenge.config.difficulty}/5

**Requirements to Evaluate Against:**
${requirements.map((req, index) => `${index + 1}. ${req}`).join('\n')}

**Code to Evaluate:**
\`\`\`${challenge.config.language}
${code}
\`\`\`

**Evaluation Instructions:**
Please evaluate this code from the perspective of each of the following four roles and provide scores (0-100) and brief reasons for each:

1. **DEVELOPER ROLE**: Focus on code quality, best practices, maintainability, and technical implementation
   - Evaluation criteria: clean code principles, SOLID principles, error handling, performance, readability

2. **ARCHITECT ROLE**: Focus on system design, scalability, patterns, and architectural decisions
   - Evaluation criteria: design patterns, separation of concerns, modularity, scalability, architectural consistency

3. **SQA ROLE**: Focus on defects, edge cases, testing coverage, and quality assurance concerns
   - Evaluation criteria: bug detection, edge case handling, test completeness, input validation, error robustness

4. **PRODUCT_OWNER ROLE**: Focus on requirement fulfillment, user experience, and business value delivery
   - Evaluation criteria: requirement compliance, user experience, feature completeness, business value alignment

**CRITICAL: You must respond with ONLY a valid JSON object in exactly this format:**
{
  "developer": [score, "brief reason for score"],
  "architect": [score, "brief reason for score"],
  "sqa": [score, "brief reason for score"],
  "productOwner": [score, "brief reason for score"]
}

**Requirements for the response:**
- Each score must be an integer between 0 and 100
- Each reason must be a concise explanation (1-2 sentences) for the score
- The response must be valid JSON that can be parsed
- Do not include any text before or after the JSON object
- Use exactly the keys: "developer", "architect", "sqa", "productOwner"
- Do not use markdown code blocks or any formatting
- Start your response immediately with the opening brace {
- End your response with the closing brace }

Example format:
{"developer": [85, "Good code structure with minor improvements needed"], "architect": [78, "Solid design but could use better patterns"], "sqa": [92, "Excellent testing and quality measures"], "productOwner": [88, "Requirements well addressed with good UX"]}

Evaluate the code now and respond with ONLY the JSON object:`;
  }

  /**
   * Build role-specific evaluation prompt (fallback method)
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
   * Parse unified AI evaluation response in JSON format
   * Expected format: {"developer": [score, "reason"], "architect": [score, "reason"], "sqa": [score, "reason"], "productOwner": [score, "reason"]}
   */
  private parseUnifiedEvaluationResponse(
    aiResponse: string,
    model: string
  ): RoleEvaluation[] {
    console.log('Parsing unified evaluation response from model:', model);
    console.log('Raw AI response:', aiResponse);

    try {
      // Clean the response to extract JSON
      let jsonStr = aiResponse.trim();

      // Remove any markdown code blocks
      jsonStr = jsonStr.replace(/```json\s*/g, '').replace(/```\s*/g, '');

      // Find JSON object in the response
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }

      console.log('Extracted JSON string:', jsonStr);

      // Parse the JSON response
      const parsedResponse = JSON.parse(jsonStr);
      console.log('Parsed JSON response:', parsedResponse);

      // Validate the expected structure
      const requiredKeys = ['developer', 'architect', 'sqa', 'productOwner'];
      const presentKeys = Object.keys(parsedResponse);
      const missingKeys = requiredKeys.filter(key => !(key in parsedResponse));

      console.log('Present keys in response:', presentKeys);
      console.log('Required keys:', requiredKeys);
      console.log('Missing keys:', missingKeys);

      if (missingKeys.length > 0) {
        console.warn(`Missing required keys: ${missingKeys.join(', ')}`);
        throw new Error(`Missing required keys: ${missingKeys.join(', ')}`);
      }

      // Convert to RoleEvaluation objects
      const roleEvaluations: RoleEvaluation[] = [];
      const timestamp = new Date();

      // Process each role evaluation
      Object.entries(parsedResponse).forEach(([roleKey, evaluation]) => {
        console.log(`Processing role ${roleKey}:`, evaluation);
        console.log(`Evaluation type: ${typeof evaluation}, isArray: ${Array.isArray(evaluation)}`);
        
        if (!Array.isArray(evaluation)) {
          console.warn(`Evaluation for ${roleKey} is not an array:`, evaluation);
          throw new Error(`Invalid evaluation format for ${roleKey} - expected array, got ${typeof evaluation}`);
        }
        
        if (evaluation.length !== 2) {
          console.warn(`Evaluation array for ${roleKey} has wrong length (${evaluation.length}):`, evaluation);
          throw new Error(`Invalid evaluation format for ${roleKey} - expected array of length 2, got ${evaluation.length}`);
        }

        const [score, reason] = evaluation;
        console.log(`Extracted score: ${score} (type: ${typeof score}), reason: ${reason} (type: ${typeof reason})`);
        
        const numericScore = Math.min(100, Math.max(0, parseInt(String(score))));
        const roleEnum = this.mapRoleKeyToEnum(roleKey);

        if (!roleEnum) {
          console.warn(`Unknown role key: ${roleKey}`);
          throw new Error(`Unknown role key: ${roleKey}`);
        }

        const promptConfig = this.gradingPrompts[roleEnum];

        roleEvaluations.push({
          role: roleEnum,
          modelUsed: model,
          score: numericScore,
          feedback: String(reason),
          detailedAnalysis: `${roleEnum.toUpperCase()} Evaluation: ${reason}\n\nThis evaluation focused on: ${promptConfig.focusAreas.join(', ')}.`,
          focusAreas: promptConfig.focusAreas,
          timestamp
        });
        
        console.log(`Successfully processed ${roleKey} with score ${numericScore}`);
      });

      console.log('Successfully parsed unified response, created evaluations:', roleEvaluations.length);
      return roleEvaluations;

    } catch (error) {
      console.error('Failed to parse unified evaluation response:', error);
      console.error('Raw response:', aiResponse);

      // Try to extract individual role evaluations from a more flexible format
      const flexibleEvaluations = this.tryFlexibleParsing(aiResponse, model);
      if (flexibleEvaluations.length > 0) {
        console.log('Successfully used flexible parsing, created evaluations:', flexibleEvaluations.length);
        return flexibleEvaluations;
      }

      // Fallback: create default evaluations for all roles
      console.log('Using fallback evaluations');
      return this.createFallbackEvaluations(model, aiResponse);
    }
  }

  /**
   * Map role key from JSON response to GradingRole enum
   */
  private mapRoleKeyToEnum(roleKey: string): GradingRole | null {
    const roleMap: Record<string, GradingRole> = {
      'developer': GradingRole.DEVELOPER,
      'architect': GradingRole.ARCHITECT,
      'sqa': GradingRole.SQA,
      'productOwner': GradingRole.PRODUCT_OWNER
    };

    return roleMap[roleKey] || null;
  }

  /**
   * Try flexible parsing for Local LLM responses that might not follow exact JSON format
   */
  private tryFlexibleParsing(aiResponse: string, model: string): RoleEvaluation[] {
    console.log('Attempting flexible parsing...');
    
    const roleEvaluations: RoleEvaluation[] = [];
    const timestamp = new Date();
    
    // First, try to extract JSON-like structures with role arrays
    const roleKeys = ['developer', 'architect', 'sqa', 'productOwner'];
    let foundValidArrays = 0;
    
    for (const roleKey of roleKeys) {
      const roleEnum = this.mapRoleKeyToEnum(roleKey);
      if (!roleEnum) continue;
      
      // Look for patterns like "developer":[80,"reason text"]
      const arrayPattern = new RegExp(`"${roleKey}"\\s*:\\s*\\[(\\d+)\\s*,\\s*"([^"]*)"\\]`, 'i');
      const match = aiResponse.match(arrayPattern);
      
      if (match) {
        const score = Math.min(100, Math.max(0, parseInt(match[1])));
        const feedback = match[2];
        const promptConfig = this.gradingPrompts[roleEnum];
        
        roleEvaluations.push({
          role: roleEnum,
          modelUsed: model,
          score,
          feedback,
          detailedAnalysis: `${roleEnum.toUpperCase()} Evaluation: ${feedback}\n\nThis evaluation focused on: ${promptConfig.focusAreas.join(', ')}.`,
          focusAreas: promptConfig.focusAreas,
          timestamp
        });
        
        foundValidArrays++;
        console.log(`Extracted ${roleKey}: score=${score}, feedback="${feedback}"`);
      }
    }
    
    // If we found all 4 roles with valid array format, return them
    if (foundValidArrays === 4) {
      console.log('Successfully extracted all 4 roles using array pattern matching');
      return roleEvaluations;
    }
    
    // Fallback to pattern-based extraction
    console.log('Array pattern matching failed, trying pattern-based extraction');
    roleEvaluations.length = 0; // Clear previous attempts
    
    const rolePatterns = [
      { role: GradingRole.DEVELOPER, patterns: ['developer', 'dev', 'code quality', 'technical'] },
      { role: GradingRole.ARCHITECT, patterns: ['architect', 'architecture', 'design', 'system'] },
      { role: GradingRole.SQA, patterns: ['sqa', 'qa', 'quality', 'testing', 'defect'] },
      { role: GradingRole.PRODUCT_OWNER, patterns: ['product', 'owner', 'business', 'requirement'] }
    ];

    for (const { role, patterns } of rolePatterns) {
      let score = 50; // Default score
      let feedback = 'Evaluation completed but format was unclear.';
      
      // Look for score patterns
      const scoreRegex = /(?:score|rating|grade)[\s:]*(\d+)/gi;
      const scoreMatches = aiResponse.match(scoreRegex);
      if (scoreMatches && scoreMatches.length > 0) {
        const scoreMatch = scoreMatches[0].match(/(\d+)/);
        if (scoreMatch) {
          score = Math.min(100, Math.max(0, parseInt(scoreMatch[1])));
        }
      }

      // Look for role-specific content
      for (const pattern of patterns) {
        const roleRegex = new RegExp(`${pattern}[\\s\\S]{0,200}`, 'gi');
        const roleMatch = aiResponse.match(roleRegex);
        if (roleMatch && roleMatch[0]) {
          feedback = roleMatch[0].substring(0, 150) + '...';
          break;
        }
      }

      const promptConfig = this.gradingPrompts[role];
      
      roleEvaluations.push({
        role,
        modelUsed: model,
        score,
        feedback,
        detailedAnalysis: `Flexible parsing extracted: ${feedback}\n\nFull response: ${aiResponse.substring(0, 300)}...`,
        focusAreas: promptConfig.focusAreas,
        timestamp
      });
    }

    return roleEvaluations.length === 4 ? roleEvaluations : [];
  }

  /**
   * Create fallback evaluations when unified parsing fails
   */
  private createFallbackEvaluations(model: string, rawResponse: string): RoleEvaluation[] {
    const roles = [GradingRole.DEVELOPER, GradingRole.ARCHITECT, GradingRole.SQA, GradingRole.PRODUCT_OWNER];
    const timestamp = new Date();

    return roles.map(role => {
      const promptConfig = this.gradingPrompts[role];

      return {
        role,
        modelUsed: model,
        score: 50, // Neutral fallback score
        feedback: `Unable to parse ${role} evaluation from AI response. Please try again.`,
        detailedAnalysis: `Parsing failed for ${role} evaluation. Raw AI response: ${rawResponse.substring(0, 200)}...`,
        focusAreas: promptConfig.focusAreas,
        timestamp
      };
    });
  }

  /**
   * Parse AI evaluation response to extract score and feedback (fallback method)
   */
  private parseAIEvaluationResponse(
    aiResponse: string,
    role: GradingRole
  ): { score: number; feedback: string; detailedAnalysis: string } {
    console.log(`Parsing AI evaluation response for ${role}:`, aiResponse);
    
    try {
      // Extract score using multiple patterns
      let score = 50; // Default score
      
      // Try different score patterns
      const scorePatterns = [
        /SCORE:\s*(-?\d+)/i,
        /Score:\s*(-?\d+)/i,
        /(\d+)\/100/i,
        /(\d+)\s*out\s*of\s*100/i,
        /rating:\s*(\d+)/i,
        /grade:\s*(\d+)/i,
        /(\d+)%/i
      ];
      
      for (const pattern of scorePatterns) {
        const match = aiResponse.match(pattern);
        if (match) {
          score = Math.min(100, Math.max(0, parseInt(match[1])));
          console.log(`Found score ${score} using pattern:`, pattern);
          break;
        }
      }

      // Extract feedback section with multiple patterns
      let feedback = '';
      const feedbackPatterns = [
        /FEEDBACK:\s*(.*?)(?=DETAILED ANALYSIS:|$)/is,
        /Feedback:\s*(.*?)(?=Analysis:|$)/is,
        /Assessment:\s*(.*?)(?=Details:|$)/is,
        /Evaluation:\s*(.*?)(?=Analysis:|$)/is
      ];
      
      for (const pattern of feedbackPatterns) {
        const match = aiResponse.match(pattern);
        if (match && match[1].trim()) {
          feedback = match[1].trim();
          console.log(`Found feedback using pattern:`, pattern);
          break;
        }
      }
      
      if (!feedback) {
        // Extract first meaningful sentence as feedback
        const sentences = aiResponse.split(/[.!?]+/);
        feedback = sentences.find(s => s.trim().length > 20)?.trim() || 
                  `${role} evaluation completed. Please review the detailed analysis.`;
      }

      // Extract detailed analysis section
      let detailedAnalysis = '';
      const analysisPatterns = [
        /DETAILED ANALYSIS:\s*(.*?)$/is,
        /Analysis:\s*(.*?)$/is,
        /Details:\s*(.*?)$/is,
        /Detailed:\s*(.*?)$/is
      ];
      
      for (const pattern of analysisPatterns) {
        const match = aiResponse.match(pattern);
        if (match && match[1].trim()) {
          detailedAnalysis = match[1].trim();
          console.log(`Found detailed analysis using pattern:`, pattern);
          break;
        }
      }
      
      if (!detailedAnalysis) {
        detailedAnalysis = `Detailed analysis from ${role} perspective:\n\n${aiResponse.substring(0, 500)}${aiResponse.length > 500 ? '...' : ''}`;
      }

      console.log(`Parsed ${role} evaluation - Score: ${score}, Feedback length: ${feedback.length}`);
      
      return {
        score,
        feedback,
        detailedAnalysis
      };
    } catch (error) {
      console.error('Failed to parse AI evaluation response:', error);

      // Fallback parsing - try to extract any numbers and meaningful text
      const numbers = aiResponse.match(/\d+/g);
      const fallbackScore = numbers ? Math.min(100, Math.max(0, parseInt(numbers[0]))) : 50;
      
      return {
        score: fallbackScore,
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