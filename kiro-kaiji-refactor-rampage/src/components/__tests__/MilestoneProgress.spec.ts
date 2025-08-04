/**
 * Milestone Progress Component Tests
 * 
 * Tests for the milestone progress tracking component
 */

import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import MilestoneProgress from '../progress/MilestoneProgress.vue';
import type { UserProgress } from '@/types/user';
import { KaijuType } from '@/types/kaiju';
import { DifficultyLevel, ChallengeCategory } from '@/types/challenge';

const createMockUserProgress = (overrides: Partial<UserProgress> = {}): UserProgress => ({
  userId: 'test-user',
  username: 'testuser',
  completedChallenges: ['challenge1', 'challenge2'],
  achievements: [],
  stats: {
    totalChallenges: 5,
    challengesCompleted: 2,
    averageScore: 75,
    bestScore: 85,
    totalTimeSpent: 60,
    kaijuDefeated: {
      [KaijuType.HYDRA_BUG]: 3,
      [KaijuType.COMPLEXASAUR]: 1,
      [KaijuType.DUPLICATRON]: 0,
      [KaijuType.SPAGHETTIZILLA]: 0,
      [KaijuType.MEMORYLEAK_ODACTYL]: 0
    },
    categoriesCompleted: {
      [ChallengeCategory.REFACTORING]: 2,
      [ChallengeCategory.BUG_FIXING]: 0,
      [ChallengeCategory.FEATURE_ADDITION]: 0,
      [ChallengeCategory.PERFORMANCE_OPTIMIZATION]: 0,
      [ChallengeCategory.TESTING]: 0,
      [ChallengeCategory.CODE_REVIEW]: 0,
      [ChallengeCategory.ARCHITECTURE]: 0
    },
    improvementTrend: [70, 75, 80],
    currentStreak: 2,
    longestStreak: 3
  },
  unlockedDifficulties: [DifficultyLevel.BEGINNER],
  unlockedKaiju: [KaijuType.HYDRA_BUG],
  preferences: {
    theme: 'light',
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
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

describe('MilestoneProgress', () => {
  it('renders correctly with user progress', () => {
    const userProgress = createMockUserProgress();
    const wrapper = mount(MilestoneProgress, {
      props: {
        userProgress,
        currentLevel: 1,
        nextLevelProgress: 40
      }
    });

    expect(wrapper.find('.milestone-progress').exists()).toBe(true);
    expect(wrapper.find('h3').text()).toBe('Next Milestones');
  });

  it('displays current level progress correctly', () => {
    const userProgress = createMockUserProgress();
    const wrapper = mount(MilestoneProgress, {
      props: {
        userProgress,
        currentLevel: 2,
        nextLevelProgress: 60
      }
    });

    expect(wrapper.text()).toContain('Level 2 → 3');
    expect(wrapper.text()).toContain('60% complete');
  });

  it('calculates challenges until next level correctly', () => {
    const userProgress = createMockUserProgress({
      stats: {
        ...createMockUserProgress().stats,
        challengesCompleted: 7 // 7 % 5 = 2, so 3 challenges until next level
      }
    });
    
    const wrapper = mount(MilestoneProgress, {
      props: {
        userProgress,
        currentLevel: 2,
        nextLevelProgress: 40
      }
    });

    expect(wrapper.text()).toContain('3 challenges to go');
  });

  it('shows upcoming challenge milestones', () => {
    const userProgress = createMockUserProgress({
      stats: {
        ...createMockUserProgress().stats,
        challengesCompleted: 5
      }
    });
    
    const wrapper = mount(MilestoneProgress, {
      props: {
        userProgress,
        currentLevel: 2,
        nextLevelProgress: 0
      }
    });

    expect(wrapper.text()).toContain('10 Challenges');
    expect(wrapper.text()).toContain('5/10');
  });

  it('shows streak milestones', () => {
    const userProgress = createMockUserProgress({
      stats: {
        ...createMockUserProgress().stats,
        currentStreak: 3,
        longestStreak: 3
      }
    });
    
    const wrapper = mount(MilestoneProgress, {
      props: {
        userProgress,
        currentLevel: 1,
        nextLevelProgress: 40
      }
    });

    expect(wrapper.text()).toContain('5 Win Streak');
    expect(wrapper.text()).toContain('3/5');
  });

  it('shows kaiju defeat milestones', () => {
    const userProgress = createMockUserProgress({
      stats: {
        ...createMockUserProgress().stats,
        kaijuDefeated: {
          [KaijuType.HYDRA_BUG]: 7,
          [KaijuType.COMPLEXASAUR]: 2,
          [KaijuType.DUPLICATRON]: 0,
          [KaijuType.SPAGHETTIZILLA]: 0,
          [KaijuType.MEMORYLEAK_ODACTYL]: 0
        }
      }
    });
    
    const wrapper = mount(MilestoneProgress, {
      props: {
        userProgress,
        currentLevel: 1,
        nextLevelProgress: 40
      }
    });

    expect(wrapper.text()).toContain('Hydra Bug Master');
    expect(wrapper.text()).toContain('7/10');
  });

  it('shows difficulty unlock milestones', () => {
    const userProgress = createMockUserProgress({
      stats: {
        ...createMockUserProgress().stats,
        challengesCompleted: 3
      },
      unlockedDifficulties: [DifficultyLevel.BEGINNER]
    });
    
    const wrapper = mount(MilestoneProgress, {
      props: {
        userProgress,
        currentLevel: 1,
        nextLevelProgress: 60
      }
    });

    expect(wrapper.text()).toContain('Intermediate Difficulty');
    expect(wrapper.text()).toContain('3/5');
  });

  it('displays encouragement message', () => {
    const userProgress = createMockUserProgress({
      stats: {
        ...createMockUserProgress().stats,
        challengesCompleted: 8
      }
    });
    
    const wrapper = mount(MilestoneProgress, {
      props: {
        userProgress,
        currentLevel: 2,
        nextLevelProgress: 60
      }
    });

    expect(wrapper.find('.bg-gradient-to-r').exists()).toBe(true);
    expect(wrapper.text()).toContain('Keep Going!');
  });

  it('handles null user progress gracefully', () => {
    const wrapper = mount(MilestoneProgress, {
      props: {
        userProgress: null,
        currentLevel: 1,
        nextLevelProgress: 0
      }
    });

    expect(wrapper.find('.milestone-progress').exists()).toBe(true);
    expect(wrapper.text()).toContain('5 challenges to go');
  });

  it('shows progress bars for incomplete milestones', () => {
    const userProgress = createMockUserProgress({
      stats: {
        ...createMockUserProgress().stats,
        challengesCompleted: 7
      }
    });
    
    const wrapper = mount(MilestoneProgress, {
      props: {
        userProgress,
        currentLevel: 2,
        nextLevelProgress: 40
      }
    });

    // Should have progress bars for milestones with progress > 0
    const progressBars = wrapper.findAll('.bg-blue-500');
    expect(progressBars.length).toBeGreaterThan(0);
  });

  it('limits milestones to top 5', () => {
    const userProgress = createMockUserProgress({
      stats: {
        ...createMockUserProgress().stats,
        challengesCompleted: 1, // This will create many available milestones
        currentStreak: 1,
        longestStreak: 1
      }
    });
    
    const wrapper = mount(MilestoneProgress, {
      props: {
        userProgress,
        currentLevel: 1,
        nextLevelProgress: 20
      }
    });

    const milestoneItems = wrapper.findAll('.milestone-item');
    expect(milestoneItems.length).toBeLessThanOrEqual(5);
  });

  it('sorts milestones by progress percentage', () => {
    const userProgress = createMockUserProgress({
      stats: {
        ...createMockUserProgress().stats,
        challengesCompleted: 8, // 80% towards 10 challenge milestone
        currentStreak: 1, // 20% towards 5 streak milestone
        longestStreak: 1
      },
      unlockedDifficulties: [DifficultyLevel.BEGINNER, DifficultyLevel.INTERMEDIATE] // Already unlocked intermediate
    });
    
    const wrapper = mount(MilestoneProgress, {
      props: {
        userProgress,
        currentLevel: 2,
        nextLevelProgress: 60
      }
    });

    const milestoneItems = wrapper.findAll('.milestone-item');
    expect(milestoneItems.length).toBeGreaterThan(0);
    
    // First milestone should be the one with highest progress (10 challenges at 80%)
    const firstMilestone = milestoneItems[0];
    expect(firstMilestone.text()).toContain('10 Challenges');
  });
});