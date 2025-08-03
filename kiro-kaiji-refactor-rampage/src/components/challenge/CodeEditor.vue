<template>
  <div class="code-editor-container h-full flex flex-col">
    <!-- Editor Header with Controls -->
    <div class="editor-header bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-2 flex items-center justify-between">
      <div class="flex items-center space-x-2">
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
          {{ language.toUpperCase() }}
        </span>
        <div class="w-2 h-2 rounded-full bg-green-500" :class="{ 'bg-red-500': hasErrors }"></div>
      </div>
      
      <!-- Mobile Controls -->
      <div class="flex items-center space-x-2">
        <button
          v-if="isMobile"
          @click="toggleMobileKeyboard"
          class="p-1 rounded text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
          :class="{ 'bg-blue-100 dark:bg-blue-900': showMobileKeyboard }"
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3 1h10v8H5V6z"/>
          </svg>
        </button>
        
        <button
          @click="toggleTheme"
          class="p-1 rounded text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          <svg v-if="theme === 'light'" class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/>
          </svg>
          <svg v-else class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd"/>
          </svg>
        </button>
        
        <button
          v-if="isMobile"
          @click="toggleFullscreen"
          class="p-1 rounded text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z" clip-rule="evenodd"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Monaco Editor Container -->
    <div 
      ref="editorContainer" 
      class="editor-content flex-1 relative"
      :class="{ 
        'fullscreen': isFullscreen,
        'mobile-optimized': isMobile && showMobileKeyboard
      }"
    ></div>

    <!-- Mobile Virtual Keyboard Helper -->
    <div 
      v-if="isMobile && showMobileKeyboard" 
      class="mobile-keyboard bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-2"
    >
      <div class="flex flex-wrap gap-1">
        <button
          v-for="key in commonKeys"
          :key="key"
          @click="insertText(key)"
          class="px-2 py-1 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          {{ key }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick, computed } from 'vue'
import loader from '@monaco-editor/loader'
import type * as Monaco from 'monaco-editor'

// Props
interface Props {
  modelValue: string
  language: string
  readOnly?: boolean
  theme?: 'light' | 'dark'
  options?: Monaco.editor.IStandaloneEditorConstructionOptions
}

const props = withDefaults(defineProps<Props>(), {
  readOnly: false,
  theme: 'light',
  options: () => ({})
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: string]
  'change': [value: string]
  'focus': []
  'blur': []
  'error': [errors: Monaco.editor.IMarker[]]
}>()

// Refs
const editorContainer = ref<HTMLElement>()
let editor: Monaco.editor.IStandaloneCodeEditor | null = null
let monaco: typeof Monaco | null = null

// Reactive state
const theme = ref(props.theme)
const hasErrors = ref(false)
const isFullscreen = ref(false)
const showMobileKeyboard = ref(false)

// Mobile detection
const isMobile = computed(() => {
  return window.innerWidth < 768
})

// Common keys for mobile virtual keyboard
const commonKeys = ['{', '}', '(', ')', '[', ']', ';', ':', '"', "'", '<', '>', '/', '\\', '|', '&', '*', '+', '-', '=', '_', '$', '@', '#', '%', '^', '!', '?', '~', '`']

// Language configuration mapping
const languageMap: Record<string, string> = {
  'javascript': 'javascript',
  'typescript': 'typescript',
  'python': 'python',
  'java': 'java',
  'csharp': 'csharp',
  'cpp': 'cpp',
  'c': 'c',
  'php': 'php',
  'ruby': 'ruby',
  'go': 'go',
  'rust': 'rust',
  'swift': 'swift',
  'kotlin': 'kotlin',
  'html': 'html',
  'css': 'css',
  'json': 'json',
  'xml': 'xml',
  'yaml': 'yaml',
  'markdown': 'markdown'
}

// Initialize Monaco Editor
const initializeEditor = async () => {
  if (!editorContainer.value) return

  try {
    // Load Monaco Editor
    monaco = await loader.init()
    
    // Configure Monaco Editor for different languages
    await configureLanguageSupport()

    // Create editor instance
    editor = monaco.editor.create(editorContainer.value, {
      value: props.modelValue,
      language: languageMap[props.language] || props.language,
      theme: theme.value === 'dark' ? 'vs-dark' : 'vs',
      readOnly: props.readOnly,
      automaticLayout: true,
      minimap: { enabled: !isMobile.value },
      scrollBeyondLastLine: false,
      wordWrap: isMobile.value ? 'on' : 'off',
      fontSize: isMobile.value ? 14 : 13,
      lineHeight: isMobile.value ? 20 : 18,
      folding: true,
      lineNumbers: 'on',
      renderLineHighlight: 'all',
      selectOnLineNumbers: true,
      roundedSelection: false,
      cursorStyle: 'line',
      contextmenu: !isMobile.value,
      mouseWheelZoom: !isMobile.value,
      // Mobile optimizations
      scrollbar: {
        vertical: isMobile.value ? 'hidden' : 'auto',
        horizontal: isMobile.value ? 'hidden' : 'auto',
        verticalScrollbarSize: isMobile.value ? 8 : 14,
        horizontalScrollbarSize: isMobile.value ? 8 : 14
      },
      // Touch optimizations
      multiCursorModifier: 'ctrlCmd',
      accessibilitySupport: 'auto',
      ...props.options
    })

    // Set up event listeners
    setupEventListeners()
  } catch (error) {
    console.error('Failed to initialize Monaco Editor:', error)
  }
}

// Configure language support
const configureLanguageSupport = async () => {
  if (!monaco) return

  // Configure TypeScript/JavaScript
  monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
    target: monaco.languages.typescript.ScriptTarget.ES2020,
    allowNonTsExtensions: true,
    moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
    module: monaco.languages.typescript.ModuleKind.CommonJS,
    noEmit: true,
    esModuleInterop: true,
    jsx: monaco.languages.typescript.JsxEmit.React,
    reactNamespace: 'React',
    allowJs: true,
    typeRoots: ['node_modules/@types']
  })

  monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
    target: monaco.languages.typescript.ScriptTarget.ES2020,
    allowNonTsExtensions: true,
    moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
    module: monaco.languages.typescript.ModuleKind.CommonJS,
    noEmit: true,
    esModuleInterop: true,
    allowJs: true,
    typeRoots: ['node_modules/@types']
  })

  // Configure diagnostics
  monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: false,
    noSyntaxValidation: false
  })

  monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: false,
    noSyntaxValidation: false
  })
}

// Set up event listeners
const setupEventListeners = () => {
  if (!editor || !monaco) return

  // Content change listener
  editor.onDidChangeModelContent(() => {
    const value = editor?.getValue() || ''
    emit('update:modelValue', value)
    emit('change', value)
  })

  // Focus/blur listeners
  editor.onDidFocusEditorText(() => {
    emit('focus')
  })

  editor.onDidBlurEditorText(() => {
    emit('blur')
  })

  // Error detection
  monaco.editor.onDidChangeMarkers(([resource]) => {
    if (editor && monaco && resource.toString() === editor.getModel()?.uri.toString()) {
      const markers = monaco.editor.getModelMarkers({ resource })
      const errors = markers.filter(marker => marker.severity === monaco!.MarkerSeverity.Error)
      hasErrors.value = errors.length > 0
      emit('error', errors)
    }
  })

  // Mobile touch optimizations
  if (isMobile.value) {
    setupMobileTouchHandlers()
  }
}

// Mobile touch handlers
const setupMobileTouchHandlers = () => {
  if (!editor || !editorContainer.value) return

  let touchStartTime = 0
  let touchStartPos = { x: 0, y: 0 }

  editorContainer.value.addEventListener('touchstart', (e) => {
    touchStartTime = Date.now()
    touchStartPos = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  })

  editorContainer.value.addEventListener('touchend', (e) => {
    const touchEndTime = Date.now()
    const touchDuration = touchEndTime - touchStartTime
    
    // Handle long press for context menu on mobile
    if (touchDuration > 500) {
      e.preventDefault()
      // Show mobile context menu or selection
    }
  })
}

// Theme switching
const toggleTheme = () => {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
  if (editor && monaco) {
    monaco.editor.setTheme(theme.value === 'dark' ? 'vs-dark' : 'vs')
  }
}

// Mobile keyboard toggle
const toggleMobileKeyboard = () => {
  showMobileKeyboard.value = !showMobileKeyboard.value
}

// Fullscreen toggle
const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
  if (editor) {
    nextTick(() => {
      editor?.layout()
    })
  }
}

// Insert text at cursor position
const insertText = (text: string) => {
  if (!editor) return
  
  const selection = editor.getSelection()
  if (selection) {
    editor.executeEdits('mobile-keyboard', [{
      range: selection,
      text: text
    }])
    editor.focus()
  }
}

// Watch for prop changes
watch(() => props.modelValue, (newValue) => {
  if (editor && editor.getValue() !== newValue) {
    editor.setValue(newValue)
  }
})

watch(() => props.language, (newLanguage) => {
  if (editor && monaco) {
    const model = editor.getModel()
    if (model) {
      monaco.editor.setModelLanguage(model, languageMap[newLanguage] || newLanguage)
    }
  }
})

watch(() => props.theme, (newTheme) => {
  theme.value = newTheme
  if (editor && monaco) {
    monaco.editor.setTheme(newTheme === 'dark' ? 'vs-dark' : 'vs')
  }
})

// Handle window resize
const handleResize = () => {
  if (editor) {
    editor.layout()
  }
}

// Lifecycle hooks
onMounted(async () => {
  await nextTick()
  await initializeEditor()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  if (editor) {
    editor.dispose()
  }
  window.removeEventListener('resize', handleResize)
})

// Expose editor instance for parent components
defineExpose({
  editor,
  focus: () => editor?.focus(),
  blur: () => editor?.getContainerDomNode().blur(),
  getValue: () => editor?.getValue() || '',
  setValue: (value: string) => editor?.setValue(value),
  getSelection: () => editor?.getSelection(),
  setSelection: (selection: Monaco.IRange) => editor?.setSelection(selection),
  insertText,
  toggleTheme,
  toggleFullscreen
})
</script>

<style scoped>
.code-editor-container {
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  overflow: hidden;
}

.dark .code-editor-container {
  border-color: #374151;
}

.editor-content {
  min-height: 300px;
}

.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  background: white;
}

.dark .fullscreen {
  background: #1f2937;
}

.mobile-optimized {
  padding-bottom: 60px;
}

.mobile-keyboard {
  max-height: 120px;
  overflow-y: auto;
}

/* Mobile responsive adjustments */
@media (max-width: 768px) {
  .editor-content {
    min-height: 250px;
  }
  
  .editor-header {
    padding: 0.5rem;
  }
}

/* Touch-friendly scrollbars on mobile */
@media (max-width: 768px) {
  .editor-content :deep(.monaco-scrollable-element .scrollbar) {
    width: 8px !important;
    height: 8px !important;
  }
  
  .editor-content :deep(.monaco-scrollable-element .slider) {
    background: rgba(0, 0, 0, 0.3) !important;
    border-radius: 4px !important;
  }
}
</style>