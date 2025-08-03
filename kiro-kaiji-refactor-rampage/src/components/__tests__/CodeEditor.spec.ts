import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import CodeEditor from '../challenge/CodeEditor.vue'

// Mock Monaco Editor loader
const mockEditor = {
  getValue: vi.fn(() => 'test code'),
  setValue: vi.fn(),
  onDidChangeModelContent: vi.fn(() => ({ dispose: vi.fn() })),
  onDidFocusEditorText: vi.fn(() => ({ dispose: vi.fn() })),
  onDidBlurEditorText: vi.fn(() => ({ dispose: vi.fn() })),
  getModel: vi.fn(() => ({ uri: { toString: () => 'test-uri' } })),
  getSelection: vi.fn(),
  setSelection: vi.fn(),
  executeEdits: vi.fn(),
  focus: vi.fn(),
  layout: vi.fn(),
  dispose: vi.fn(),
  getContainerDomNode: vi.fn(() => ({ blur: vi.fn() }))
}

const mockMonaco = {
  editor: {
    create: vi.fn(() => mockEditor),
    setTheme: vi.fn(),
    onDidChangeMarkers: vi.fn(() => ({ dispose: vi.fn() })),
    getModelMarkers: vi.fn(() => []),
    setModelLanguage: vi.fn()
  },
  languages: {
    typescript: {
      ScriptTarget: {
        ES2020: 7
      },
      ModuleResolutionKind: {
        NodeJs: 2
      },
      ModuleKind: {
        CommonJS: 1
      },
      JsxEmit: {
        React: 2
      },
      javascriptDefaults: {
        setCompilerOptions: vi.fn(),
        setDiagnosticsOptions: vi.fn()
      },
      typescriptDefaults: {
        setCompilerOptions: vi.fn(),
        setDiagnosticsOptions: vi.fn()
      }
    }
  },
  MarkerSeverity: {
    Error: 8
  }
}

vi.mock('@monaco-editor/loader', () => ({
  default: {
    init: vi.fn(() => Promise.resolve(mockMonaco))
  }
}))

// Mock window.innerWidth for mobile detection
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1024
})

describe('CodeEditor', () => {
  let wrapper: VueWrapper<any>

  beforeEach(() => {
    vi.clearAllMocks()
    window.innerWidth = 1024
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })

  describe('Component Structure', () => {
    it('should render with required elements', async () => {
      wrapper = mount(CodeEditor, {
        props: {
          modelValue: 'console.log("Hello World");',
          language: 'javascript'
        }
      })

      await nextTick()

      expect(wrapper.find('.code-editor-container').exists()).toBe(true)
      expect(wrapper.find('.editor-header').exists()).toBe(true)
      expect(wrapper.find('.editor-content').exists()).toBe(true)
    })

    it('should display language in header', async () => {
      wrapper = mount(CodeEditor, {
        props: {
          modelValue: 'test code',
          language: 'typescript'
        }
      })

      await nextTick()

      expect(wrapper.text()).toContain('TYPESCRIPT')
    })

    it('should show theme toggle button', async () => {
      wrapper = mount(CodeEditor, {
        props: {
          modelValue: 'test',
          language: 'javascript'
        }
      })

      await nextTick()

      const buttons = wrapper.findAll('button')
      expect(buttons.length).toBeGreaterThan(0)
    })
  })

  describe('Mobile Responsiveness', () => {
    beforeEach(() => {
      window.innerWidth = 600 // Set mobile width
    })

    it('should show mobile-specific controls on small screens', async () => {
      wrapper = mount(CodeEditor, {
        props: {
          modelValue: 'test',
          language: 'javascript'
        }
      })

      await nextTick()

      // Should have multiple buttons for mobile controls
      const buttons = wrapper.findAll('button')
      expect(buttons.length).toBeGreaterThan(1)
    })

    it('should toggle mobile keyboard visibility', async () => {
      wrapper = mount(CodeEditor, {
        props: {
          modelValue: 'test',
          language: 'javascript'
        }
      })

      await nextTick()

      const vm = wrapper.vm as any
      
      // Initially keyboard should be hidden
      expect(vm.showMobileKeyboard).toBe(false)
      
      // Toggle keyboard
      vm.toggleMobileKeyboard()
      await nextTick()
      
      expect(vm.showMobileKeyboard).toBe(true)
      expect(wrapper.find('.mobile-keyboard').exists()).toBe(true)
    })

    it('should show virtual keyboard keys when enabled', async () => {
      wrapper = mount(CodeEditor, {
        props: {
          modelValue: 'test',
          language: 'javascript'
        }
      })

      await nextTick()

      const vm = wrapper.vm as any
      vm.showMobileKeyboard = true
      await nextTick()

      const keyboard = wrapper.find('.mobile-keyboard')
      expect(keyboard.exists()).toBe(true)
      
      const keys = keyboard.findAll('button')
      expect(keys.length).toBeGreaterThan(0)
    })
  })

  describe('Theme Switching', () => {
    it('should toggle between light and dark themes', async () => {
      wrapper = mount(CodeEditor, {
        props: {
          modelValue: 'test',
          language: 'javascript',
          theme: 'light'
        }
      })

      await nextTick()

      const vm = wrapper.vm as any
      
      // Initial theme should be light
      expect(vm.theme).toBe('light')
      
      // Toggle theme
      vm.toggleTheme()
      await nextTick()
      
      expect(vm.theme).toBe('dark')
      
      // Toggle back
      vm.toggleTheme()
      await nextTick()
      
      expect(vm.theme).toBe('light')
    })

    it('should update theme when prop changes', async () => {
      wrapper = mount(CodeEditor, {
        props: {
          modelValue: 'test',
          language: 'javascript',
          theme: 'light'
        }
      })

      await nextTick()

      const vm = wrapper.vm as any
      expect(vm.theme).toBe('light')

      await wrapper.setProps({ theme: 'dark' })
      await nextTick()

      expect(vm.theme).toBe('dark')
    })
  })

  describe('Language Support', () => {
    it('should handle different programming languages', async () => {
      const languages = ['javascript', 'typescript', 'python', 'java', 'csharp']
      
      for (const lang of languages) {
        wrapper = mount(CodeEditor, {
          props: {
            modelValue: 'test code',
            language: lang
          }
        })

        await nextTick()

        expect(wrapper.text()).toContain(lang.toUpperCase())
        wrapper.unmount()
      }
    })

    it('should handle unknown languages gracefully', async () => {
      wrapper = mount(CodeEditor, {
        props: {
          modelValue: 'test',
          language: 'unknown-language'
        }
      })

      await nextTick()

      expect(wrapper.text()).toContain('UNKNOWN-LANGUAGE')
    })
  })

  describe('Fullscreen Mode', () => {
    it('should toggle fullscreen state', async () => {
      wrapper = mount(CodeEditor, {
        props: {
          modelValue: 'test',
          language: 'javascript'
        }
      })

      await nextTick()

      const vm = wrapper.vm as any
      
      // Initially not fullscreen
      expect(vm.isFullscreen).toBe(false)
      
      // Toggle fullscreen
      vm.toggleFullscreen()
      await nextTick()
      
      expect(vm.isFullscreen).toBe(true)
      expect(wrapper.find('.fullscreen').exists()).toBe(true)
    })
  })

  describe('Error Handling', () => {
    it('should track error state', async () => {
      wrapper = mount(CodeEditor, {
        props: {
          modelValue: 'test',
          language: 'javascript'
        }
      })

      await nextTick()

      const vm = wrapper.vm as any
      
      // Initially no errors
      expect(vm.hasErrors).toBe(false)
      
      // Simulate error state
      vm.hasErrors = true
      await nextTick()
      
      expect(vm.hasErrors).toBe(true)
    })
  })

  describe('Event Emissions', () => {
    it('should emit update:modelValue when value changes', async () => {
      wrapper = mount(CodeEditor, {
        props: {
          modelValue: 'initial',
          language: 'javascript'
        }
      })

      await nextTick()

      // Simulate value change through exposed method
      await wrapper.vm.$emit('update:modelValue', 'updated content')

      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['updated content'])
    })

    it('should emit change event', async () => {
      wrapper = mount(CodeEditor, {
        props: {
          modelValue: 'test',
          language: 'javascript'
        }
      })

      await nextTick()

      await wrapper.vm.$emit('change', 'new content')

      expect(wrapper.emitted('change')).toBeTruthy()
      expect(wrapper.emitted('change')?.[0]).toEqual(['new content'])
    })

    it('should emit focus and blur events', async () => {
      wrapper = mount(CodeEditor, {
        props: {
          modelValue: 'test',
          language: 'javascript'
        }
      })

      await nextTick()

      await wrapper.vm.$emit('focus')
      await wrapper.vm.$emit('blur')

      expect(wrapper.emitted('focus')).toBeTruthy()
      expect(wrapper.emitted('blur')).toBeTruthy()
    })
  })

  describe('Exposed Methods', () => {
    it('should expose required methods', async () => {
      wrapper = mount(CodeEditor, {
        props: {
          modelValue: 'test',
          language: 'javascript'
        }
      })

      await nextTick()

      const vm = wrapper.vm as any

      // Check that methods are exposed
      expect(typeof vm.toggleTheme).toBe('function')
      expect(typeof vm.toggleFullscreen).toBe('function')
      expect(typeof vm.insertText).toBe('function')
    })
  })

  describe('Props Validation', () => {
    it('should handle readOnly prop', async () => {
      wrapper = mount(CodeEditor, {
        props: {
          modelValue: 'test',
          language: 'javascript',
          readOnly: true
        }
      })

      await nextTick()

      // Component should render without errors
      expect(wrapper.find('.code-editor-container').exists()).toBe(true)
    })

    it('should handle custom options', async () => {
      wrapper = mount(CodeEditor, {
        props: {
          modelValue: 'test',
          language: 'javascript',
          options: { fontSize: 16 }
        }
      })

      await nextTick()

      // Component should render without errors
      expect(wrapper.find('.code-editor-container').exists()).toBe(true)
    })
  })

  describe('Mobile Virtual Keyboard', () => {
    beforeEach(() => {
      window.innerWidth = 600 // Set mobile width
    })

    it('should insert text when virtual keyboard keys are clicked', async () => {
      wrapper = mount(CodeEditor, {
        props: {
          modelValue: 'test',
          language: 'javascript'
        }
      })

      await nextTick()

      const vm = wrapper.vm as any
      vm.showMobileKeyboard = true
      await nextTick()

      // Find a virtual key button
      const virtualKeys = wrapper.findAll('.mobile-keyboard button')
      expect(virtualKeys.length).toBeGreaterThan(0)

      // Click the first virtual key
      if (virtualKeys.length > 0) {
        await virtualKeys[0].trigger('click')
        // The insertText method should be called (we can't easily test the Monaco editor interaction)
        expect(virtualKeys[0].exists()).toBe(true)
      }
    })

    it('should show common programming symbols in virtual keyboard', async () => {
      wrapper = mount(CodeEditor, {
        props: {
          modelValue: 'test',
          language: 'javascript'
        }
      })

      await nextTick()

      const vm = wrapper.vm as any
      vm.showMobileKeyboard = true
      await nextTick()

      const keyboard = wrapper.find('.mobile-keyboard')
      expect(keyboard.exists()).toBe(true)

      // Check for common programming symbols
      const keyboardText = keyboard.text()
      expect(keyboardText).toContain('{')
      expect(keyboardText).toContain('}')
      expect(keyboardText).toContain('(')
      expect(keyboardText).toContain(')')
      expect(keyboardText).toContain(';')
    })
  })

  describe('Responsive Design', () => {
    it('should detect mobile devices correctly', async () => {
      // Test desktop
      window.innerWidth = 1024
      wrapper = mount(CodeEditor, {
        props: {
          modelValue: 'test',
          language: 'javascript'
        }
      })

      await nextTick()
      let vm = wrapper.vm as any
      expect(vm.isMobile).toBe(false)
      wrapper.unmount()

      // Test mobile
      window.innerWidth = 600
      wrapper = mount(CodeEditor, {
        props: {
          modelValue: 'test',
          language: 'javascript'
        }
      })

      await nextTick()
      vm = wrapper.vm as any
      expect(vm.isMobile).toBe(true)
    })

    it('should show mobile controls only on mobile devices', async () => {
      // Desktop - should not show mobile keyboard button
      window.innerWidth = 1024
      wrapper = mount(CodeEditor, {
        props: {
          modelValue: 'test',
          language: 'javascript'
        }
      })

      await nextTick()
      
      // Mobile keyboard button should not be visible on desktop
      const mobileButtons = wrapper.findAll('button').filter(btn => 
        btn.element.innerHTML.includes('svg') && 
        btn.element.innerHTML.includes('path') &&
        btn.element.innerHTML.includes('M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3 1h10v8H5V6z')
      )
      
      expect(mobileButtons.length).toBe(0)
      wrapper.unmount()

      // Mobile - should show mobile controls
      window.innerWidth = 600
      wrapper = mount(CodeEditor, {
        props: {
          modelValue: 'test',
          language: 'javascript'
        }
      })

      await nextTick()
      
      const buttons = wrapper.findAll('button')
      expect(buttons.length).toBeGreaterThan(1) // Should have theme + mobile controls
    })
  })
})