/**
 * User Progress Store Tests
 * 
 * Tests for user progress tracking, achievements, and difficulty progression
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useUserProgressStore } from '../userProgressStore';
import type { EvaluationResult } from '@/types/user';
import { KaijuType } from '@/types/kaiju';
import { DifficultyLevel, ChallengeCategory } from '@/types/challenge';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('User Progress Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with null progress', () => {
      const store = useUserProgressStore();
      expect(store.userProgress).toBeNull();
      expect(store.isInitialized).toBe(false);
    });

    it('should create new progress profile', () => {
      const store = useUserProgressStore();
      store.initializeProgress('user123', 'testuser');
      
      expect(store.userProgress).not.toBeNull();
      expect(store.userProgress?.userId).toBe('user123');
      expect(store.userProgress?.username).toBe('testuser');
      expect(store.userProgress?.stats.challengesCompleted).toBe(0);
      expect(store.userProgress?.unlockedDifficulties).toEqual([DifficultyLevel.BEGINNER]);
      expect(store.userProgress?.unlockedKaiju).toEqual([KaijuType.HYDRA_BUG]);
    });

    it('should not reinitialize existing progress', () => {
      const store = useUserProgressStore();
      store.initializeProgress('user123', 'testuser');
      const originalProgress = store.userProgress;
      
      store.initializeProgress('user123', 'testuser');
      expect(store.userProgress).toBe(originalProgress);
    });
  });

  describe('Progress Loading and Saving', () => {
    it('should load progress from localStorage', async () => {
      const mockProgress = {
        userId: 'user123',
        username: 'testuser',
        completedChallenges: ['challenge1'],
        achievements: [],
        stats: {
          totalChallenges: 5,
          challengesCompleted: 3,
          averageScore: 85,
          bestScore: 95,
          totalTimeSpent: 120,
          kaijuDefeated: {
            [KaijuType.HYDRA_BUG]: 2,
            [KaijuType.COMPLEXASAUR]: 1,
            [KaijuType.DUPLICATRON]: 0,
            [KaijuType.SPAGHETTIZILLA]: 0,
            [KaijuType.MEMORYLEAK_ODACTYL]: 0
          },
          categoriesCompleted: {
            [ChallengeCategory.REFACTORING]: 2,
            [ChallengeCategory.BUG_FIXING]: 1,
            [ChallengeCategory.FEATURE_ADDITION]: 0,
            [ChallengeCategory.PERFORMANCE_OPTIMIZATION]: 0,
            [ChallengeCategory.TESTING]: 0,
            [ChallengeCategory.CODE_REVIEW]: 0,
            [ChallengeCategory.ARCHITECTURE]: 0
          },
          improvementTrend: [80, 85, 90],
          currentStreak: 2,
          longestStreak: 3
        },
        unlockedDifficulties: [DifficultyLevel.BEGINNER],
        unlockedKaiju: [KaijuType.HYDRA_BUG],
        preferences: {
          theme: 'dark' as const,
          language: 'en',
          notifications: true,
          soundEffects: true,
          autoSave: true,
          codeEditorSettings: {
            fontSize: 14,
            tabSize: 2,
            wordWrap: true,
            minimap: true
          }
        },
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-02T00:00:00.000Z'
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockProgress));

      const store = useUserProgressStore();
      await store.loadProgress('user123');

      expect(store.userProgress?.userId).toBe('user123');
      expect(store.userProgress?.stats.challengesCompleted).toBe(3);
      expect(store.userProgress?.createdAt).toBeInstanceOf(Date);
    });

    it('should initialize new progress if none exists in localStorage', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      const store = useUserProgressStore();
      await store.loadProgress('user123');

      expect(store.userProgress?.userId).toBe('user123');
      expect(store.userProgress?.stats.challengesCompleted).toBe(0);
    });

    it('should save progress to localStorage', async () => {
      const store = useUserProgressStore();
      store.initializeProgress('user123', 'testuser');
      
      await store.saveProgress();

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'userProgress_user123',
        expect.stringContaining('"userId":"user123"')
      );
    });
  });

  describe('Challenge Completion', () => {
    it('should update stats when completing a challenge', async () => {
      const store = useUserProgressStore();
      store.initializeProgress('user123');

      const evaluationResult: EvaluationResult = {
        challengeId: 'challenge1',
        userId: 'user123',
        submittedCode: 'test code',
        scores: {
          readability: 85,
          quality: 80,
          defects: 90,
          requirements: 88
        },
        overallScore: 86,
        feedback: [],
        timeSpent: 30,
        attempts: 1,
        passed: true,
        evaluatedAt: new Date()
      };

      await store.completeChallenge(evaluationResult);

      expect(store.userProgress?.stats.totalChallenges).toBe(1);
      expect(store.userProgress?.stats.challengesCompleted).toBe(1);
      expect(store.userProgress?.stats.averageScore).toBe(86);
      expect(store.userProgress?.stats.bestScore).toBe(86);
      expect(store.userProgress?.stats.currentStreak).toBe(1);
      expect(store.userProgress?.completedChallenges).toContain('challenge1');
    });

    it('should handle failed challenges correctly', async () => {
      const store = useUserProgressStore();
      store.initializeProgress('user123');

      const evaluationResult: EvaluationResult = {
        challengeId: 'challenge1',
        userId: 'user123',
        submittedCode: 'test code',
        scores: {
          readability: 50,
          quality: 45,
          defects: 40,
          requirements: 35
        },
        overallScore: 42,
        feedback: [],
        timeSpent: 45,
        attempts: 3,
        passed: false,
        evaluatedAt: new Date()
      };

      await store.completeChallenge(evaluationResult);

      expect(store.userProgress?.stats.totalChallenges).toBe(1);
      expect(store.userProgress?.stats.challengesCompleted).toBe(0);
      expect(store.userProgress?.stats.currentStreak).toBe(0);
      expect(store.userProgress?.completedChallenges).not.toContain('challenge1');
    });

    it('should update improvement trend correctly', async () => {
      const store = useUserProgressStore();
      store.initializeProgress('user123');

      // Complete multiple challenges
      const scores = [70, 75, 80, 85, 90];
      for (let i = 0; i < scores.length; i++) {
        const evaluationResult: EvaluationResult = {
          challengeId: `challenge${i + 1}`,
          userId: 'user123',
          submittedCode: 'test code',
          scores: { readability: scores[i], quality: scores[i], defects: scores[i], requirements: scores[i] },
          overallScore: scores[i],
          feedback: [],
          timeSpent: 30,
          attempts: 1,
          passed: true,
          evaluatedAt: new Date()
        };
        await store.completeChallenge(evaluationResult);
      }

      expect(store.userProgress?.stats.improvementTrend).toEqual(scores);
      expect(store.improvementTrend).toBe('improving');
    });
  });

  describe('Achievement System', () => {
    it('should award first victory achievement', async () => {
      const store = useUserProgressStore();
      store.initializeProgress('user123');

      const evaluationResult: EvaluationResult = {
        challengeId: 'challenge1',
        userId: 'user123',
        submittedCode: 'test code',
        scores: { readability: 80, quality: 80, defects: 80, requirements: 80 },
        overallScore: 80,
        feedback: [],
        timeSpent: 30,
        attempts: 1,
        passed: true,
        evaluatedAt: new Date()
      };

      const result = await store.completeChallenge(evaluationResult);

      expect(result?.newAchievements).toHaveLength(1);
      expect(result?.newAchievements[0].id).toBe('first-victory');
      expect(result?.newAchievements[0].name).toBe('First Victory');
      expect(result?.encouragements).toHaveLength(1);
      expect(result?.encouragements[0]).toContain('Great start!');
      expect(store.userProgress?.achievements).toHaveLength(1);
    });

    it('should award streak achievements', async () => {
      const store = useUserProgressStore();
      store.initializeProgress('user123');

      // Complete 5 challenges in a row
      for (let i = 0; i < 5; i++) {
        const evaluationResult: EvaluationResult = {
          challengeId: `challenge${i + 1}`,
          userId: 'user123',
          submittedCode: 'test code',
          scores: { readability: 80, quality: 80, defects: 80, requirements: 80 },
          overallScore: 80,
          feedback: [],
          timeSpent: 30,
          attempts: 1,
          passed: true,
          evaluatedAt: new Date()
        };
        await store.completeChallenge(evaluationResult);
      }

      const streakAchievement = store.userProgress?.achievements.find(a => a.id === 'streak-5');
      expect(streakAchievement).toBeDefined();
      expect(streakAchievement?.name).toBe('On Fire');
    });

    it('should award perfectionist achievement for high scores', async () => {
      const store = useUserProgressStore();
      store.initializeProgress('user123');

      const evaluationResult: EvaluationResult = {
        challengeId: 'challenge1',
        userId: 'user123',
        submittedCode: 'test code',
        scores: { readability: 95, quality: 92, defects: 88, requirements: 90 },
        overallScore: 91,
        feedback: [],
        timeSpent: 30,
        attempts: 1,
        passed: true,
        evaluatedAt: new Date()
      };

      await store.completeChallenge(evaluationResult);

      const perfectionist = store.userProgress?.achievements.find(a => a.id === 'perfectionist');
      expect(perfectionist).toBeDefined();
      expect(perfectionist?.name).toBe('Perfectionist');
    });

    it('should provide milestone encouragement messages', async () => {
      const store = useUserProgressStore();
      store.initializeProgress('user123');

      // Complete 5 challenges to trigger milestone encouragement
      for (let i = 0; i < 5; i++) {
        const evaluationResult: EvaluationResult = {
          challengeId: `challenge${i + 1}`,
          userId: 'user123',
          submittedCode: 'test code',
          scores: { readability: 80, quality: 80, defects: 80, requirements: 80 },
          overallScore: 80,
          feedback: [],
          timeSpent: 30,
          attempts: 1,
          passed: true,
          evaluatedAt: new Date()
        };
        
        const result = await store.completeChallenge(evaluationResult);
        
        if (i === 0) {
          // First challenge should have encouragement
          expect(result?.encouragements).toHaveLength(1);
          expect(result?.encouragements[0]).toContain('Great start!');
        } else if (i === 4) {
          // Fifth challenge should have milestone encouragement
          expect(result?.encouragements).toHaveLength(1);
          expect(result?.encouragements[0]).toContain('You\'re on fire!');
        }
      }
    });
  });

  describe('Difficulty Progression', () => {
    it('should unlock intermediate difficulty after 5 completed challenges', async () => {
      const store = useUserProgressStore();
      store.initializeProgress('user123');

      // Complete 5 challenges
      for (let i = 0; i < 5; i++) {
        const evaluationResult: EvaluationResult = {
          challengeId: `challenge${i + 1}`,
          userId: 'user123',
          submittedCode: 'test code',
          scores: { readability: 80, quality: 80, defects: 80, requirements: 80 },
          overallScore: 80,
          feedback: [],
          timeSpent: 30,
          attempts: 1,
          passed: true,
          evaluatedAt: new Date()
        };
        await store.completeChallenge(evaluationResult);
      }

      expect(store.userProgress?.unlockedDifficulties).toContain(DifficultyLevel.INTERMEDIATE);
      expect(store.userProgress?.unlockedKaiju).toContain(KaijuType.COMPLEXASAUR);
    });

    it('should unlock advanced difficulty with good performance', async () => {
      const store = useUserProgressStore();
      store.initializeProgress('user123');

      // Complete 15 challenges with good scores
      for (let i = 0; i < 15; i++) {
        const evaluationResult: EvaluationResult = {
          challengeId: `challenge${i + 1}`,
          userId: 'user123',
          submittedCode: 'test code',
          scores: { readability: 75, quality: 75, defects: 75, requirements: 75 },
          overallScore: 75,
          feedback: [],
          timeSpent: 30,
          attempts: 1,
          passed: true,
          evaluatedAt: new Date()
        };
        await store.completeChallenge(evaluationResult);
      }

      expect(store.userProgress?.unlockedDifficulties).toContain(DifficultyLevel.ADVANCED);
      expect(store.userProgress?.unlockedKaiju).toContain(KaijuType.DUPLICATRON);
      expect(store.userProgress?.unlockedKaiju).toContain(KaijuType.SPAGHETTIZILLA);
    });
  });

  describe('Computed Properties', () => {
    it('should calculate current level correctly', () => {
      const store = useUserProgressStore();
      store.initializeProgress('user123');
      
      // Mock completed challenges
      if (store.userProgress) {
        store.userProgress.stats.challengesCompleted = 12;
      }

      expect(store.currentLevel).toBe(3); // 12 / 5 + 1 = 3
    });

    it('should calculate next level progress correctly', () => {
      const store = useUserProgressStore();
      store.initializeProgress('user123');
      
      // Mock completed challenges
      if (store.userProgress) {
        store.userProgress.stats.challengesCompleted = 7;
      }

      expect(store.nextLevelProgress).toBe(40); // (7 % 5) / 5 * 100 = 40
    });

    it('should return recent achievements in correct order', () => {
      const store = useUserProgressStore();
      store.initializeProgress('user123');
      
      // Mock achievements with different dates
      if (store.userProgress) {
        store.userProgress.achievements = [
          {
            id: 'old',
            name: 'Old Achievement',
            description: 'Old',
            icon: '🏆',
            category: 'milestone',
            unlockedAt: new Date('2024-01-01'),
            rarity: 'common'
          },
          {
            id: 'new',
            name: 'New Achievement',
            description: 'New',
            icon: '🎉',
            category: 'milestone',
            unlockedAt: new Date('2024-01-02'),
            rarity: 'rare'
          }
        ];
      }

      const recent = store.recentAchievements;
      expect(recent[0].id).toBe('new');
      expect(recent[1].id).toBe('old');
    });
  });

  describe('Utility Methods', () => {
    it('should update Kaiju defeated count', () => {
      const store = useUserProgressStore();
      store.initializeProgress('user123');
      
      store.updateKaijuDefeated(KaijuType.HYDRA_BUG);
      store.updateKaijuDefeated(KaijuType.HYDRA_BUG);

      expect(store.userProgress?.stats.kaijuDefeated[KaijuType.HYDRA_BUG]).toBe(2);
    });

    it('should update category completed count', () => {
      const store = useUserProgressStore();
      store.initializeProgress('user123');
      
      store.updateCategoryCompleted(ChallengeCategory.REFACTORING);

      expect(store.userProgress?.stats.categoriesCompleted[ChallengeCategory.REFACTORING]).toBe(1);
    });

    it('should update user preferences', async () => {
      const store = useUserProgressStore();
      store.initializeProgress('user123');
      
      await store.updatePreferences({ theme: 'dark' });

      expect(store.userProgress?.preferences.theme).toBe('dark');
    });

    it('should reset progress correctly', async () => {
      const store = useUserProgressStore();
      store.initializeProgress('user123', 'testuser');
      
      // Add some progress
      if (store.userProgress) {
        store.userProgress.stats.challengesCompleted = 10;
        store.userProgress.achievements = [
          {
            id: 'test',
            name: 'Test',
            description: 'Test',
            icon: '🏆',
            category: 'milestone',
            unlockedAt: new Date(),
            rarity: 'common'
          }
        ];
      }

      await store.resetProgress();

      expect(store.userProgress?.stats.challengesCompleted).toBe(0);
      expect(store.userProgress?.achievements).toHaveLength(0);
      expect(store.userProgress?.userId).toBe('user123');
      expect(store.userProgress?.username).toBe('testuser');
    });
  });
});