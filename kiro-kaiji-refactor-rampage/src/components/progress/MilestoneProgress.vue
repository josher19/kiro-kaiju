<template>
  <div class="milestone-progress bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
      Next Milestones
    </h3>
    
    <!-- Current Level Progress -->
    <div class="mb-6">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
          Level {{ currentLevel }} → {{ currentLevel + 1 }}
        </span>
        <span class="text-sm text-gray-600 dark:text-gray-400">
          {{ challengesUntilNextLevel }} challenges to go
        </span>
      </div>
      <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-2">
        <div 
          class="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
          :style="{ width: `${nextLevelProgress}%` }"
        ></div>
      </div>
      <div class="text-xs text-gray-500 dark:text-gray-400">
        {{ Math.round(nextLevelProgress) }}% complete
      </div>
    </div>

    <!-- Upcoming Milestones -->
    <div class="space-y-4">
      <div 
        v-for="milestone in upcomingMilestones" 
        :key="milestone.id"
        class="milestone-item"
      >
        <div class="flex items-center space-x-3">
          <!-- Milestone Icon -->
          <div 
            class="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg"
            :class="milestone.completed ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400' : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500'"
          >
            {{ milestone.completed ? '✅' : milestone.icon }}
          </div>
          
          <!-- Milestone Content -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between">
              <h4 
                class="text-sm font-medium"
                :class="milestone.completed ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'"
              >
                {{ milestone.name }}
              </h4>
              <span 
                class="text-xs px-2 py-1 rounded-full"
                :class="milestone.completed ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'"
              >
                {{ milestone.completed ? 'Completed' : `${milestone.progress}/${milestone.target}` }}
              </span>
            </div>
            <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {{ milestone.description }}
            </p>
            
            <!-- Progress Bar for Incomplete Milestones -->
            <div v-if="!milestone.completed && milestone.progress > 0" class="mt-2">
              <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                <div 
                  class="bg-blue-500 h-1 rounded-full transition-all duration-300"
                  :style="{ width: `${(milestone.progress / milestone.target) * 100}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Encouragement Message -->
    <div v-if="encouragementMessage" class="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
      <div class="flex items-center space-x-2">
        <span class="text-2xl">🎯</span>
        <div>
          <p class="text-sm font-medium text-gray-900 dark:text-white">
            Keep Going!
          </p>
          <p class="text-xs text-gray-600 dark:text-gray-400">
            {{ encouragementMessage }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { UserProgress } from '@/types/user';
import { KaijuType } from '@/types/kaiju';
import { DifficultyLevel } from '@/types/challenge';

interface Props {
  userProgress: UserProgress | null;
  currentLevel: number;
  nextLevelProgress: number;
}

const props = defineProps<Props>();

interface Milestone {
  id: string;
  name: string;
  description: string;
  icon: string;
  target: number;
  progress: number;
  completed: boolean;
  type: 'level' | 'achievement' | 'kaiju' | 'streak';
}

// Computed properties
const challengesUntilNextLevel = computed(() => {
  if (!props.userProgress) return 5;
  const completed = props.userProgress.stats.challengesCompleted;
  return 5 - (completed % 5);
});

const upcomingMilestones = computed((): Milestone[] => {
  if (!props.userProgress) return [];
  
  const stats = props.userProgress.stats;
  const milestones: Milestone[] = [];
  
  // Challenge completion milestones
  const challengeMilestones = [10, 25, 50, 100];
  challengeMilestones.forEach(target => {
    if (stats.challengesCompleted < target) {
      milestones.push({
        id: `challenges-${target}`,
        name: `${target} Challenges`,
        description: `Complete ${target} coding challenges`,
        icon: '🏆',
        target,
        progress: stats.challengesCompleted,
        completed: false,
        type: 'achievement'
      });
    }
  });
  
  // Streak milestones
  const streakMilestones = [5, 10, 15];
  streakMilestones.forEach(target => {
    if (stats.longestStreak < target) {
      milestones.push({
        id: `streak-${target}`,
        name: `${target} Win Streak`,
        description: `Complete ${target} challenges in a row`,
        icon: '🔥',
        target,
        progress: stats.currentStreak,
        completed: false,
        type: 'streak'
      });
    }
  });
  
  // Kaiju defeat milestones
  Object.entries(stats.kaijuDefeated).forEach(([kaiju, count]) => {
    const target = 10;
    if (count < target) {
      const kaijuName = kaiju.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
      milestones.push({
        id: `kaiju-${kaiju}`,
        name: `${kaijuName} Master`,
        description: `Defeat ${kaijuName} ${target} times`,
        icon: getKaijuIcon(kaiju as KaijuType),
        target,
        progress: count,
        completed: false,
        type: 'kaiju'
      });
    }
  });
  
  // Difficulty unlock milestones
  const difficultyMilestones = [
    { level: DifficultyLevel.INTERMEDIATE, name: 'Intermediate', challenges: 5, icon: '📈' },
    { level: DifficultyLevel.ADVANCED, name: 'Advanced', challenges: 15, icon: '🚀' },
    { level: DifficultyLevel.EXPERT, name: 'Expert', challenges: 30, icon: '⭐' }
  ];
  
  difficultyMilestones.forEach(({ level, name, challenges, icon }) => {
    if (!props.userProgress?.unlockedDifficulties.includes(level)) {
      milestones.push({
        id: `difficulty-${level}`,
        name: `${name} Difficulty`,
        description: `Unlock ${name} difficulty level`,
        icon,
        target: challenges,
        progress: stats.challengesCompleted,
        completed: false,
        type: 'level'
      });
    }
  });
  
  // Sort by progress percentage and return top 5
  return milestones
    .sort((a, b) => {
      const aProgress = a.progress / a.target;
      const bProgress = b.progress / b.target;
      return bProgress - aProgress;
    })
    .slice(0, 5);
});

const encouragementMessage = computed(() => {
  if (!props.userProgress) return '';
  
  const stats = props.userProgress.stats;
  const nextMilestone = upcomingMilestones.value[0];
  
  if (!nextMilestone) {
    return "You're doing amazing! Keep challenging yourself!";
  }
  
  const remaining = nextMilestone.target - nextMilestone.progress;
  
  if (nextMilestone.type === 'achievement') {
    return `Just ${remaining} more challenges to unlock "${nextMilestone.name}"!`;
  } else if (nextMilestone.type === 'streak') {
    return `${remaining} more wins in a row for "${nextMilestone.name}"!`;
  } else if (nextMilestone.type === 'kaiju') {
    return `Defeat ${remaining} more monsters to become a "${nextMilestone.name}"!`;
  } else if (nextMilestone.type === 'level') {
    return `${remaining} more challenges to unlock ${nextMilestone.name}!`;
  }
  
  return "You're making great progress!";
});

// Helper functions
const getKaijuIcon = (kaiju: KaijuType): string => {
  const iconMap = {
    [KaijuType.HYDRA_BUG]: '🐛',
    [KaijuType.COMPLEXASAUR]: '🦕',
    [KaijuType.DUPLICATRON]: '👥',
    [KaijuType.SPAGHETTIZILLA]: '🍝',
    [KaijuType.MEMORYLEAK_ODACTYL]: '🦇'
  };
  return iconMap[kaiju] || '👾';
};
</script>

<style scoped>
.milestone-item {
  transition: all 0.2s ease-in-out;
}

.milestone-item:hover {
  transform: translateX(4px);
}
</style>