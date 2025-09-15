<template>
  <div class="visual-display-container">
    <!-- Visual Display Component with KaijuDisplay -->
    <div 
      v-if="hasActiveDisplay"
      class="visual-display p-3 flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 transition-all duration-300"
    >
      <div class="image-container relative w-full h-24 flex items-center justify-center">
        <ErrorBoundary
          error-title="Image Display Error"
          error-message="Failed to load the character image"
          :show-reload="false"
        >
          <KaijuDisplay
            :kaiju-type="currentKaijuType"
            :team-role="currentTeamRole"
            image-size="small"
          />
        </ErrorBoundary>
        
        <!-- Loading placeholder -->
        <LoadingState
          v-if="isImageLoading"
          type="skeleton"
          size="sm"
          class="absolute inset-0 bg-gray-100 dark:bg-gray-600 rounded"
        />
      </div>
    </div>
    
    <!-- Empty state when no image -->
    <div 
      v-else
      class="visual-display-empty p-3 flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 opacity-50"
    >
      <div class="text-center text-gray-400 dark:text-gray-500">
        <div class="text-2xl mb-1">🦖</div>
        <div class="text-xs">Select Challenge</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useChallengeStore } from '@/stores/challengeStore'
import { useAppStore } from '@/stores/appStore'
import type { KaijuType } from '@/types/kaiju'
import type { TeamRole } from '@/types/team'
import KaijuDisplay from '@/components/kaiju/KaijuDisplay.vue'
import ErrorBoundary from '@/components/common/ErrorBoundary.vue'
import LoadingState from '@/components/common/LoadingState.vue'

// Stores
const challengeStore = useChallengeStore()
const appStore = useAppStore()

// Store refs
const { currentChallenge } = storeToRefs(challengeStore)
const { selectedTeamMember } = storeToRefs(appStore)

// Local state
const isImageLoading = ref(false)

// Computed properties
const currentKaijuType = computed(() => {
  // Only show Kaiju if no team member is selected
  if (!selectedTeamMember.value && currentChallenge.value?.kaiju?.type) {
    return currentChallenge.value.kaiju.type as KaijuType
  }
  return null
})

const currentTeamRole = computed(() => {
  // Team member takes priority over Kaiju
  return selectedTeamMember.value || null
})

const hasActiveDisplay = computed(() => {
  return currentKaijuType.value || currentTeamRole.value
})

// Methods
const triggerImageTransition = () => {
  isImageLoading.value = true
  
  // Reset loading state after a brief delay
  setTimeout(() => {
    isImageLoading.value = false
  }, 300)
}

// Watch for challenge changes to show Kaiju image
watch(currentChallenge, (newChallenge) => {
  if (newChallenge && !selectedTeamMember.value) {
    triggerImageTransition()
  }
}, { immediate: false })

// Watch for team member selection to show team member image
watch(selectedTeamMember, (newTeamMember) => {
  if (newTeamMember) {
    triggerImageTransition()
  }
}, { immediate: false })
</script>

<style scoped>
.visual-display-container {
  width: 100%;
  min-height: 96px; /* h-24 equivalent */
}

.visual-display {
  min-height: 96px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.visual-display:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.dark .visual-display:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.image-container img {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.visual-display-empty {
  min-height: 96px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Responsive adjustments */
@media (max-width: 1023px) {
  .visual-display-container {
    min-height: 80px;
  }
  
  .visual-display,
  .visual-display-empty {
    min-height: 80px;
  }
  
  .image-container {
    height: 80px;
  }
}

@media (max-width: 767px) {
  .visual-display-container {
    min-height: 64px;
  }
  
  .visual-display,
  .visual-display-empty {
    min-height: 64px;
  }
  
  .image-container {
    height: 64px;
  }
}
</style>