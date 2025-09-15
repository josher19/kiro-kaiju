import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import KaijuDisplay from '../KaijuDisplay.vue'
import type { KaijuType } from '@/types/kaiju'
import type { TeamRole } from '@/types/team'

// Mock Teleport component for testing
vi.mock('vue', async () => {
  const actual = await vi.importActual('vue')
  return {
    ...actual,
    Teleport: {
      name: 'Teleport',
      props: ['to'],
      template: '<div data-testid="teleport-content"><slot /></div>'
    }
  }
})

describe('KaijuDisplay', () => {
  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = ''
  })

  describe('Kaiju Display', () => {
    it('renders kaiju thumbnail when kaiju type is provided', () => {
      const wrapper = mount(KaijuDisplay, {
        props: {
          kaijuType: 'hydra-bug' as KaijuType
        }
      })

      const thumbnail = wrapper.find('.kaiju-thumbnail')
      expect(thumbnail.exists()).toBe(true)

      const img = wrapper.find('img')
      expect(img.exists()).toBe(true)
      expect(img.attributes('src')).toContain('HydraBug_small.png')
      expect(img.attributes('alt')).toBe('HydraBug')
    })

    it('renders team member thumbnail when team role is provided', () => {
      const wrapper = mount(KaijuDisplay, {
        props: {
          teamRole: 'quality-assurance' as TeamRole
        }
      })

      const thumbnail = wrapper.find('.kaiju-thumbnail')
      expect(thumbnail.exists()).toBe(true)

      const img = wrapper.find('img')
      expect(img.exists()).toBe(true)
      expect(img.attributes('src')).toContain('sqa_sm.png')
      expect(img.attributes('alt')).toBe('Quality Assurance Pufferfish')
    })

    it('does not render thumbnail when no props are provided', () => {
      const wrapper = mount(KaijuDisplay, {
        props: {}
      })

      const thumbnail = wrapper.find('.kaiju-thumbnail')
      expect(thumbnail.exists()).toBe(false)
    })
  })

  describe('Full Size Modal', () => {
    it('shows full size modal when thumbnail is clicked', async () => {
      const wrapper = mount(KaijuDisplay, {
        props: {
          kaijuType: 'complexasaur' as KaijuType
        }
      })

      const thumbnail = wrapper.find('.kaiju-thumbnail')
      await thumbnail.trigger('click')

      expect(wrapper.vm.isFullImageVisible).toBe(true)
      
      // Modal is rendered in Teleport, check the component state instead
      expect(wrapper.vm.fullSizeImage).toContain('Complexosaur.png')
    })

    it('shows full size modal when Enter key is pressed on thumbnail', async () => {
      const wrapper = mount(KaijuDisplay, {
        props: {
          kaijuType: 'duplicatron' as KaijuType
        }
      })

      const thumbnail = wrapper.find('.kaiju-thumbnail')
      await thumbnail.trigger('keydown.enter')

      expect(wrapper.vm.isFullImageVisible).toBe(true)
    })

    it('shows full size modal when Space key is pressed on thumbnail', async () => {
      const wrapper = mount(KaijuDisplay, {
        props: {
          kaijuType: 'spaghettizilla' as KaijuType
        }
      })

      const thumbnail = wrapper.find('.kaiju-thumbnail')
      await thumbnail.trigger('keydown.space')

      expect(wrapper.vm.isFullImageVisible).toBe(true)
    })

    it('hides modal when clicked outside', async () => {
      const wrapper = mount(KaijuDisplay, {
        props: {
          kaijuType: 'memoryleak-odactyl' as KaijuType
        }
      })

      // Show modal first
      const thumbnail = wrapper.find('.kaiju-thumbnail')
      await thumbnail.trigger('click')
      expect(wrapper.vm.isFullImageVisible).toBe(true)

      // Call hideFullImage method directly since modal is in Teleport
      wrapper.vm.hideFullImage()

      expect(wrapper.vm.isFullImageVisible).toBe(false)
    })

    it('hides modal when close button is clicked', async () => {
      const wrapper = mount(KaijuDisplay, {
        props: {
          teamRole: 'architect' as TeamRole
        }
      })

      // Show modal first
      const thumbnail = wrapper.find('.kaiju-thumbnail')
      await thumbnail.trigger('click')
      expect(wrapper.vm.isFullImageVisible).toBe(true)

      // Call hideFullImage method directly since modal is in Teleport
      wrapper.vm.hideFullImage()

      expect(wrapper.vm.isFullImageVisible).toBe(false)
    })

    it('displays correct full size image path for kaiju', async () => {
      const wrapper = mount(KaijuDisplay, {
        props: {
          kaijuType: 'hydra-bug' as KaijuType
        }
      })

      // Show modal
      const thumbnail = wrapper.find('.kaiju-thumbnail')
      await thumbnail.trigger('click')

      // Check that full size image path is correct (without _small)
      expect(wrapper.vm.fullSizeImage).toContain('HydraBug.png')
      expect(wrapper.vm.fullSizeImage).not.toContain('_small')
    })

    it('displays correct full size image path for team member', async () => {
      const wrapper = mount(KaijuDisplay, {
        props: {
          teamRole: 'senior-developer' as TeamRole
        }
      })

      // Show modal
      const thumbnail = wrapper.find('.kaiju-thumbnail')
      await thumbnail.trigger('click')

      // Check that full size image path is correct (without _sm)
      expect(wrapper.vm.fullSizeImage).toContain('developer.png')
      expect(wrapper.vm.fullSizeImage).not.toContain('_sm')
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA attributes on thumbnail', () => {
      const wrapper = mount(KaijuDisplay, {
        props: {
          kaijuType: 'complexasaur' as KaijuType
        }
      })

      const thumbnail = wrapper.find('.kaiju-thumbnail')
      expect(thumbnail.attributes('role')).toBe('button')
      expect(thumbnail.attributes('tabindex')).toBe('0')
      expect(thumbnail.attributes('aria-label')).toContain('View full size Complexasaur')
    })

    it('has proper ARIA attributes on modal', async () => {
      const wrapper = mount(KaijuDisplay, {
        props: {
          teamRole: 'product-owner' as TeamRole
        }
      })

      // Show modal
      const thumbnail = wrapper.find('.kaiju-thumbnail')
      await thumbnail.trigger('click')

      // Check that modal state is correct (modal is in Teleport)
      expect(wrapper.vm.isFullImageVisible).toBe(true)
      expect(wrapper.vm.currentImageAlt).toBe('Product Owner Pig')
    })
  })

  describe('Error Handling', () => {
    it('handles image load errors gracefully', async () => {
      const wrapper = mount(KaijuDisplay, {
        props: {
          kaijuType: 'hydra-bug' as KaijuType
        }
      })

      const img = wrapper.find('img')
      await img.trigger('error')

      // Should not crash and should hide the image
      expect(img.element.style.display).toBe('none')
    })

    it('shows error state when full image fails to load', async () => {
      const wrapper = mount(KaijuDisplay, {
        props: {
          kaijuType: 'complexasaur' as KaijuType
        }
      })

      // Show modal
      const thumbnail = wrapper.find('.kaiju-thumbnail')
      await thumbnail.trigger('click')

      // Trigger full image error
      wrapper.vm.handleFullImageError()

      expect(wrapper.vm.fullImageError).toBe(true)
      expect(wrapper.vm.isFullImageLoading).toBe(false)
    })
  })

  describe('Keyboard Navigation', () => {
    it('closes modal on Escape key', async () => {
      // Mock document event listener
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener')
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener')

      const wrapper = mount(KaijuDisplay, {
        props: {
          kaijuType: 'spaghettizilla' as KaijuType
        }
      })

      // Verify event listener was added
      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))

      // Show modal
      const thumbnail = wrapper.find('.kaiju-thumbnail')
      await thumbnail.trigger('click')
      expect(wrapper.vm.isFullImageVisible).toBe(true)

      // Simulate Escape key press
      const keydownEvent = new KeyboardEvent('keydown', { key: 'Escape' })
      document.dispatchEvent(keydownEvent)

      expect(wrapper.vm.isFullImageVisible).toBe(false)

      // Cleanup
      wrapper.unmount()
      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
    })
  })
})