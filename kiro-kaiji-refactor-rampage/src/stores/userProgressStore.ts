/**
 * User Progress Store
 * 
 * Pinia store for managing user progress, achievements, statistics,
 * and difficulty progression
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { 
  UserProgress, 
  Achievement, 
  UserStats, 
  EvaluationResult,
  UserPreferences 
} from '@/types/user';
import { KaijuType } from '@/types/kaiju';
import { DifficultyLevel, ChallengeCategory } from '@/types/challenge';

export const useUserProgressStore = defineStore('userProgress', () => {
  // State
  const userProgress = ref<UserProgress | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Default user preferences
  const defaultPreferences: UserPreferences = {
    theme: 'auto',
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
  };

  // Default user stats
  const defaultStats: UserStats = {
    totalChallenges: 0,
    challengesCompleted: 0,
    averageScore: 0,
    bestScore: 0,
    totalTimeSpent: 0,
    kaijuDefeated: {
      [KaijuType.HYDRA_BUG]: 0,
      [KaijuType.COMPLEXASAUR]: 0,
      [KaijuType.DUPLICATRON]: 0,
      [KaijuType.SPAGHETTIZILLA]: 0,
      [KaijuType.MEMORYLEAK_ODACTYL]: 0
    },
    categoriesCompleted: {
      [ChallengeCategory.REFACTORING]: 0,
      [ChallengeCategory.BUG_FIXING]: 0,
      [ChallengeCategory.FEATURE_ADDITION]: 0,
      [ChallengeCategory.PERFORMANCE_OPTIMIZATION]: 0,
      [ChallengeCategory.TESTING]: 0,
      [ChallengeCategory.CODE_REVIEW]: 0,
      [ChallengeCategory.ARCHITECTURE]: 0
    },
    improvementTrend: [],
    currentStreak: 0,
    longestStreak: 0
  };

  // Computed properties
  const isInitialized = computed(() => userProgress.value !== null);
  
  const currentLevel = computed(() => {
    if (!userProgress.value) return 1;
    const completed = userProgress.value.stats.challengesCompleted;
    return Math.floor(completed / 5) + 1; // Level up every 5 challenges
  });

  const nextLevelProgress = computed(() => {
    if (!userProgress.value) return 0;
    const completed = userProgress.value.stats.challengesCompleted;
    return (completed % 5) / 5 * 100; // Progress to next level
  });

  const totalAchievements = computed(() => {
    return userProgress.value?.achievements.length || 0;
  });

  const recentAchievements = computed(() => {
    if (!userProgress.value) return [];
    return userProgress.value.achievements
      .sort((a, b) => b.unlockedAt.getTime() - a.unlockedAt.getTime())
      .slice(0, 5);
  });

  const improvementTrend = computed(() => {
    if (!userProgress.value) return 'stable';
    const trend = userProgress.value.stats.improvementTrend;
    if (trend.length < 3) return 'stable';
    
    const recent = trend.slice(-3);
    const average = recent.reduce((sum, score) => sum + score, 0) / recent.length;
    const older = trend.slice(-6, -3);
    const olderAverage = older.length > 0 
      ? older.reduce((sum, score) => sum + score, 0) / older.length 
      : average;
    
    if (average > olderAverage + 5) return 'improving';
    if (average < olderAverage - 5) return 'declining';
    return 'stable';
  });

  // Milestone feedback system
  const getMilestoneEncouragement = (challengesCompleted: number): string[] => {
    const encouragements: string[] = [];
    
    if (challengesCompleted === 1) {
      encouragements.push("🎉 Great start! You've completed your first challenge!");
    } else if (challengesCompleted === 5) {
      encouragements.push("🔥 You're on fire! 5 challenges completed - intermediate difficulty unlocked!");
    } else if (challengesCompleted === 10) {
      encouragements.push("💪 Double digits! You're becoming a refactoring expert!");
    } else if (challengesCompleted === 15) {
      encouragements.push("🚀 Advanced level unlocked! You're ready for bigger challenges!");
    } else if (challengesCompleted === 25) {
      encouragements.push("⭐ Quarter century! You're mastering the art of clean code!");
    } else if (challengesCompleted === 50) {
      encouragements.push("👑 Half century achieved! You're a true Kaiju slayer!");
    } else if (challengesCompleted % 10 === 0 && challengesCompleted > 50) {
      encouragements.push(`🎯 ${challengesCompleted} challenges conquered! Keep up the amazing work!`);
    }
    
    return encouragements;
  };

  // Achievement checking logic
  const checkForNewAchievements = (): Achievement[] => {
    if (!userProgress.value) return [];
    
    const newAchievements: Achievement[] = [];
    const stats = userProgress.value.stats;
    const existingIds = new Set(userProgress.value.achievements.map(a => a.id));
    
    // First challenge completion
    if (stats.challengesCompleted === 1 && !existingIds.has('first-victory')) {
      newAchievements.push({
        id: 'first-victory',
        name: 'First Victory',
        description: 'Complete your first challenge',
        icon: '🎉',
        category: 'milestone',
        unlockedAt: new Date(),
        rarity: 'common'
      });
    }
    
    // Kaiju slayer achievements
    Object.entries(stats.kaijuDefeated).forEach(([kaiju, count]) => {
      const achievementId = `${kaiju}-slayer`;
      if (count >= 5 && !existingIds.has(achievementId)) {
        newAchievements.push({
          id: achievementId,
          name: `${kaiju.replace('-', ' ')} Slayer`,
          description: `Defeat ${kaiju.replace('-', ' ')} 5 times`,
          icon: '⚔️',
          category: 'kaiju-slayer',
          unlockedAt: new Date(),
          rarity: 'rare'
        });
      }
    });
    
    // Streak achievements
    if (stats.currentStreak === 5 && !existingIds.has('streak-5')) {
      newAchievements.push({
        id: 'streak-5',
        name: 'On Fire',
        description: 'Complete 5 challenges in a row',
        icon: '🔥',
        category: 'streak',
        unlockedAt: new Date(),
        rarity: 'rare'
      });
    }
    
    if (stats.currentStreak === 10 && !existingIds.has('streak-10')) {
      newAchievements.push({
        id: 'streak-10',
        name: 'Unstoppable',
        description: 'Complete 10 challenges in a row',
        icon: '⚡',
        category: 'streak',
        unlockedAt: new Date(),
        rarity: 'epic'
      });
    }
    
    // Score achievements
    if (stats.bestScore >= 90 && !existingIds.has('perfectionist')) {
      newAchievements.push({
        id: 'perfectionist',
        name: 'Perfectionist',
        description: 'Achieve a score of 90 or higher',
        icon: '💎',
        category: 'skill-master',
        unlockedAt: new Date(),
        rarity: 'epic'
      });
    }
    
    // Milestone achievements
    const milestones = [
      { count: 10, id: 'veteran', name: 'Veteran', icon: '🏆', rarity: 'rare' as const },
      { count: 25, id: 'expert', name: 'Expert', icon: '🥇', rarity: 'epic' as const },
      { count: 50, id: 'master', name: 'Master', icon: '👑', rarity: 'legendary' as const }
    ];
    
    milestones.forEach(({ count, id, name, icon, rarity }) => {
      if (stats.challengesCompleted >= count && !existingIds.has(id)) {
        newAchievements.push({
          id,
          name,
          description: `Complete ${count} challenges`,
          icon,
          category: 'milestone',
          unlockedAt: new Date(),
          rarity
        });
      }
    });
    
    return newAchievements;
  };

  // Difficulty progression logic
  const checkDifficultyUnlocks = () => {
    if (!userProgress.value) return;
    
    const stats = userProgress.value.stats;
    const unlocked = userProgress.value.unlockedDifficulties;
    
    // Unlock intermediate after 5 completed challenges
    if (stats.challengesCompleted >= 5 && !unlocked.includes(DifficultyLevel.INTERMEDIATE)) {
      userProgress.value.unlockedDifficulties.push(DifficultyLevel.INTERMEDIATE);
      userProgress.value.unlockedKaiju.push(KaijuType.COMPLEXASAUR);
    }
    
    // Unlock advanced after 15 completed challenges with good average
    if (stats.challengesCompleted >= 15 && 
        stats.averageScore >= 70 && 
        !unlocked.includes(DifficultyLevel.ADVANCED)) {
      userProgress.value.unlockedDifficulties.push(DifficultyLevel.ADVANCED);
      userProgress.value.unlockedKaiju.push(KaijuType.DUPLICATRON, KaijuType.SPAGHETTIZILLA);
    }
    
    // Unlock expert after 30 completed challenges with high average
    if (stats.challengesCompleted >= 30 && 
        stats.averageScore >= 80 && 
        !unlocked.includes(DifficultyLevel.EXPERT)) {
      userProgress.value.unlockedDifficulties.push(DifficultyLevel.EXPERT);
      userProgress.value.unlockedKaiju.push(KaijuType.MEMORYLEAK_ODACTYL);
    }
  };

  // Actions
  const initializeProgress = (userId: string, username?: string) => {
    if (userProgress.value) return;
    
    const now = new Date();
    userProgress.value = {
      userId,
      username,
      completedChallenges: [],
      achievements: [],
      stats: { ...defaultStats },
      unlockedDifficulties: [DifficultyLevel.BEGINNER],
      unlockedKaiju: [KaijuType.HYDRA_BUG], // Start with basic Kaiju
      preferences: { ...defaultPreferences },
      createdAt: now,
      updatedAt: now
    };
    
    saveProgress();
  };

  const loadProgress = async (userId: string) => {
    isLoading.value = true;
    error.value = null;
    
    try {
      // Try to load from localStorage first (local mode)
      const stored = localStorage.getItem(`userProgress_${userId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects
        parsed.createdAt = new Date(parsed.createdAt);
        parsed.updatedAt = new Date(parsed.updatedAt);
        parsed.achievements = parsed.achievements.map((achievement: any) => ({
          ...achievement,
          unlockedAt: new Date(achievement.unlockedAt)
        }));
        userProgress.value = parsed;
      } else {
        // Initialize new progress if none exists
        initializeProgress(userId);
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load progress';
      console.error('Failed to load user progress:', err);
    } finally {
      isLoading.value = false;
    }
  };

  const saveProgress = async () => {
    if (!userProgress.value) return;
    
    try {
      userProgress.value.updatedAt = new Date();
      // Save to localStorage (local mode)
      localStorage.setItem(
        `userProgress_${userProgress.value.userId}`, 
        JSON.stringify(userProgress.value)
      );
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to save progress';
      console.error('Failed to save user progress:', err);
    }
  };

  const completeChallenge = async (evaluationResult: EvaluationResult) => {
    if (!userProgress.value) return;

    const { challengeId, overallScore, timeSpent, passed } = evaluationResult;
    
    // Update basic stats
    userProgress.value.stats.totalChallenges++;
    if (passed) {
      userProgress.value.stats.challengesCompleted++;
      userProgress.value.completedChallenges.push(challengeId);
    }
    
    // Update scores
    if (overallScore > userProgress.value.stats.bestScore) {
      userProgress.value.stats.bestScore = overallScore;
    }
    
    // Update average score
    const totalScore = userProgress.value.stats.averageScore * (userProgress.value.stats.totalChallenges - 1) + overallScore;
    userProgress.value.stats.averageScore = totalScore / userProgress.value.stats.totalChallenges;
    
    // Update time spent
    userProgress.value.stats.totalTimeSpent += timeSpent;
    
    // Update improvement trend
    userProgress.value.stats.improvementTrend.push(overallScore);
    if (userProgress.value.stats.improvementTrend.length > 10) {
      userProgress.value.stats.improvementTrend.shift();
    }
    
    // Update streak
    if (passed) {
      userProgress.value.stats.currentStreak++;
      if (userProgress.value.stats.currentStreak > userProgress.value.stats.longestStreak) {
        userProgress.value.stats.longestStreak = userProgress.value.stats.currentStreak;
      }
    } else {
      userProgress.value.stats.currentStreak = 0;
    }
    
    // Check for new achievements
    const newAchievements = checkForNewAchievements();
    if (newAchievements.length > 0) {
      userProgress.value.achievements.push(...newAchievements);
    }
    
    // Check for difficulty unlocks
    checkDifficultyUnlocks();
    
    // Get milestone encouragement messages
    const encouragements = passed ? getMilestoneEncouragement(userProgress.value.stats.challengesCompleted) : [];
    
    await saveProgress();
    return { newAchievements, encouragements };
  };

  const updateKaijuDefeated = (kaijuType: KaijuType) => {
    if (!userProgress.value) return;
    userProgress.value.stats.kaijuDefeated[kaijuType]++;
  };

  const updateCategoryCompleted = (category: ChallengeCategory) => {
    if (!userProgress.value) return;
    userProgress.value.stats.categoriesCompleted[category]++;
  };

  const updatePreferences = async (newPreferences: Partial<UserPreferences>) => {
    if (!userProgress.value) return;
    
    userProgress.value.preferences = {
      ...userProgress.value.preferences,
      ...newPreferences
    };
    
    await saveProgress();
  };

  const resetProgress = async () => {
    if (!userProgress.value) return;
    
    const userId = userProgress.value.userId;
    const username = userProgress.value.username;
    
    userProgress.value = {
      userId,
      username,
      completedChallenges: [],
      achievements: [],
      stats: { ...defaultStats },
      unlockedDifficulties: [DifficultyLevel.BEGINNER],
      unlockedKaiju: [KaijuType.HYDRA_BUG],
      preferences: { ...defaultPreferences },
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await saveProgress();
  };

  return {
    // State
    userProgress,
    isLoading,
    error,
    
    // Computed
    isInitialized,
    currentLevel,
    nextLevelProgress,
    totalAchievements,
    recentAchievements,
    improvementTrend,
    
    // Actions
    initializeProgress,
    loadProgress,
    saveProgress,
    completeChallenge,
    updateKaijuDefeated,
    updateCategoryCompleted,
    updatePreferences,
    resetProgress
  };
});