<template>
  <div v-if="showBudgetStatus" class="budget-status-container">
    <!-- Budget Status Display -->
    <div 
      class="budget-status-card"
      :class="budgetStatusClass"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <div class="budget-icon" :class="budgetIconClass">
            <component :is="budgetIcon" class="w-4 h-4" />
          </div>
          <span class="text-sm font-medium">
            Budget: ${{ currentSpending.toFixed(2) }} / ${{ budgetLimit.toFixed(2) }}
          </span>
        </div>
        <div class="text-xs text-gray-500">
          {{ percentageUsed.toFixed(1) }}%
        </div>
      </div>
      
      <!-- Progress Bar -->
      <div class="budget-progress-bar">
        <div 
          class="budget-progress-fill"
          :class="progressBarClass"
          :style="{ width: `${Math.min(percentageUsed, 100)}%` }"
        ></div>
      </div>
      
      <!-- Status Message -->
      <div v-if="statusMessage" class="text-xs mt-1" :class="statusMessageClass">
        {{ statusMessage }}
      </div>
    </div>

    <!-- Budget Exceeded Modal -->
    <div 
      v-if="showBudgetExceededModal" 
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click="closeBudgetModal"
    >
      <div 
        class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4"
        @click.stop
      >
        <div class="flex items-center space-x-3 mb-4">
          <div class="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
            <ExclamationTriangleIcon class="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              Budget Limit Exceeded
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              AWS spending limit reached
            </p>
          </div>
        </div>

        <div class="mb-4">
          <p class="text-sm text-gray-700 dark:text-gray-300 mb-3">
            Your AWS budget limit of ${{ budgetLimit.toFixed(2) }} has been exceeded. 
            Current spending: ${{ currentSpending.toFixed(2) }}.
          </p>
          
          <div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <h4 class="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
              Available Options:
            </h4>
            <ul class="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
              <li v-if="fallbackOptions?.switchToLocalMode">
                • Switch to Local Mode (using local LLM)
              </li>
              <li v-if="fallbackOptions?.requireOpenRouterKey">
                • Provide OpenRouter API key to continue
              </li>
              <li>• Wait until next month for budget reset</li>
            </ul>
          </div>
        </div>

        <div class="flex space-x-3">
          <button
            v-if="fallbackOptions?.switchToLocalMode"
            @click="switchToLocalMode"
            class="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Switch to Local Mode
          </button>
          
          <button
            v-if="fallbackOptions?.requireOpenRouterKey"
            @click="showOpenRouterKeyInput"
            class="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Use OpenRouter
          </button>
          
          <button
            @click="closeBudgetModal"
            class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>

    <!-- OpenRouter API Key Input Modal -->
    <div 
      v-if="showApiKeyModal" 
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click="closeApiKeyModal"
    >
      <div 
        class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4"
        @click.stop
      >
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Enter OpenRouter API Key
        </h3>
        
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            API Key
          </label>
          <input
            v-model="apiKeyInput"
            type="password"
            placeholder="sk-or-..."
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Get your API key from <a href="https://openrouter.ai" target="_blank" class="text-blue-600 hover:underline">openrouter.ai</a>
          </p>
        </div>

        <div class="flex space-x-3">
          <button
            @click="saveApiKey"
            :disabled="!apiKeyInput.trim()"
            class="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Save & Continue
          </button>
          
          <button
            @click="closeApiKeyModal"
            class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useAppStore } from '@/stores/appStore';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  XCircleIcon 
} from '@heroicons/vue/24/outline';

const appStore = useAppStore();

// Local state
const showBudgetExceededModal = ref(false);
const showApiKeyModal = ref(false);
const apiKeyInput = ref('');

// Computed properties
const showBudgetStatus = computed(() => {
  return appStore.deploymentMode === 'cloud' && appStore.budgetStatus;
});

const currentSpending = computed(() => appStore.budgetStatus?.currentSpending || 0);
const budgetLimit = computed(() => appStore.budgetStatus?.budgetLimit || 15);
const percentageUsed = computed(() => appStore.budgetStatus?.percentageUsed || 0);
const budgetStatus = computed(() => appStore.budgetStatus?.status || 'ok');
const fallbackOptions = computed(() => appStore.fallbackOptions);

const budgetStatusClass = computed(() => {
  switch (budgetStatus.value) {
    case 'exceeded':
      return 'border-red-500 bg-red-50 dark:bg-red-900/20';
    case 'critical':
      return 'border-orange-500 bg-orange-50 dark:bg-orange-900/20';
    case 'warning':
      return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
    default:
      return 'border-green-500 bg-green-50 dark:bg-green-900/20';
  }
});

const budgetIconClass = computed(() => {
  switch (budgetStatus.value) {
    case 'exceeded':
      return 'text-red-600 dark:text-red-400';
    case 'critical':
      return 'text-orange-600 dark:text-orange-400';
    case 'warning':
      return 'text-yellow-600 dark:text-yellow-400';
    default:
      return 'text-green-600 dark:text-green-400';
  }
});

const budgetIcon = computed(() => {
  switch (budgetStatus.value) {
    case 'exceeded':
      return XCircleIcon;
    case 'critical':
    case 'warning':
      return ExclamationTriangleIcon;
    default:
      return CheckCircleIcon;
  }
});

const progressBarClass = computed(() => {
  switch (budgetStatus.value) {
    case 'exceeded':
      return 'bg-red-500';
    case 'critical':
      return 'bg-orange-500';
    case 'warning':
      return 'bg-yellow-500';
    default:
      return 'bg-green-500';
  }
});

const statusMessage = computed(() => {
  switch (budgetStatus.value) {
    case 'exceeded':
      return 'Budget exceeded - services disabled';
    case 'critical':
      return 'Critical: Approaching budget limit';
    case 'warning':
      return 'Warning: Monitor usage closely';
    default:
      return 'Budget within limits';
  }
});

const statusMessageClass = computed(() => {
  switch (budgetStatus.value) {
    case 'exceeded':
      return 'text-red-600 dark:text-red-400';
    case 'critical':
      return 'text-orange-600 dark:text-orange-400';
    case 'warning':
      return 'text-yellow-600 dark:text-yellow-400';
    default:
      return 'text-green-600 dark:text-green-400';
  }
});

// Watch for budget exceeded state
watch(() => appStore.budgetExceeded, (exceeded) => {
  if (exceeded) {
    showBudgetExceededModal.value = true;
  }
});

// Methods
const closeBudgetModal = () => {
  showBudgetExceededModal.value = false;
};

const switchToLocalMode = async () => {
  try {
    await appStore.setDeploymentMode('local');
    appStore.clearBudgetExceeded();
    closeBudgetModal();
  } catch (error) {
    console.error('Failed to switch to local mode:', error);
  }
};

const showOpenRouterKeyInput = () => {
  showBudgetExceededModal.value = false;
  showApiKeyModal.value = true;
  apiKeyInput.value = localStorage.getItem('openrouter-api-key') || '';
};

const closeApiKeyModal = () => {
  showApiKeyModal.value = false;
  apiKeyInput.value = '';
};

const saveApiKey = () => {
  if (apiKeyInput.value.trim()) {
    localStorage.setItem('openrouter-api-key', apiKeyInput.value.trim());
    appStore.clearBudgetExceeded();
    closeApiKeyModal();
    
    // Reinitialize AI service with new API key
    appStore.initializeApp();
  }
};
</script>

<style scoped>
.budget-status-container {
  @apply relative;
}

.budget-status-card {
  @apply border rounded-lg p-3 transition-all duration-200;
}

.budget-progress-bar {
  @apply w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-2;
}

.budget-progress-fill {
  @apply h-1.5 rounded-full transition-all duration-300;
}

.budget-icon {
  @apply flex items-center justify-center;
}
</style>