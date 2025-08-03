<template>
  <div class="code-editor-test-view p-4">
    <h1 class="text-2xl font-bold mb-4">Monaco Code Editor Test</h1>
    
    <div class="mb-4">
      <label class="block text-sm font-medium mb-2">Language:</label>
      <select 
        v-model="selectedLanguage" 
        class="border border-gray-300 rounded px-3 py-2"
      >
        <option value="javascript">JavaScript</option>
        <option value="typescript">TypeScript</option>
        <option value="python">Python</option>
        <option value="java">Java</option>
        <option value="csharp">C#</option>
      </select>
    </div>

    <div class="mb-4">
      <label class="block text-sm font-medium mb-2">Theme:</label>
      <select 
        v-model="selectedTheme" 
        class="border border-gray-300 rounded px-3 py-2"
      >
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </div>

    <div class="mb-4">
      <label class="block text-sm font-medium mb-2">Code:</label>
      <CodeEditor
        v-model="code"
        :language="selectedLanguage"
        :theme="selectedTheme"
        @change="onCodeChange"
        @focus="onFocus"
        @blur="onBlur"
        @error="onError"
        class="h-96"
      />
    </div>

    <div class="mt-4">
      <h3 class="text-lg font-semibold mb-2">Events Log:</h3>
      <div class="bg-gray-100 p-3 rounded max-h-32 overflow-y-auto">
        <div v-for="(event, index) in events" :key="index" class="text-sm">
          {{ event }}
        </div>
      </div>
    </div>

    <div class="mt-4">
      <h3 class="text-lg font-semibold mb-2">Current Code Value:</h3>
      <pre class="bg-gray-100 p-3 rounded text-sm overflow-x-auto">{{ code }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import CodeEditor from '@/components/challenge/CodeEditor.vue'
import type * as Monaco from 'monaco-editor'

const selectedLanguage = ref('javascript')
const selectedTheme = ref<'light' | 'dark'>('light')
const events = ref<string[]>([])

const code = ref(`// Welcome to the Monaco Code Editor!
function greet(name) {
  console.log('Hello, ' + name + '!');
  return 'Hello, ' + name + '!';
}

// Test the function
greet('World');

// Try changing the language or theme above
// This editor supports:
// - Syntax highlighting
// - Error detection
// - Mobile responsiveness
// - Theme switching
// - Multiple programming languages`)

const addEvent = (eventName: string, data?: any) => {
  const timestamp = new Date().toLocaleTimeString()
  const eventStr = data 
    ? `[${timestamp}] ${eventName}: ${JSON.stringify(data)}`
    : `[${timestamp}] ${eventName}`
  events.value.unshift(eventStr)
  
  // Keep only last 10 events
  if (events.value.length > 10) {
    events.value = events.value.slice(0, 10)
  }
}

const onCodeChange = (newCode: string) => {
  addEvent('Code Changed', { length: newCode.length })
}

const onFocus = () => {
  addEvent('Editor Focused')
}

const onBlur = () => {
  addEvent('Editor Blurred')
}

const onError = (errors: Monaco.editor.IMarker[]) => {
  addEvent('Errors Detected', { count: errors.length })
}
</script>

<style scoped>
.code-editor-test-view {
  max-width: 1200px;
  margin: 0 auto;
}
</style>