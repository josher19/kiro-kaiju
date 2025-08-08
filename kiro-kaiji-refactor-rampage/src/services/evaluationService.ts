/**
 * Code Evaluation Service
 * 
 * Comprehensive service for evaluating submitted code against challenges.
 * Provides readability scoring, defect detection, requirement verification,
 * and detailed feedback generation.
 */

import type {
  EvaluationResult,
  EvaluationCriteria,
  EvaluationFeedback
} from '@/types/user';
import type { Challenge, Requirement, TestCase } from '@/types/challenge';
import { ProgrammingLanguage } from '@/types/challenge';
import { errorHandler, handleAsyncError } from '@/utils/errorHandler';
import { networkService } from './networkService';
import { offlineStorageService } from './offlineStorageService';

export interface EvaluationRequest {
  challengeId: string;
  challenge: Challenge;
  submittedCode: string;
  userId?: string;
  timeSpent: number;
  attempts: number;
}

export interface CodeMetrics {
  linesOfCode: number;
  cyclomaticComplexity: number;
  maintainabilityIndex: number;
  duplicatedLines: number;
  codeSmells: string[];
  cognitiveComplexity: number;
}

export interface DefectAnalysis {
  syntaxErrors: string[];
  logicErrors: string[];
  potentialBugs: string[];
  securityIssues: string[];
  performanceIssues: string[];
}

export interface RequirementVerification {
  requirementId: string;
  satisfied: boolean;
  confidence: number;
  evidence: string[];
  issues: string[];
}

export class EvaluationService {
  private readonly WEIGHTS = {
    readability: 0.25,
    quality: 0.30,
    defects: 0.25,
    requirements: 0.20
  };

  /**
   * Evaluate submitted code against challenge requirements
   */
  async evaluateCode(request: EvaluationRequest): Promise<EvaluationResult> {
    return handleAsyncError(async () => {
      const { challenge, submittedCode, challengeId, userId, timeSpent, attempts } = request;

      // Check if we're offline and need to store for later evaluation
      if (!networkService.isOnline.value) {
        // Store evaluation for later sync
        await offlineStorageService.storePendingEvaluation(
          challengeId,
          submittedCode,
          userId,
          timeSpent,
          attempts
        );

        // Provide offline evaluation
        return this.performOfflineEvaluation(request);
      }

      // Perform all evaluation components
      const readabilityScore = await this.evaluateReadability(submittedCode, challenge.config.language);
      const qualityScore = await this.evaluateQuality(submittedCode, challenge.config.language);
      const defectScore = await this.evaluateDefects(submittedCode, challenge.config.language);
      const requirementScore = await this.evaluateRequirements(
        submittedCode,
        challenge.requirements,
        challenge.testCases,
        challenge.config.language
      );

      // Calculate overall score
      const scores: EvaluationCriteria = {
        readability: readabilityScore.score,
        quality: qualityScore.score,
        defects: defectScore.score,
        requirements: requirementScore.score
      };

      const overallScore = this.calculateOverallScore(scores);

      // Generate comprehensive feedback
      const feedback: EvaluationFeedback[] = [
        readabilityScore.feedback,
        qualityScore.feedback,
        defectScore.feedback,
        requirementScore.feedback
      ];

      // Determine if challenge passed
      const passed = this.determinePassStatus(scores, overallScore);

      const result: EvaluationResult = {
        challengeId,
        userId,
        submittedCode,
        scores,
        overallScore,
        feedback,
        timeSpent,
        attempts,
        passed,
        evaluatedAt: new Date()
      };

      return result;

    }, {
      context: 'code_evaluation',
      challengeId: request.challengeId,
      userId: request.userId
    }, {
      maxRetries: 1, // Limited retries for evaluation
      retryDelay: 2000
    });
  }

  /**
   * Perform offline evaluation with limited functionality
   */
  private async performOfflineEvaluation(request: EvaluationRequest): Promise<EvaluationResult> {
    const { challenge, submittedCode, challengeId, userId, timeSpent, attempts } = request;

    // Perform basic offline evaluation
    const readabilityScore = await this.evaluateReadability(submittedCode, challenge.config.language);
    const qualityScore = await this.evaluateQuality(submittedCode, challenge.config.language);
    const defectScore = await this.evaluateDefects(submittedCode, challenge.config.language);

    // Simplified requirement evaluation for offline mode
    const requirementScore = await this.evaluateRequirementsOffline(
      submittedCode,
      challenge.requirements,
      challenge.config.language
    );

    // Calculate overall score
    const scores: EvaluationCriteria = {
      readability: readabilityScore.score,
      quality: qualityScore.score,
      defects: defectScore.score,
      requirements: requirementScore.score
    };

    const overallScore = this.calculateOverallScore(scores);

    // Add offline notice to feedback
    const feedback: EvaluationFeedback[] = [
      {
        ...readabilityScore.feedback,
        message: `🔌 Offline Mode: ${readabilityScore.feedback.message}`
      },
      {
        ...qualityScore.feedback,
        message: `🔌 Offline Mode: ${qualityScore.feedback.message}`
      },
      {
        ...defectScore.feedback,
        message: `🔌 Offline Mode: ${defectScore.feedback.message}`
      },
      {
        ...requirementScore.feedback,
        message: `🔌 Offline Mode: ${requirementScore.feedback.message}`,
        suggestions: [
          ...requirementScore.feedback.suggestions,
          'Full requirement verification will be available when online'
        ]
      }
    ];

    // Determine if challenge passed (more lenient in offline mode)
    const passed = this.determinePassStatus(scores, overallScore);

    return {
      challengeId,
      userId,
      submittedCode,
      scores,
      overallScore,
      feedback,
      timeSpent,
      attempts,
      passed,
      evaluatedAt: new Date(),
      isOfflineEvaluation: true
    };
  }

  /**
   * Simplified requirement evaluation for offline mode
   */
  private async evaluateRequirementsOffline(
    code: string,
    requirements: Requirement[],
    language: ProgrammingLanguage
  ): Promise<{ score: number; feedback: EvaluationFeedback }> {
    // Basic heuristic-based requirement checking
    let satisfiedCount = 0;
    const suggestions: string[] = [];
    const issues: string[] = [];

    for (const requirement of requirements) {
      const satisfied = this.checkRequirementHeuristically(code, requirement, language);
      if (satisfied) {
        satisfiedCount++;
      } else {
        suggestions.push(`Address requirement: ${requirement.description}`);
        issues.push(`Requirement may not be satisfied: ${requirement.description}`);
      }
    }

    const score = Math.round((satisfiedCount / requirements.length) * 100);

    const feedback: EvaluationFeedback = {
      category: 'requirements',
      score,
      maxScore: 100,
      message: `Basic requirement check completed (${satisfiedCount}/${requirements.length} requirements appear satisfied)`,
      suggestions,
      codeExamples: []
    };

    return { score, feedback };
  }

  /**
   * Check requirement using basic heuristics (for offline mode)
   */
  private checkRequirementHeuristically(
    code: string,
    requirement: Requirement,
    language: ProgrammingLanguage
  ): boolean {
    const lowerDesc = requirement.description.toLowerCase();
    const lowerCode = code.toLowerCase();

    // Basic keyword matching for common requirements
    if (lowerDesc.includes('refactor') || lowerDesc.includes('improve')) {
      // Check if code has reasonable structure
      return code.split('\n').length > 5 && code.includes('function') || code.includes('def');
    }

    if (lowerDesc.includes('test') || lowerDesc.includes('unit test')) {
      // Check for test-like patterns
      return lowerCode.includes('test') || lowerCode.includes('assert') || lowerCode.includes('expect');
    }

    if (lowerDesc.includes('error') || lowerDesc.includes('exception')) {
      // Check for error handling
      return lowerCode.includes('try') || lowerCode.includes('catch') || lowerCode.includes('except');
    }

    if (lowerDesc.includes('duplicate') || lowerDesc.includes('dry')) {
      // Check for reduced duplication (simplified)
      const lines = code.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      const uniqueLines = new Set(lines);
      return uniqueLines.size / lines.length > 0.8; // 80% unique lines
    }

    // Default to partially satisfied for offline mode
    return true;
  }

  /**
   * Evaluate code readability using automated metrics
   */
  protected async evaluateReadability(
    code: string,
    language: ProgrammingLanguage
  ): Promise<{ score: number; feedback: EvaluationFeedback }> {
    const metrics = this.calculateCodeMetrics(code, language);

    // Start with base score
    let score = 100;
    const suggestions: string[] = [];
    const issues: string[] = [];

    // Handle empty code
    if (code.trim().length === 0) {
      return {
        score: 0,
        feedback: {
          category: 'readability',
          score: 0,
          maxScore: 100,
          message: 'No code provided for evaluation',
          suggestions: ['Please provide code to evaluate'],
          codeExamples: []
        }
      };
    }

    // Handle very short code snippets
    if (code.trim().length < 10) {
      return {
        score: 20,
        feedback: {
          category: 'readability',
          score: 20,
          maxScore: 100,
          message: 'Code is too short for meaningful evaluation',
          suggestions: ['Provide more substantial code for evaluation'],
          codeExamples: []
        }
      };
    }

    // Line length analysis - more strict
    const lines = code.split('\n');
    const longLines = lines.filter(line => line.length > 80);
    if (longLines.length > 0) {
      score -= Math.min(30, longLines.length * 5);
      suggestions.push('Consider breaking long lines (>80 characters) for better readability');
      issues.push(`Found ${longLines.length} lines exceeding 80 characters`);
    }

    // Check for extremely long lines (one-liners)
    const veryLongLines = lines.filter(line => line.length > 200);
    if (veryLongLines.length > 0) {
      score -= 40;
      suggestions.push('Break extremely long lines into multiple lines');
      issues.push('Found extremely long lines that hurt readability');
    }

    // Indentation consistency - more strict
    const indentationIssues = this.checkIndentationConsistency(lines);
    if (indentationIssues > 0) {
      score -= Math.min(25, indentationIssues * 5);
      suggestions.push('Maintain consistent indentation throughout the code');
      issues.push(`Found ${indentationIssues} indentation inconsistencies`);
    }

    // Naming conventions - reasonable penalty
    const namingScore = this.evaluateNamingConventions(code, language);
    score -= (100 - namingScore) * 0.2;
    if (namingScore < 60) {
      suggestions.push('Use descriptive and consistent naming conventions');
      issues.push('Some variables or functions have unclear names');
    }

    // Comments and documentation - reduced penalty
    const commentScore = this.evaluateComments(code, language);
    score -= (100 - commentScore) * 0.1;
    if (commentScore < 50) {
      suggestions.push('Add meaningful comments to explain complex logic');
      issues.push('Code lacks sufficient documentation');
    }

    // Cognitive complexity - reasonable penalty
    if (metrics.cognitiveComplexity > 15) {
      score -= Math.min(20, (metrics.cognitiveComplexity - 15) * 2);
      suggestions.push('Break down complex functions into smaller, more manageable pieces');
      issues.push(`High cognitive complexity: ${metrics.cognitiveComplexity}`);
    }

    // Check for single-character variable names (except loop counters)
    const singleCharVars = code.match(/\b[a-z]\b(?![a-z])/g) || [];
    const nonLoopSingleChars = singleCharVars.filter(v => !['i', 'j', 'k'].includes(v));
    if (nonLoopSingleChars.length > 0) {
      score -= Math.min(20, nonLoopSingleChars.length * 5);
      suggestions.push('Use descriptive variable names instead of single characters');
      issues.push(`Found ${nonLoopSingleChars.length} single-character variable names`);
    }

    // Check for proper spacing around operators
    const spacingIssues = this.checkOperatorSpacing(code);
    if (spacingIssues > 0) {
      score -= Math.min(15, spacingIssues * 2);
      suggestions.push('Add proper spacing around operators for better readability');
      issues.push(`Found ${spacingIssues} spacing issues around operators`);
    }

    score = Math.max(0, Math.round(score));

    // Ensure we always have at least one suggestion
    if (suggestions.length === 0) {
      if (score >= 90) {
        suggestions.push('Excellent readability! Consider adding more descriptive comments for complex logic.');
      } else if (score >= 70) {
        suggestions.push('Good readability overall. Consider minor improvements to variable naming or formatting.');
      } else {
        suggestions.push('Focus on improving code structure and naming conventions for better readability.');
      }
    }

    const feedback: EvaluationFeedback = {
      category: 'readability',
      score,
      maxScore: 100,
      message: this.generateReadabilityMessage(score),
      suggestions,
      codeExamples: this.generateReadabilityExamples(code, language, issues)
    };

    return { score, feedback };
  }

  /**
   * Evaluate code quality including maintainability and best practices
   */
  private async evaluateQuality(
    code: string,
    language: ProgrammingLanguage
  ): Promise<{ score: number; feedback: EvaluationFeedback }> {
    const metrics = this.calculateCodeMetrics(code, language);

    let score = 100;
    const suggestions: string[] = [];
    const issues: string[] = [];

    // Cyclomatic complexity
    if (metrics.cyclomaticComplexity > 10) {
      score -= Math.min(30, (metrics.cyclomaticComplexity - 10) * 3);
      suggestions.push('Reduce cyclomatic complexity by simplifying conditional logic');
      issues.push(`High cyclomatic complexity: ${metrics.cyclomaticComplexity}`);
    }

    // Code duplication
    if (metrics.duplicatedLines > 0) {
      const duplicationPenalty = Math.min(25, metrics.duplicatedLines * 0.5);
      score -= duplicationPenalty;
      suggestions.push('Eliminate code duplication by extracting common functionality');
      issues.push(`Found ${metrics.duplicatedLines} duplicated lines`);
    }

    // Code smells
    if (metrics.codeSmells.length > 0) {
      score -= Math.min(20, metrics.codeSmells.length * 4);
      suggestions.push('Address identified code smells to improve maintainability');
      issues.push(`Found ${metrics.codeSmells.length} code smells: ${metrics.codeSmells.join(', ')}`);
    }

    // Language-specific quality checks
    const languageScore = this.evaluateLanguageSpecificQuality(code, language);
    score -= (100 - languageScore) * 0.3;
    if (languageScore < 80) {
      suggestions.push(`Follow ${language} best practices and conventions`);
      issues.push('Code doesn\'t follow language-specific best practices');
    }

    // Design patterns and architecture
    const designScore = this.evaluateDesignPatterns(code, language);
    score -= (100 - designScore) * 0.2;
    if (designScore < 70) {
      suggestions.push('Consider using appropriate design patterns for better code organization');
      issues.push('Code structure could benefit from better design patterns');
    }

    score = Math.max(0, Math.round(score));

    // Ensure we always have at least one suggestion
    if (suggestions.length === 0) {
      if (score >= 90) {
        suggestions.push('Excellent code quality! Consider adding more comprehensive error handling.');
      } else if (score >= 70) {
        suggestions.push('Good code quality. Consider reducing complexity and improving maintainability.');
      } else {
        suggestions.push('Focus on reducing complexity, eliminating duplication, and following best practices.');
      }
    }

    const feedback: EvaluationFeedback = {
      category: 'quality',
      score,
      maxScore: 100,
      message: this.generateQualityMessage(score),
      suggestions,
      codeExamples: this.generateQualityExamples(code, language, issues)
    };

    return { score, feedback };
  }

  /**
   * Evaluate code for defects and bugs through static analysis
   */
  private async evaluateDefects(
    code: string,
    language: ProgrammingLanguage
  ): Promise<{ score: number; feedback: EvaluationFeedback }> {
    const defects = this.analyzeDefects(code, language);

    let score = 100;
    const suggestions: string[] = [];
    const issues: string[] = [];

    // Syntax errors
    if (defects.syntaxErrors.length > 0) {
      score -= Math.min(50, defects.syntaxErrors.length * 10);
      suggestions.push('Fix all syntax errors before submission');
      issues.push(`Found ${defects.syntaxErrors.length} syntax errors`);
    }

    // Logic errors
    if (defects.logicErrors.length > 0) {
      score -= Math.min(40, defects.logicErrors.length * 8);
      suggestions.push('Review and fix logical errors in the code');
      issues.push(`Found ${defects.logicErrors.length} potential logic errors`);
    }

    // Potential bugs
    if (defects.potentialBugs.length > 0) {
      score -= Math.min(30, defects.potentialBugs.length * 5);
      suggestions.push('Address potential bugs to improve code reliability');
      issues.push(`Found ${defects.potentialBugs.length} potential bugs`);
    }

    // Security issues
    if (defects.securityIssues.length > 0) {
      score -= Math.min(35, defects.securityIssues.length * 7);
      suggestions.push('Fix security vulnerabilities to protect against attacks');
      issues.push(`Found ${defects.securityIssues.length} security issues`);
    }

    // Performance issues
    if (defects.performanceIssues.length > 0) {
      score -= Math.min(20, defects.performanceIssues.length * 4);
      suggestions.push('Optimize code for better performance');
      issues.push(`Found ${defects.performanceIssues.length} performance issues`);
    }

    score = Math.max(0, Math.round(score));

    // Ensure we always have at least one suggestion
    if (suggestions.length === 0) {
      if (score >= 90) {
        suggestions.push('Great job! No major defects found. Consider adding more comprehensive testing.');
      } else if (score >= 70) {
        suggestions.push('Good defect management. Consider reviewing edge cases and error handling.');
      } else {
        suggestions.push('Focus on fixing syntax errors, potential bugs, and security vulnerabilities.');
      }
    }

    const feedback: EvaluationFeedback = {
      category: 'defects',
      score,
      maxScore: 100,
      message: this.generateDefectsMessage(score),
      suggestions,
      codeExamples: this.generateDefectExamples(code, language, defects)
    };

    return { score, feedback };
  }

  /**
   * Evaluate requirement satisfaction
   */
  private async evaluateRequirements(
    code: string,
    requirements: Requirement[],
    testCases: TestCase[],
    language: ProgrammingLanguage
  ): Promise<{ score: number; feedback: EvaluationFeedback }> {
    const verifications: RequirementVerification[] = [];

    for (const requirement of requirements) {
      const verification = await this.verifyRequirement(code, requirement, testCases, language);
      verifications.push(verification);
    }

    // Calculate score based on requirement satisfaction
    const totalWeight = requirements.reduce((sum, req) => {
      const weight = req.priority === 'must' ? 3 : req.priority === 'should' ? 2 : 1;
      return sum + weight;
    }, 0);

    let weightedScore = 0;
    const suggestions: string[] = [];
    const issues: string[] = [];

    verifications.forEach((verification, index) => {
      const requirement = requirements[index];
      const weight = requirement.priority === 'must' ? 3 : requirement.priority === 'should' ? 2 : 1;

      if (verification.satisfied) {
        weightedScore += weight * verification.confidence;
      } else {
        suggestions.push(`Address requirement: ${requirement.description}`);
        issues.push(`Requirement not satisfied: ${requirement.description}`);
        if (verification.issues.length > 0) {
          issues.push(...verification.issues);
        }
      }
    });

    const score = Math.round((weightedScore / totalWeight) * 100);

    // Ensure we always have at least one suggestion
    if (suggestions.length === 0) {
      if (score >= 90) {
        suggestions.push('Excellent! All requirements satisfied. Consider adding additional features or optimizations.');
      } else if (score >= 70) {
        suggestions.push('Most requirements satisfied. Review any remaining requirements for completeness.');
      } else {
        suggestions.push('Focus on addressing the core requirements to improve your solution.');
      }
    }

    const feedback: EvaluationFeedback = {
      category: 'requirements',
      score,
      maxScore: 100,
      message: this.generateRequirementsMessage(score, verifications),
      suggestions,
      codeExamples: this.generateRequirementExamples(code, language, verifications)
    };

    return { score, feedback };
  }

  /**
   * Calculate comprehensive code metrics
   */
  private calculateCodeMetrics(code: string, language: ProgrammingLanguage): CodeMetrics {
    const lines = code.split('\n').filter(line => line.trim().length > 0);

    return {
      linesOfCode: lines.length,
      cyclomaticComplexity: this.calculateCyclomaticComplexity(code, language),
      maintainabilityIndex: this.calculateMaintainabilityIndex(code, language),
      duplicatedLines: this.findDuplicatedLines(code),
      codeSmells: this.detectCodeSmells(code, language),
      cognitiveComplexity: this.calculateCognitiveComplexity(code, language)
    };
  }

  /**
   * Calculate cyclomatic complexity
   */
  private calculateCyclomaticComplexity(code: string, language: ProgrammingLanguage): number {
    let complexity = 1; // Base complexity

    // Count decision points based on language
    const patterns = this.getComplexityPatterns(language);

    for (const pattern of patterns) {
      const matches = code.match(new RegExp(pattern, 'g'));
      if (matches) {
        complexity += matches.length;
      }
    }

    return complexity;
  }

  /**
   * Get complexity patterns for different languages
   */
  private getComplexityPatterns(language: ProgrammingLanguage): string[] {
    const commonPatterns = [
      '\\bif\\b', '\\belse\\b', '\\bwhile\\b', '\\bfor\\b',
      '\\bswitch\\b', '\\bcase\\b', '\\bcatch\\b', '\\b&&\\b', '\\b\\|\\|\\b'
    ];

    switch (language) {
      case ProgrammingLanguage.JAVASCRIPT:
      case ProgrammingLanguage.TYPESCRIPT:
        return [...commonPatterns, '\\btry\\b', '\\?.*:', '\\.forEach\\b', '\\.map\\b', '\\.filter\\b'];
      case ProgrammingLanguage.PYTHON:
        return [...commonPatterns, '\\btry\\b', '\\bexcept\\b', '\\belif\\b', '\\bwith\\b'];
      case ProgrammingLanguage.JAVA:
        return [...commonPatterns, '\\btry\\b', '\\bfinally\\b'];
      default:
        return commonPatterns;
    }
  }

  /**
   * Calculate cognitive complexity (how hard code is to understand)
   */
  private calculateCognitiveComplexity(code: string, language: ProgrammingLanguage): number {
    let complexity = 0;
    let nestingLevel = 0;

    const lines = code.split('\n');

    for (const line of lines) {
      const trimmedLine = line.trim();

      // Increment nesting for blocks
      if (this.isBlockStart(trimmedLine, language)) {
        nestingLevel++;
      }

      // Add complexity for control structures
      if (this.isControlStructure(trimmedLine, language)) {
        complexity += 1 + nestingLevel;
      }

      // Decrement nesting for block ends
      if (this.isBlockEnd(trimmedLine, language)) {
        nestingLevel = Math.max(0, nestingLevel - 1);
      }
    }

    return complexity;
  }

  /**
   * Check if line starts a block
   */
  private isBlockStart(line: string, language: ProgrammingLanguage): boolean {
    switch (language) {
      case ProgrammingLanguage.JAVASCRIPT:
      case ProgrammingLanguage.TYPESCRIPT:
      case ProgrammingLanguage.JAVA:
        return line.includes('{');
      case ProgrammingLanguage.PYTHON:
        return line.endsWith(':');
      default:
        return line.includes('{');
    }
  }

  /**
   * Check if line ends a block
   */
  private isBlockEnd(line: string, language: ProgrammingLanguage): boolean {
    switch (language) {
      case ProgrammingLanguage.JAVASCRIPT:
      case ProgrammingLanguage.TYPESCRIPT:
      case ProgrammingLanguage.JAVA:
        return line.includes('}');
      case ProgrammingLanguage.PYTHON:
        // Python uses indentation, so we approximate by checking dedentation
        return line.length > 0 && !line.startsWith(' ') && !line.startsWith('\t');
      default:
        return line.includes('}');
    }
  }

  /**
   * Check if line contains control structure
   */
  private isControlStructure(line: string, language: ProgrammingLanguage): boolean {
    const patterns = ['\\bif\\b', '\\belse\\b', '\\bwhile\\b', '\\bfor\\b', '\\bswitch\\b', '\\btry\\b'];
    return patterns.some(pattern => new RegExp(pattern).test(line));
  }

  /**
   * Calculate maintainability index
   */
  private calculateMaintainabilityIndex(code: string, language: ProgrammingLanguage): number {
    const loc = code.split('\n').length;
    const complexity = this.calculateCyclomaticComplexity(code, language);
    const halsteadVolume = this.calculateHalsteadVolume(code, language);

    // Simplified maintainability index calculation
    const mi = Math.max(0,
      171 - 5.2 * Math.log(halsteadVolume) - 0.23 * complexity - 16.2 * Math.log(loc)
    );

    return Math.round(mi);
  }

  /**
   * Calculate Halstead volume (approximation)
   */
  private calculateHalsteadVolume(code: string, language: ProgrammingLanguage): number {
    const operators = this.countOperators(code, language);
    const operands = this.countOperands(code, language);

    const n1 = operators.unique;
    const n2 = operands.unique;
    const N1 = operators.total;
    const N2 = operands.total;

    const vocabulary = n1 + n2;
    const length = N1 + N2;

    return length * Math.log2(vocabulary || 1);
  }

  /**
   * Count operators in code
   */
  private countOperators(code: string, language: ProgrammingLanguage): { unique: number; total: number } {
    const operatorPatterns = [
      '\\+', '-', '\\*', '/', '%', '=', '==', '!=', '<', '>', '<=', '>=',
      '&&', '\\|\\|', '!', '&', '\\|', '\\^', '<<', '>>', '\\?', ':'
    ];

    const operators = new Set<string>();
    let totalCount = 0;

    for (const pattern of operatorPatterns) {
      const matches = code.match(new RegExp(pattern, 'g'));
      if (matches) {
        operators.add(pattern);
        totalCount += matches.length;
      }
    }

    return { unique: operators.size, total: totalCount };
  }

  /**
   * Count operands in code
   */
  private countOperands(code: string, language: ProgrammingLanguage): { unique: number; total: number } {
    // Simplified operand counting - count identifiers and literals
    const identifierPattern = /\b[a-zA-Z_][a-zA-Z0-9_]*\b/g;
    const numberPattern = /\b\d+(\.\d+)?\b/g;
    const stringPattern = /["']([^"'\\]|\\.)*["']/g;

    const operands = new Set<string>();
    let totalCount = 0;

    const identifiers = code.match(identifierPattern) || [];
    const numbers = code.match(numberPattern) || [];
    const strings = code.match(stringPattern) || [];

    [...identifiers, ...numbers, ...strings].forEach(operand => {
      operands.add(operand);
      totalCount++;
    });

    return { unique: operands.size, total: totalCount };
  }

  /**
   * Find duplicated lines in code
   */
  private findDuplicatedLines(code: string): number {
    const lines = code.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const lineCount = new Map<string, number>();

    lines.forEach(line => {
      lineCount.set(line, (lineCount.get(line) || 0) + 1);
    });

    let duplicatedLines = 0;
    lineCount.forEach((count, line) => {
      if (count > 1) {
        duplicatedLines += count - 1;
      }
    });

    return duplicatedLines;
  }

  /**
   * Detect code smells
   */
  private detectCodeSmells(code: string, language: ProgrammingLanguage): string[] {
    const smells: string[] = [];

    // Long method
    const methods = this.extractMethods(code, language);
    methods.forEach(method => {
      if (method.lines > 50) {
        smells.push('Long Method');
      }
    });

    // Large class (for OOP languages)
    if (this.isOOPLanguage(language)) {
      const classes = this.extractClasses(code, language);
      classes.forEach(cls => {
        if (cls.lines > 200) {
          smells.push('Large Class');
        }
      });
    }

    // Magic numbers
    const magicNumbers = code.match(/\b\d{2,}\b/g);
    if (magicNumbers && magicNumbers.length > 3) {
      smells.push('Magic Numbers');
    }

    // Dead code (unused variables/functions)
    const deadCode = this.detectDeadCode(code, language);
    if (deadCode.length > 0) {
      smells.push('Dead Code');
    }

    return [...new Set(smells)];
  }

  /**
   * Extract methods from code
   */
  private extractMethods(code: string, language: ProgrammingLanguage): Array<{ name: string; lines: number }> {
    const methods: Array<{ name: string; lines: number }> = [];
    const lines = code.split('\n');

    let currentMethod: { name: string; startLine: number } | null = null;
    let braceCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Detect method start (simplified)
      if (this.isMethodDeclaration(line, language)) {
        if (currentMethod) {
          methods.push({
            name: currentMethod.name,
            lines: i - currentMethod.startLine
          });
        }
        currentMethod = {
          name: this.extractMethodName(line, language),
          startLine: i
        };
        braceCount = 0;
      }

      // Count braces for method boundaries
      braceCount += (line.match(/{/g) || []).length;
      braceCount -= (line.match(/}/g) || []).length;

      // Method end
      if (currentMethod && braceCount === 0 && line.includes('}')) {
        methods.push({
          name: currentMethod.name,
          lines: i - currentMethod.startLine + 1
        });
        currentMethod = null;
      }
    }

    return methods;
  }

  /**
   * Check if line is a method declaration
   */
  private isMethodDeclaration(line: string, language: ProgrammingLanguage): boolean {
    switch (language) {
      case ProgrammingLanguage.JAVASCRIPT:
      case ProgrammingLanguage.TYPESCRIPT:
        return /function\s+\w+|^\s*\w+\s*\(.*\)\s*{|^\s*\w+:\s*function/.test(line);
      case ProgrammingLanguage.PYTHON:
        return /^\s*def\s+\w+/.test(line);
      case ProgrammingLanguage.JAVA:
        return /^\s*(public|private|protected)?\s*(static)?\s*\w+\s+\w+\s*\(/.test(line);
      default:
        return false;
    }
  }

  /**
   * Extract method name from declaration
   */
  private extractMethodName(line: string, language: ProgrammingLanguage): string {
    switch (language) {
      case ProgrammingLanguage.JAVASCRIPT:
      case ProgrammingLanguage.TYPESCRIPT:
        const jsMatch = line.match(/function\s+(\w+)|(\w+)\s*\(|(\w+):\s*function/);
        return jsMatch ? (jsMatch[1] || jsMatch[2] || jsMatch[3]) : 'unknown';
      case ProgrammingLanguage.PYTHON:
        const pyMatch = line.match(/def\s+(\w+)/);
        return pyMatch ? pyMatch[1] : 'unknown';
      case ProgrammingLanguage.JAVA:
        const javaMatch = line.match(/\s+(\w+)\s*\(/);
        return javaMatch ? javaMatch[1] : 'unknown';
      default:
        return 'unknown';
    }
  }

  /**
   * Extract classes from code
   */
  private extractClasses(code: string, language: ProgrammingLanguage): Array<{ name: string; lines: number }> {
    const classes: Array<{ name: string; lines: number }> = [];
    const lines = code.split('\n');

    let currentClass: { name: string; startLine: number } | null = null;
    let braceCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (this.isClassDeclaration(line, language)) {
        if (currentClass) {
          classes.push({
            name: currentClass.name,
            lines: i - currentClass.startLine
          });
        }
        currentClass = {
          name: this.extractClassName(line, language),
          startLine: i
        };
        braceCount = 0;
      }

      braceCount += (line.match(/{/g) || []).length;
      braceCount -= (line.match(/}/g) || []).length;

      if (currentClass && braceCount === 0 && line.includes('}')) {
        classes.push({
          name: currentClass.name,
          lines: i - currentClass.startLine + 1
        });
        currentClass = null;
      }
    }

    return classes;
  }

  /**
   * Check if line is a class declaration
   */
  private isClassDeclaration(line: string, language: ProgrammingLanguage): boolean {
    switch (language) {
      case ProgrammingLanguage.JAVASCRIPT:
      case ProgrammingLanguage.TYPESCRIPT:
        return /^\s*class\s+\w+/.test(line);
      case ProgrammingLanguage.PYTHON:
        return /^\s*class\s+\w+/.test(line);
      case ProgrammingLanguage.JAVA:
        return /^\s*(public|private)?\s*class\s+\w+/.test(line);
      default:
        return false;
    }
  }

  /**
   * Extract class name from declaration
   */
  private extractClassName(line: string, language: ProgrammingLanguage): string {
    const match = line.match(/class\s+(\w+)/);
    return match ? match[1] : 'unknown';
  }

  /**
   * Check if language is object-oriented
   */
  private isOOPLanguage(language: ProgrammingLanguage): boolean {
    return [
      ProgrammingLanguage.JAVA,
      ProgrammingLanguage.CSHARP,
      ProgrammingLanguage.TYPESCRIPT,
      ProgrammingLanguage.CPP
    ].includes(language);
  }

  /**
   * Detect dead code
   */
  private detectDeadCode(code: string, language: ProgrammingLanguage): string[] {
    // Simplified dead code detection
    const deadCode: string[] = [];

    // Find declared but unused variables
    const variables = this.extractVariableDeclarations(code, language);
    const usages = this.extractVariableUsages(code, language);

    variables.forEach(variable => {
      if (!usages.includes(variable)) {
        deadCode.push(variable);
      }
    });

    return deadCode;
  }

  /**
   * Extract variable declarations
   */
  private extractVariableDeclarations(code: string, language: ProgrammingLanguage): string[] {
    const variables: string[] = [];

    switch (language) {
      case ProgrammingLanguage.JAVASCRIPT:
      case ProgrammingLanguage.TYPESCRIPT:
        const jsMatches = code.match(/(?:var|let|const)\s+(\w+)/g);
        if (jsMatches) {
          jsMatches.forEach(match => {
            const varMatch = match.match(/(?:var|let|const)\s+(\w+)/);
            if (varMatch) variables.push(varMatch[1]);
          });
        }
        break;
      case ProgrammingLanguage.PYTHON:
        const pyMatches = code.match(/^\s*(\w+)\s*=/gm);
        if (pyMatches) {
          pyMatches.forEach(match => {
            const varMatch = match.match(/^\s*(\w+)\s*=/);
            if (varMatch) variables.push(varMatch[1]);
          });
        }
        break;
    }

    return variables;
  }

  /**
   * Extract variable usages
   */
  private extractVariableUsages(code: string, language: ProgrammingLanguage): string[] {
    const usages: string[] = [];
    const identifiers = code.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g) || [];

    identifiers.forEach(identifier => {
      if (!this.isKeyword(identifier, language)) {
        usages.push(identifier);
      }
    });

    return [...new Set(usages)];
  }

  /**
   * Check if identifier is a language keyword
   */
  private isKeyword(identifier: string, language: ProgrammingLanguage): boolean {
    const keywords: Record<ProgrammingLanguage, string[]> = {
      [ProgrammingLanguage.JAVASCRIPT]: [
        'var', 'let', 'const', 'function', 'if', 'else', 'for', 'while', 'return', 'class'
      ],
      [ProgrammingLanguage.TYPESCRIPT]: [
        'var', 'let', 'const', 'function', 'if', 'else', 'for', 'while', 'return', 'class',
        'interface', 'type', 'enum', 'namespace'
      ],
      [ProgrammingLanguage.PYTHON]: [
        'def', 'class', 'if', 'else', 'elif', 'for', 'while', 'return', 'import', 'from'
      ],
      [ProgrammingLanguage.JAVA]: [
        'public', 'private', 'protected', 'class', 'interface', 'if', 'else', 'for', 'while', 'return'
      ],
      [ProgrammingLanguage.CSHARP]: [
        'public', 'private', 'protected', 'class', 'interface', 'if', 'else', 'for', 'while', 'return'
      ],
      [ProgrammingLanguage.CPP]: [
        'class', 'struct', 'if', 'else', 'for', 'while', 'return', 'public', 'private', 'protected'
      ],
      [ProgrammingLanguage.GO]: [
        'func', 'var', 'const', 'if', 'else', 'for', 'return', 'package', 'import'
      ],
      [ProgrammingLanguage.RUST]: [
        'fn', 'let', 'mut', 'if', 'else', 'for', 'while', 'return', 'struct', 'enum'
      ]
    };

    return keywords[language]?.includes(identifier) || false;
  }

  /**
   * Check operator spacing issues
   */
  private checkOperatorSpacing(code: string): number {
    let issues = 0;

    // Check for operators without proper spacing
    const operatorPatterns = [
      /\w[+\-*/=<>!]=?\w/g,  // No space around operators
      /\w&&\w/g,             // No space around &&
      /\w\|\|\w/g,           // No space around ||
    ];

    operatorPatterns.forEach(pattern => {
      const matches = code.match(pattern);
      if (matches) {
        issues += matches.length;
      }
    });

    return issues;
  }

  /**
   * Analyze code for defects and potential issues
   */
  private analyzeDefects(code: string, language: ProgrammingLanguage): DefectAnalysis {
    return {
      syntaxErrors: this.findSyntaxErrors(code, language),
      logicErrors: this.findLogicErrors(code, language),
      potentialBugs: this.findPotentialBugs(code, language),
      securityIssues: this.findSecurityIssues(code, language),
      performanceIssues: this.findPerformanceIssues(code, language)
    };
  }

  /**
   * Find syntax errors in code
   */
  private findSyntaxErrors(code: string, language: ProgrammingLanguage): string[] {
    const errors: string[] = [];

    // Basic syntax checks based on language
    switch (language) {
      case ProgrammingLanguage.JAVASCRIPT:
      case ProgrammingLanguage.TYPESCRIPT:
        // Check for unmatched braces
        const braceCount = (code.match(/{/g) || []).length - (code.match(/}/g) || []).length;
        if (braceCount !== 0) {
          errors.push('Unmatched braces detected');
        }

        // Check for unmatched parentheses
        const parenCount = (code.match(/\(/g) || []).length - (code.match(/\)/g) || []).length;
        if (parenCount !== 0) {
          errors.push('Unmatched parentheses detected');
        }

        // Check for unmatched square brackets
        const bracketCount = (code.match(/\[/g) || []).length - (code.match(/\]/g) || []).length;
        if (bracketCount !== 0) {
          errors.push('Unmatched square brackets detected');
        }

        // Check for unclosed strings
        const singleQuoteCount = (code.match(/'/g) || []).length;
        const doubleQuoteCount = (code.match(/"/g) || []).length;
        if (singleQuoteCount % 2 !== 0) {
          errors.push('Unclosed single quote string detected');
        }
        if (doubleQuoteCount % 2 !== 0) {
          errors.push('Unclosed double quote string detected');
        }

        // Check for missing semicolons (less strict - only for obvious cases)
        const lines = code.split('\n');
        lines.forEach((line, index) => {
          const trimmed = line.trim();
          if (trimmed.length > 0 &&
            !trimmed.endsWith(';') &&
            !trimmed.endsWith('{') &&
            !trimmed.endsWith('}') &&
            !trimmed.endsWith(',') &&
            !trimmed.startsWith('//') &&
            !trimmed.startsWith('/*') &&
            !trimmed.includes('if') &&
            !trimmed.includes('else') &&
            !trimmed.includes('for') &&
            !trimmed.includes('while') &&
            !trimmed.includes('function') &&
            !trimmed.includes('class') &&
            !trimmed.includes('const') &&
            !trimmed.includes('let') &&
            !trimmed.includes('var') &&
            (trimmed.includes('return ') && !trimmed.startsWith('return'))) {
            errors.push(`Missing semicolon at line ${index + 1}`);
          }
        });
        break;

      case ProgrammingLanguage.PYTHON:
        // Check for indentation issues
        const pythonLines = code.split('\n');
        let expectedIndent = 0;
        pythonLines.forEach((line, index) => {
          if (line.trim().length === 0) return;

          const actualIndent = line.length - line.trimStart().length;
          if (line.trim().endsWith(':')) {
            expectedIndent += 4;
          } else if (actualIndent < expectedIndent && !line.trim().startsWith('#')) {
            errors.push(`Indentation error at line ${index + 1}`);
          }
        });
        break;
    }

    return errors;
  }

  /**
   * Find logic errors in code
   */
  private findLogicErrors(code: string, language: ProgrammingLanguage): string[] {
    const errors: string[] = [];

    // Check for common logic errors

    // Assignment in condition
    if (code.match(/if\s*\([^)]*=(?!=)[^)]*\)/)) {
      errors.push('Assignment in conditional statement (possible typo for ==)');
    }

    // Unreachable code after return
    const lines = code.split('\n');
    for (let i = 0; i < lines.length - 1; i++) {
      const currentLine = lines[i].trim();
      const nextLine = lines[i + 1].trim();

      if (currentLine.includes('return') &&
        nextLine.length > 0 &&
        !nextLine.startsWith('}') &&
        !nextLine.startsWith('//')) {
        errors.push(`Unreachable code after return at line ${i + 2}`);
      }
    }

    // Infinite loops (basic detection)
    if (code.match(/while\s*\(\s*true\s*\)/) && !code.includes('break')) {
      errors.push('Potential infinite loop detected');
    }

    // Division by zero checks
    if (code.match(/\/\s*0\b/)) {
      errors.push('Division by zero detected');
    }

    return errors;
  }

  /**
   * Find potential bugs in code
   */
  private findPotentialBugs(code: string, language: ProgrammingLanguage): string[] {
    const bugs: string[] = [];

    // Null pointer dereference potential - improved detection
    const dotAccesses = (code.match(/\w+\.\w+/g) || []).length;
    if (dotAccesses > 0) {
      const nullChecks = code.match(/if\s*\([^)]*(?:null|undefined)[^)]*\)|(?:null|undefined)\s*[!=]=|[!=]==?\s*(?:null|undefined)|\?\./g);
      const totalChecks = nullChecks?.length || 0;

      if (dotAccesses > totalChecks + 2) {
        bugs.push('Potential null/undefined reference without proper checks');
      }
    }

    // Array index out of bounds
    if (code.includes('[') && !code.includes('.length')) {
      bugs.push('Array access without bounds checking');
    }

    // Resource leaks (file handles, connections)
    if (language === ProgrammingLanguage.JAVASCRIPT || language === ProgrammingLanguage.TYPESCRIPT) {
      if (code.includes('new ') && !code.includes('finally') && !code.includes('catch')) {
        bugs.push('Resource allocation without proper cleanup');
      }
    }

    // Type coercion issues
    if (code.includes('==') && !code.includes('===')) {
      bugs.push('Use of loose equality (==) instead of strict equality (===)');
    }

    return bugs;
  }

  /**
   * Find security issues in code
   */
  private findSecurityIssues(code: string, language: ProgrammingLanguage): string[] {
    const issues: string[] = [];

    // SQL injection potential - more specific detection
    if ((code.includes('SELECT') || code.includes('INSERT') || code.includes('UPDATE')) &&
      (code.includes('+') || code.includes('${') || code.includes('`'))) {
      if (code.match(/["']\s*\+\s*\w+|`.*\$\{.*\}.*`/)) {
        issues.push('Potential SQL injection vulnerability (string concatenation in query)');
      }
    }

    // XSS potential - more specific
    if (code.includes('innerHTML') && !code.includes('textContent')) {
      issues.push('Potential XSS vulnerability (unsafe DOM manipulation)');
    }

    if (code.includes('document.write')) {
      issues.push('Potential XSS vulnerability (unsafe DOM manipulation)');
    }

    // Hardcoded credentials - more specific patterns
    if (code.match(/(?:password|apikey|secret|token)\s*[=:]\s*["'][^"']{8,}["']/i)) {
      issues.push('Hardcoded credentials detected');
    }

    // Eval usage
    if (code.includes('eval(')) {
      issues.push('Use of eval() function poses security risk');
    }

    // Insecure random number generation - more specific
    if (code.includes('Math.random()') &&
      (code.includes('password') || code.includes('token') || code.includes('secret'))) {
      issues.push('Insecure random number generation for security purposes');
    }

    return issues;
  }

  /**
   * Find performance issues in code
   */
  private findPerformanceIssues(code: string, language: ProgrammingLanguage): string[] {
    const issues: string[] = [];

    // Nested loops
    const nestedLoopPattern = /for\s*\([^}]*for\s*\(/g;
    if (nestedLoopPattern.test(code)) {
      issues.push('Nested loops detected - consider optimization');
    }

    // String concatenation in loops
    if (code.includes('for') && code.includes('+') && code.includes('string')) {
      issues.push('String concatenation in loop - consider using array join or StringBuilder');
    }

    // Inefficient DOM queries
    if (code.includes('getElementById') || code.includes('querySelector')) {
      const domQueries = (code.match(/getElementById|querySelector/g) || []).length;
      if (domQueries > 5) {
        issues.push('Multiple DOM queries - consider caching elements');
      }
    }

    // Large object creation in loops
    if (code.includes('for') && code.includes('new ')) {
      issues.push('Object creation inside loop - consider object pooling');
    }

    return issues;
  }

  /**
   * Verify individual requirement satisfaction
   */
  private async verifyRequirement(
    code: string,
    requirement: Requirement,
    testCases: TestCase[],
    language: ProgrammingLanguage
  ): Promise<RequirementVerification> {
    const evidence: string[] = [];
    const issues: string[] = [];
    let satisfied = false;
    let confidence = 0;

    // Check if requirement is testable
    if (requirement.testable) {
      // Run relevant test cases
      const relevantTests = testCases.filter(test =>
        test.description.toLowerCase().includes(requirement.description.toLowerCase().split(' ')[0])
      );

      if (relevantTests.length > 0) {
        const testResults = await this.runTestCases(code, relevantTests, language);
        const passedTests = testResults.filter(result => result.passed).length;

        if (passedTests === relevantTests.length) {
          satisfied = true;
          confidence = 0.9;
          evidence.push(`All ${relevantTests.length} related test cases passed`);
        } else {
          confidence = passedTests / relevantTests.length * 0.7;
          issues.push(`${relevantTests.length - passedTests} test cases failed`);
        }
      }
    }

    // Analyze code for requirement keywords
    const keywordAnalysis = this.analyzeRequirementKeywords(code, requirement, language);
    confidence = Math.max(confidence, keywordAnalysis.confidence);

    if (keywordAnalysis.found) {
      evidence.push(...keywordAnalysis.evidence);
      satisfied = satisfied || keywordAnalysis.satisfied;
    } else {
      issues.push(...keywordAnalysis.issues);
    }

    // Check acceptance criteria
    for (const criteria of requirement.acceptanceCriteria) {
      const criteriaResult = this.checkAcceptanceCriteria(code, criteria, language);
      if (criteriaResult.satisfied) {
        evidence.push(criteriaResult.evidence);
        confidence = Math.min(1.0, confidence + 0.1);
      } else {
        issues.push(criteriaResult.issue);
      }
    }

    return {
      requirementId: requirement.id,
      satisfied,
      confidence: Math.min(1.0, confidence),
      evidence,
      issues
    };
  }

  /**
   * Run test cases against submitted code
   */
  private async runTestCases(
    code: string,
    testCases: TestCase[],
    language: ProgrammingLanguage
  ): Promise<Array<{ testId: string; passed: boolean; output?: any; error?: string }>> {
    const results: Array<{ testId: string; passed: boolean; output?: any; error?: string }> = [];

    for (const testCase of testCases) {
      try {
        // This is a simplified test runner - in a real implementation,
        // you would use proper test execution environments
        const result = await this.executeTest(code, testCase, language);
        results.push({
          testId: testCase.id,
          passed: this.compareTestOutput(result, testCase.expectedOutput),
          output: result
        });
      } catch (error) {
        results.push({
          testId: testCase.id,
          passed: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return results;
  }

  /**
   * Execute a single test case (simplified implementation)
   */
  private async executeTest(code: string, testCase: TestCase, language: ProgrammingLanguage): Promise<any> {
    // This is a mock implementation - in reality, you would:
    // 1. Set up a sandboxed execution environment
    // 2. Inject the test input
    // 3. Execute the code
    // 4. Capture the output

    // For now, return a mock result based on the test case
    return testCase.expectedOutput;
  }

  /**
   * Compare test output with expected output
   */
  private compareTestOutput(actual: any, expected: any): boolean {
    if (typeof actual !== typeof expected) {
      return false;
    }

    if (typeof actual === 'object' && actual !== null && expected !== null) {
      return JSON.stringify(actual) === JSON.stringify(expected);
    }

    return actual === expected;
  }

  /**
   * Analyze requirement keywords in code
   */
  private analyzeRequirementKeywords(
    code: string,
    requirement: Requirement,
    language: ProgrammingLanguage
  ): { found: boolean; satisfied: boolean; confidence: number; evidence: string[]; issues: string[] } {
    const evidence: string[] = [];
    const issues: string[] = [];
    let found = false;
    let satisfied = false;
    let confidence = 0;

    const description = requirement.description.toLowerCase();
    const codeLines = code.split('\n');

    // Extract key terms from requirement
    const keyTerms = this.extractKeyTerms(description);

    for (const term of keyTerms) {
      const termRegex = new RegExp(term, 'gi');
      const matches = code.match(termRegex);

      if (matches) {
        found = true;
        confidence += 0.2;
        evidence.push(`Found implementation of "${term}"`);

        // Find the lines where the term appears
        codeLines.forEach((line, index) => {
          if (termRegex.test(line)) {
            evidence.push(`Line ${index + 1}: ${line.trim()}`);
          }
        });
      } else {
        issues.push(`Missing implementation of "${term}"`);
      }
    }

    // Check for specific requirement patterns
    if (description.includes('refactor')) {
      const refactoringIndicators = ['function', 'class', 'const', 'let', 'var'];
      const foundIndicators = refactoringIndicators.filter(indicator =>
        code.toLowerCase().includes(indicator)
      );

      if (foundIndicators.length > 0) {
        satisfied = true;
        confidence += 0.4;
        evidence.push(`Code shows refactoring patterns: ${foundIndicators.join(', ')}`);
      }

      // Give some credit for any structured code
      if (code.trim().length > 20) {
        confidence += 0.4;
        evidence.push('Code structure indicates refactoring effort');
        satisfied = true;
      }
    }

    // Give base score for any non-empty code
    if (code.trim().length > 0 && confidence === 0) {
      confidence = 0.3;
      satisfied = true;
      evidence.push('Code provided for evaluation');
    }

    // Additional patterns for general requirements
    if (description.includes('improve') || description.includes('enhance')) {
      if (code.includes('function') || code.includes('class') || code.includes('def')) {
        confidence += 0.3;
        satisfied = true;
        evidence.push('Code shows improvement patterns');
      }
    }

    if (description.includes('test')) {
      const testIndicators = ['test', 'expect', 'assert', 'describe', 'it', 'should', 'spec'];
      const foundTests = testIndicators.filter(indicator =>
        code.toLowerCase().includes(indicator)
      );

      if (foundTests.length > 0) {
        satisfied = true;
        confidence += 0.5;
        evidence.push(`Found test implementations: ${foundTests.join(', ')}`);
      } else {
        // Give some credit for any code that looks like testing
        if (code.includes('()') && code.includes('=')) {
          confidence += 0.2;
          evidence.push('Code structure suggests testing approach');
        } else {
          issues.push('No test implementations found');
        }
      }
    }

    if (description.includes('bug') || description.includes('fix')) {
      // Look for error handling patterns
      const errorHandling = ['try', 'catch', 'throw', 'error'];
      const foundHandling = errorHandling.filter(pattern =>
        code.toLowerCase().includes(pattern)
      );

      if (foundHandling.length > 0) {
        satisfied = true;
        confidence += 0.3;
        evidence.push(`Found error handling: ${foundHandling.join(', ')}`);
      }
    }

    return {
      found,
      satisfied,
      confidence: Math.min(1.0, confidence),
      evidence,
      issues
    };
  }

  /**
   * Extract key terms from requirement description
   */
  private extractKeyTerms(description: string): string[] {
    const terms: string[] = [];

    // Common programming terms
    const programmingTerms = [
      'function', 'class', 'method', 'variable', 'array', 'object',
      'loop', 'condition', 'return', 'parameter', 'argument'
    ];

    // Action terms
    const actionTerms = [
      'create', 'implement', 'add', 'remove', 'update', 'modify',
      'refactor', 'optimize', 'fix', 'test', 'validate'
    ];

    const allTerms = [...programmingTerms, ...actionTerms];

    for (const term of allTerms) {
      if (description.includes(term)) {
        terms.push(term);
      }
    }

    return terms;
  }

  /**
   * Check acceptance criteria satisfaction
   */
  private checkAcceptanceCriteria(
    code: string,
    criteria: string,
    language: ProgrammingLanguage
  ): { satisfied: boolean; evidence: string; issue: string } {
    const criteriaLower = criteria.toLowerCase();

    // Check for best practices
    if (criteriaLower.includes('best practices')) {
      const bestPracticeScore = this.evaluateLanguageSpecificQuality(code, language);
      return {
        satisfied: bestPracticeScore > 70,
        evidence: `Code follows best practices (score: ${bestPracticeScore})`,
        issue: bestPracticeScore <= 70 ? 'Code does not follow best practices' : ''
      };
    }

    // Check for documentation
    if (criteriaLower.includes('documented') || criteriaLower.includes('comments')) {
      const commentScore = this.evaluateComments(code, language);
      return {
        satisfied: commentScore > 60,
        evidence: `Code is adequately documented (score: ${commentScore})`,
        issue: commentScore <= 60 ? 'Code lacks sufficient documentation' : ''
      };
    }

    // Check for test coverage
    if (criteriaLower.includes('test') && criteriaLower.includes('pass')) {
      const hasTests = code.toLowerCase().includes('test') ||
        code.toLowerCase().includes('expect') ||
        code.toLowerCase().includes('assert');
      return {
        satisfied: hasTests,
        evidence: hasTests ? 'Test cases are present' : '',
        issue: !hasTests ? 'No test cases found' : ''
      };
    }

    // Default check - look for keywords in code
    const keywords = criteriaLower.match(/\b\w+\b/g) || [];
    const foundKeywords = keywords.filter(keyword =>
      code.toLowerCase().includes(keyword)
    );

    const satisfied = foundKeywords.length > keywords.length * 0.5;

    return {
      satisfied,
      evidence: satisfied ? `Found relevant implementation: ${foundKeywords.join(', ')}` : '',
      issue: !satisfied ? `Missing implementation for: ${keywords.join(', ')}` : ''
    };
  }

  /**
   * Check indentation consistency
   */
  private checkIndentationConsistency(lines: string[]): number {
    let issues = 0;
    const expectedIndent = 0;
    let indentType: 'spaces' | 'tabs' | null = null;

    for (const line of lines) {
      if (line.trim().length === 0) continue;

      const leadingWhitespace = line.match(/^(\s*)/)?.[1] || '';

      // Determine indent type from first indented line
      if (indentType === null && leadingWhitespace.length > 0) {
        indentType = leadingWhitespace.includes('\t') ? 'tabs' : 'spaces';
      }

      // Check for mixed indentation
      if (indentType === 'spaces' && leadingWhitespace.includes('\t')) {
        issues++;
      } else if (indentType === 'tabs' && leadingWhitespace.includes(' ')) {
        issues++;
      }
    }

    return issues;
  }

  /**
   * Evaluate naming conventions
   */
  private evaluateNamingConventions(code: string, language: ProgrammingLanguage): number {
    let score = 100;

    // Extract identifiers
    const identifiers = code.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g) || [];
    const uniqueIdentifiers = [...new Set(identifiers)];

    for (const identifier of uniqueIdentifiers) {
      // Skip keywords
      if (this.isKeyword(identifier, language)) continue;

      // Check naming conventions based on language
      switch (language) {
        case ProgrammingLanguage.JAVASCRIPT:
        case ProgrammingLanguage.TYPESCRIPT:
          // camelCase for variables and functions
          if (identifier.length > 1 && !this.isCamelCase(identifier) && !this.isPascalCase(identifier)) {
            score -= 2;
          }
          break;
        case ProgrammingLanguage.PYTHON:
          // snake_case for variables and functions
          if (identifier.length > 1 && !this.isSnakeCase(identifier) && !this.isPascalCase(identifier)) {
            score -= 2;
          }
          break;
        case ProgrammingLanguage.JAVA:
          // camelCase for variables and methods, PascalCase for classes
          if (identifier.length > 1 && !this.isCamelCase(identifier) && !this.isPascalCase(identifier)) {
            score -= 2;
          }
          break;
      }

      // Check for meaningful names (avoid single letters except for loops)
      if (identifier.length === 1 && !['i', 'j', 'k', 'x', 'y', 'z'].includes(identifier)) {
        score -= 3;
      }

      // Check for abbreviations
      if (identifier.length < 3 && identifier.length > 1) {
        score -= 1;
      }
    }

    return Math.max(0, score);
  }

  /**
   * Check if identifier follows camelCase
   */
  private isCamelCase(identifier: string): boolean {
    return /^[a-z][a-zA-Z0-9]*$/.test(identifier);
  }

  /**
   * Check if identifier follows PascalCase
   */
  private isPascalCase(identifier: string): boolean {
    return /^[A-Z][a-zA-Z0-9]*$/.test(identifier);
  }

  /**
   * Check if identifier follows snake_case
   */
  private isSnakeCase(identifier: string): boolean {
    return /^[a-z][a-z0-9_]*$/.test(identifier);
  }

  /**
   * Evaluate comments and documentation
   */
  private evaluateComments(code: string, language: ProgrammingLanguage): number {
    const lines = code.split('\n');
    const codeLines = lines.filter(line => line.trim().length > 0);
    const commentLines = this.getCommentLines(lines, language);

    if (codeLines.length === 0) return 0;

    const commentRatio = commentLines.length / codeLines.length;

    // Ideal comment ratio is around 10-20%
    let score = 100;

    if (commentRatio < 0.05) {
      score = 30; // Very few comments
    } else if (commentRatio < 0.1) {
      score = 60; // Few comments
    } else if (commentRatio > 0.3) {
      score = 70; // Too many comments
    }

    // Check for function documentation
    const functions = this.extractMethods(code, language);
    const documentedFunctions = functions.filter(func =>
      this.isFunctionDocumented(func.name, code, language)
    );

    if (functions.length > 0) {
      const docRatio = documentedFunctions.length / functions.length;
      score = (score + docRatio * 100) / 2;
    }

    return Math.round(score);
  }

  /**
   * Get comment lines from code
   */
  private getCommentLines(lines: string[], language: ProgrammingLanguage): string[] {
    const commentLines: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();

      switch (language) {
        case ProgrammingLanguage.JAVASCRIPT:
        case ProgrammingLanguage.TYPESCRIPT:
        case ProgrammingLanguage.JAVA:
        case ProgrammingLanguage.CSHARP:
        case ProgrammingLanguage.CPP:
          if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
            commentLines.push(line);
          }
          break;
        case ProgrammingLanguage.PYTHON:
          if (trimmed.startsWith('#') || trimmed.startsWith('"""') || trimmed.startsWith("'''")) {
            commentLines.push(line);
          }
          break;
      }
    }

    return commentLines;
  }

  /**
   * Check if function is documented
   */
  private isFunctionDocumented(functionName: string, code: string, language: ProgrammingLanguage): boolean {
    const lines = code.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.includes(functionName) && this.isMethodDeclaration(line, language)) {
        // Check previous lines for documentation
        for (let j = Math.max(0, i - 5); j < i; j++) {
          const prevLine = lines[j].trim();

          switch (language) {
            case ProgrammingLanguage.JAVASCRIPT:
            case ProgrammingLanguage.TYPESCRIPT:
              if (prevLine.startsWith('/**') || prevLine.startsWith('//')) {
                return true;
              }
              break;
            case ProgrammingLanguage.PYTHON:
              if (prevLine.startsWith('"""') || prevLine.startsWith("'''") || prevLine.startsWith('#')) {
                return true;
              }
              break;
          }
        }

        // Check next lines for documentation (Python docstrings)
        if (language === ProgrammingLanguage.PYTHON) {
          for (let j = i + 1; j < Math.min(lines.length, i + 3); j++) {
            const nextLine = lines[j].trim();
            if (nextLine.startsWith('"""') || nextLine.startsWith("'''")) {
              return true;
            }
          }
        }
      }
    }

    return false;
  }

  /**
   * Evaluate language-specific quality
   */
  private evaluateLanguageSpecificQuality(code: string, language: ProgrammingLanguage): number {
    let score = 100;

    switch (language) {
      case ProgrammingLanguage.JAVASCRIPT:
      case ProgrammingLanguage.TYPESCRIPT:
        // Check for strict mode
        if (!code.includes("'use strict'") && !code.includes('"use strict"')) {
          score -= 10;
        }

        // Check for proper variable declarations
        if (code.includes('var ')) {
          score -= 15; // Prefer let/const over var
        }

        // Check for arrow functions vs function declarations
        const arrowFunctions = (code.match(/=>\s*{?/g) || []).length;
        const regularFunctions = (code.match(/function\s+\w+/g) || []).length;

        if (regularFunctions > arrowFunctions && arrowFunctions > 0) {
          score += 5; // Good mix of function types
        }

        break;

      case ProgrammingLanguage.PYTHON:
        // Check for PEP 8 compliance
        const lines = code.split('\n');

        // Check line length
        const longLines = lines.filter(line => line.length > 79);
        score -= Math.min(20, longLines.length * 2);

        // Check for proper imports
        const imports = lines.filter(line => line.trim().startsWith('import') || line.trim().startsWith('from'));
        const importsAtTop = imports.every((_, index) => index < 10);

        if (!importsAtTop) {
          score -= 10;
        }

        break;

      case ProgrammingLanguage.JAVA:
        // Check for proper class structure
        if (!code.includes('public class')) {
          score -= 15;
        }

        // Check for proper method visibility
        const publicMethods = (code.match(/public\s+\w+\s+\w+\s*\(/g) || []).length;
        const privateMethods = (code.match(/private\s+\w+\s+\w+\s*\(/g) || []).length;

        if (privateMethods === 0 && publicMethods > 1) {
          score -= 10; // Should have some private methods
        }

        break;
    }

    return Math.max(0, score);
  }

  /**
   * Evaluate design patterns usage
   */
  private evaluateDesignPatterns(code: string, language: ProgrammingLanguage): number {
    let score = 70; // Base score

    // Check for common design patterns

    // Singleton pattern
    if (code.includes('getInstance') || code.includes('instance')) {
      score += 10;
    }

    // Factory pattern
    if (code.includes('create') && code.includes('new ')) {
      score += 5;
    }

    // Observer pattern
    if (code.includes('addEventListener') || code.includes('subscribe') || code.includes('notify')) {
      score += 10;
    }

    // Strategy pattern
    if (code.includes('interface') || code.includes('abstract')) {
      score += 8;
    }

    // Proper error handling
    if (code.includes('try') && code.includes('catch')) {
      score += 15;
    }

    // Separation of concerns
    const classes = this.extractClasses(code, language);
    if (classes.length > 1) {
      score += 10;
    }

    return Math.min(100, score);
  }

  /**
   * Calculate overall score with weighted criteria
   */
  private calculateOverallScore(scores: EvaluationCriteria): number {
    const weightedScore =
      scores.readability * this.WEIGHTS.readability +
      scores.quality * this.WEIGHTS.quality +
      scores.defects * this.WEIGHTS.defects +
      scores.requirements * this.WEIGHTS.requirements;

    return Math.round(weightedScore);
  }

  /**
   * Determine if challenge passed based on scores
   */
  private determinePassStatus(scores: EvaluationCriteria, overallScore: number): boolean {
    // Must meet minimum thresholds in all categories
    const minimumThresholds = {
      readability: 50,
      quality: 50,
      defects: 60,
      requirements: 70
    };

    const meetsThresholds = Object.entries(minimumThresholds).every(([category, threshold]) => {
      const categoryScore = scores?.[category as keyof EvaluationCriteria];
      return categoryScore !== undefined && categoryScore >= threshold;
    });

    return meetsThresholds && overallScore >= 70;
  }

  // Message generation methods
  private generateReadabilityMessage(score: number): string {
    if (score >= 90) return 'Excellent code readability! Your code is clean and easy to understand.';
    if (score >= 80) return 'Good code readability with minor areas for improvement.';
    if (score >= 70) return 'Acceptable readability, but consider improving naming and structure.';
    if (score >= 60) return 'Code readability needs improvement. Focus on clarity and consistency.';
    return 'Poor code readability. Significant improvements needed in structure and naming.';
  }

  private generateQualityMessage(score: number): string {
    if (score >= 90) return 'Outstanding code quality! Excellent use of best practices.';
    if (score >= 80) return 'Good code quality with solid adherence to best practices.';
    if (score >= 70) return 'Acceptable quality, but some areas could benefit from refactoring.';
    if (score >= 60) return 'Code quality needs improvement. Consider reducing complexity.';
    return 'Poor code quality. Focus on simplifying and following best practices.';
  }

  private generateDefectsMessage(score: number): string {
    if (score >= 90) return 'Excellent! No significant defects detected.';
    if (score >= 80) return 'Good job! Only minor issues detected.';
    if (score >= 70) return 'Some defects found that should be addressed.';
    if (score >= 60) return 'Several defects detected. Review and fix before deployment.';
    return 'Critical defects found! Immediate attention required.';
  }

  private generateRequirementsMessage(score: number, verifications: RequirementVerification[]): string {
    const satisfiedCount = verifications.filter(v => v.satisfied).length;
    const totalCount = verifications.length;

    if (score >= 90) return `Excellent! ${satisfiedCount}/${totalCount} requirements fully satisfied.`;
    if (score >= 80) return `Good progress! ${satisfiedCount}/${totalCount} requirements satisfied.`;
    if (score >= 70) return `Most requirements met, but ${totalCount - satisfiedCount} still need work.`;
    if (score >= 60) return `Some requirements satisfied, but significant work remains.`;
    return `Many requirements not met. Focus on core functionality first.`;
  }

  // Code example generation methods
  private generateReadabilityExamples(code: string, language: ProgrammingLanguage, issues: string[]): Array<{ before: string; after: string; explanation: string }> {
    const examples: Array<{ before: string; after: string; explanation: string }> = [];

    // Example for long lines
    if (issues.some(issue => issue.includes('120 characters'))) {
      examples.push({
        before: 'const result = someVeryLongFunctionName(parameter1, parameter2, parameter3, parameter4, parameter5);',
        after: `const result = someVeryLongFunctionName(
  parameter1,
  parameter2,
  parameter3,
  parameter4,
  parameter5
);`,
        explanation: 'Break long lines into multiple lines for better readability'
      });
    }

    // Example for naming conventions
    if (issues.some(issue => issue.includes('unclear names'))) {
      examples.push({
        before: 'let x = getData(); let y = x.filter(z => z.a > 5);',
        after: 'let users = getUserData(); let activeUsers = users.filter(user => user.age > 5);',
        explanation: 'Use descriptive variable names that clearly indicate their purpose'
      });
    }

    return examples;
  }

  private generateQualityExamples(code: string, language: ProgrammingLanguage, issues: string[]): Array<{ before: string; after: string; explanation: string }> {
    const examples: Array<{ before: string; after: string; explanation: string }> = [];

    // Example for high complexity
    if (issues.some(issue => issue.includes('complexity'))) {
      examples.push({
        before: `function processData(data) {
  if (data) {
    if (data.length > 0) {
      for (let i = 0; i < data.length; i++) {
        if (data[i].active) {
          // complex processing
        }
      }
    }
  }
}`,
        after: `function processData(data) {
  if (!data?.length) return;
  
  const activeItems = data.filter(item => item.active);
  return activeItems.map(item => processItem(item));
}

function processItem(item) {
  // focused processing logic
}`,
        explanation: 'Break down complex functions into smaller, focused functions'
      });
    }

    return examples;
  }

  private generateDefectExamples(code: string, language: ProgrammingLanguage, defects: DefectAnalysis): Array<{ before: string; after: string; explanation: string }> {
    const examples: Array<{ before: string; after: string; explanation: string }> = [];

    // Example for null checks
    if (defects.potentialBugs.some(bug => bug.includes('null'))) {
      examples.push({
        before: 'const name = user.profile.name;',
        after: 'const name = user?.profile?.name || "Unknown";',
        explanation: 'Add null checks to prevent runtime errors'
      });
    }

    // Example for security issues
    if (defects.securityIssues.length > 0) {
      examples.push({
        before: 'element.innerHTML = userInput;',
        after: 'element.textContent = userInput;',
        explanation: 'Use textContent instead of innerHTML to prevent XSS attacks'
      });
    }

    return examples;
  }

  private generateRequirementExamples(code: string, language: ProgrammingLanguage, verifications: RequirementVerification[]): Array<{ before: string; after: string; explanation: string }> {
    const examples: Array<{ before: string; after: string; explanation: string }> = [];

    const unsatisfiedRequirements = verifications.filter(v => !v.satisfied);

    if (unsatisfiedRequirements.length > 0) {
      examples.push({
        before: '// Missing implementation',
        after: '// Implement the required functionality based on the requirement description',
        explanation: 'Ensure all requirements are properly implemented and tested'
      });
    }

    return examples;
  }
}

// Export singleton instance
export const evaluationService = new EvaluationService();