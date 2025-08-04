<template>
  <Transition
    enter-active-class="transition-all duration-500 ease-out"
    enter-from-class="opacity-0 transform translate-y-8 scale-95"
    enter-to-class="opacity-100 transform translate-y-0 scale-100"
    leave-active-class="transition-all duration-300 ease-in"
    leave-from-class="opacity-100 transform translate-y-0 scale-100"
    leave-to-class="opacity-0 transform translate-y-8 scale-95"
  >
    <div 
      v-if="visible"
      class="achievement-notification fixed top-4 right-4 z-50 max-w-sm"
    >
      <div 
        class="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 p-1 rounded-lg shadow-2xl"
      >
        <div class="bg-white dark:bg-gray-800 rounded-md p-4">
          <div class="flex items-start space-x-3">
            <!-- Achievement Icon -->
            <div class="flex-shrink-0">
              <div class="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-2xl animate-bounce">
                {{ achievement?.icon || '🏆' }}
              </div>
            </div>
            
            <!-- Achievement Content -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center space-x-2 mb-1">
                <h3 class="text-lg font-bold text-gray-900 dark:text-white">
                  Achievement Unlocked!
                </h3>
                <div 
                  class="px-2 py-1 rounded-full text-xs font-medium"
                  :class="getRarityClasses(achievement?.rarity || 'common')"
                >
                  {{ achievement?.rarity || 'common' }}
                </div>
              </div>
              
              <p class="text-base font-semibold text-gray-800 dark:text-gray-200 mb-1">
                {{ achievement?.name }}
              </p>
              
              <p class="text-sm text-gray-600 dark:text-gray-400">
                {{ achievement?.description }}
              </p>
            </div>
            
            <!-- Close Button -->
            <button
              @click="close"
              class="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <XMarkIcon class="w-5 h-5" />
            </button>
          </div>
          
          <!-- Progress Bar -->
          <div class="mt-3">
            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
              <div 
                class="bg-gradient-to-r from-yellow-400 to-orange-500 h-1 rounded-full transition-all duration-300"
                :style="{ width: `${progress}%` }"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { XMarkIcon } from '@heroicons/vue/24/outline';
import type { Achievement } from '@/types/user';

interface Props {
  achievement: Achievement | null;
  autoClose?: boolean;
  duration?: number;
}

const props = withDefaults(defineProps<Props>(), {
  autoClose: true,
  duration: 5000
});

const emit = defineEmits<{
  close: [];
}>();

const visible = ref(false);
const progress = ref(100);
let progressInterval: NodeJS.Timeout | null = null;
let autoCloseTimeout: NodeJS.Timeout | null = null;

// Watch for new achievements
watch(() => props.achievement, (newAchievement) => {
  if (newAchievement) {
    show();
  }
}, { immediate: true });

const show = () => {
  visible.value = true;
  progress.value = 100;
  
  if (props.autoClose) {
    // Start progress bar countdown
    progressInterval = setInterval(() => {
      progress.value -= (100 / (props.duration / 100));
      if (progress.value <= 0) {
        clearInterval(progressInterval!);
      }
    }, 100);
    
    // Auto close after duration
    autoCloseTimeout = setTimeout(() => {
      close();
    }, props.duration);
  }
};

const close = () => {
  visible.value = false;
  
  // Clear intervals
  if (progressInterval) {
    clearInterval(progressInterval);
    progressInterval = null;
  }
  
  if (autoCloseTimeout) {
    clearTimeout(autoCloseTimeout);
    autoCloseTimeout = null;
  }
  
  emit('close');
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

// Cleanup on unmount
onMounted(() => {
  return () => {
    if (progressInterval) clearInterval(progressInterval);
    if (autoCloseTimeout) clearTimeout(autoCloseTimeout);
  };
});
</script>

<style scoped>
.achievement-notification {
  animation: celebrationPulse 0.6s ease-out;
}

@keyframes celebrationPulse {
  0% {
    transform: scale(0.8);
    opacity: 0;
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* Add sparkle effect */
.achievement-notification::before {
  content: '';
  position: absolute;
  top: -10px;
  left: -10px;
  right: -10px;
  bottom: -10px;
  background: radial-gradient(circle, rgba(255, 215, 0, 0.3) 0%, transparent 70%);
  border-radius: 12px;
  animation: sparkle 2s ease-in-out infinite;
  pointer-events: none;
}

@keyframes sparkle {
  0%, 100% {
    opacity: 0;
    transform: scale(0.8);
  }
  50% {
    opacity: 1;
    transform: scale(1.1);
  }
}
</style>