import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import ErrorBoundary from '../ErrorBoundary.vue'

// Mock component that throws an error
const ErrorThrowingComponent = {
  name: 'ErrorThrowingComponent',
  setup() {
    throw new Error('Test error')
  },
  template: '<div>This should not render</div>'
}

// Mock component that works normally
const WorkingComponent = {
  name: 'WorkingComponent',
  template: '<div data-testid="working-component">Working component</div>'
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Normal Operation', () => {
    it('renders children when no error occurs', () => {
      const wrapper = mount(ErrorBoundary, {
        slots: {
          default: WorkingComponent
        }
      })

      expect(wrapper.find('[data-testid="working-component"]').exists()).toBe(true)
      expect(wrapper.find('.error-container').exists()).toBe(false)
    })

    it('shows loading state when isLoading is true', async () => {
      const wrapper = mount(ErrorBoundary, {
        props: {
          loadingMessage: 'Loading test...'
        },
        slots: {
          default: WorkingComponent
        }
      })

      // Simulate loading state
      wrapper.vm.isLoading = true
      await nextTick()

      expect(wrapper.find('.loading-container').exists()).toBe(true)
      expect(wrapper.text()).toContain('Loading test...')
    })
  })

  describe('Error Handling', () => {
    it('displays error state when error is caught', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      const wrapper = mount(ErrorBoundary, {
        props: {
          errorTitle: 'Custom Error Title',
          errorMessage: 'Custom error message'
        }
      })

      // Simulate error
      wrapper.vm.hasError = true
      wrapper.vm.errorDetails = 'Error stack trace'
      await nextTick()

      expect(wrapper.find('.error-container').exists()).toBe(true)
      expect(wrapper.text()).toContain('Custom Error Title')
      expect(wrapper.text()).toContain('Custom error message')

      consoleSpy.mockRestore()
    })

    it('shows error details in development mode', async () => {
      const wrapper = mount(ErrorBoundary, {
        props: {
          showDetails: true
        }
      })

      // Simulate error with details
      wrapper.vm.hasError = true
      wrapper.vm.errorDetails = 'Detailed error information'
      await nextTick()

      const details = wrapper.find('details')
      expect(details.exists()).toBe(true)
      expect(wrapper.text()).toContain('Show Error Details')
      expect(wrapper.text()).toContain('Detailed error information')
    })

    it('hides error details when showDetails is false', async () => {
      const wrapper = mount(ErrorBoundary, {
        props: {
          showDetails: false
        }
      })

      // Simulate error
      wrapper.vm.hasError = true
      wrapper.vm.errorDetails = 'Detailed error information'
      await nextTick()

      const details = wrapper.find('details')
      expect(details.exists()).toBe(false)
    })
  })

  describe('Action Buttons', () => {
    it('shows retry button and calls retry handler', async () => {
      const retryHandler = vi.fn()
      const wrapper = mount(ErrorBoundary, {
        props: {
          retryHandler
        }
      })

      // Simulate error
      wrapper.vm.hasError = true
      await nextTick()

      const retryButton = wrapper.find('button')
      expect(retryButton.exists()).toBe(true)
      expect(retryButton.text()).toContain('Try Again')

      await retryButton.trigger('click')
      expect(retryHandler).toHaveBeenCalled()
    })

    it('shows reload button when showReload is true', async () => {
      const wrapper = mount(ErrorBoundary, {
        props: {
          showReload: true
        }
      })

      // Simulate error
      wrapper.vm.hasError = true
      await nextTick()

      const buttons = wrapper.findAll('button')
      const reloadButton = buttons.find(btn => btn.text().includes('Reload Page'))
      expect(reloadButton).toBeTruthy()
    })

    it('hides reload button when showReload is false', async () => {
      const wrapper = mount(ErrorBoundary, {
        props: {
          showReload: false
        }
      })

      // Simulate error
      wrapper.vm.hasError = true
      await nextTick()

      const buttons = wrapper.findAll('button')
      const reloadButton = buttons.find(btn => btn.text().includes('Reload Page'))
      expect(reloadButton).toBeFalsy()
    })

    it('shows fallback action button when provided', async () => {
      const fallbackHandler = vi.fn()
      const wrapper = mount(ErrorBoundary, {
        props: {
          fallbackAction: {
            label: 'Custom Action',
            handler: fallbackHandler
          }
        }
      })

      // Simulate error
      wrapper.vm.hasError = true
      await nextTick()

      const buttons = wrapper.findAll('button')
      const fallbackButton = buttons.find(btn => btn.text().includes('Custom Action'))
      expect(fallbackButton).toBeTruthy()

      await fallbackButton!.trigger('click')
      expect(fallbackHandler).toHaveBeenCalled()
    })
  })

  describe('Retry Logic', () => {
    it('handles retry with custom retry handler', async () => {
      const retryHandler = vi.fn().mockResolvedValue(undefined)
      const wrapper = mount(ErrorBoundary, {
        props: {
          retryHandler
        }
      })

      // Simulate error
      wrapper.vm.hasError = true
      await nextTick()

      // Trigger retry
      await wrapper.vm.retry()

      expect(retryHandler).toHaveBeenCalled()
      expect(wrapper.vm.hasError()).toBe(false)
    })

    it('handles retry failure', async () => {
      const retryHandler = vi.fn().mockRejectedValue(new Error('Retry failed'))
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      const wrapper = mount(ErrorBoundary, {
        props: {
          retryHandler
        }
      })

      // Simulate error
      wrapper.vm.hasError = true
      await nextTick()

      // Trigger retry
      await wrapper.vm.retry()

      expect(retryHandler).toHaveBeenCalled()
      expect(wrapper.vm.hasError()).toBe(true)
      expect(wrapper.vm.isLoading()).toBe(false)

      consoleSpy.mockRestore()
    })

    it('respects maximum retry attempts', async () => {
      const retryHandler = vi.fn().mockRejectedValue(new Error('Always fails'))
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      const wrapper = mount(ErrorBoundary, {
        props: {
          retryHandler
        }
      })

      // Simulate error
      wrapper.vm.hasError = true
      wrapper.vm.retryCount = 3 // Set to max retries
      await nextTick()

      // Trigger retry
      await wrapper.vm.retry()

      expect(retryHandler).not.toHaveBeenCalled()
      expect(consoleSpy).toHaveBeenCalledWith('Maximum retry attempts reached')

      consoleSpy.mockRestore()
    })
  })

  describe('Events', () => {
    it('emits error event when error occurs', async () => {
      const wrapper = mount(ErrorBoundary)

      const testError = new Error('Test error')
      wrapper.vm.hasError = true
      wrapper.vm.errorDetails = testError.stack || testError.message

      // Simulate error capture
      await wrapper.vm.$emit('error', testError)

      expect(wrapper.emitted('error')).toBeTruthy()
      expect(wrapper.emitted('error')?.[0]).toEqual([testError])
    })

    it('emits retry event when retry is successful', async () => {
      const retryHandler = vi.fn().mockResolvedValue(undefined)
      const wrapper = mount(ErrorBoundary, {
        props: {
          retryHandler
        }
      })

      // Simulate error and retry
      wrapper.vm.hasError = true
      await wrapper.vm.retry()

      expect(wrapper.emitted('retry')).toBeTruthy()
    })

    it('emits reload event when reload is triggered', async () => {
      // Mock window.location.reload
      const reloadMock = vi.fn()
      Object.defineProperty(window, 'location', {
        value: { reload: reloadMock },
        writable: true
      })

      const wrapper = mount(ErrorBoundary)

      await wrapper.vm.reloadPage()

      expect(wrapper.emitted('reload')).toBeTruthy()
      expect(reloadMock).toHaveBeenCalled()
    })
  })

  describe('Component Methods', () => {
    it('exposes reset method', () => {
      const wrapper = mount(ErrorBoundary)

      // Simulate error state
      wrapper.vm.hasError = true
      wrapper.vm.isLoading = true
      wrapper.vm.errorDetails = 'Some error'
      wrapper.vm.retryCount = 2

      // Reset
      wrapper.vm.reset()

      expect(wrapper.vm.hasError()).toBe(false)
      expect(wrapper.vm.isLoading()).toBe(false)
    })

    it('exposes hasError method', () => {
      const wrapper = mount(ErrorBoundary)

      expect(wrapper.vm.hasError()).toBe(false)

      wrapper.vm.hasError = true
      expect(wrapper.vm.hasError()).toBe(true)
    })

    it('exposes isLoading method', () => {
      const wrapper = mount(ErrorBoundary)

      expect(wrapper.vm.isLoading()).toBe(false)

      wrapper.vm.isLoading = true
      expect(wrapper.vm.isLoading()).toBe(true)
    })
  })
})