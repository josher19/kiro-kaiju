<template>
  <div v-if="showBudgetAlert" class="budget-alert" :class="alertClass">
    <div class="budget-alert-content">
      <div class="budget-alert-header">
        <h3 class="budget-alert-title">{{ alertTitle }}</h3>
        <button @click="dismissAlert" class="budget-alert-close" aria-label="Close alert">
          ×
        </button>
      </div>
      
      <div class="budget-alert-body">
        <p class="budget-alert-message">{{ alertMessage }}</p>
        
        <div v-if="budgetStatus" class="budget-progress">
          <div class="budget-progress-bar">
            <div 
              class="budget-progress-fill" 
              :style="{ width: `${Math.min(budgetStatus.percentageUsed, 100)}%` }"
              :class="progressBarClass"
            ></div>
          </div>
          <div class="budget-progress-text">
            ${{ budgetStatus.currentSpending.toFixed(2) }} / ${{ budgetStatus.budgetLimit.toFixed(2) }}
            ({{ budgetStatus.percentageUsed.toFixed(1) }}%)
          </div>
        </div>

        <div v-if="showFallbackOptions" class="budget-fallback-options">
          <h4>Available Options:</h4>
          <div class="fallback-buttons">
            <button 
              v-if="fallbackOptions.switchToLocalMode" 
              @click="switchToLocalMode"
              class="fallback-button local-mode"
            >
              Switch to Local Mode
            </button>
            <button 
              v-if="fallbackOptions.requireOpenRouterKey" 
              @click="showOpenRouterKeyInput = true"
              class="fallback-button openrouter-mode"
            >
              Use OpenRouter API
            </button>
          </div>
        </div>

        <div v-if="showOpenRouterKeyInput" class="openrouter-input">
          <label for="openrouter-key">OpenRouter API Key:</label>
          <input 
            id="openrouter-key"
            v-model="openRouterKey" 
            type="password" 
            placeholder="Enter your OpenRouter API key"
            class="openrouter-key-input"
          />
          <div class="openrouter-buttons">
            <button @click="saveOpenRouterKey" class="save-key-button">Save Key</button>
            <button @click="showOpenRouterKeyInput = false" class="cancel-button">Cancel</button>
          </div>
        </div>

        <div v-if="costOptimizationStrategies.length > 0" class="cost-strategies">
          <h4>Cost Optimization Strategies:</h4>
          <ul>
            <li v-for="strategy in costOptimizationStrategies" :key="strategy">
              {{ strategy }}
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useAppStore } from '../../stores/appStore';
import type { BudgetStatus } from '../../services/cloudService';

interface Props {
  cloudService?: any;
}

const props = defineProps<Props>();
const appStore = useAppStore();

// Reactive state
const showBudgetAlert = ref(false);
const budgetStatus = ref<BudgetStatus | null>(null);
const fallbackOptions = ref<any>({});
const costOptimizationStrategies = ref<string[]>([]);
const showOpenRouterKeyInput = ref(false);
const openRouterKey = ref('');
const alertDismissed = ref(false);

// Computed properties
const alertClass = computed(() => {
  if (!budgetStatus.value) return 'budget-alert-info';
  
  switch (budgetStatus.value.status) {
    case 'exceeded':
      return 'budget-alert-error';
    case 'critical':
      return 'budget-alert-critical';
    case 'warning':
      return 'budget-alert-warning';
    default:
      return 'budget-alert-info';
  }
});

const progressBarClass = computed(() => {
  if (!budgetStatus.value) return 'progress-ok';
  
  if (budgetStatus.value.percentageUsed >= 100) return 'progress-exceeded';
  if (budgetStatus.value.percentageUsed >= 95) return 'progress-critical';
  if (budgetStatus.value.percentageUsed >= 80) return 'progress-warning';
  return 'progress-ok';
});

const alertTitle = computed(() => {
  if (!budgetStatus.value) return 'Budget Status';
  
  switch (budgetStatus.value.status) {
    case 'exceeded':
      return 'Budget Exceeded';
    case 'critical':
      return 'Budget Critical';
    case 'warning':
      return 'Budget Warning';
    default:
      return 'Budget Status';
  }
});

const alertMessage = computed(() => {
  if (!budgetStatus.value) return '';
  
  switch (budgetStatus.value.status) {
    case 'exceeded':
      return `Monthly budget of $${budgetStatus.value.budgetLimit} has been exceeded. AWS services are now disabled. Please switch to local mode or provide an OpenRouter API key to continue.`;
    case 'critical':
      return `Budget usage is at ${budgetStatus.value.percentageUsed.toFixed(1)}%. Services may be automatically disabled soon.`;
    case 'warning':
      return `Budget usage is at ${budgetStatus.value.percentageUsed.toFixed(1)}%. Consider switching to local mode to avoid service interruption.`;
    default:
      return `Budget usage: ${budgetStatus.value.percentageUsed.toFixed(1)}%`;
  }
});

const showFallbackOptions = computed(() => {
  return budgetStatus.value?.status === 'exceeded' || budgetStatus.value?.percentageUsed >= 95;
});

// Methods
const checkBudgetStatus = async () => {
  if (!props.cloudService) return;
  
  try {
    const status = await props.cloudService.getBudgetStatus();
    budgetStatus.value = status;
    
    // Show alert if budget is concerning and not dismissed
    if (!alertDismissed.value && (status.percentageUsed >= 80 || status.status !== 'ok')) {
      showBudgetAlert.value = true;
      
      // Get fallback options if budget is exceeded
      if (status.status === 'exceeded' || status.percentageUsed >= 95) {
        const constraints = await props.cloudService.checkBudgetConstraints();
        fallbackOptions.value = constraints.fallbackOptions;
        
        const strategies = await props.cloudService.getCostOptimizationStrategies();
        costOptimizationStrategies.value = strategies.strategies;
      }
    }
  } catch (error) {
    console.error('Failed to check budget status:', error);
  }
};

const dismissAlert = () => {
  showBudgetAlert.value = false;
  alertDismissed.value = true;
  
  // Auto-show again after 30 minutes if budget is still exceeded
  if (budgetStatus.value?.status === 'exceeded') {
    setTimeout(() => {
      alertDismissed.value = false;
      checkBudgetStatus();
    }, 30 * 60 * 1000);
  }
};

const switchToLocalMode = () => {
  appStore.setDeploymentMode('local');
  showBudgetAlert.value = false;
  
  // Emit event for parent components to handle
  window.dispatchEvent(new CustomEvent('kiro-switch-to-local', {
    detail: { reason: 'budget-exceeded' }
  }));
};

const saveOpenRouterKey = () => {
  if (openRouterKey.value.trim()) {
    localStorage.setItem('openrouter-api-key', openRouterKey.value.trim());
    appStore.setDeploymentMode('remote');
    showBudgetAlert.value = false;
    showOpenRouterKeyInput.value = false;
    
    // Emit event for parent components to handle
    window.dispatchEvent(new CustomEvent('kiro-openrouter-key-saved', {
      detail: { apiKey: openRouterKey.value.trim() }
    }));
  }
};

const handleBudgetExceeded = (event: CustomEvent) => {
  fallbackOptions.value = event.detail.fallbackOptions;
  showBudgetAlert.value = true;
  alertDismissed.value = false;
};

// Lifecycle
onMounted(() => {
  // Check budget status on mount
  checkBudgetStatus();
  
  // Set up periodic budget checking (every 5 minutes)
  const budgetCheckInterval = setInterval(checkBudgetStatus, 5 * 60 * 1000);
  
  // Listen for budget exceeded events
  window.addEventListener('kiro-budget-exceeded', handleBudgetExceeded);
  
  // Cleanup on unmount
  onUnmounted(() => {
    clearInterval(budgetCheckInterval);
    window.removeEventListener('kiro-budget-exceeded', handleBudgetExceeded);
  });
  
  // Load saved OpenRouter key
  const savedKey = localStorage.getItem('openrouter-api-key');
  if (savedKey) {
    openRouterKey.value = savedKey;
  }
});
</script>

<style scoped>
.budget-alert {
  position: fixed;
  top: 20px;
  right: 20px;
  max-width: 400px;
  z-index: 1000;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.budget-alert-info {
  background: #e3f2fd;
  border: 1px solid #2196f3;
  color: #1565c0;
}

.budget-alert-warning {
  background: #fff3e0;
  border: 1px solid #ff9800;
  color: #e65100;
}

.budget-alert-critical {
  background: #ffebee;
  border: 1px solid #f44336;
  color: #c62828;
}

.budget-alert-error {
  background: #ffebee;
  border: 1px solid #d32f2f;
  color: #b71c1c;
}

.budget-alert-content {
  padding: 16px;
}

.budget-alert-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.budget-alert-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.budget-alert-close {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.budget-alert-close:hover {
  background-color: rgba(0, 0, 0, 0.1);
}

.budget-alert-message {
  margin: 0 0 12px 0;
  font-size: 14px;
  line-height: 1.4;
}

.budget-progress {
  margin: 12px 0;
}

.budget-progress-bar {
  width: 100%;
  height: 8px;
  background-color: rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 4px;
}

.budget-progress-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.progress-ok {
  background-color: #4caf50;
}

.progress-warning {
  background-color: #ff9800;
}

.progress-critical {
  background-color: #f44336;
}

.progress-exceeded {
  background-color: #d32f2f;
}

.budget-progress-text {
  font-size: 12px;
  text-align: center;
  opacity: 0.8;
}

.budget-fallback-options {
  margin-top: 16px;
}

.budget-fallback-options h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
}

.fallback-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.fallback-button {
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.local-mode {
  background-color: #4caf50;
  color: white;
}

.local-mode:hover {
  background-color: #45a049;
}

.openrouter-mode {
  background-color: #2196f3;
  color: white;
}

.openrouter-mode:hover {
  background-color: #1976d2;
}

.openrouter-input {
  margin-top: 12px;
  padding: 12px;
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
}

.openrouter-input label {
  display: block;
  margin-bottom: 4px;
  font-size: 12px;
  font-weight: 600;
}

.openrouter-key-input {
  width: 100%;
  padding: 8px;
  border: 1px solid rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  font-size: 12px;
  margin-bottom: 8px;
}

.openrouter-buttons {
  display: flex;
  gap: 8px;
}

.save-key-button {
  padding: 6px 12px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}

.cancel-button {
  padding: 6px 12px;
  background-color: #757575;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}

.cost-strategies {
  margin-top: 12px;
}

.cost-strategies h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
}

.cost-strategies ul {
  margin: 0;
  padding-left: 16px;
  font-size: 12px;
}

.cost-strategies li {
  margin-bottom: 4px;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .budget-alert {
    top: 10px;
    right: 10px;
    left: 10px;
    max-width: none;
  }
  
  .fallback-buttons {
    flex-direction: column;
  }
  
  .fallback-button {
    width: 100%;
  }
}
</style>