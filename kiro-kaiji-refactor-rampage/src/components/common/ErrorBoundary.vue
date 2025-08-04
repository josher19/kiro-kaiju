<template>
  <div v-if="hasError" class="error-boundary">
    <div class="error-container">
      <div class="error-icon">
        <svg class="w-16 h-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      
      <h2 class="error-title">{{ errorTitle }}</h2>
      <p class="error-message">{{ errorMessage }}</p>
      
      <div v-if="showDetails && errorDetails" class="error-details">
        <button 
          @click="toggleDetails" 
          class="details-toggle"
          :class="{ 'expanded': showErrorDetails }"
        >
          <span>{{ showErrorDetails ? 'Hide' : 'Show' }} Details</span>
          <svg class="w-4 h-4 ml-2 transform transition-transform" 
               :class="{ 'rotate-180': showErrorDetails }"
               fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        <div v-if="showErrorDetails" class="error-details-content">
          <pre class="error-stack">{{ errorDetails }}</pre>
        </div>
      </div>
      
      <div class="error-actions">
        <button 
          @click="retry" 
          class="btn-primary"
          :disabled="isRetrying"
        >
          <svg v-if="isRetrying" class="animate-spin w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {{ isRetrying ? 'Retrying...' : 'Try Again' }}
        </button>
        
        <button 
          v-if="canGoBack" 
          @click="goBack" 
          class="btn-secondary"
        >
          Go Back
        </button>
        
        <button 
          v-if="canReload" 
          @click="reload" 
          class="btn-secondary"
        >
          Reload Page
        </button>
      </div>
      
      <div v-if="suggestions.length > 0" class="error-suggestions">
        <h3>Suggestions:</h3>
        <ul>
          <li v-for="suggestion in suggestions" :key="suggestion">
            {{ suggestion }}
          </li>
        </ul>
      </div>
    </div>
  </div>
  
  <slot v-else />
</template>

<script setup lang="ts">
import { ref, computed, onErrorCaptured, watch } from 'vue';
import { useRouter } from 'vue-router';
import { errorHandler, type AppError, ErrorCategory, ErrorSeverity } from '@/utils/errorHandler';

interface Props {
  fallbackTitle?: string;
  fallbackMessage?: string;
  showDetails?: boolean;
  canRetry?: boolean;
  canGoBack?: boolean;
  canReload?: boolean;
  onRetry?: () => void | Promise<void>;
  maxRetries?: number;
}

const props = withDefaults(defineProps<Props>(), {
  fallbackTitle: 'Something went wrong',
  fallbackMessage: 'An unexpected error occurred. Please try again.',
  showDetails: true,
  canRetry: true,
  canGoBack: true,
  canReload: true,
  maxRetries: 3
});

const emit = defineEmits<{
  error: [error: AppError];
  retry: [];
  recovered: [];
}>();

const router = useRouter();

// State
const hasError = ref(false);
const currentError = ref<AppError | null>(null);
const showErrorDetails = ref(false);
const isRetrying = ref(false);
const retryCount = ref(0);

// Computed
const errorTitle = computed(() => {
  if (!currentError.value) return props.fallbackTitle;
  
  switch (currentError.value.category) {
    case ErrorCategory.NETWORK:
      return 'Connection Problem';
    case ErrorCategory.VALIDATION:
      return 'Invalid Input';
    case ErrorCategory.GENERATION:
      return 'Challenge Generation Failed';
    case ErrorCategory.EVALUATION:
      return 'Evaluation Failed';
    case ErrorCategory.AI_SERVICE:
      return 'AI Assistant Unavailable';
    case ErrorCategory.KIRO_INTEGRATION:
      return 'Kiro Integration Issue';
    case ErrorCategory.STORAGE:
      return 'Storage Problem';
    default:
      return props.fallbackTitle;
  }
});

const errorMessage = computed(() => {
  return currentError.value?.userMessage || props.fallbackMessage;
});

const errorDetails = computed(() => {
  if (!currentError.value) return null;
  
  return `Error Code: ${currentError.value.code}
Category: ${currentError.value.category}
Severity: ${currentError.value.severity}
Time: ${currentError.value.timestamp.toISOString()}
Message: ${currentError.value.message}
${currentError.value.originalError ? `\nStack: ${currentError.value.originalError.stack}` : ''}`;
});

const suggestions = computed(() => {
  if (!currentError.value) return [];
  
  const baseSuggestions: string[] = [];
  
  switch (currentError.value.category) {
    case ErrorCategory.NETWORK:
      baseSuggestions.push(
        'Check your internet connection',
        'Try refreshing the page',
        'Wait a moment and try again'
      );
      break;
    case ErrorCategory.VALIDATION:
      baseSuggestions.push(
        'Check your input for errors',
        'Make sure all required fields are filled',
        'Verify the format of your data'
      );
      break;
    case ErrorCategory.GENERATION:
      baseSuggestions.push(
        'Try different challenge parameters',
        'Check if you have cached challenges available',
        'Wait a moment and try again'
      );
      break;
    case ErrorCategory.EVALUATION:
      baseSuggestions.push(
        'Check your code for syntax errors',
        'Try submitting again',
        'Your progress has been saved for later sync'
      );
      break;
    case ErrorCategory.AI_SERVICE:
      baseSuggestions.push(
        'The AI assistant will be back shortly',
        'You can continue coding without AI help',
        'Check your network connection'
      );
      break;
    case ErrorCategory.KIRO_INTEGRATION:
      baseSuggestions.push(
        'Some features may be limited',
        'Try switching to cloud mode',
        'Restart the Kiro IDE if needed'
      );
      break;
    case ErrorCategory.STORAGE:
      baseSuggestions.push(
        'Clear browser cache if needed',
        'Check available storage space',
        'Your data will sync when possible'
      );
      break;
  }
  
  return baseSuggestions;
});

// Error capture
onErrorCaptured((error: Error, instance, info) => {
  console.error('Error boundary caught error:', error, info);
  
  const appError = errorHandler.handle(error, {
    component: instance?.$options.name || 'Unknown',
    errorInfo: info
  });
  
  handleError(appError);
  return false; // Prevent error from propagating
});

// Methods
function handleError(error: AppError) {
  currentError.value = error;
  hasError.value = true;
  retryCount.value = 0;
  
  emit('error', error);
}

function toggleDetails() {
  showErrorDetails.value = !showErrorDetails.value;
}

async function retry() {
  if (retryCount.value >= props.maxRetries) {
    console.warn('Maximum retry attempts reached');
    return;
  }
  
  isRetrying.value = true;
  retryCount.value++;
  
  try {
    if (props.onRetry) {
      await props.onRetry();
    }
    
    // Reset error state
    hasError.value = false;
    currentError.value = null;
    showErrorDetails.value = false;
    
    emit('retry');
    emit('recovered');
    
  } catch (error) {
    console.error('Retry failed:', error);
    const appError = errorHandler.handle(error as Error, {
      context: 'error_boundary_retry',
      retryAttempt: retryCount.value
    });
    
    currentError.value = appError;
  } finally {
    isRetrying.value = false;
  }
}

function goBack() {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.push('/');
  }
}

function reload() {
  window.location.reload();
}

// Watch for external error recovery
watch(() => hasError.value, (newValue, oldValue) => {
  if (oldValue && !newValue) {
    emit('recovered');
  }
});

// Expose methods for parent components
defineExpose({
  handleError,
  retry,
  reset: () => {
    hasError.value = false;
    currentError.value = null;
    showErrorDetails.value = false;
    retryCount.value = 0;
  }
});
</script>

<style scoped>
.error-boundary {
  @apply min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4;
}

.error-container {
  @apply max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center;
}

.error-icon {
  @apply flex justify-center mb-4;
}

.error-title {
  @apply text-xl font-semibold text-gray-900 dark:text-white mb-2;
}

.error-message {
  @apply text-gray-600 dark:text-gray-300 mb-6;
}

.error-details {
  @apply mb-6;
}

.details-toggle {
  @apply flex items-center justify-center w-full text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors;
}

.error-details-content {
  @apply mt-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg text-left;
}

.error-stack {
  @apply text-xs text-gray-600 dark:text-gray-300 font-mono whitespace-pre-wrap overflow-auto max-h-40;
}

.error-actions {
  @apply flex flex-col sm:flex-row gap-3 justify-center mb-6;
}

.btn-primary {
  @apply flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors;
}

.btn-secondary {
  @apply px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 rounded-lg font-medium transition-colors;
}

.error-suggestions {
  @apply text-left;
}

.error-suggestions h3 {
  @apply font-medium text-gray-900 dark:text-white mb-2;
}

.error-suggestions ul {
  @apply list-disc list-inside text-sm text-gray-600 dark:text-gray-300 space-y-1;
}
</style>