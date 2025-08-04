<template>
  <div class="progress-tracker bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
        Your Progress
      </h2>
      <div class="flex items-center space-x-2">
        <span class="text-sm text-gray-600 dark:text-gray-400">Level</span>
        <span class="text-2xl font-bold text-blue-600 dark:text-blue-400">
          {{ currentLevel }}
        </span>
      </div>
    </div>

    <!-- Level Progress Bar -->
    <div class="mb-6">
      <div class="flex justify-between items-center mb-2">
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
          Level {{ currentLevel }} Progress
        </span>
        <span class="text-sm text-gray-600 dark:text-gray-400">
          {{ Math.round(nextLevelProgress) }}%
        </span>
      </div>
      <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
        <div 
          class="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
          :style="{ width: `${nextLevelProgress}%` }"
        ></div>
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div class="stat-card bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
        <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">
          {{ userProgress?.stats.challengesCompleted || 0 }}
        </div>
        <div class="text-sm text-gray-600 dark:text-gray-400">
          Completed
        </div>
      </div>
      
      <div class="stat-card bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
        <div class="text-2xl font-bold text-green-600 dark:text-green-400">
          {{ Math.round(userProgress?.stats.averageScore || 0) }}
        </div>
        <div class="text-sm text-gray-600 dark:text-gray-400">
          Avg Score
        </div>
      </div>
      
      <div class="stat-card bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
        <div class="text-2xl font-bold text-purple-600 dark:text-purple-400">
          {{ userProgress?.stats.currentStreak || 0 }}
        </div>
        <div class="text-sm text-gray-600 dark:text-gray-400">
          Streak
        </div>
      </div>
      
      <div class="stat-card bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
        <div class="text-2xl font-bold text-orange-600 dark:text-orange-400">
          {{ totalAchievements }}
        </div>
        <div class="text-sm text-gray-600 dark:text-gray-400">
          Achievements
        </div>
      </div>
    </div>

    <!-- Progress Chart -->
    <div class="mb-6">
      <ProgressChart 
        :scores="userProgress?.stats.improvementTrend || []"
        :improvement-trend="improvementTrend"
      />
    </div>

    <!-- Kaiju Defeated -->
    <div class="mb-6">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
        Kaiju Defeated
      </h3>
      <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div 
          v-for="(count, kaiju) in userProgress?.stats.kaijuDefeated" 
          :key="kaiju"
          class="kaiju-stat bg-gray-50 dark:bg-gray-700 p-3 rounded-lg text-center"
        >
          <div class="text-2xl mb-1">{{ getKaijuEmoji(kaiju as KaijuType) }}</div>
          <div class="text-lg font-bold text-gray-900 dark:text-white">{{ count }}</div>
          <div class="text-xs text-gray-600 dark:text-gray-400 capitalize">
            {{ kaiju.replace('-', ' ') }}
          </div>
        </div>
      </div>
    </div>

    <!-- Milestone Progress -->
    <div class="mb-6">
      <MilestoneProgress 
        :user-progress="userProgress"
        :current-level="currentLevel"
        :next-level-progress="nextLevelProgress"
      />
    </div>

    <!-- Recent Achievements -->
    <div v-if="recentAchievements.length > 0">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
        Recent Achievements
      </h3>
      <div class="space-y-2">
        <div 
          v-for="achievement in recentAchievements" 
          :key="achievement.id"
          class="achievement-item flex items-center p-3 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg"
        >
          <div class="text-2xl mr-3">{{ achievement.icon }}</div>
          <div class="flex-1">
            <div class="font-semibold text-gray-900 dark:text-white">
              {{ achievement.name }}
            </div>
            <div class="text-sm text-gray-600 dark:text-gray-400">
              {{ achievement.description }}
            </div>
          </div>
          <div 
            class="px-2 py-1 rounded-full text-xs font-medium"
            :class="getRarityClasses(achievement.rarity)"
          >
            {{ achievement.rarity }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useUserProgressStore } from '@/stores/userProgressStore';
import { KaijuType } from '@/types/kaiju';
import ProgressChart from './ProgressChart.vue';
import MilestoneProgress from './MilestoneProgress.vue';
// Icons will be handled with emojis for simplicity

const progressStore = useUserProgressStore();

// Computed properties from store
const userProgress = computed(() => progressStore.userProgress);
const currentLevel = computed(() => progressStore.currentLevel);
const nextLevelProgress = computed(() => progressStore.nextLevelProgress);
const totalAchievements = computed(() => progressStore.totalAchievements);
const recentAchievements = computed(() => progressStore.recentAchievements);
const improvementTrend = computed(() => progressStore.improvementTrend);

// Trend display logic using emojis
const trendEmoji = computed(() => {
  switch (improvementTrend.value) {
    case 'improving': return '📈';
    case 'declining': return '📉';
    default: return '➖';
  }
});

const trendText = computed(() => {
  switch (improvementTrend.value) {
    case 'improving': return 'Improving';
    case 'declining': return 'Needs Focus';
    default: return 'Stable';
  }
});

const trendClasses = computed(() => {
  switch (improvementTrend.value) {
    case 'improving': 
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    case 'declining': 
      return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
    default: 
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }
});

// Helper functions
const getKaijuEmoji = (kaiju: KaijuType): string => {
  const emojiMap = {
    [KaijuType.HYDRA_BUG]: '🐛',
    [KaijuType.COMPLEXASAUR]: '🦕',
    [KaijuType.DUPLICATRON]: '👥',
    [KaijuType.SPAGHETTIZILLA]: '🍝',
    [KaijuType.MEMORYLEAK_ODACTYL]: '🦅'
  };
  return emojiMap[kaiju] || '👾';
};

const getRarityClasses = (rarity: string): string => {
  const rarityMap = {
    common: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    rare: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    epic: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
    legendary: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
  };
  return rarityMap[rarity as keyof typeof rarityMap] || rarityMap.common;
};
</script>

<style scoped>
.stat-card {
  transition: transform 0.2s ease-in-out;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.achievement-item {
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.kaiju-stat {
  transition: all 0.2s ease-in-out;
}

.kaiju-stat:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
</style>