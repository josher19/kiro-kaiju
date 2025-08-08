/**
 * Local Evaluation Service
 * 
 * Handles challenge submission and evaluation in local mode with Kiro IDE integration.
 * Provides real-time code analysis and evaluation without external API calls.
 */

import type { Challenge } from '@/types/challenge';
import type { EvaluationResult, EvaluationFeedback } from '@/types/user';
import { EvaluationService, type EvaluationRequest } from './evaluationService';
import { getKiroFileSystemService } from './kiroFileSystemService';

export interface LocalEvaluationConfig {
  autoEvaluate: boolean;
  realTimeAnalysis: boolean;
  saveResults: boolean;
  workspaceIntegration: boolean;
}

export interface LocalSubmissionResult {
  evaluationResult: EvaluationResult;
  filesModified: string[];
  workspaceSynced: boolean;
  timestamp: Date;
}

export class LocalEvaluationService extends EvaluationService {
  private config: LocalEvaluationConfig;
  private pendingEvaluations: Map<string, number> = new Map();

  constructor(config: LocalEvaluationConfig) {
    super();
    this.config = config;
  }

  /**
   * Submit challenge for local evaluation
   */
  async submitChallenge(
    challenge: Challenge,
    submittedCode: string,
    userId?: string,
    timeSpent: number = 0,
    attempts: number = 1
  ): Promise<LocalSubmissionResult> {
    try {
      // Create evaluation request
      const evaluationRequest: EvaluationRequest = {
        challengeId: challenge.id,
        challenge,
        submittedCode,
        userId,
        timeSpent,
        attempts
      };

      // Perform evaluation
      const evaluationResult = await this.evaluateCode(evaluationRequest);

      // Save code to workspace if enabled
      const filesModified: string[] = [];
      if (this.config.workspaceIntegration) {
        try {
          const fileSystemService = getKiroFileSystemService();
          await fileSystemService.writeChallengeCode(challenge.id, submittedCode);
          filesModified.push(`${challenge.id}/main.${this.getFileExtension(challenge.config.language)}`);
          
          // Save evaluation results
          if (this.config.saveResults) {
            const resultsPath = `${challenge.id}/evaluation-results.json`;
            await this.saveEvaluationResults(challenge.id, evaluationResult);
            filesModified.push(resultsPath);
          }
        } catch (error) {
          console.warn('Failed to save to workspace:', error);
        }
      }

      // Sync workspace with Kiro IDE
      let workspaceSynced = false;
      if (this.config.workspaceIntegration) {
        try {
          const fileSystemService = getKiroFileSystemService();
          await fileSystemService.syncWorkspace();
          workspaceSynced = true;
        } catch (error) {
          console.warn('Failed to sync workspace:', error);
        }
      }

      // Integrate with Kiro IDE for enhanced analysis
      if (this.isKiroEnvironment()) {
        await this.performKiroAnalysis(challenge, submittedCode, evaluationResult);
      }

      return {
        evaluationResult,
        filesModified,
        workspaceSynced,
        timestamp: new Date()
      };

    } catch (error) {
      console.error('Local evaluation failed:', error);
      throw error;
    }
  }

  /**
   * Start real-time code analysis for a challenge
   */
  async startRealTimeAnalysis(
    challenge: Challenge,
    onAnalysisUpdate: (analysis: Partial<EvaluationResult>) => void
  ): Promise<void> {
    if (!this.config.realTimeAnalysis) {
      return;
    }

    try {
      const fileSystemService = getKiroFileSystemService();
      
      // Watch for file changes
      fileSystemService.onFileChange(async (change) => {
        if (change.path.includes(challenge.id) && change.type === 'modified') {
          // Debounce analysis to avoid too frequent updates
          this.debounceAnalysis(challenge.id, async () => {
            try {
              const currentCode = await fileSystemService.readChallengeCode(challenge.id);
              const quickAnalysis = await this.performQuickAnalysis(challenge, currentCode);
              onAnalysisUpdate(quickAnalysis);
            } catch (error) {
              console.error('Real-time analysis failed:', error);
            }
          });
        }
      });

    } catch (error) {
      console.error('Failed to start real-time analysis:', error);
    }
  }

  /**
   * Stop real-time analysis for a challenge
   */
  stopRealTimeAnalysis(challengeId: string): void {
    const timeout = this.pendingEvaluations.get(challengeId);
    if (timeout) {
      clearTimeout(timeout);
      this.pendingEvaluations.delete(challengeId);
    }
  }

  /**
   * Perform quick analysis for real-time feedback
   */
  private async performQuickAnalysis(
    challenge: Challenge,
    code: string
  ): Promise<Partial<EvaluationResult>> {
    try {
      // Perform lightweight analysis for real-time feedback
      const readabilityScore = await this.evaluateReadability(code, challenge.config.language);
      const basicDefects = await this.performBasicDefectAnalysis(code, challenge.config.language);

      return {
        challengeId: challenge.id,
        submittedCode: code,
        scores: {
          readability: readabilityScore.score,
          quality: 0, // Skip for quick analysis
          defects: basicDefects.score,
          requirements: 0 // Skip for quick analysis
        },
        overallScore: Math.round((readabilityScore.score + basicDefects.score) / 2),
        feedback: [readabilityScore.feedback, basicDefects.feedback],
        timeSpent: 0,
        attempts: 0,
        passed: false,
        evaluatedAt: new Date()
      };

    } catch (error) {
      console.error('Quick analysis failed:', error);
      return {
        challengeId: challenge.id,
        submittedCode: code,
        scores: { readability: 0, quality: 0, defects: 0, requirements: 0 },
        overallScore: 0,
        feedback: [],
        timeSpent: 0,
        attempts: 0,
        passed: false,
        evaluatedAt: new Date()
      };
    }
  }

  /**
   * Perform basic defect analysis for real-time feedback
   */
  private async performBasicDefectAnalysis(
    code: string,
    language: string
  ): Promise<{ score: number; feedback: EvaluationFeedback }> {
    let score = 100;
    const issues: string[] = [];
    const suggestions: string[] = [];

    // Basic syntax checks
    if (this.hasSyntaxErrors(code, language)) {
      score -= 50;
      issues.push('Syntax errors detected');
      suggestions.push('Fix syntax errors before proceeding');
    }

    // Basic logic checks
    const logicIssues = this.detectBasicLogicIssues(code);
    if (logicIssues.length > 0) {
      score -= logicIssues.length * 10;
      issues.push(...logicIssues);
      suggestions.push('Review logic flow and variable usage');
    }

    // Performance red flags
    const performanceIssues = this.detectPerformanceIssues(code);
    if (performanceIssues.length > 0) {
      score -= performanceIssues.length * 5;
      issues.push(...performanceIssues);
      suggestions.push('Consider optimizing performance-critical sections');
    }

    return {
      score: Math.max(0, score),
      feedback: {
        category: 'defects',
        score: Math.max(0, score),
        maxScore: 100,
        message: issues.length > 0 ? `Found ${issues.length} potential issues` : 'No major issues detected',
        suggestions,
        codeExamples: []
      }
    };
  }

  /**
   * Perform enhanced analysis using Kiro IDE capabilities
   */
  private async performKiroAnalysis(
    challenge: Challenge,
    code: string,
    evaluationResult: EvaluationResult
  ): Promise<void> {
    try {
      if (window.kiro?.ai?.analyze) {
        const analysisRequest = {
          code,
          language: challenge.config.language,
          context: {
            challenge: challenge.title,
            kaiju: challenge.kaiju.name,
            requirements: challenge.requirements.map(req => req.description)
          },
          options: {
            includeRefactoringSuggestions: true,
            includePerformanceAnalysis: true,
            includeSecurityAnalysis: true
          }
        };

        const kiroAnalysis = await window.kiro.ai.analyze(
          JSON.stringify(analysisRequest),
          {
            challengeId: challenge.id,
            language: challenge.config.language
          }
        );
        
        if (kiroAnalysis.success) {
          // Enhance evaluation result with Kiro's analysis
          this.enhanceEvaluationWithKiroAnalysis(evaluationResult, kiroAnalysis);
        }
      }
    } catch (error) {
      console.warn('Kiro analysis enhancement failed:', error);
    }
  }

  /**
   * Enhance evaluation result with Kiro's analysis
   */
  private enhanceEvaluationWithKiroAnalysis(
    evaluationResult: EvaluationResult,
    kiroAnalysis: any
  ): void {
    // Add Kiro-specific insights to feedback
    if (kiroAnalysis.refactoringSuggestions?.length > 0) {
      const refactoringFeedback: EvaluationFeedback = {
        category: 'quality',
        score: evaluationResult.overallScore,
        maxScore: 100,
        message: 'Kiro AI Refactoring Suggestions',
        suggestions: kiroAnalysis.refactoringSuggestions,
        codeExamples: kiroAnalysis.codeExamples || []
      };
      evaluationResult.feedback.push(refactoringFeedback);
    }

    if (kiroAnalysis.performanceInsights?.length > 0) {
      const performanceFeedback: EvaluationFeedback = {
        category: 'performance',
        score: evaluationResult.scores.quality,
        maxScore: 100,
        message: 'Kiro AI Performance Analysis',
        suggestions: kiroAnalysis.performanceInsights,
        codeExamples: []
      };
      evaluationResult.feedback.push(performanceFeedback);
    }
  }

  /**
   * Save evaluation results to workspace
   */
  private async saveEvaluationResults(
    challengeId: string,
    evaluationResult: EvaluationResult
  ): Promise<void> {
    try {
      const fileSystemService = getKiroFileSystemService();
      const resultsContent = JSON.stringify(evaluationResult, null, 2);
      
      // Write to a results file in the challenge directory
      if (window.kiro?.fileSystem?.writeFile) {
        const resultsPath = `${challengeId}/evaluation-results.json`;
        await window.kiro.fileSystem.writeFile(resultsPath, resultsContent);
      }
    } catch (error) {
      console.error('Failed to save evaluation results:', error);
    }
  }

  /**
   * Debounce analysis to avoid too frequent updates
   */
  private debounceAnalysis(challengeId: string, analysisFunction: () => Promise<void>): void {
    // Clear existing timeout
    const existingTimeout = this.pendingEvaluations.get(challengeId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Set new timeout
    const timeout = setTimeout(async () => {
      await analysisFunction();
      this.pendingEvaluations.delete(challengeId);
    }, 1000); // 1 second debounce

    this.pendingEvaluations.set(challengeId, timeout as unknown as number);
  }

  /**
   * Check if running in Kiro IDE environment
   */
  private isKiroEnvironment(): boolean {
    return typeof window !== 'undefined' && 
           window.kiro !== undefined;
  }

  /**
   * Get file extension for programming language
   */
  private getFileExtension(language: string): string {
    const extensions: Record<string, string> = {
      javascript: 'js',
      typescript: 'ts',
      python: 'py',
      java: 'java',
      csharp: 'cs',
      cpp: 'cpp',
      go: 'go',
      rust: 'rs'
    };
    return extensions[language] || 'txt';
  }

  /**
   * Basic syntax error detection
   */
  private hasSyntaxErrors(code: string, language: string): boolean {
    try {
      switch (language) {
        case 'javascript':
        case 'typescript':
          // Basic bracket matching
          const brackets = { '(': ')', '[': ']', '{': '}' };
          const stack: string[] = [];
          for (const char of code) {
            if (char in brackets) {
              stack.push(brackets[char as keyof typeof brackets]);
            } else if (Object.values(brackets).includes(char)) {
              if (stack.pop() !== char) return true;
            }
          }
          return stack.length > 0;
        
        case 'python':
          // Basic indentation and colon checks
          const lines = code.split('\n');
          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.endsWith(':') && !trimmed.match(/^(if|else|elif|for|while|def|class|try|except|finally|with)/)) {
              return true;
            }
          }
          return false;
        
        default:
          return false;
      }
    } catch (error) {
      return true;
    }
  }

  /**
   * Detect basic logic issues
   */
  private detectBasicLogicIssues(code: string): string[] {
    const issues: string[] = [];

    // Unused variables (basic detection)
    const variableDeclarations = code.match(/(?:var|let|const)\s+(\w+)/g) || [];
    const variables = variableDeclarations.map(decl => decl.split(/\s+/).pop()!);
    
    for (const variable of variables) {
      const usageCount = (code.match(new RegExp(`\\b${variable}\\b`, 'g')) || []).length;
      if (usageCount === 1) { // Only declaration, no usage
        issues.push(`Unused variable: ${variable}`);
      }
    }

    // Infinite loop detection (basic)
    if (code.includes('while(true)') || code.includes('while (true)')) {
      if (!code.includes('break') && !code.includes('return')) {
        issues.push('Potential infinite loop detected');
      }
    }

    // Null/undefined checks
    if (code.includes('.length') && !code.includes('null') && !code.includes('undefined')) {
      issues.push('Consider null/undefined checks before accessing properties');
    }

    return issues;
  }

  /**
   * Detect performance issues
   */
  private detectPerformanceIssues(code: string): string[] {
    const issues: string[] = [];

    // Nested loops
    const forLoops = (code.match(/for\s*\(/g) || []).length;
    const whileLoops = (code.match(/while\s*\(/g) || []).length;
    const totalLoops = forLoops + whileLoops;
    
    if (totalLoops > 2) {
      issues.push('Multiple nested loops detected - consider optimization');
    }

    // String concatenation in loops
    if (code.includes('for') && code.includes('+=') && code.includes('"')) {
      issues.push('String concatenation in loop - consider using array join');
    }

    // DOM queries in loops
    if (code.includes('document.') && (code.includes('for') || code.includes('while'))) {
      issues.push('DOM queries in loop - consider caching elements');
    }

    return issues;
  }
}

// Export singleton instance
let localEvaluationServiceInstance: LocalEvaluationService | null = null;

export function createLocalEvaluationService(config: LocalEvaluationConfig): LocalEvaluationService {
  localEvaluationServiceInstance = new LocalEvaluationService(config);
  return localEvaluationServiceInstance;
}

export function getLocalEvaluationService(): LocalEvaluationService {
  if (!localEvaluationServiceInstance) {
    throw new Error('Local Evaluation Service not initialized. Call createLocalEvaluationService first.');
  }
  return localEvaluationServiceInstance;
}