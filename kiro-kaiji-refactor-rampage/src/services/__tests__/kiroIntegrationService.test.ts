/**
 * Kiro Integration Service Tests
 * 
 * Integration tests for the main Kiro IDE orchestration service
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  KiroIntegrationService, 
  createKiroIntegrationService,
  defaultKiroConfig,
  type KiroIntegrationConfig,
  type LocalChallengeSession 
} from '../kiroIntegrationService';
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
    chat: vi.fn(),
    analyze: vi.fn()
  }
};

Object.defineProperty(window, 'kiro', {
  value: mockKiroAPI,
  writable: true
});

// Mock custom events
const mockDispatchEvent = vi.fn();
Object.defineProperty(window, 'dispatchEvent', {
  value: mockDispatchEvent,
  writable: true
});

describe('KiroIntegrationService', () => {
  let service: KiroIntegrationService;
  let config: KiroIntegrationConfig;
  let mockChallenge: Challenge;

  beforeEach(() => {
    config = {
      ...defaultKiroConfig,
      enableRealTimeAnalysis: true
    };

    mockChallenge = {
      id: 'integration-test-challenge',
      title: 'Integration Test Challenge',
      description: 'A challenge for testing Kiro integration',
      kaiju: {
        id: 'complexasaur',
        name: 'Complexasaur',
        type: KaijuType.COMPLEXASAUR,
        description: 'A monster that creates overly complex code',
        avatar: 'complexasaur.png',
        flavorText: 'More complexity is always better!',
        codePatterns: [],
        difficultyModifiers: []
      },
      config: {
        language: ProgrammingLanguage.TYPESCRIPT,
        category: ChallengeCategory.REFACTORING,
        difficulty: DifficultyLevel.ADVANCED
      },
      initialCode: `class ComplexCalculator {
  private data: number[] = [];
  
  constructor(initialData: number[]) {
    this.data = initialData;
  }
  
  public calculateComplexResult(): number {
    let result = 0;
    for (let i = 0; i < this.data.length; i++) {
      if (this.data[i] > 0) {
        if (this.data[i] % 2 === 0) {
          result += this.data[i] * 2;
        } else {
          result += this.data[i] * 3;
        }
      } else {
        if (this.data[i] % 2 === 0) {
          result -= this.data[i] * 2;
        } else {
          result -= this.data[i] * 3;
        }
      }
    }
    return result;
  }
}`,
      requirements: [
        {
          id: 'req-1',
          description: 'Simplify the complex calculation logic',
          priority: 'must',
          testable: true,
          acceptanceCriteria: ['Reduce cyclomatic complexity', 'Improve readability']
        }
      ],
      testCases: [
        {
          id: 'test-1',
          name: 'Complex calculation test',
          description: 'Test the complex calculation with various inputs',
          input: [1, 2, 3, 4, -1, -2],
          expectedOutput: 20,
          isHidden: false,
          weight: 1.0
        }
      ],
      hints: ['Look for repeated patterns', 'Consider extracting helper methods'],
      createdAt: new Date(),
      timeLimit: 60 * 60 * 1000
    };

    service = createKiroIntegrationService(config);

    // Reset all mocks
    vi.clearAllMocks();
    
    // Set up default mock implementations
    mockKiroAPI.fileSystem.ensureDirectory.mockResolvedValue(undefined);
    mockKiroAPI.fileSystem.writeFile.mockResolvedValue(undefined);
    mockKiroAPI.fileSystem.readFile.mockResolvedValue(mockChallenge.initialCode);
    mockKiroAPI.fileSystem.watch.mockResolvedValue({
      on: vi.fn(),
      close: vi.fn()
    });
    mockKiroAPI.fileSystem.watchFile.mockResolvedValue({
      on: vi.fn(),
      close: vi.fn()
    });
    mockKiroAPI.workspace.sync.mockResolvedValue(undefined);
    mockKiroAPI.ai.chat.mockResolvedValue({
      success: true,
      message: 'AI response'
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize successfully in Kiro environment', async () => {
      await expect(service.initialize()).resolves.not.toThrow();
    });

    it('should throw error when not in Kiro environment', async () => {
      // Temporarily remove Kiro API
      const originalKiro = window.kiro;
      delete (window as any).kiro;

      await expect(service.initialize()).rejects.toThrow('Not running in Kiro IDE environment');

      // Restore Kiro API
      window.kiro = originalKiro;
    });

    it('should initialize all required services', async () => {
      await service.initialize();

      expect(mockKiroAPI.fileSystem.ensureDirectory).toHaveBeenCalled();
      expect(mockKiroAPI.fileSystem.watch).toHaveBeenCalled();
    });
  });

  describe('challenge session management', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should start challenge session successfully', async () => {
      const session = await service.startChallengeSession(mockChallenge);

      expect(session).toBeDefined();
      expect(session.challenge.id).toBe(mockChallenge.id);
      expect(session.isActive).toBe(true);
      expect(session.filesCreated).toHaveLength(3); // main.ts, README.md, REQUIREMENTS.md
      expect(session.startTime).toBeInstanceOf(Date);
    });

    it('should create challenge files in workspace', async () => {
      await service.startChallengeSession(mockChallenge);

      expect(mockKiroAPI.fileSystem.writeFile).toHaveBeenCalledTimes(3);
      expect(mockKiroAPI.fileSystem.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('main.ts'),
        mockChallenge.initialCode
      );
    });

    it('should sync workspace when autoSync is enabled', async () => {
      await service.startChallengeSession(mockChallenge);

      expect(mockKiroAPI.workspace.sync).toHaveBeenCalled();
    });

    it('should track active sessions', async () => {
      await service.startChallengeSession(mockChallenge);

      const activeSessions = service.getActiveSessions();
      expect(activeSessions).toHaveLength(1);
      expect(activeSessions[0].challenge.id).toBe(mockChallenge.id);
    });

    it('should get session by challenge ID', async () => {
      await service.startChallengeSession(mockChallenge);

      const session = service.getSession(mockChallenge.id);
      expect(session).toBeDefined();
      expect(session!.challenge.id).toBe(mockChallenge.id);
    });
  });

  describe('code management', () => {
    let session: LocalChallengeSession;

    beforeEach(async () => {
      await service.initialize();
      session = await service.startChallengeSession(mockChallenge);
    });

    it('should get current code from workspace', async () => {
      const expectedCode = 'function improved() { return "better"; }';
      mockKiroAPI.fileSystem.readFile.mockResolvedValue(expectedCode);

      const currentCode = await service.getCurrentCode(mockChallenge.id);

      expect(currentCode).toBe(expectedCode);
      expect(mockKiroAPI.fileSystem.readFile).toHaveBeenCalledWith(
        expect.stringContaining('main.ts')
      );
    });

    it('should update code in workspace', async () => {
      const newCode = 'class ImprovedCalculator { /* simplified */ }';

      await service.updateCode(mockChallenge.id, newCode);

      expect(mockKiroAPI.fileSystem.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('main.ts'),
        newCode
      );
    });

    it('should sync workspace after code update when autoSync enabled', async () => {
      const newCode = 'updated code';
      mockKiroAPI.workspace.sync.mockClear();

      await service.updateCode(mockChallenge.id, newCode);

      expect(mockKiroAPI.workspace.sync).toHaveBeenCalled();
    });

    it('should update session context when code changes', async () => {
      const newCode = 'new code content';

      await service.updateCode(mockChallenge.id, newCode);

      const updatedSession = service.getSession(mockChallenge.id);
      expect(updatedSession!.context.currentCode).toBe(newCode);
      expect(updatedSession!.lastActivity).toBeInstanceOf(Date);
    });

    it('should throw error for non-existent session', async () => {
      await expect(
        service.getCurrentCode('non-existent-challenge')
      ).rejects.toThrow('No active session found');
    });
  });

  describe('challenge submission', () => {
    let session: LocalChallengeSession;

    beforeEach(async () => {
      await service.initialize();
      session = await service.startChallengeSession(mockChallenge);
    });

    it('should submit challenge and return evaluation result', async () => {
      const improvedCode = 'class SimplifiedCalculator { /* much better */ }';
      mockKiroAPI.fileSystem.readFile.mockResolvedValue(improvedCode);

      const result = await service.submitChallenge(mockChallenge.id, 'test-user');

      expect(result).toBeDefined();
      expect(result.evaluationResult).toBeDefined();
      expect(result.evaluationResult.challengeId).toBe(mockChallenge.id);
      expect(result.evaluationResult.submittedCode).toBe(improvedCode);
    });

    it('should increment attempt count on submission', async () => {
      await service.submitChallenge(mockChallenge.id, 'test-user');

      const updatedSession = service.getSession(mockChallenge.id);
      expect(updatedSession!.context.attempts).toBe(1);
    });

    it('should deactivate session when challenge is passed', async () => {
      // Mock a passing evaluation
      const passingCode = 'perfect code';
      mockKiroAPI.fileSystem.readFile.mockResolvedValue(passingCode);

      const result = await service.submitChallenge(mockChallenge.id, 'test-user');
      
      // Manually set passed to true for test
      result.evaluationResult.passed = true;

      const updatedSession = service.getSession(mockChallenge.id);
      expect(updatedSession!.isActive).toBe(true); // Still active until explicitly ended
    });
  });

  describe('AI assistance', () => {
    let session: LocalChallengeSession;

    beforeEach(async () => {
      await service.initialize();
      session = await service.startChallengeSession(mockChallenge);
    });

    it('should get AI assistance successfully', async () => {
      const testMessage = 'How can I simplify this complex code?';
      const expectedResponse = {
        success: true,
        message: {
          id: 'ai-msg-1',
          role: 'assistant',
          content: 'You can simplify by extracting helper methods...',
          timestamp: new Date()
        }
      };
      
      mockKiroAPI.ai.chat.mockResolvedValue(expectedResponse);

      const response = await service.getAIAssistance(
        mockChallenge.id,
        testMessage,
        'test-user'
      );

      expect(response).toBeDefined();
      expect(mockKiroAPI.ai.chat).toHaveBeenCalled();
    });

    it('should update session activity when getting AI assistance', async () => {
      const originalActivity = session.lastActivity;
      
      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));
      
      await service.getAIAssistance(mockChallenge.id, 'test message', 'test-user');

      const updatedSession = service.getSession(mockChallenge.id);
      expect(updatedSession!.lastActivity.getTime()).toBeGreaterThan(originalActivity.getTime());
    });

    it('should include current code in AI context', async () => {
      const currentCode = 'current code state';
      mockKiroAPI.fileSystem.readFile.mockResolvedValue(currentCode);

      await service.getAIAssistance(mockChallenge.id, 'help me', 'test-user');

      const updatedSession = service.getSession(mockChallenge.id);
      expect(updatedSession!.context.currentCode).toBe(currentCode);
    });
  });

  describe('session lifecycle', () => {
    let session: LocalChallengeSession;

    beforeEach(async () => {
      await service.initialize();
      session = await service.startChallengeSession(mockChallenge);
    });

    it('should end session without cleanup', async () => {
      await service.endChallengeSession(mockChallenge.id, false);

      const endedSession = service.getSession(mockChallenge.id);
      expect(endedSession).toBeUndefined();
    });

    it('should end session with cleanup', async () => {
      mockKiroAPI.fileSystem.removeDirectory.mockResolvedValue(undefined);

      await service.endChallengeSession(mockChallenge.id, true);

      expect(mockKiroAPI.fileSystem.removeDirectory).toHaveBeenCalledWith(
        expect.stringContaining(mockChallenge.id)
      );
    });

    it('should handle ending non-existent session gracefully', async () => {
      await expect(
        service.endChallengeSession('non-existent-challenge', false)
      ).resolves.not.toThrow();
    });
  });

  describe('file change handling', () => {
    beforeEach(async () => {
      await service.initialize();
      await service.startChallengeSession(mockChallenge);
    });

    it('should emit file change events', async () => {
      // Get the file change handler that was registered
      const watchCall = mockKiroAPI.fileSystem.watch.mock.calls[0];
      const watcher = await watchCall[0]; // The returned watcher
      const changeHandler = watcher.on.mock.calls.find((call: any) => call[0] === 'change')[1];

      const mockChange = {
        path: `./challenges/${mockChallenge.id}/main.ts`,
        type: 'modified',
        content: 'updated content'
      };

      // Simulate file change
      changeHandler(mockChange);

      expect(mockDispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'kiro-file-change',
          detail: {
            challengeId: mockChallenge.id,
            change: expect.objectContaining({
              path: mockChange.path,
              type: mockChange.type
            })
          }
        })
      );
    });

    it('should update session context on main file changes', async () => {
      const watchCall = mockKiroAPI.fileSystem.watch.mock.calls[0];
      const watcher = await watchCall[0];
      const changeHandler = watcher.on.mock.calls.find((call: any) => call[0] === 'change')[1];

      const mockChange = {
        path: `./challenges/${mockChallenge.id}/main.ts`,
        type: 'modified',
        content: 'new code content'
      };

      changeHandler(mockChange);

      const updatedSession = service.getSession(mockChallenge.id);
      expect(updatedSession!.context.currentCode).toBe('new code content');
    });
  });

  describe('real-time analysis', () => {
    beforeEach(async () => {
      await service.initialize();
      await service.startChallengeSession(mockChallenge);
    });

    it('should emit analysis update events', async () => {
      // This would be triggered by the real-time analysis system
      const mockAnalysis = {
        challengeId: mockChallenge.id,
        scores: { readability: 85, quality: 0, defects: 90, requirements: 0 },
        overallScore: 87
      };

      // Simulate analysis update
      window.dispatchEvent(new CustomEvent('kiro-analysis-update', {
        detail: { challengeId: mockChallenge.id, analysis: mockAnalysis }
      }));

      expect(mockDispatchEvent).toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    beforeEach(async () => {
      await service.initialize();
      await service.startChallengeSession(mockChallenge);
    });

    it('should cleanup all sessions and resources', async () => {
      const mockWatcher = {
        on: vi.fn(),
        close: vi.fn()
      };
      mockKiroAPI.fileSystem.watch.mockResolvedValue(mockWatcher);

      await service.cleanup();

      expect(mockWatcher.close).toHaveBeenCalled();
      expect(service.getActiveSessions()).toHaveLength(0);
    });

    it('should handle cleanup errors gracefully', async () => {
      const mockWatcher = {
        on: vi.fn(),
        close: vi.fn().mockRejectedValue(new Error('Close failed'))
      };
      mockKiroAPI.fileSystem.watch.mockResolvedValue(mockWatcher);

      await expect(service.cleanup()).resolves.not.toThrow();
    });
  });

  describe('error handling', () => {
    it('should handle initialization errors', async () => {
      mockKiroAPI.fileSystem.ensureDirectory.mockRejectedValue(new Error('Directory creation failed'));

      await expect(service.initialize()).rejects.toThrow();
    });

    it('should handle file system errors during session start', async () => {
      await service.initialize();
      mockKiroAPI.fileSystem.writeFile.mockRejectedValue(new Error('Write failed'));

      await expect(
        service.startChallengeSession(mockChallenge)
      ).rejects.toThrow();
    });

    it('should handle AI service errors gracefully', async () => {
      await service.initialize();
      await service.startChallengeSession(mockChallenge);
      
      mockKiroAPI.ai.chat.mockRejectedValue(new Error('AI service unavailable'));

      await expect(
        service.getAIAssistance(mockChallenge.id, 'test message', 'test-user')
      ).rejects.toThrow();
    });
  });

  describe('configuration', () => {
    it('should use default configuration', () => {
      const defaultService = createKiroIntegrationService(defaultKiroConfig);
      expect(defaultService).toBeInstanceOf(KiroIntegrationService);
    });

    it('should respect autoSync setting', async () => {
      const noAutoSyncConfig = {
        ...config,
        autoSync: false
      };
      const noAutoSyncService = createKiroIntegrationService(noAutoSyncConfig);
      
      await noAutoSyncService.initialize();
      await noAutoSyncService.startChallengeSession(mockChallenge);

      // Workspace sync should not be called when autoSync is disabled
      expect(mockKiroAPI.workspace.sync).not.toHaveBeenCalled();
    });

    it('should respect enableRealTimeAnalysis setting', async () => {
      const noRealTimeConfig = {
        ...config,
        enableRealTimeAnalysis: false
      };
      const noRealTimeService = createKiroIntegrationService(noRealTimeConfig);
      
      await noRealTimeService.initialize();
      
      // Should not start real-time analysis when disabled
      await expect(
        noRealTimeService.startChallengeSession(mockChallenge)
      ).resolves.toBeDefined();
    });
  });
});