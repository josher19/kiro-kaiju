/**
 * Offline Storage Service Tests
 * 
 * Tests for offline data management, caching, and synchronization
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { OfflineStorageService, useOfflineStorage } from '../offlineStorageService';
import type { Challenge } from '@/types/challenge';
import type { AIChatMessage } from '@/types/api';
import { ProgrammingLanguage, ChallengeCategory, DifficultyLevel } from '@/types/challenge';
import { KaijuType } from '@/types/kaiju';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock navigator.storage
Object.defineProperty(navigator, 'storage', {
  value: {
    estimate: vi.fn().mockResolvedValue({
      usage: 1024 * 1024, // 1MB
      quota: 50 * 1024 * 1024 // 50MB
    })
  }
});

describe('OfflineStorageService', () => {
  let offlineStorage: OfflineStorageService;
  let mockChallenge: Challenge;
  let mockChatMessages: AIChatMessage[];

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    
    offlineStorage = OfflineStorageService.getInstance();

    // Mock challenge
    mockChallenge = {
      id: 'test-challenge-1',
      kaiju: {
        id: 'hydra-bug',
        name: 'HydraBug',
        type: KaijuType.HYDRA_BUG,
        description: 'A bug that multiplies when you try to fix it',
        avatar: 'hydra-bug.png',
        flavorText: 'Fix one bug, create two more!',
        codePatterns: [],
        difficultyModifiers: [],
        specialAbilities: ['Bug multiplication', 'Recursive spawning'],
        weaknesses: ['Proper error handling', 'Unit testing']
      },
      config: {
        language: ProgrammingLanguage.JAVASCRIPT,
        category: ChallengeCategory.BUG_FIXING,
        difficulty: DifficultyLevel.INTERMEDIATE
      },
      title: 'HydraBug Bug Hunt',
      description: 'Fix the multiplying bugs',
      initialCode: 'function buggyCode() { return "bugs"; }',
      requirements: [],
      testCases: [],
      hints: ['Look for the bug patterns'],
      createdAt: new Date(),
      timeLimit: 30 * 60 * 1000,
      maxAttempts: 3
    };

    // Mock chat messages
    mockChatMessages = [
      {
        id: 'msg-1',
        role: 'user',
        content: 'Help me fix this bug',
        timestamp: new Date(),
        context: {
          challengeId: 'test-challenge-1',
          currentCode: 'function test() {}'
        }
      },
      {
        id: 'msg-2',
        role: 'assistant',
        content: 'I can help you with that bug',
        timestamp: new Date(),
        context: {
          challengeId: 'test-challenge-1',
          currentCode: 'function test() {}'
        }
      }
    ];
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize storage structure when no data exists', async () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      await offlineStorage['initialize']();
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'kiro-kaiju-offline-data',
        expect.stringContaining('"challenges":{}')
      );
    });

    it('should load existing data on initialization', async () => {
      const existingData = {
        challenges: {},
        pendingEvaluations: {},
        chatHistories: {},
        userProgress: null,
        settings: {},
        metadata: {
          version: '1.0.0',
          lastSync: new Date().toISOString(),
          totalSize: 0
        }
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(existingData));
      
      await offlineStorage['initialize']();
      
      // Should not create new data structure
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it('should check storage availability', () => {
      const isAvailable = offlineStorage['isStorageAvailable']();
      expect(isAvailable).toBe(true);
    });
  });

  describe('Challenge Caching', () => {
    beforeEach(() => {
      // Mock existing empty data
      const emptyData = {
        challenges: {},
        pendingEvaluations: {},
        chatHistories: {},
        userProgress: null,
        settings: {},
        metadata: {
          version: '1.0.0',
          lastSync: new Date().toISOString(),
          totalSize: 0
        }
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(emptyData));
    });

    it('should cache a challenge', async () => {
      await offlineStorage.cacheChallenge(mockChallenge);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'kiro-kaiju-offline-data',
        expect.stringContaining(mockChallenge.id)
      );
    });

    it('should retrieve cached challenge', () => {
      const cachedData = {
        challenges: {
          [mockChallenge.id]: {
            challenge: mockChallenge,
            cachedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            accessCount: 0,
            lastAccessed: new Date().toISOString()
          }
        },
        pendingEvaluations: {},
        chatHistories: {},
        userProgress: null,
        settings: {},
        metadata: {
          version: '1.0.0',
          lastSync: new Date().toISOString(),
          totalSize: 0
        }
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(cachedData));

      const retrieved = offlineStorage.getCachedChallenge(mockChallenge.id);
      expect(retrieved).toEqual(mockChallenge);
    });

    it('should return null for expired challenge', () => {
      const expiredData = {
        challenges: {
          [mockChallenge.id]: {
            challenge: mockChallenge,
            cachedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() - 1000).toISOString(), // Expired
            accessCount: 0,
            lastAccessed: new Date().toISOString()
          }
        },
        pendingEvaluations: {},
        chatHistories: {},
        userProgress: null,
        settings: {},
        metadata: {
          version: '1.0.0',
          lastSync: new Date().toISOString(),
          totalSize: 0
        }
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(expiredData));

      const retrieved = offlineStorage.getCachedChallenge(mockChallenge.id);
      expect(retrieved).toBeNull();
    });

    it('should get all cached challenges', () => {
      const cachedData = {
        challenges: {
          'challenge-1': {
            challenge: { ...mockChallenge, id: 'challenge-1' },
            cachedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            accessCount: 0,
            lastAccessed: new Date().toISOString()
          },
          'challenge-2': {
            challenge: { ...mockChallenge, id: 'challenge-2' },
            cachedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            accessCount: 0,
            lastAccessed: new Date().toISOString()
          }
        },
        pendingEvaluations: {},
        chatHistories: {},
        userProgress: null,
        settings: {},
        metadata: {
          version: '1.0.0',
          lastSync: new Date().toISOString(),
          totalSize: 0
        }
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(cachedData));

      const challenges = offlineStorage.getCachedChallenges();
      expect(challenges).toHaveLength(2);
      expect(challenges[0].id).toBe('challenge-1');
      expect(challenges[1].id).toBe('challenge-2');
    });

    it('should enforce cache limits', async () => {
      // Create data with many challenges
      const challenges: any = {};
      for (let i = 0; i < 25; i++) {
        challenges[`challenge-${i}`] = {
          challenge: { ...mockChallenge, id: `challenge-${i}` },
          cachedAt: new Date(Date.now() - i * 1000).toISOString(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          accessCount: 0,
          lastAccessed: new Date(Date.now() - i * 1000).toISOString()
        };
      }

      const dataWithManyChallenges = {
        challenges,
        pendingEvaluations: {},
        chatHistories: {},
        userProgress: null,
        settings: {},
        metadata: {
          version: '1.0.0',
          lastSync: new Date().toISOString(),
          totalSize: 0
        }
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(dataWithManyChallenges));

      await offlineStorage.cacheChallenge(mockChallenge);

      // Should have removed oldest challenges
      const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(Object.keys(savedData.challenges)).toHaveLength(20); // MAX_CHALLENGES
    });
  });

  describe('Pending Evaluations', () => {
    it('should store pending evaluation', async () => {
      const evaluationId = await offlineStorage.storePendingEvaluation(
        'challenge-1',
        'function fixed() { return "fixed"; }',
        'user-1',
        300,
        2
      );

      expect(evaluationId).toMatch(/^eval-/);
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('should retrieve pending evaluations', () => {
      const pendingData = {
        challenges: {},
        pendingEvaluations: {
          'eval-1': {
            id: 'eval-1',
            challengeId: 'challenge-1',
            submittedCode: 'function test() {}',
            userId: 'user-1',
            timeSpent: 300,
            attempts: 2,
            createdAt: new Date().toISOString(),
            retryCount: 0
          }
        },
        chatHistories: {},
        userProgress: null,
        settings: {},
        metadata: {
          version: '1.0.0',
          lastSync: new Date().toISOString(),
          totalSize: 0
        }
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(pendingData));

      const pending = offlineStorage.getPendingEvaluations();
      expect(pending).toHaveLength(1);
      expect(pending[0].id).toBe('eval-1');
    });

    it('should remove pending evaluation', () => {
      const pendingData = {
        challenges: {},
        pendingEvaluations: {
          'eval-1': {
            id: 'eval-1',
            challengeId: 'challenge-1',
            submittedCode: 'function test() {}',
            userId: 'user-1',
            timeSpent: 300,
            attempts: 2,
            createdAt: new Date().toISOString(),
            retryCount: 0
          }
        },
        chatHistories: {},
        userProgress: null,
        settings: {},
        metadata: {
          version: '1.0.0',
          lastSync: new Date().toISOString(),
          totalSize: 0
        }
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(pendingData));

      offlineStorage.removePendingEvaluation('eval-1');

      const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(savedData.pendingEvaluations).toEqual({});
    });
  });

  describe('Chat History Caching', () => {
    it('should cache chat history', async () => {
      await offlineStorage.cacheChatHistory('challenge-1', mockChatMessages, 'user-1');

      expect(localStorageMock.setItem).toHaveBeenCalled();
      const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(savedData.chatHistories['challenge-1-user-1']).toBeDefined();
    });

    it('should retrieve cached chat history', () => {
      const chatData = {
        challenges: {},
        pendingEvaluations: {},
        chatHistories: {
          'challenge-1-user-1': {
            challengeId: 'challenge-1',
            userId: 'user-1',
            messages: mockChatMessages,
            lastUpdated: new Date().toISOString()
          }
        },
        userProgress: null,
        settings: {},
        metadata: {
          version: '1.0.0',
          lastSync: new Date().toISOString(),
          totalSize: 0
        }
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(chatData));

      const history = offlineStorage.getCachedChatHistory('challenge-1', 'user-1');
      expect(history).toHaveLength(2);
      expect(history[0].content).toBe('Help me fix this bug');
    });

    it('should return empty array for non-existent chat history', () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify({
        challenges: {},
        pendingEvaluations: {},
        chatHistories: {},
        userProgress: null,
        settings: {},
        metadata: {
          version: '1.0.0',
          lastSync: new Date().toISOString(),
          totalSize: 0
        }
      }));

      const history = offlineStorage.getCachedChatHistory('non-existent', 'user-1');
      expect(history).toEqual([]);
    });
  });

  describe('User Progress and Settings', () => {
    it('should store user progress', async () => {
      const progress = {
        userId: 'user-1',
        completedChallenges: ['challenge-1'],
        achievements: [],
        stats: { totalChallenges: 1 }
      };

      await offlineStorage.storeUserProgress(progress);

      expect(localStorageMock.setItem).toHaveBeenCalled();
      const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(savedData.userProgress).toEqual(progress);
    });

    it('should retrieve stored user progress', () => {
      const progress = {
        userId: 'user-1',
        completedChallenges: ['challenge-1'],
        achievements: [],
        stats: { totalChallenges: 1 }
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify({
        challenges: {},
        pendingEvaluations: {},
        chatHistories: {},
        userProgress: progress,
        settings: {},
        metadata: {
          version: '1.0.0',
          lastSync: new Date().toISOString(),
          totalSize: 0
        }
      }));

      const retrieved = offlineStorage.getStoredUserProgress();
      expect(retrieved).toEqual(progress);
    });

    it('should store and retrieve settings', async () => {
      await offlineStorage.storeSetting('theme', 'dark');
      await offlineStorage.storeSetting('language', 'javascript');

      const theme = offlineStorage.getStoredSetting('theme');
      const language = offlineStorage.getStoredSetting('language');
      const nonExistent = offlineStorage.getStoredSetting('nonExistent', 'default');

      expect(theme).toBe('dark');
      expect(language).toBe('javascript');
      expect(nonExistent).toBe('default');
    });
  });

  describe('Storage Statistics', () => {
    it('should provide storage statistics', () => {
      const mockData = {
        challenges: { 'c1': {}, 'c2': {} },
        pendingEvaluations: { 'e1': {} },
        chatHistories: { 'h1': {}, 'h2': {}, 'h3': {} },
        userProgress: null,
        settings: {},
        metadata: {
          version: '1.0.0',
          lastSync: new Date().toISOString(),
          totalSize: 1024
        }
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockData));

      const stats = offlineStorage.getStorageStats();
      expect(stats.challenges).toBe(2);
      expect(stats.pendingEvaluations).toBe(1);
      expect(stats.chatHistories).toBe(3);
      expect(stats.totalSize).toBe(1024);
    });
  });

  describe('Data Cleanup', () => {
    it('should clean up expired data', async () => {
      const expiredData = {
        challenges: {
          'expired': {
            challenge: mockChallenge,
            cachedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() - 1000).toISOString(), // Expired
            accessCount: 0,
            lastAccessed: new Date().toISOString()
          },
          'valid': {
            challenge: mockChallenge,
            cachedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            accessCount: 0,
            lastAccessed: new Date().toISOString()
          }
        },
        pendingEvaluations: {},
        chatHistories: {},
        userProgress: null,
        settings: {},
        metadata: {
          version: '1.0.0',
          lastSync: new Date().toISOString(),
          totalSize: 0
        }
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(expiredData));

      await offlineStorage['cleanupExpiredData']();

      const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(savedData.challenges.expired).toBeUndefined();
      expect(savedData.challenges.valid).toBeDefined();
    });

    it('should clear all data', async () => {
      await offlineStorage.clearAllData();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('kiro-kaiju-offline-data');
      expect(localStorageMock.setItem).toHaveBeenCalled(); // Re-initialize
    });
  });

  describe('Storage Quota Management', () => {
    it('should handle storage quota exceeded', () => {
      const largeData = {
        challenges: {},
        pendingEvaluations: {},
        chatHistories: {},
        userProgress: null,
        settings: {},
        metadata: {
          version: '1.0.0',
          lastSync: new Date(),
          totalSize: 0
        }
      };

      // Add many challenges to simulate large data
      for (let i = 0; i < 10; i++) {
        (largeData.challenges as any)[`challenge-${i}`] = {
          challenge: mockChallenge,
          cachedAt: new Date(Date.now() - i * 1000).toISOString(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          accessCount: 0,
          lastAccessed: new Date(Date.now() - i * 1000).toISOString()
        };
      }

      localStorageMock.setItem.mockImplementationOnce(() => {
        const error = new Error('QuotaExceededError');
        error.name = 'QuotaExceededError';
        throw error;
      }).mockImplementationOnce(() => {}); // Second call should succeed

      localStorageMock.getItem.mockReturnValue(JSON.stringify(largeData));

      offlineStorage['saveOfflineData'](largeData);

      // Should have attempted to save twice (first failed, second succeeded after cleanup)
      expect(localStorageMock.setItem).toHaveBeenCalledTimes(2);
    });
  });

  describe('Sync Functionality', () => {
    it('should sync pending data when online', async () => {
      const pendingData = {
        challenges: {},
        pendingEvaluations: {
          'eval-1': {
            id: 'eval-1',
            challengeId: 'challenge-1',
            submittedCode: 'function test() {}',
            userId: 'user-1',
            timeSpent: 300,
            attempts: 2,
            createdAt: new Date().toISOString(),
            retryCount: 0
          }
        },
        chatHistories: {},
        userProgress: null,
        settings: {},
        metadata: {
          version: '1.0.0',
          lastSync: new Date().toISOString(),
          totalSize: 0
        }
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(pendingData));

      // Mock network service to be online
      vi.doMock('../networkService', () => ({
        networkService: {
          isOnline: { value: true }
        }
      }));

      await offlineStorage.syncPendingData();

      // Should have removed the pending evaluation after sync
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });
  });
});

describe('useOfflineStorage', () => {
  it('should provide reactive offline storage interface', () => {
    const {
      isInitialized,
      storageQuota,
      pendingSync,
      cacheChallenge,
      getCachedChallenge,
      storePendingEvaluation,
      getStorageStats
    } = useOfflineStorage();

    expect(typeof cacheChallenge).toBe('function');
    expect(typeof getCachedChallenge).toBe('function');
    expect(typeof storePendingEvaluation).toBe('function');
    expect(typeof getStorageStats).toBe('function');
  });
});