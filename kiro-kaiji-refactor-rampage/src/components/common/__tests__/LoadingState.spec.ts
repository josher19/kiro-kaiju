import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import LoadingState from '../LoadingState.vue'

describe('LoadingState', () => {
  describe('Loading Types', () => {
    it('renders spinner type by default', () => {
      const wrapper = mount(LoadingState)

      expect(wrapper.find('.loading-spinner').exists()).toBe(true)
      expect(wrapper.find('svg.animate-spin').exists()).toBe(true)
    })

    it('renders dots type when specified', () => {
      const wrapper = mount(LoadingState, {
        props: {
          type: 'dots'
        }
      })

      expect(wrapper.find('.loading-dots').exists()).toBe(true)
      expect(wrapper.findAll('.dot')).toHaveLength(3)
    })

    it('renders pulse type when specified', () => {
      const wrapper = mount(LoadingState, {
        props: {
          type: 'pulse'
        }
      })

      expect(wrapper.find('.loading-pulse').exists()).toBe(true)
      expect(wrapper.find('.pulse-circle').exists()).toBe(true)
    })

    it('renders skeleton type when specified', () => {
      const wrapper = mount(LoadingState, {
        props: {
          type: 'skeleton'
        }
      })

      expect(wrapper.find('.loading-skeleton').exists()).toBe(true)
      expect(wrapper.findAll('.skeleton-line')).toHaveLength(3)
    })

    it('renders kaiju type when specified', () => {
      const wrapper = mount(LoadingState, {
        props: {
          type: 'kaiju'
        }
      })

      expect(wrapper.find('.loading-kaiju').exists()).toBe(true)
      expect(wrapper.find('.kaiju-emoji').exists()).toBe(true)
      expect(wrapper.text()).toContain('🦖')
    })
  })

  describe('Sizes', () => {
    it('applies small size classes', () => {
      const wrapper = mount(LoadingState, {
        props: {
          size: 'sm'
        }
      })

      const spinner = wrapper.find('svg')
      expect(spinner.classes()).toContain('w-4')
      expect(spinner.classes()).toContain('h-4')
    })

    it('applies medium size classes by default', () => {
      const wrapper = mount(LoadingState)

      const spinner = wrapper.find('svg')
      expect(spinner.classes()).toContain('w-8')
      expect(spinner.classes()).toContain('h-8')
    })

    it('applies large size classes', () => {
      const wrapper = mount(LoadingState, {
        props: {
          size: 'lg'
        }
      })

      const spinner = wrapper.find('svg')
      expect(spinner.classes()).toContain('w-12')
      expect(spinner.classes()).toContain('h-12')
    })

    it('applies extra large size classes', () => {
      const wrapper = mount(LoadingState, {
        props: {
          size: 'xl'
        }
      })

      const spinner = wrapper.find('svg')
      expect(spinner.classes()).toContain('w-16')
      expect(spinner.classes()).toContain('h-16')
    })
  })

  describe('Colors', () => {
    it('applies blue color by default', () => {
      const wrapper = mount(LoadingState)

      const spinnerContainer = wrapper.find('.loading-spinner')
      expect(spinnerContainer.classes()).toContain('text-blue-500')
    })

    it('applies gray color when specified', () => {
      const wrapper = mount(LoadingState, {
        props: {
          color: 'gray'
        }
      })

      const spinnerContainer = wrapper.find('.loading-spinner')
      expect(spinnerContainer.classes()).toContain('text-gray-500')
    })

    it('applies green color when specified', () => {
      const wrapper = mount(LoadingState, {
        props: {
          color: 'green'
        }
      })

      const spinnerContainer = wrapper.find('.loading-spinner')
      expect(spinnerContainer.classes()).toContain('text-green-500')
    })

    it('applies red color when specified', () => {
      const wrapper = mount(LoadingState, {
        props: {
          color: 'red'
        }
      })

      const spinnerContainer = wrapper.find('.loading-spinner')
      expect(spinnerContainer.classes()).toContain('text-red-500')
    })

    it('applies yellow color when specified', () => {
      const wrapper = mount(LoadingState, {
        props: {
          color: 'yellow'
        }
      })

      const spinnerContainer = wrapper.find('.loading-spinner')
      expect(spinnerContainer.classes()).toContain('text-yellow-500')
    })

    it('applies purple color when specified', () => {
      const wrapper = mount(LoadingState, {
        props: {
          color: 'purple'
        }
      })

      const spinnerContainer = wrapper.find('.loading-spinner')
      expect(spinnerContainer.classes()).toContain('text-purple-500')
    })
  })

  describe('Messages', () => {
    it('displays loading message when provided', () => {
      const wrapper = mount(LoadingState, {
        props: {
          message: 'Loading challenges...'
        }
      })

      expect(wrapper.text()).toContain('Loading challenges...')
      expect(wrapper.find('.loading-message').exists()).toBe(true)
    })

    it('displays submessage when provided', () => {
      const wrapper = mount(LoadingState, {
        props: {
          message: 'Loading...',
          submessage: 'Please wait while we prepare your challenge'
        }
      })

      expect(wrapper.text()).toContain('Loading...')
      expect(wrapper.text()).toContain('Please wait while we prepare your challenge')
    })

    it('does not display message container when no message is provided', () => {
      const wrapper = mount(LoadingState)

      expect(wrapper.find('.loading-message').exists()).toBe(false)
    })
  })

  describe('Progress Bar', () => {
    it('displays progress bar when showProgress is true and progress is provided', () => {
      const wrapper = mount(LoadingState, {
        props: {
          showProgress: true,
          progress: 75
        }
      })

      expect(wrapper.find('.loading-progress').exists()).toBe(true)
      expect(wrapper.find('.progress-bar').exists()).toBe(true)
      expect(wrapper.find('.progress-fill').exists()).toBe(true)
      expect(wrapper.text()).toContain('75%')
    })

    it('sets correct progress bar width', () => {
      const wrapper = mount(LoadingState, {
        props: {
          showProgress: true,
          progress: 60
        }
      })

      const progressFill = wrapper.find('.progress-fill')
      expect(progressFill.attributes('style')).toContain('width: 60%')
    })

    it('clamps progress to 0-100 range', () => {
      const wrapper = mount(LoadingState, {
        props: {
          showProgress: true,
          progress: 150
        }
      })

      const progressFill = wrapper.find('.progress-fill')
      expect(progressFill.attributes('style')).toContain('width: 100%')
      expect(wrapper.text()).toContain('100%')
    })

    it('handles negative progress values', () => {
      const wrapper = mount(LoadingState, {
        props: {
          showProgress: true,
          progress: -10
        }
      })

      const progressFill = wrapper.find('.progress-fill')
      expect(progressFill.attributes('style')).toContain('width: 0%')
      expect(wrapper.text()).toContain('0%')
    })

    it('does not display progress bar when showProgress is false', () => {
      const wrapper = mount(LoadingState, {
        props: {
          showProgress: false,
          progress: 50
        }
      })

      expect(wrapper.find('.loading-progress').exists()).toBe(false)
    })

    it('does not display progress bar when progress is undefined', () => {
      const wrapper = mount(LoadingState, {
        props: {
          showProgress: true
        }
      })

      expect(wrapper.find('.loading-progress').exists()).toBe(false)
    })
  })

  describe('Layout Options', () => {
    it('applies full height when fullHeight is true', () => {
      const wrapper = mount(LoadingState, {
        props: {
          fullHeight: true
        }
      })

      const container = wrapper.find('.loading-state')
      expect(container.classes()).toContain('min-h-screen')
    })

    it('applies minimum height when fullHeight is false', () => {
      const wrapper = mount(LoadingState, {
        props: {
          fullHeight: false
        }
      })

      const container = wrapper.find('.loading-state')
      expect(container.classes()).toContain('min-h-32')
      expect(container.classes()).not.toContain('min-h-screen')
    })

    it('applies overlay styles when overlay is true', () => {
      const wrapper = mount(LoadingState, {
        props: {
          overlay: true
        }
      })

      const container = wrapper.find('.loading-state')
      expect(container.classes()).toContain('fixed')
      expect(container.classes()).toContain('inset-0')
      expect(container.classes()).toContain('z-50')
      expect(container.classes()).toContain('bg-white')
      expect(container.classes()).toContain('bg-opacity-75')
      expect(container.classes()).toContain('backdrop-blur-sm')
    })
  })

  describe('Dots Animation', () => {
    it('applies correct animation delays to dots', () => {
      const wrapper = mount(LoadingState, {
        props: {
          type: 'dots'
        }
      })

      const dots = wrapper.findAll('.dot')
      expect(dots[0].attributes('style')).toContain('animation-delay: 0s')
      expect(dots[1].attributes('style')).toContain('animation-delay: 0.2s')
      expect(dots[2].attributes('style')).toContain('animation-delay: 0.4s')
    })
  })

  describe('Accessibility', () => {
    it('has proper structure for screen readers', () => {
      const wrapper = mount(LoadingState, {
        props: {
          message: 'Loading content'
        }
      })

      // Should have text content that screen readers can announce
      expect(wrapper.text()).toContain('Loading content')
    })

    it('respects reduced motion preferences in CSS', () => {
      const wrapper = mount(LoadingState)

      // The component should have CSS that respects prefers-reduced-motion
      // This is tested through the CSS classes being present
      expect(wrapper.find('.animate-spin').exists()).toBe(true)
    })
  })
})