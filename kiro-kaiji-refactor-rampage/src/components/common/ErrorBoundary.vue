<template>
  <div class="error-boundary">
    <!-- Error State -->
    <div 
      v-if="hasError"
      class="error-container flex flex-col items-center justify-center min-h-64 p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
    >
      <!-- Error Icon -->
      <div class="error-icon mb-4">
        <svg class="w-16 h-16 text-red-500 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z"></path>
        </svg>
      </div>

      <!-- Error Message -->
      <h3 class="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
        {{ errorTitle }}
      </h3>
      
      <p class="text-red-600 dark:text-red-300 text-center mb-4 max-w-md">
        {{ errorMessage }}
      </p>

      <!-- Error Details (Development Mode) -->
      <details 
        v-if="showDetails && errorDetails"
        class="w-full max-w-2xl mb-4"
      >
        <summary class="cursor-pointer text-sm text-red-700 dark:text-red-300 hover:text-red-800 dark:hover:text-red-200">
          Show Error Details
        </summary>
        <pre class="mt-2 p-3 bg-red-100 dark:bg-red-900/40 border border-red-200 dark:border-red-700 rounded text-xs text-red-800 dark:text-red-200 overflow-auto max-h-40">{{ errorDetails }}</pre>
      </details>

      <!-- Action Buttons -->
      <div class="flex flex-col sm:flex-row gap-3">
        <button
          @click="retry"
          class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          Try Again
        </button>
        
        <button
          v-if="showReload"
          @click="reloadPage"
          class="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          Reload Page
        </button>
        
        <button
          v-if="fallbackAction"
          @click="fallbackAction.handler"
          class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {{ fallbackAction.label }}
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div 
      v-else-if="isLoading"
      class="loading-container flex flex-col items-center justify-center min-h-32 p-6"
    >
      <div class="loading-spinner mb-4">
        <svg class="animate-spin h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
      <p class="text-gray-600 dark:text-gray-400">{{ loadingMessage }}</p>
    </div>

    <!-- Success State - Render Children -->
    <div v-else class="error-boundary-content">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onErrorCaptured, watch, nextTick } from 'vue'

// Props
interface Props {
  errorTitle?: string
  errorMessage?: string
  loadingMessage?: string
  showDetails?: boolean
  showReload?: boolean
  fallbackAction?: {
    label: string
    handler: () => void
  }
  retryHandler?: () => Promise<void> | void
}

const props = withDefaults(defineProps<Props>(), {
  errorTitle: 'Something went wrong',
  errorMessage: 'An unexpected error occurred. Please try again.',
  loadingMessage: 'Loading...',
  showDetails: import.meta.env.DEV, // Show details in development mode
  showReload: true,
  fallbackAction: undefined,
  retryHandler: undefined
})

// Emits
const emit = defineEmits<{
  error: [error: Error]
  retry: []
  reload: []
}>()

// Local state
const hasError = ref(false)
const isLoading = ref(false)
const errorDetails = ref<string>('')
const retryCount = ref(0)
const maxRetries = 3

// Error capture
onErrorCaptured((error: Error) => {
  console.error('ErrorBoundary caught error:', error)
  
  hasError.value = true
  isLoading.value = false
  errorDetails.value = error.stack || error.message
  
  emit('error', error)
  
  // Return false to prevent the error from propagating further
  return false
})

// Methods
const retry = async () => {
  if (retryCount.value >= maxRetries) {
    console.warn('Maximum retry attempts reached')
    return
  }
  
  retryCount.value++
  hasError.value = false
  isLoading.value = true
  
  try {
    if (props.retryHandler) {
      await props.retryHandler()
    }
    
    // Wait for next tick to allow component to re-render
    await nextTick()
    
    isLoading.value = false
    emit('retry')
  } catch (error) {
    console.error('Retry failed:', error)
    hasError.value = true
    isLoading.value = false
    
    if (error instanceof Error) {
      errorDetails.value = error.stack || error.message
    }
  }
}

const reloadPage = () => {
  emit('reload')
  window.location.reload()
}

// Reset error state when component is reused
const reset = () => {
  hasError.value = false
  isLoading.value = false
  errorDetails.value = ''
  retryCount.value = 0
}

// Watch for external loading state changes
watch(() => props.loadingMessage, (newMessage) => {
  if (newMessage && !hasError.value) {
    isLoading.value = true
  }
})

// Expose methods for parent components
defineExpose({
  reset,
  retry,
  hasError: () => hasError.value,
  isLoading: () => isLoading.value
})
</script>

<style scoped>
.error-boundary {
  width: 100%;
}

.error-container {
  animation: fadeIn 0.3s ease-out;
}

.loading-container {
  animation: fadeIn 0.3s ease-out;
}

.error-boundary-content {
  width: 100%;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Mobile optimizations */
@media (max-width: 640px) {
  .error-container {
    min-height: 16rem;
    padding: 1rem;
  }
  
  .error-icon svg {
    width: 3rem;
    height: 3rem;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .error-container {
    border-width: 2px;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .error-container,
  .loading-container {
    animation: none;
  }
  
  .loading-spinner svg {
    animation: none;
  }
}
</style>