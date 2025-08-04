/**
 * Kiro Integration Service
 * 
 * Main orchestration service for Kiro IDE integration in local mode.
 * Coordinates file system, AI, and evaluation services for seamless local development.
 */

import type { Challenge, ChallengeContext } from '@/types/challenge';
import type { EvaluationResult } from '@/types/user';
import { 
  createKiroFileSystemService, 
  getKiroFileSystemService,
  type FileSystemConfig,
  type FileChange 
} from './kiroFileSystemService';
import { 
  createLocalEvaluationService, 
  getLocalEvaluationService,
  type LocalEvaluationConfig,
  type LocalSubmissionResult 
} from './localEvaluationService';
import { 
  createAIService, 
  getAIService,
  type AIServiceConfig 
} from './aiService';

export interface KiroIntegrationConfig {
  fileSystem: FileSystemConfig;
  evaluation: LocalEvaluationConfig;
  ai: AIServiceConfig;
  autoSync: boolean;
  enableRealTimeAnalysis: boolean;
}

export interface LocalChallengeSession {
  challenge: Challenge;
  context: ChallengeContext;
  filesCreated: string[];
  isActive: boolean;
  startTime: Date;
  lastActivity: Date;
}

export class KiroIntegrationService {
  private config: KiroIntegrationConfig;
  private activeSessions: Map<string, LocalChallengeSession> = new Map();
  private isInitialized = false;

  constructor(config: KiroIntegrationConfig) {
    this.config = config;
  }

  /**
   * Initialize Kiro IDE integration
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Check if we're in Kiro IDE environment
      if (!this.isKiroEnvironment()) {
        throw new Error('Not running in Kiro IDE environment');
      }

      // Initialize file system service
      const fileSystemService = createKiroFileSystemService(this.config.fileSystem);
      await fileSystemService.initialize();

      // Initialize evaluation service
      createLocalEvaluationService(this.config.evaluation);

      // Initialize AI service
      createAIService(this.config.ai);

      // Set up global file change handling
      fileSystemService.onFileChange(this.handleFileChange.bind(this));

      this.isInitialized = true;
      console.log('Kiro Integration Service initialized successfully');

    } catch (error) {
      console.error('Failed to initialize Kiro Integration Service:', error);
      throw error;
    }
  }

  /**
   * Start a new challenge session in local mode
   */
  async startChallengeSession(challenge: Challenge): Promise<LocalChallengeSession> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const fileSystemService = getKiroFileSystemService();
      
      // Create challenge files in workspace
      const filesCreated = await fileSystemService.createChallengeFiles(challenge);

      // Create challenge context
      const context: ChallengeContext = {
        challenge,
        currentCode: challenge.initialCode,
        attempts: 0,
        startTime: new Date(),
        lastModified: new Date()
      };

      // Create session
      const session: LocalChallengeSession = {
        challenge,
        context,
        filesCreated,
        isActive: true,
        startTime: new Date(),
        lastActivity: new Date()
      };

      this.activeSessions.set(challenge.id, session);

      // Start real-time analysis if enabled
      if (this.config.enableRealTimeAnalysis) {
        await this.startRealTimeAnalysis(challenge.id);
      }

      // Sync workspace
      if (this.config.autoSync) {
        await fileSystemService.syncWorkspace();
      }

      console.log(`Started challenge session: ${challenge.title}`);
      return session;

    } catch (error) {
      console.error('Failed to start challenge session:', error);
      throw error;
    }
  }

  /**
   * Submit challenge solution for evaluation
   */
  async submitChallenge(
    challengeId: string,
    userId?: string
  ): Promise<LocalSubmissionResult> {
    const session = this.activeSessions.get(challengeId);
    if (!session) {
      throw new Error(`No active session found for challenge: ${challengeId}`);
    }

    try {
      const fileSystemService = getKiroFileSystemService();
      const evaluationService = getLocalEvaluationService();

      // Read current code from workspace
      const currentCode = await fileSystemService.readChallengeCode(challengeId);
      
      // Update session context
      session.context.currentCode = currentCode;
      session.context.attempts += 1;
      session.context.lastModified = new Date();
      session.lastActivity = new Date();

      // Calculate time spent
      const timeSpent = Date.now() - session.startTime.getTime();

      // Submit for evaluation
      const result = await evaluationService.submitChallenge(
        session.challenge,
        currentCode,
        userId,
        timeSpent,
        session.context.attempts
      );

      // Update session based on results
      if (result.evaluationResult.passed) {
        session.isActive = false;
        console.log(`Challenge completed: ${session.challenge.title}`);
      }

      return result;

    } catch (error) {
      console.error('Failed to submit challenge:', error);
      throw error;
    }
  }

  /**
   * Get current code for a challenge
   */
  async getCurrentCode(challengeId: string): Promise<string> {
    const session = this.activeSessions.get(challengeId);
    if (!session) {
      throw new Error(`No active session found for challenge: ${challengeId}`);
    }

    try {
      const fileSystemService = getKiroFileSystemService();
      return await fileSystemService.readChallengeCode(challengeId);
    } catch (error) {
      console.error('Failed to get current code:', error);
      throw error;
    }
  }

  /**
   * Update code for a challenge
   */
  async updateCode(challengeId: string, code: string): Promise<void> {
    const session = this.activeSessions.get(challengeId);
    if (!session) {
      throw new Error(`No active session found for challenge: ${challengeId}`);
    }

    try {
      const fileSystemService = getKiroFileSystemService();
      await fileSystemService.writeChallengeCode(challengeId, code);
      
      // Update session context
      session.context.currentCode = code;
      session.context.lastModified = new Date();
      session.lastActivity = new Date();

      // Sync workspace if enabled
      if (this.config.autoSync) {
        await fileSystemService.syncWorkspace();
      }

    } catch (error) {
      console.error('Failed to update code:', error);
      throw error;
    }
  }

  /**
   * Get AI assistance for a challenge
   */
  async getAIAssistance(
    challengeId: string,
    message: string,
    userId?: string
  ): Promise<any> {
    const session = this.activeSessions.get(challengeId);
    if (!session) {
      throw new Error(`No active session found for challenge: ${challengeId}`);
    }

    try {
      const aiService = getAIService();
      
      // Get current code
      const currentCode = await this.getCurrentCode(challengeId);
      session.context.currentCode = currentCode;

      // Send message to AI
      const response = await aiService.sendMessage(
        message,
        session.context,
        userId
      );

      session.lastActivity = new Date();
      return response;

    } catch (error) {
      console.error('Failed to get AI assistance:', error);
      throw error;
    }
  }

  /**
   * End a challenge session
   */
  async endChallengeSession(challengeId: string, cleanup: boolean = false): Promise<void> {
    const session = this.activeSessions.get(challengeId);
    if (!session) {
      return;
    }

    try {
      // Stop real-time analysis
      const evaluationService = getLocalEvaluationService();
      evaluationService.stopRealTimeAnalysis(challengeId);

      // Cleanup files if requested
      if (cleanup) {
        const fileSystemService = getKiroFileSystemService();
        await fileSystemService.cleanupChallenge(challengeId);
      }

      // Remove session
      this.activeSessions.delete(challengeId);
      console.log(`Ended challenge session: ${session.challenge.title}`);

    } catch (error) {
      console.error('Failed to end challenge session:', error);
    }
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(): LocalChallengeSession[] {
    return Array.from(this.activeSessions.values());
  }

  /**
   * Get session by challenge ID
   */
  getSession(challengeId: string): LocalChallengeSession | undefined {
    return this.activeSessions.get(challengeId);
  }

  /**
   * Start real-time analysis for a challenge
   */
  private async startRealTimeAnalysis(challengeId: string): Promise<void> {
    const session = this.activeSessions.get(challengeId);
    if (!session) {
      return;
    }

    try {
      const evaluationService = getLocalEvaluationService();
      
      await evaluationService.startRealTimeAnalysis(
        session.challenge,
        (analysis) => {
          // Emit real-time analysis update
          this.emitAnalysisUpdate(challengeId, analysis);
        }
      );

    } catch (error) {
      console.error('Failed to start real-time analysis:', error);
    }
  }

  /**
   * Handle file changes in the workspace
   */
  private handleFileChange(change: FileChange): void {
    // Find which challenge this file belongs to
    for (const [challengeId, session] of this.activeSessions) {
      if (change.path.includes(challengeId)) {
        session.lastActivity = new Date();
        
        // Update context if it's the main code file
        if (change.path.endsWith(this.getCodeFileName(session.challenge.config.language))) {
          session.context.currentCode = change.content || '';
          session.context.lastModified = new Date();
        }

        // Emit file change event
        this.emitFileChange(challengeId, change);
        break;
      }
    }
  }

  /**
   * Emit analysis update event
   */
  private emitAnalysisUpdate(challengeId: string, analysis: Partial<EvaluationResult>): void {
    // This would emit to the UI components
    window.dispatchEvent(new CustomEvent('kiro-analysis-update', {
      detail: { challengeId, analysis }
    }));
  }

  /**
   * Emit file change event
   */
  private emitFileChange(challengeId: string, change: FileChange): void {
    // This would emit to the UI components
    window.dispatchEvent(new CustomEvent('kiro-file-change', {
      detail: { challengeId, change }
    }));
  }

  /**
   * Check if running in Kiro IDE environment
   */
  private isKiroEnvironment(): boolean {
    return typeof window !== 'undefined' && 
           window.kiro !== undefined;
  }

  /**
   * Get code file name for language
   */
  private getCodeFileName(language: string): string {
    const extensions: Record<string, string> = {
      javascript: 'main.js',
      typescript: 'main.ts',
      python: 'main.py',
      java: 'Main.java',
      csharp: 'Main.cs',
      cpp: 'main.cpp',
      go: 'main.go',
      rust: 'main.rs'
    };
    return extensions[language] || 'main.txt';
  }

  /**
   * Cleanup all sessions and resources
   */
  async cleanup(): Promise<void> {
    try {
      // End all active sessions
      const sessionIds = Array.from(this.activeSessions.keys());
      for (const sessionId of sessionIds) {
        await this.endChallengeSession(sessionId, false);
      }

      // Stop file watching
      const fileSystemService = getKiroFileSystemService();
      await fileSystemService.stopFileWatching();

      this.isInitialized = false;
      console.log('Kiro Integration Service cleaned up');

    } catch (error) {
      console.error('Failed to cleanup Kiro Integration Service:', error);
    }
  }
}

// Export singleton instance
let kiroIntegrationServiceInstance: KiroIntegrationService | null = null;

export function createKiroIntegrationService(config: KiroIntegrationConfig): KiroIntegrationService {
  kiroIntegrationServiceInstance = new KiroIntegrationService(config);
  return kiroIntegrationServiceInstance;
}

export function getKiroIntegrationService(): KiroIntegrationService {
  if (!kiroIntegrationServiceInstance) {
    throw new Error('Kiro Integration Service not initialized. Call createKiroIntegrationService first.');
  }
  return kiroIntegrationServiceInstance;
}

// Default configuration for local mode
export const defaultKiroConfig: KiroIntegrationConfig = {
  fileSystem: {
    workspaceRoot: './workspace',
    challengeDirectory: './challenges',
    autoSave: true,
    watchFiles: true
  },
  evaluation: {
    autoEvaluate: false,
    realTimeAnalysis: true,
    saveResults: true,
    workspaceIntegration: true
  },
  ai: {
    mode: 'local',
    apiKey: undefined,
    baseUrl: undefined,
    model: undefined
  },
  autoSync: true,
  enableRealTimeAnalysis: true
};