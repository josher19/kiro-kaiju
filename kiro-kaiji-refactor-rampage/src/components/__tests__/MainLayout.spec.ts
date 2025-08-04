import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import MainLayout from '@/components/layout/MainLayout.vue'
import { useAppStore } from '@/stores/appStore'
import { useChallengeStore } from '@/stores/challengeStore'
import { useUserProgressStore } from '@/stores/userProgressStore'
import { ProgrammingLanguage, ChallengeCategory, DifficultyLevel, KaijuType } from '@/types'

// Mock window methods
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

describe('MainLayout', () => {
  let wrapper: VueWrapper<any>
  let appStore: ReturnType<typeof useAppStore>
  let challengeStore: ReturnType<typeof useChallengeStore>
  let progressStore: ReturnType<typeof useUserProgressStore>

  const mockChallenge = {
    id: 'test-challenge-1',
    kaiju: {
      id: 'hydra-bug',
      name: 'HydraBug',
      avatar: '🐛',
      type: KaijuType.HYDRA_BUG,
      description: 'A bug that multiplies when you try to fix it',
      codePatterns: [],
      difficultyModifiers: []
    },
    config: {
      language: ProgrammingLanguage.JAVASCRIPT,
      category: ChallengeCategory.BUG_FIXING,
      difficulty: DifficultyLevel.BEGINNER
    },
    initialCode: 'console.log("Hello World");',
    requirements: [
      { id: '1', description: 'Fix the bug', priority: 'must' as const, testable: true }
    ],
    testCases: [],
    createdAt: new Date(),
    timeLimit: 3600
  }

  beforeEach(() => {
    setActivePinia(createPinia())
    
    // Get store instances
    appStore = useAppStore()
    challengeStore = useChallengeStore()
    progressStore = useUserProgressStore()

    // Mock store methods
    vi.spyOn(progressStore, 'loadProgress').mockResolvedValue()
    
    // Set initial store state
    appStore.initializeApp()
    
    wrapper = mount(MainLayout, {
      global: {
        stubs: {
          ChallengeSelector: {
            template: '<div data-testid="challenge-selector">Challenge Selector</div>',
            emits: ['challenge-generated']
          },
          CodeEditor: {
            template: '<div data-testid="code-editor">Code Editor</div>',
            props: ['initialCode', 'language', 'theme'],
            emits: ['code-change']
          },
          AIChatInterface: {
            template: '<div data-testid="ai-chat">AI Chat Interface</div>',
            props: ['challengeContext', 'userId']
          },
          ZoomAFriendPanel: {
            template: '<div data-testid="zoom-friend">Zoom-a-Friend Panel</div>',
            props: ['challengeId', 'currentCode', 'requirements']
          },
          ProgressTracker: {
            template: '<div data-testid="progress-tracker">Progress Tracker</div>'
          }
        }
      }
    })
  })

  afterEach(() => {
    wrapper.unmount()
    vi.clearAllMocks()
  })

  describe('Layout Structure', () => {
    it('renders main layout container', () => {
      expect(wrapper.find('.main-layout').exists()).toBe(true)
      expect(wrapper.find('.main-layout').classes()).toContain('min-h-screen')
    })

    it('renders desktop sidebar', () => {
      expect(wrapper.find('aside').exists()).toBe(true)
      expect(wrapper.find('aside').classes()).toContain('lg:flex')
    })

    it('renders mobile header', () => {
      const mobileHeader = wrapper.find('header')
      expect(mobileHeader.exists()).toBe(true)
      expect(mobileHeader.classes()).toContain('lg:hidden')
    })

    it('has navigation buttons', () => {
      const navButtons = wrapper.findAll('nav button')
      expect(navButtons.length).toBeGreaterThan(0)
    })
  })

  describe('Mobile Responsiveness', () => {
    it('toggles mobile menu', async () => {
      appStore.setMobile(true)
      const menuButton = wrapper.find('header button')
      
      expect(appStore.isMobileMenuOpen).toBe(false)
      await menuButton.trigger('click')
      expect(appStore.isMobileMenuOpen).toBe(true)
    })

    it('manages mobile panel state', () => {
      appStore.setMobile(true)
      appStore.toggleAIPanel()
      expect(appStore.isAIPanelOpen).toBe(true)
      
      appStore.toggleZoomPanel()
      expect(appStore.isZoomPanelOpen).toBe(true)
      expect(appStore.isAIPanelOpen).toBe(false) // Should close AI panel
    })
  })

  describe('Store Integration', () => {
    it('uses app store for state management', () => {
      expect(appStore).toBeDefined()
      expect(challengeStore).toBeDefined()
      expect(progressStore).toBeDefined()
    })

    it('manages view state through app store', () => {
      appStore.setCurrentView('coding')
      expect(appStore.currentView).toBe('coding')
      
      appStore.setCurrentView('progress')
      expect(appStore.currentView).toBe('progress')
    })

    it('manages mobile state through app store', () => {
      appStore.setMobile(true)
      expect(appStore.isMobile).toBe(true)
      
      appStore.setMobile(false)
      expect(appStore.isMobile).toBe(false)
    })
  })

  describe('Error Handling', () => {
    it('handles loading states', () => {
      appStore.setLoading(true, 'Test loading')
      expect(appStore.isLoading).toBe(true)
      expect(appStore.loadingMessage).toBe('Test loading')
      
      appStore.setLoading(false)
      expect(appStore.isLoading).toBe(false)
    })

    it('handles error states', () => {
      appStore.setError('Test error')
      expect(appStore.error).toBe('Test error')
      
      appStore.clearError()
      expect(appStore.error).toBe(null)
    })
  })
})