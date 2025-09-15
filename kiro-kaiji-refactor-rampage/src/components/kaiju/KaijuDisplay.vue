<template>
  <div class="kaiju-display">
    <!-- Small Kaiju Image (clickable) -->
    <div 
      v-if="currentImage"
      class="kaiju-thumbnail cursor-pointer transition-all duration-300 hover:scale-105"
      @click="showFullImage"
      @keydown.enter="showFullImage"
      @keydown.space="showFullImage"
      tabindex="0"
      role="button"
      :aria-label="`View full size ${currentImageAlt}`"
    >
      <img
        :src="currentImage"
        :alt="currentImageAlt"
        class="w-full h-full object-contain rounded-lg"
        @error="handleImageError"
      />
    </div>

    <!-- Full Size Image Modal -->
    <Teleport to="body">
      <div
        v-if="isFullImageVisible"
        class="kaiju-modal fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm"
        @click="hideFullImage"
        @keydown.esc="hideFullImage"
        tabindex="0"
        role="dialog"
        aria-modal="true"
        :aria-label="`Full size view of ${currentImageAlt}`"
      >
        <div class="modal-content relative max-w-4xl max-h-screen p-4">
          <!-- Close button -->
          <button
            class="absolute top-2 right-2 z-10 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 transition-all duration-200"
            @click.stop="hideFullImage"
            aria-label="Close full size image"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>

          <!-- Full size image -->
          <img
            v-if="fullSizeImage"
            :src="fullSizeImage"
            :alt="currentImageAlt"
            class="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            @click.stop
            @error="handleFullImageError"
          />

          <!-- Loading state -->
          <div 
            v-if="isFullImageLoading"
            class="flex items-center justify-center w-96 h-96 bg-gray-800 rounded-lg"
          >
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>

          <!-- Error state -->
          <div 
            v-if="fullImageError"
            class="flex flex-col items-center justify-center w-96 h-96 bg-gray-800 rounded-lg text-white"
          >
            <svg class="w-16 h-16 mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
            <p class="text-center">Failed to load full size image</p>
          </div>

          <!-- Instructions -->
          <div class="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm bg-black bg-opacity-50 px-3 py-1 rounded">
            Click anywhere to close
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import type { KaijuType } from '@/types/kaiju'
import type { TeamRole } from '@/types/team'

// Props
interface Props {
  kaijuType?: KaijuType | null
  teamRole?: TeamRole | null
  imageSize?: 'small' | 'medium' | 'large'
}

const props = withDefaults(defineProps<Props>(), {
  kaijuType: null,
  teamRole: null,
  imageSize: 'small'
})

// Local state
const isFullImageVisible = ref(false)
const isFullImageLoading = ref(false)
const fullImageError = ref(false)

// Image mappings
const kaijuImageMap: Record<KaijuType, { small: string; full: string }> = {
  'hydra-bug': {
    small: '/src/assets/images/kaiju/HydraBug_small.png',
    full: '/src/assets/images/kaiju/HydraBug.png'
  },
  'complexasaur': {
    small: '/src/assets/images/kaiju/Complexosaur_small.png',
    full: '/src/assets/images/kaiju/Complexosaur.png'
  },
  'duplicatron': {
    small: '/src/assets/images/kaiju/Duplicatron_small.png',
    full: '/src/assets/images/kaiju/Duplicatron.png'
  },
  'spaghettizilla': {
    small: '/src/assets/images/kaiju/Speghettizilla_small.png',
    full: '/src/assets/images/kaiju/Speghettizilla.png'
  },
  'memoryleak-odactyl': {
    small: '/src/assets/images/kaiju/MemoryLeakodactyl_small.png',
    full: '/src/assets/images/kaiju/MemoryLeakodactyl.png'
  }
}

const teamMemberImageMap: Record<TeamRole, { small: string; full: string }> = {
  'quality-assurance': {
    small: '/src/assets/images/team/sqa_sm.png',
    full: '/src/assets/images/team/sqa.png'
  },
  'architect': {
    small: '/src/assets/images/team/architect_sm.png',
    full: '/src/assets/images/team/architect.png'
  },
  'product-owner': {
    small: '/src/assets/images/team/product-owner_sm.png',
    full: '/src/assets/images/team/product-owner.png'
  },
  'senior-developer': {
    small: '/src/assets/images/team/developer_sm.png',
    full: '/src/assets/images/team/developer.png'
  }
}

// Computed properties
const currentImage = computed(() => {
  if (props.teamRole) {
    return teamMemberImageMap[props.teamRole]?.small
  }
  
  if (props.kaijuType) {
    return kaijuImageMap[props.kaijuType]?.small
  }
  
  return null
})

const fullSizeImage = computed(() => {
  if (props.teamRole) {
    return teamMemberImageMap[props.teamRole]?.full
  }
  
  if (props.kaijuType) {
    return kaijuImageMap[props.kaijuType]?.full
  }
  
  return null
})

const currentImageAlt = computed(() => {
  if (props.teamRole) {
    const roleNames: Record<TeamRole, string> = {
      'quality-assurance': 'Quality Assurance Pufferfish',
      'architect': 'Architect Owl',
      'product-owner': 'Product Owner Pig',
      'senior-developer': 'Senior Developer Cat'
    }
    return roleNames[props.teamRole]
  }
  
  if (props.kaijuType) {
    const kaijuNames: Record<KaijuType, string> = {
      'hydra-bug': 'HydraBug',
      'complexasaur': 'Complexasaur',
      'duplicatron': 'Duplicatron',
      'spaghettizilla': 'Spaghettizilla',
      'memoryleak-odactyl': 'MemoryLeak-odactyl'
    }
    return kaijuNames[props.kaijuType]
  }
  
  return 'Character'
})

// Methods
const showFullImage = () => {
  if (!fullSizeImage.value) return
  
  isFullImageVisible.value = true
  isFullImageLoading.value = true
  fullImageError.value = false
  
  // Preload the full size image
  const img = new Image()
  img.onload = () => {
    isFullImageLoading.value = false
  }
  img.onerror = () => {
    isFullImageLoading.value = false
    fullImageError.value = true
  }
  img.src = fullSizeImage.value
}

const hideFullImage = () => {
  isFullImageVisible.value = false
  isFullImageLoading.value = false
  fullImageError.value = false
}

const handleImageError = (event: Event) => {
  console.warn('Failed to load thumbnail image:', currentImage.value)
  const img = event.target as HTMLImageElement
  img.style.display = 'none'
}

const handleFullImageError = () => {
  fullImageError.value = true
  isFullImageLoading.value = false
}

// Keyboard event handler for modal
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && isFullImageVisible.value) {
    hideFullImage()
  }
}

// Lifecycle
onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})

// Watch for prop changes to reset error state
watch([() => props.kaijuType, () => props.teamRole], () => {
  fullImageError.value = false
})
</script>

<style scoped>
.kaiju-display {
  width: 100%;
  height: 100%;
}

.kaiju-thumbnail {
  width: 100%;
  height: 100%;
  border-radius: 0.5rem;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.kaiju-thumbnail:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.kaiju-thumbnail:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

.kaiju-modal {
  animation: fadeIn 0.3s ease-out;
}

.modal-content {
  animation: scaleIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Mobile optimizations */
@media (max-width: 768px) {
  .modal-content {
    padding: 1rem;
    max-width: 95vw;
    max-height: 95vh;
  }
  
  .kaiju-thumbnail:hover {
    transform: scale(1.02);
  }
}

/* Touch device optimizations */
@media (hover: none) and (pointer: coarse) {
  .kaiju-thumbnail:hover {
    transform: none;
    box-shadow: none;
  }
  
  .kaiju-thumbnail:active {
    transform: scale(0.98);
  }
}
</style>