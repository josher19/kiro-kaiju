<template>
  <div class="visual-display-container">
    <!-- Visual Display Component -->
    <div 
      v-if="currentImage"
      class="visual-display p-3 flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 transition-all duration-300"
    >
      <div class="image-container relative w-full h-24 flex items-center justify-center">
        <img
          :src="currentImage"
          :alt="currentImageAlt"
          class="max-w-full max-h-full object-contain transition-all duration-500 ease-in-out transform"
          :class="imageTransitionClass"
          @load="handleImageLoad"
          @error="handleImageError"
        />
        
        <!-- Loading placeholder -->
        <div 
          v-if="isImageLoading"
          class="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-600 rounded animate-pulse"
        >
          <div class="text-gray-400 dark:text-gray-500">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
          </div>
        </div>
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

// Stores
const challengeStore = useChallengeStore()
const appStore = useAppStore()

// Store refs
const { currentChallenge } = storeToRefs(challengeStore)
const { selectedTeamMember } = storeToRefs(appStore)

// Local state
const isImageLoading = ref(false)
const imageTransitionClass = ref('')

// Image mappings
const kaijuImageMap: Record<KaijuType, string> = {
  'hydra-bug': '/src/assets/images/kaiju/HydraBug_small.png',
  'complexasaur': '/src/assets/images/kaiju/Complexosaur_small.png',
  'duplicatron': '/src/assets/images/kaiju/Duplicatron_small.png',
  'spaghettizilla': '/src/assets/images/kaiju/Speghettizilla_small.png',
  'memoryleak-odactyl': '/src/assets/images/kaiju/MemoryLeakodactyl_small.png'
}

const teamMemberImageMap: Record<TeamRole, string> = {
  'quality-assurance': '/src/assets/images/team/sqa_sm.png',
  'architect': '/src/assets/images/team/architect_sm.png',
  'product-owner': '/src/assets/images/team/product-owner_sm.png',
  'senior-developer': '/src/assets/images/team/developer_sm.png'
}

// Computed properties
const currentImage = computed(() => {
  // Priority: Team member image over Kaiju image
  if (selectedTeamMember.value) {
    return teamMemberImageMap[selectedTeamMember.value]
  }
  
  // Show Kaiju image when challenge is selected
  if (currentChallenge.value?.kaiju?.type) {
    return kaijuImageMap[currentChallenge.value.kaiju.type as KaijuType]
  }
  
  return null
})

const currentImageAlt = computed(() => {
  if (selectedTeamMember.value) {
    const roleNames: Record<TeamRole, string> = {
      'quality-assurance': 'Quality Assurance Pufferfish',
      'architect': 'Architect Owl',
      'product-owner': 'Product Owner Pig',
      'senior-developer': 'Senior Developer Cat'
    }
    return roleNames[selectedTeamMember.value]
  }
  
  if (currentChallenge.value?.kaiju?.name) {
    return currentChallenge.value.kaiju.name
  }
  
  return 'Visual Display'
})

// Methods
const handleImageLoad = () => {
  isImageLoading.value = false
  imageTransitionClass.value = 'scale-100 opacity-100'
}

const handleImageError = () => {
  isImageLoading.value = false
  console.warn('Failed to load image:', currentImage.value)
}

const triggerImageTransition = () => {
  isImageLoading.value = true
  imageTransitionClass.value = 'scale-95 opacity-0'
  
  // Reset transition class after a brief delay
  setTimeout(() => {
    imageTransitionClass.value = 'scale-100 opacity-100'
  }, 150)
}

// Watch for image changes to trigger smooth transitions
watch(currentImage, (newImage, oldImage) => {
  if (newImage && newImage !== oldImage) {
    triggerImageTransition()
  }
}, { immediate: false })

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