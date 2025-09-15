<template>
  <div 
    class="loading-state flex items-center justify-center"
    :class="containerClasses"
  >
    <div class="loading-content flex flex-col items-center">
      <!-- Spinner -->
      <div 
        v-if="type === 'spinner'"
        class="loading-spinner mb-3"
        :class="spinnerClasses"
      >
        <svg 
          class="animate-spin"
          :class="iconSizeClasses"
          fill="none" 
          viewBox="0 0 24 24"
        >
          <circle 
            class="opacity-25" 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="currentColor" 
            stroke-width="4"
          ></circle>
          <path 
            class="opacity-75" 
            fill="currentColor" 
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      </div>

      <!-- Dots -->
      <div 
        v-else-if="type === 'dots'"
        class="loading-dots flex space-x-1 mb-3"
      >
        <div 
          v-for="i in 3" 
          :key="i"
          class="dot rounded-full animate-pulse"
          :class="[dotSizeClasses, dotColorClasses]"
          :style="{ animationDelay: `${(i - 1) * 0.2}s` }"
        ></div>
      </div>

      <!-- Pulse -->
      <div 
        v-else-if="type === 'pulse'"
        class="loading-pulse mb-3"
      >
        <div 
          class="pulse-circle rounded-full animate-ping"
          :class="[pulseSizeClasses, pulseColorClasses]"
        ></div>
      </div>

      <!-- Skeleton -->
      <div 
        v-else-if="type === 'skeleton'"
        class="loading-skeleton space-y-3 w-full max-w-sm"
      >
        <div class="skeleton-line h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
        <div class="skeleton-line h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse w-3/4"></div>
        <div class="skeleton-line h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse w-1/2"></div>
      </div>

      <!-- Kaiju themed loader -->
      <div 
        v-else-if="type === 'kaiju'"
        class="loading-kaiju mb-3"
      >
        <div class="kaiju-emoji text-4xl animate-bounce">🦖</div>
      </div>

      <!-- Loading Message -->
      <div 
        v-if="message"
        class="loading-message text-center"
        :class="messageClasses"
      >
        <p class="font-medium">{{ message }}</p>
        <p 
          v-if="submessage"
          class="text-sm opacity-75 mt-1"
        >
          {{ submessage }}
        </p>
      </div>

      <!-- Progress Bar -->
      <div 
        v-if="showProgress && progress !== undefined"
        class="loading-progress w-full max-w-xs mt-3"
      >
        <div class="progress-bar bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
          <div 
            class="progress-fill bg-blue-500 h-full transition-all duration-300 ease-out"
            :style="{ width: `${Math.min(100, Math.max(0, progress))}%` }"
          ></div>
        </div>
        <div class="progress-text text-xs text-center mt-1 text-gray-600 dark:text-gray-400">
          {{ Math.round(Math.min(100, Math.max(0, progress))) }}%
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// Props
interface Props {
  type?: 'spinner' | 'dots' | 'pulse' | 'skeleton' | 'kaiju'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  color?: 'blue' | 'gray' | 'green' | 'red' | 'yellow' | 'purple'
  message?: string
  submessage?: string
  progress?: number
  showProgress?: boolean
  fullHeight?: boolean
  overlay?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'spinner',
  size: 'md',
  color: 'blue',
  message: '',
  submessage: '',
  progress: undefined,
  showProgress: false,
  fullHeight: false,
  overlay: false
})

// Computed classes
const containerClasses = computed(() => [
  {
    'min-h-screen': props.fullHeight,
    'min-h-32': !props.fullHeight,
    'fixed inset-0 z-50 bg-white bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75 backdrop-blur-sm': props.overlay
  }
])

const iconSizeClasses = computed(() => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  }
  return sizes[props.size]
})

const spinnerClasses = computed(() => {
  const colors = {
    blue: 'text-blue-500',
    gray: 'text-gray-500',
    green: 'text-green-500',
    red: 'text-red-500',
    yellow: 'text-yellow-500',
    purple: 'text-purple-500'
  }
  return colors[props.color]
})

const dotSizeClasses = computed(() => {
  const sizes = {
    sm: 'w-1 h-1',
    md: 'w-2 h-2',
    lg: 'w-3 h-3',
    xl: 'w-4 h-4'
  }
  return sizes[props.size]
})

const dotColorClasses = computed(() => {
  const colors = {
    blue: 'bg-blue-500',
    gray: 'bg-gray-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500'
  }
  return colors[props.color]
})

const pulseSizeClasses = computed(() => {
  const sizes = {
    sm: 'w-3 h-3',
    md: 'w-6 h-6',
    lg: 'w-9 h-9',
    xl: 'w-12 h-12'
  }
  return sizes[props.size]
})

const pulseColorClasses = computed(() => {
  const colors = {
    blue: 'bg-blue-500',
    gray: 'bg-gray-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500'
  }
  return colors[props.color]
})

const messageClasses = computed(() => {
  const sizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  }
  return [
    sizes[props.size],
    'text-gray-700 dark:text-gray-300'
  ]
})
</script>

<style scoped>
.loading-state {
  animation: fadeIn 0.3s ease-out;
}

.loading-dots .dot {
  animation: dotPulse 1.4s ease-in-out infinite both;
}

.loading-dots .dot:nth-child(1) { animation-delay: -0.32s; }
.loading-dots .dot:nth-child(2) { animation-delay: -0.16s; }
.loading-dots .dot:nth-child(3) { animation-delay: 0s; }

.loading-kaiju .kaiju-emoji {
  animation: kaijuBounce 2s ease-in-out infinite;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes dotPulse {
  0%, 80%, 100% {
    transform: scale(0);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes kaijuBounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .loading-state {
    animation: none;
  }
  
  .animate-spin,
  .animate-pulse,
  .animate-ping,
  .animate-bounce {
    animation: none;
  }
  
  .loading-dots .dot {
    animation: none;
    opacity: 0.7;
  }
  
  .loading-kaiju .kaiju-emoji {
    animation: none;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .progress-bar {
    border: 1px solid currentColor;
  }
  
  .skeleton-line {
    border: 1px solid currentColor;
  }
}
</style>