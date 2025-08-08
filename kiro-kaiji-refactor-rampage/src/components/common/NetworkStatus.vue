<template>
  <div 
    v-if="showIndicator" 
    class="network-status"
    :class="statusClasses"
  >
    <div class="status-content">
      <div class="status-icon">
        <!-- Online icon -->
        <svg v-if="networkStatus.isOnline" class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M17.778 8.222c-4.296-4.296-11.26-4.296-15.556 0A1 1 0 01.808 6.808c5.076-5.077 13.308-5.077 18.384 0a1 1 0 01-1.414 1.414zM14.95 11.05a7 7 0 00-9.9 0 1 1 0 01-1.414-1.414 9 9 0 0112.728 0 1 1 0 01-1.414 1.414zM12.12 13.88a3 3 0 00-4.242 0 1 1 0 01-1.415-1.415 5 5 0 017.072 0 1 1 0 01-1.415 1.415zM9 16a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clip-rule="evenodd" />
        </svg>
        
        <!-- Offline icon -->
        <svg v-else class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0zm-2 0a6 6 0 11-12 0 6 6 0 0112 0z" clip-rule="evenodd" />
        </svg>
        
        <!-- Checking icon -->
        <svg v-if="isChecking" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
      
      <div class="status-text">
        <span class="status-label">{{ statusLabel }}</span>
        <span v-if="showDetails" class="status-details">{{ statusDetails }}</span>
      </div>
      
      <div v-if="pendingSync > 0" class="sync-indicator">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
        </svg>
        <span class="sync-count">{{ pendingSync }}</span>
      </div>
    </div>
    
    <!-- Expandable details -->
    <div v-if="expanded" class="status-expanded">
      <div class="network-details">
        <div class="detail-row">
          <span class="detail-label">Connection:</span>
          <span class="detail-value">{{ connectionTypeLabel }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Speed:</span>
          <span class="detail-value">{{ speedLabel }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Quality:</span>
          <span class="detail-value">{{ qualityLabel }}</span>
        </div>
        <div v-if="pendingSync > 0" class="detail-row">
          <span class="detail-label">Pending Sync:</span>
          <span class="detail-value">{{ pendingSync }} items</span>
        </div>
      </div>
      
      <div v-if="!networkStatus.isOnline" class="offline-actions">
        <button @click="checkConnection" class="check-btn" :disabled="isChecking">
          {{ isChecking ? 'Checking...' : 'Check Connection' }}
        </button>
      </div>
    </div>
    
    <!-- Click to expand/collapse -->
    <button 
      v-if="allowExpand"
      @click="toggleExpanded" 
      class="expand-btn"
      :class="{ 'expanded': expanded }"
    >
      <svg class="w-3 h-3 transform transition-transform" 
           :class="{ 'rotate-180': expanded }"
           fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useNetworkStatus } from '@/services/networkService';
import { useOfflineStorage } from '@/services/offlineStorageService';

interface Props {
  position?: 'top' | 'bottom';
  showWhenOnline?: boolean;
  showDetails?: boolean;
  allowExpand?: boolean;
  autoHide?: boolean;
  autoHideDelay?: number;
}

const props = withDefaults(defineProps<Props>(), {
  position: 'top',
  showWhenOnline: false,
  showDetails: true,
  allowExpand: true,
  autoHide: true,
  autoHideDelay: 5000
});

const emit = defineEmits<{
  statusChange: [status: { isOnline: boolean; quality: string }];
  syncComplete: [];
}>();

// Services
const {
  isOnline,
  connectionType,
  effectiveType,
  downlink,
  rtt,
  isChecking,
  networkStatus,
  getNetworkQuality,
  checkConnectivity
} = useNetworkStatus();

const { pendingSync, lastSync } = useOfflineStorage();

// State
const expanded = ref(false);
const hideTimeout = ref<number | null>(null);

// Computed
const showIndicator = computed(() => {
  if (!isOnline.value) return true; // Always show when offline
  if (pendingSync.value > 0) return true; // Show when there's pending sync
  return props.showWhenOnline;
});

const statusClasses = computed(() => ({
  'status-online': isOnline.value,
  'status-offline': !isOnline.value,
  'status-checking': isChecking.value,
  'status-syncing': pendingSync.value > 0,
  'position-top': props.position === 'top',
  'position-bottom': props.position === 'bottom',
  'expanded': expanded.value
}));

const statusLabel = computed(() => {
  if (isChecking.value) return 'Checking connection...';
  if (!isOnline.value) return 'Offline';
  if (pendingSync.value > 0) return 'Syncing...';
  return 'Online';
});

const statusDetails = computed(() => {
  if (!props.showDetails) return '';
  if (!isOnline.value) return 'Working offline';
  
  const quality = getNetworkQuality();
  const qualityLabels = {
    excellent: 'Excellent connection',
    good: 'Good connection',
    fair: 'Fair connection',
    poor: 'Poor connection',
    offline: 'Offline'
  };
  
  return qualityLabels[quality];
});

const connectionTypeLabel = computed(() => {
  const type = connectionType.value;
  const typeLabels = {
    wifi: 'Wi-Fi',
    cellular: 'Cellular',
    ethernet: 'Ethernet',
    unknown: 'Unknown'
  };
  return typeLabels[type];
});

const speedLabel = computed(() => {
  if (!isOnline.value) return 'N/A';
  
  const speed = downlink.value;
  if (speed >= 10) return 'Very Fast';
  if (speed >= 5) return 'Fast';
  if (speed >= 1) return 'Moderate';
  if (speed >= 0.5) return 'Slow';
  return 'Very Slow';
});

const qualityLabel = computed(() => {
  const quality = getNetworkQuality();
  return quality.charAt(0).toUpperCase() + quality.slice(1);
});

// Methods
function toggleExpanded() {
  expanded.value = !expanded.value;
  
  if (expanded.value) {
    clearAutoHide();
  } else {
    scheduleAutoHide();
  }
}

function scheduleAutoHide() {
  if (!props.autoHide || !isOnline.value) return;
  
  clearAutoHide();
  hideTimeout.value = window.setTimeout(() => {
    if (isOnline.value && pendingSync.value === 0) {
      expanded.value = false;
    }
  }, props.autoHideDelay);
}

function clearAutoHide() {
  if (hideTimeout.value) {
    clearTimeout(hideTimeout.value);
    hideTimeout.value = null;
  }
}

async function checkConnection() {
  await checkConnectivity();
}

// Lifecycle
onMounted(() => {
  // Watch for network status changes
  const unwatch = watch(
    () => networkStatus,
    (newStatus, oldStatus) => {
      if (newStatus.isOnline !== oldStatus?.isOnline) {
        emit('statusChange', {
          isOnline: newStatus.isOnline,
          quality: getNetworkQuality()
        });
        
        if (newStatus.isOnline) {
          scheduleAutoHide();
        } else {
          clearAutoHide();
          expanded.value = false;
        }
      }
    },
    { deep: true }
  );
  
  // Watch for sync completion
  const unwatchSync = watch(
    () => pendingSync.value,
    (newCount, oldCount) => {
      if (oldCount && oldCount > 0 && newCount === 0) {
        emit('syncComplete');
        scheduleAutoHide();
      }
    }
  );
  
  // Initial auto-hide schedule
  if (isOnline.value) {
    scheduleAutoHide();
  }
  
  // Cleanup watchers on unmount
  onUnmounted(() => {
    unwatch();
    unwatchSync();
    clearAutoHide();
  });
});

onUnmounted(() => {
  clearAutoHide();
});
</script>

<style scoped>
.network-status {
  @apply fixed left-1/2 transform -translate-x-1/2 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg min-w-64 max-w-sm;
  transition: all 0.3s ease-in-out;
}

.position-top {
  @apply top-4;
}

.position-bottom {
  @apply bottom-4;
}

.status-online {
  @apply border-green-200 dark:border-green-600;
}

.status-offline {
  @apply border-red-200 dark:border-red-600;
}

.status-checking {
  @apply border-yellow-200 dark:border-yellow-600;
}

.status-syncing {
  @apply border-blue-200 dark:border-blue-600;
}

.status-content {
  @apply flex items-center p-3;
}

.status-icon {
  @apply flex-shrink-0 mr-3;
}

.status-online .status-icon {
  @apply text-green-500;
}

.status-offline .status-icon {
  @apply text-red-500;
}

.status-checking .status-icon {
  @apply text-yellow-500;
}

.status-syncing .status-icon {
  @apply text-blue-500;
}

.status-text {
  @apply flex-1 min-w-0;
}

.status-label {
  @apply block font-medium text-gray-900 dark:text-white text-sm;
}

.status-details {
  @apply block text-xs text-gray-500 dark:text-gray-400 mt-1;
}

.sync-indicator {
  @apply flex items-center ml-2 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full text-xs;
}

.sync-count {
  @apply ml-1 font-medium;
}

.status-expanded {
  @apply border-t border-gray-200 dark:border-gray-600 p-3;
}

.network-details {
  @apply space-y-2 mb-3;
}

.detail-row {
  @apply flex justify-between text-sm;
}

.detail-label {
  @apply text-gray-500 dark:text-gray-400;
}

.detail-value {
  @apply text-gray-900 dark:text-white font-medium;
}

.offline-actions {
  @apply flex justify-center;
}

.check-btn {
  @apply px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm rounded-md font-medium transition-colors;
}

.expand-btn {
  @apply absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors;
}

.expand-btn.expanded {
  @apply text-gray-600 dark:text-gray-300;
}

/* Mobile responsiveness */
@media (max-width: 640px) {
  .network-status {
    @apply left-4 right-4 transform-none translate-x-0 max-w-none;
  }
}

/* Animation for showing/hiding */
.network-status {
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

.position-bottom.network-status {
  animation: slideInBottom 0.3s ease-out;
}

@keyframes slideInBottom {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}
</style>