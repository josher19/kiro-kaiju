<template>
  <div class="main-layout min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
    <!-- Mobile Header -->
    <header class="lg:hidden bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div class="flex items-center justify-between px-4 py-3">
        <div class="flex items-center space-x-3">
          <div class="text-2xl">🦖</div>
          <div>
            <h1 class="text-lg font-bold text-gray-900 dark:text-white">Kiro Kaiju</h1>
            <p class="text-xs text-gray-500 dark:text-gray-400">Refactor Rampage</p>
          </div>
        </div>
        
        <!-- Mobile Menu Button -->
        <button
          @click="toggleMobileMenu"
          class="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          :class="{ 'bg-gray-100 dark:bg-gray-700': isMobileMenuOpen }"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path 
              v-if="!isMobileMenuOpen"
              stroke-linecap="round" 
              stroke-linejoin="round" 
              stroke-width="2" 
              d="M4 6h16M4 12h16M4 18h16"
            />
            <path 
              v-else
              stroke-linecap="round" 
              stroke-linejoin="round" 
              stroke-width="2" 
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
      
      <!-- Mobile Navigation Menu -->
      <div 
        v-show="isMobileMenuOpen"
        class="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
      >
        <nav class="px-4 py-3 space-y-2">
          <button
            v-for="view in navigationViews"
            :key="view.id"
            @click="navigateToView(view.id)"
            class="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors"
            :class="currentView === view.id 
              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'"
          >
            <span class="text-lg">{{ view.icon }}</span>
            <span class="font-medium">{{ view.label }}</span>
          </button>
        </nav>
      </div>
    </header>

    <div class="flex h-screen lg:h-auto">
      <!-- Desktop Sidebar -->
      <aside class="hidden lg:flex lg:flex-col lg:w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
        <!-- Logo -->
        <div class="flex items-center space-x-3 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div class="text-3xl">🦖</div>
          <div>
            <h1 class="text-xl font-bold text-gray-900 dark:text-white">Kiro Kaiju</h1>
            <p class="text-sm text-gray-500 dark:text-gray-400">Refactor Rampage</p>
          </div>
        </div>
        
        <!-- Navigation -->
        <nav class="flex-1 px-4 py-6 space-y-2">
          <button
            v-for="view in navigationViews"
            :key="view.id"
            @click="navigateToView(view.id)"
            class="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors"
            :class="currentView === view.id 
              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'"
          >
            <span class="text-lg">{{ view.icon }}</span>
            <span class="font-medium">{{ view.label }}</span>
          </button>
        </nav>
        
        <!-- Visual Display Component -->
        <div class="px-4 py-3">
          <VisualDisplay />
        </div>
        
        <!-- Deployment Mode Switcher -->
        <div class="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          <div class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Deployment Mode</div>
          <div class="flex space-x-2">
            <button
              @click="switchToCloudMode"
              :class="deploymentMode === 'cloud' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'"
              class="flex-1 px-2 py-1 rounded text-xs font-medium transition-colors"
            >
              ☁️ Cloud
            </button>
            <button
              @click="switchToLocalMode"
              :class="deploymentMode === 'local' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'"
              class="flex-1 px-2 py-1 rounded text-xs font-medium transition-colors"
            >
              🏠 Local
            </button>
          </div>
          <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {{ deploymentMode === 'local' ? 'Kiro IDE Integration' : 'AWS Cloud Services' }}
          </div>
        </div>

        <!-- Budget Status -->
        <div class="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          <BudgetStatus />
        </div>

        <!-- User Progress Summary -->
        <div class="px-4 py-4 border-t border-gray-200 dark:border-gray-700">
          <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Level {{ currentLevel }}</span>
              <span class="text-xs text-gray-500 dark:text-gray-400">{{ totalAchievements }} 🏆</span>
            </div>
            <div class="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
              <div 
                class="bg-blue-500 h-2 rounded-full transition-all duration-300"
                :style="{ width: `${nextLevelProgress}%` }"
              ></div>
            </div>
          </div>
        </div>
      </aside>

      <!-- Main Content Area -->
      <main class="flex-1 flex flex-col lg:flex-row min-h-0">
        <!-- Primary Content -->
        <div class="flex-1 flex flex-col min-h-0">
          <!-- Loading State -->
          <div v-if="isLoading" class="flex-1 flex items-center justify-center">
            <div class="text-center">
              <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p class="text-gray-600 dark:text-gray-400">{{ loadingMessage }}</p>
            </div>
          </div>
          
          <!-- Error State -->
          <div v-else-if="error" class="flex-1 flex items-center justify-center">
            <div class="text-center max-w-md mx-auto px-4">
              <div class="text-6xl mb-4">😵</div>
              <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">Something went wrong</h2>
              <p class="text-gray-600 dark:text-gray-400 mb-4">{{ error }}</p>
              <button
                @click="retryOperation"
                class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
          
          <!-- View Content -->
          <div v-else class="flex-1 flex flex-col min-h-0">
            <!-- Challenge Selection View -->
            <div v-if="currentView === 'challenges'" class="flex-1 p-4 lg:p-6">
              <div class="max-w-4xl mx-auto">
                <div class="mb-6">
                  <h2 class="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Choose Your Challenge
                  </h2>
                  <p class="text-gray-600 dark:text-gray-400">
                    Select a Kaiju monster to battle and improve your coding skills
                  </p>
                </div>
                <ChallengeSelector 
                  @challenge-generated="handleChallengeGenerated" 
                  @challenge-selected="handleChallengeSelected" 
                />
              </div>
            </div>
            
            <!-- Coding View -->
            <div v-else-if="currentView === 'coding'" class="flex-1 flex flex-col lg:flex-row min-h-0">
              <!-- Code Editor Area -->
              <div class="flex-1 flex flex-col min-h-0 bg-white dark:bg-gray-800">
                <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                  <div class="flex items-center space-x-3">
                    <div class="text-2xl">{{ currentChallenge?.kaiju.avatar || '🦖' }}</div>
                    <div>
                      <h3 class="font-semibold text-gray-900 dark:text-white">
                        {{ currentChallenge?.kaiju.name || 'No Challenge Selected' }}
                      </h3>
                      <p class="text-sm text-gray-500 dark:text-gray-400">
                        {{ currentChallenge?.config.language || 'Select a challenge to start coding' }}
                      </p>
                      <p v-if="currentChallenge?.description" class="text-xs text-gray-600 dark:text-gray-300 mt-1">
                        {{ currentChallenge.description }}
                      </p>
                    </div>
                  </div>
                  
                  <!-- Mobile Panel Toggles -->
                  <div class="flex space-x-2 lg:hidden">
                    <button
                      @click="toggleAIPanel"
                      class="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      :class="{ 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400': isAIPanelOpen }"
                    >
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.959 8.959 0 01-4.906-1.471L3 21l2.471-5.094A8.959 8.959 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z"></path>
                      </svg>
                    </button>
                    <button
                      @click="toggleZoomPanel"
                      class="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      :class="{ 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400': isZoomPanelOpen }"
                    >
                      <span class="text-sm">🎥</span>
                    </button>
                  </div>
                </div>
                
                <!-- Challenge Description (if available) -->
                <div v-if="currentChallenge?.description" class="px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
                  <div class="flex items-start space-x-3">
                    <div class="text-blue-500 dark:text-blue-400 mt-0.5">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                    </div>
                    <div class="flex-1">
                      <h4 class="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">Challenge Description</h4>
                      <p class="text-sm text-blue-800 dark:text-blue-200">{{ currentChallenge.description }}</p>
                    </div>
                  </div>
                </div>

                <!-- Code Editor -->
                <div class="flex-1 min-h-0">
                  <CodeEditor
                    v-if="currentChallenge"
                    :model-value="currentCode"
                    :language="getEditorLanguage(currentChallenge.config.language)"
                    :theme="isDarkMode ? 'dark' : 'light'"
                    :show-grading-button="true"
                    :is-grading-in-progress="isGradingInProgress"
                    @update:model-value="handleCodeChange"
                    @submit-for-grading="handleSubmitForGrading"
                  />
                  <div v-else class="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                    <div class="text-center">
                      <div class="text-6xl mb-4">🦖</div>
                      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Ready to Battle?
                      </h3>
                      <p class="text-gray-600 dark:text-gray-400 mb-4">
                        Select a challenge to start coding
                      </p>
                      <button
                        @click="navigateToView('challenges')"
                        class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        Choose Challenge
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Side Panels (Desktop) -->
              <div class="hidden lg:flex lg:w-96 lg:flex-col lg:border-l lg:border-gray-200 lg:dark:border-gray-700">
                <!-- AI Chat Panel -->
                <div class="flex-1 min-h-0">
                  <AIChatInterface
                    v-if="currentChallenge && challengeContext"
                    :challenge-context="challengeContext"
                    :user-id="userId"
                  />
                </div>
                
                <!-- Zoom-a-Friend Panel -->
                <div class="h-80 border-t border-gray-200 dark:border-gray-700">
                  <ZoomAFriendPanel
                    v-if="currentChallenge"
                    :challenge-id="currentChallenge.id"
                    :current-code="currentCode"
                    :requirements="currentChallenge.requirements.map(r => r.description)"
                  />
                </div>
              </div>
            </div>
            
            <!-- Progress View -->
            <div v-else-if="currentView === 'progress'" class="flex-1 p-4 lg:p-6">
              <div class="max-w-6xl mx-auto">
                <div class="mb-6">
                  <h2 class="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Your Progress
                  </h2>
                  <p class="text-gray-600 dark:text-gray-400">
                    Track your achievements and improvement over time
                  </p>
                </div>
                <ProgressTracker />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
    
    <!-- Mobile Panels Overlay -->
    <div
      v-if="(isAIPanelOpen || isZoomPanelOpen) && isMobile"
      class="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
      @click="closeMobilePanels"
    ></div>
    
    <!-- Mobile AI Panel -->
    <div
      v-if="isAIPanelOpen && isMobile"
      class="fixed inset-x-0 bottom-0 top-16 bg-white dark:bg-gray-800 z-50 lg:hidden transform transition-transform duration-300"
      :class="isAIPanelOpen ? 'translate-y-0' : 'translate-y-full'"
    >
      <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <h3 class="font-semibold text-gray-900 dark:text-white">AI Assistant</h3>
        <button
          @click="toggleAIPanel"
          class="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
      <div class="flex-1 min-h-0">
        <AIChatInterface
          v-if="currentChallenge && challengeContext"
          :challenge-context="challengeContext"
          :user-id="userId"
        />
      </div>
    </div>
    
    <!-- Mobile Zoom Panel -->
    <div
      v-if="isZoomPanelOpen && isMobile"
      class="fixed inset-x-0 bottom-0 top-16 bg-white dark:bg-gray-800 z-50 lg:hidden transform transition-transform duration-300"
      :class="isZoomPanelOpen ? 'translate-y-0' : 'translate-y-full'"
    >
      <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <h3 class="font-semibold text-gray-900 dark:text-white">Zoom-a-Friend</h3>
        <button
          @click="toggleZoomPanel"
          class="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
      <div class="flex-1 min-h-0 p-4">
        <ZoomAFriendPanel
          v-if="currentChallenge"
          :challenge-id="currentChallenge.id"
          :current-code="currentCode"
          :requirements="currentChallenge.requirements.map(r => r.description)"
        />
      </div>
    </div>
    
    <!-- Grading Results Modal -->
    <div
      v-if="showGradingResults && gradingResults"
      class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      @click.self="showGradingResults = false"
    >
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <GradingResults
          :results="gradingResults"
          @close="showGradingResults = false"
          @save-to-history="handleSaveGradingToHistory"
          @view-history="handleViewGradingHistory"
        />
      </div>
    </div>
    
    <!-- Achievement Notification -->
    <AchievementNotification
      :achievement="currentAchievement"
      @close="handleAchievementClose"
    />
    
    <!-- Budget Manager -->
    <BudgetManager
      v-if="deploymentMode === 'cloud'"
      :cloud-service="cloudService"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useAppStore } from '@/stores/appStore'
import { useChallengeStore } from '@/stores/challengeStore'
import { useUserProgressStore } from '@/stores/userProgressStore'
import ChallengeSelector from '@/components/challenge/ChallengeSelector.vue'
import CodeEditor from '@/components/challenge/CodeEditor.vue'
import AIChatInterface from '@/components/ai/AIChatInterface.vue'
import ZoomAFriendPanel from '@/components/ai/ZoomAFriendPanel.vue'
import ProgressTracker from '@/components/progress/ProgressTracker.vue'
import GradingResults from '@/components/challenge/GradingResults.vue'
import VisualDisplay from '@/components/common/VisualDisplay.vue'
import AchievementNotification from '@/components/progress/AchievementNotification.vue'
import BudgetStatus from '@/components/common/BudgetStatus.vue'
import BudgetManager from '@/components/common/BudgetManager.vue'
import type { Challenge, ChallengeContext } from '@/types'
import type { AIGradingResponse } from '@/types/api'
import { ProgrammingLanguage } from '@/types'

// Stores
const appStore = useAppStore()
const challengeStore = useChallengeStore()
const progressStore = useUserProgressStore()

// Store refs
const { 
  currentView, 
  isMobile, 
  isMobileMenuOpen, 
  isAIPanelOpen, 
  isZoomPanelOpen, 
  isDarkMode,
  isLoading,
  error,
  loadingMessage,
  deploymentMode
} = storeToRefs(appStore)

const { currentChallenge } = storeToRefs(challengeStore)
const { currentLevel, nextLevelProgress, totalAchievements } = storeToRefs(progressStore)

// Local state
const currentCode = ref('')
const userId = ref('demo-user')
const isGradingInProgress = ref(false)
const gradingResults = ref<AIGradingResponse | null>(null)
const showGradingResults = ref(false)
const currentAchievement = ref<any>(null)
const cloudService = ref<any>(null)

// Navigation configuration
const navigationViews = [
  { id: 'challenges', label: 'Challenges', icon: '🎯' },
  { id: 'coding', label: 'Code Editor', icon: '💻' },
  { id: 'progress', label: 'Progress', icon: '📊' }
]

// Computed properties
const challengeContext = computed((): ChallengeContext | null => {
  if (!currentChallenge.value) return null
  
  return {
    challenge: currentChallenge.value,
    currentCode: currentCode.value,
    attempts: 0,
    startTime: new Date(),
    lastModified: new Date()
  }
})

// Methods
const toggleMobileMenu = () => {
  appStore.toggleMobileMenu()
}

const closeMobilePanels = () => {
  appStore.closeMobilePanels()
}

const toggleAIPanel = () => {
  appStore.toggleAIPanel()
}

const toggleZoomPanel = () => {
  appStore.toggleZoomPanel()
}

const navigateToView = (viewId: string) => {
  appStore.setCurrentView(viewId as any)
}

const handleChallengeGenerated = (challenge: Challenge) => {
  currentCode.value = challenge.initialCode
  // Clear selected team member to show Kaiju image
  appStore.clearSelectedTeamMember()
  appStore.setCurrentView('coding')
}

const handleChallengeSelected = (challenge: Challenge) => {
  currentCode.value = challenge.initialCode
  // Clear selected team member to show Kaiju image
  appStore.clearSelectedTeamMember()
  appStore.setCurrentView('coding')
}

const handleCodeChange = (code: string) => {
  currentCode.value = code
}

const getEditorLanguage = (language: ProgrammingLanguage): string => {
  const languageMap: Record<ProgrammingLanguage, string> = {
    [ProgrammingLanguage.JAVASCRIPT]: 'javascript',
    [ProgrammingLanguage.TYPESCRIPT]: 'typescript',
    [ProgrammingLanguage.PYTHON]: 'python',
    [ProgrammingLanguage.JAVA]: 'java',
    [ProgrammingLanguage.CSHARP]: 'csharp',
    [ProgrammingLanguage.CPP]: 'cpp',
    [ProgrammingLanguage.GO]: 'go',
    [ProgrammingLanguage.RUST]: 'rust'
  }
  return languageMap[language] || 'javascript'
}

const retryOperation = () => {
  appStore.clearError()
  // Implement retry logic based on current view
}

const switchToCloudMode = () => {
  appStore.setDeploymentMode('cloud')
}

const switchToLocalMode = () => {
  appStore.setDeploymentMode('local')
}

const handleSubmitForGrading = async () => {
  if (!currentChallenge.value || !currentCode.value.trim()) {
    appStore.setError('Please write some code before submitting for grading')
    return
  }

  isGradingInProgress.value = true
  appStore.setLoading(true, 'Submitting code for AI grading...')

  try {
    // Import the AI grading service
    const { getAIGradingService } = await import('@/services/aiGradingService')
    const gradingService = getAIGradingService()

    // Submit code for grading
    const result = await gradingService.submitForGrading(
      currentChallenge.value.id,
      currentCode.value,
      currentChallenge.value,
      userId.value
    )

    if (result.success) {
      // Process grading results in user progress store
      const progressResult = await progressStore.processGradingResults(result)
      
      if (progressResult) {
        // Update challenge completion stats
        progressStore.updateKaijuDefeated(currentChallenge.value.kaiju.type)
        progressStore.updateCategoryCompleted(currentChallenge.value.config.category)
        
        // Show any new achievements
        if (progressResult.newAchievements.length > 0) {
          console.log('New achievements unlocked:', progressResult.newAchievements)
          // Show the first new achievement in notification
          currentAchievement.value = progressResult.newAchievements[0]
        }
        
        // Show encouragement messages
        if (progressResult.encouragements.length > 0) {
          console.log('Encouragement:', progressResult.encouragements)
        }
      }
      
      // Store grading results and show modal
      gradingResults.value = result
      showGradingResults.value = true
      console.log('Grading completed successfully:', result)
    } else {
      appStore.setError(result.error || 'Failed to grade code')
    }
  } catch (error) {
    console.error('Grading failed:', error)
    appStore.setError('Failed to submit code for grading. Please try again.')
  } finally {
    isGradingInProgress.value = false
    appStore.setLoading(false)
  }
}

const handleSaveGradingToHistory = () => {
  // The grading service already saves to history automatically
  // Navigate to progress page to show the saved results
  showGradingResults.value = false
  navigateToView('progress')
  console.log('Grading results saved to your progress history!')
}

const handleViewGradingHistory = () => {
  // Navigate to progress view to see grading history
  showGradingResults.value = false
  navigateToView('progress')
}

const handleAchievementClose = () => {
  currentAchievement.value = null
}



const handleResize = () => {
  appStore.setMobile(window.innerWidth < 1024)
}

// Touch/swipe gesture handling
let touchStartX = 0
let touchStartY = 0

const handleTouchStart = (event: TouchEvent) => {
  touchStartX = event.touches[0].clientX
  touchStartY = event.touches[0].clientY
}

const handleTouchEnd = (event: TouchEvent) => {
  if (!isMobile.value) return
  
  const touchEndX = event.changedTouches[0].clientX
  const touchEndY = event.changedTouches[0].clientY
  const deltaX = touchEndX - touchStartX
  const deltaY = touchEndY - touchStartY
  
  // Only handle horizontal swipes that are longer than vertical
  if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
    if (deltaX > 0 && touchStartX < 50) {
      // Swipe right from left edge - open mobile menu
      appStore.toggleMobileMenu()
    } else if (deltaX < 0 && touchStartX > window.innerWidth - 50) {
      // Swipe left from right edge - open AI panel
      if (currentView.value === 'coding' && currentChallenge.value) {
        appStore.toggleAIPanel()
      }
    }
  }
}

// Lifecycle hooks
onMounted(async () => {
  // Initialize app
  appStore.initializeApp()
  
  // Set up event listeners
  window.addEventListener('resize', handleResize)
  document.addEventListener('touchstart', handleTouchStart, { passive: true })
  document.addEventListener('touchend', handleTouchEnd, { passive: true })
  
  // Initialize cloud service if in cloud mode
  if (deploymentMode.value === 'cloud') {
    try {
      const { CloudService } = await import('@/services/cloudService')
      cloudService.value = await CloudService.fromStoredSession(
        process.env.VITE_API_BASE_URL || 'https://api.kiro-kaiju.com'
      )
    } catch (error) {
      console.error('Failed to initialize cloud service:', error)
    }
  }
  
  // Initialize user progress
  appStore.setLoading(true, 'Initializing user progress...')
  
  try {
    await progressStore.loadProgress(userId.value)
  } catch (err) {
    appStore.setError('Failed to load user progress')
    console.error('Failed to initialize user progress:', err)
  } finally {
    appStore.setLoading(false)
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  document.removeEventListener('touchstart', handleTouchStart)
  document.removeEventListener('touchend', handleTouchEnd)
})

// Watch for challenge changes
watch(currentChallenge, (newChallenge) => {
  if (newChallenge) {
    currentCode.value = newChallenge.initialCode
  }
})
</script>

<style scoped>
/* Custom scrollbar for better mobile experience */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.5);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(156, 163, 175, 0.7);
}

/* Dark mode scrollbar */
.dark ::-webkit-scrollbar-thumb {
  background: rgba(75, 85, 99, 0.5);
}

.dark ::-webkit-scrollbar-thumb:hover {
  background: rgba(75, 85, 99, 0.7);
}

/* Smooth transitions for mobile panels */
.transform {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Ensure proper touch targets on mobile */
@media (max-width: 1023px) {
  button {
    min-height: 44px;
    min-width: 44px;
  }
}
</style>