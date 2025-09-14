<template>
  <div class="ai-chat-interface flex flex-col h-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg" data-testid="ai-chat-interface">
    <!-- Header -->
    <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
      <div class="flex items-center space-x-2">
        <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
          <span class="text-white text-sm font-bold">AI</span>
        </div>
        <div>
          <h3 class="font-semibold text-gray-900 dark:text-white">AI Assistant</h3>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            {{ isConnected ? 'Ready to help' : 'Connecting...' }}
          </p>
        </div>
      </div>
      <button
        @click="clearChat"
        class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        title="Clear conversation"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
        </svg>
      </button>
    </div>

    <!-- Messages Container -->
    <div 
      ref="messagesContainer"
      class="flex-1 overflow-y-auto p-4 space-y-4 min-h-0"
      @scroll="handleScroll"
    >
      <!-- Welcome Message -->
      <div v-if="messages.length === 0" class="text-center py-8">
        <div class="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.959 8.959 0 01-4.906-1.471L3 21l2.471-5.094A8.959 8.959 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z"></path>
          </svg>
        </div>
        <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Ready to help with your {{ challengeContext?.challenge.kaiju.name }} challenge!
        </h4>
        <p class="text-gray-600 dark:text-gray-400 text-sm max-w-md mx-auto">
          Ask me about refactoring, testing, implementing requirements, or any coding questions you have.
        </p>
      </div>

      <!-- Messages -->
      <div
        v-for="message in messages"
        :key="message.id"
        :class="[
          'flex',
          message.role === 'user' ? 'justify-end' : 'justify-start'
        ]"
      >
        <div
          :class="[
            'max-w-[80%] rounded-lg px-4 py-2',
            message.role === 'user'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
          ]"
          :data-testid="message.role === 'assistant' ? 'ai-message' : 'user-message'"
        >
          <div 
            class="markdown-content whitespace-pre-wrap break-words"
            v-html="renderMessageContent(message.content, message.role === 'assistant')"
          ></div>
          <div
            :class="[
              'text-xs mt-1 opacity-70',
              message.role === 'user' ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
            ]"
          >
            {{ formatTime(message.timestamp) }}
          </div>
        </div>
      </div>

      <!-- Loading Message -->
      <div v-if="isLoading" class="flex justify-start">
        <div class="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-2 max-w-[80%]">
          <div class="flex items-center space-x-2">
            <div class="flex space-x-1">
              <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
              <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
            </div>
            <span class="text-sm text-gray-600 dark:text-gray-400">AI is thinking...</span>
          </div>
        </div>
      </div>

      <!-- Error Message -->
      <div v-if="error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4" data-testid="ai-error-message">
        <div class="flex items-start space-x-2">
          <svg class="w-5 h-5 text-red-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <div>
            <p class="text-sm text-red-800 dark:text-red-200">{{ error }}</p>
            <button
              @click="retryLastMessage"
              class="text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 mt-1 underline"
              data-testid="ai-retry-btn"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Input Area -->
    <div class="border-t border-gray-200 dark:border-gray-700 p-4">
      <div class="flex space-x-2">
        <div class="flex-1 relative">
          <textarea
            ref="messageInput"
            v-model="currentMessage"
            @keydown="handleKeyDown"
            @input="handleInput"
            placeholder="Ask AI for help with refactoring, testing, or implementing features..."
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            rows="1"
            :disabled="isLoading"
            maxlength="2000"
            data-testid="ai-chat-input"
          ></textarea>
          <div class="absolute bottom-2 right-2 text-xs text-gray-400">
            {{ currentMessage.length }}/2000
          </div>
        </div>
        <button
          @click="sendMessage"
          :disabled="!canSendMessage"
          :class="[
            'px-4 py-2 rounded-lg font-medium transition-colors',
            canSendMessage
              ? 'bg-blue-500 hover:bg-blue-600 text-white'
              : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
          ]"
          data-testid="ai-chat-send"
        >
          <svg v-if="isLoading" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
          </svg>
        </button>
      </div>
      
      <!-- Quick Actions -->
      <div class="flex flex-wrap gap-2 mt-2">
        <button
          v-for="action in quickActions"
          :key="action.text"
          @click="sendQuickAction(action.text)"
          :disabled="isLoading"
          class="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ action.text }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch, onMounted, onUnmounted } from 'vue';
import type { AIChatMessage } from '@/types/api';
import type { ChallengeContext } from '@/types/challenge';
import { getAIService } from '@/services/aiService';
import { renderMessageContent } from '@/services/markdownService';

interface Props {
  challengeContext: ChallengeContext;
  userId?: string;
}

const props = defineProps<Props>();

// Reactive state
const messages = ref<AIChatMessage[]>([]);
const currentMessage = ref('');
const isLoading = ref(false);
const error = ref<string | null>(null);
const isConnected = ref(true);
const messagesContainer = ref<HTMLElement>();
const messageInput = ref<HTMLTextAreaElement>();
const lastMessage = ref<string>('');

// Quick action buttons
const quickActions = ref([
  { text: 'Help me refactor this code' },
  { text: 'Write unit tests' },
  { text: 'Explain the requirements' },
  { text: 'Find bugs in my code' },
  { text: 'Suggest improvements' }
]);

// Computed properties
const canSendMessage = computed(() => {
  return !isLoading.value && isConnected.value;
});

// Methods
const sendMessage = async () => {
  if (!canSendMessage.value) return;

  const messageText = currentMessage.value.trim();
  lastMessage.value = messageText;
  currentMessage.value = '';
  error.value = null;
  isLoading.value = true;

  try {
    const aiService = getAIService();
    const response = await aiService.sendMessage(messageText, props.challengeContext, props.userId);

    if (response.success && response.message) {
      // The user message is already added by the service, just add the AI response
      messages.value = aiService.getConversationHistory(
        `${props.challengeContext.challenge.id}-${props.userId || 'anonymous'}`
      );
    } else {
      error.value = response.error || 'Failed to get AI response';
    }
  } catch (err) {
    console.error('Chat error:', err);
    error.value = 'Network error. Please check your connection and try again.';
  } finally {
    isLoading.value = false;
    await nextTick();
    scrollToBottom();
  }
};

const sendQuickAction = (actionText: string) => {
  currentMessage.value = actionText;
  sendMessage();
};

const retryLastMessage = () => {
  if (lastMessage.value) {
    currentMessage.value = lastMessage.value;
    sendMessage();
  }
};

const clearChat = () => {
  try {
    const aiService = getAIService();
    aiService.clearConversationHistory(props.challengeContext.challenge.id, props.userId);
    messages.value = [];
    error.value = null;
  } catch (err) {
    console.error('Error clearing chat:', err);
  }
};

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
};

const handleInput = () => {
  // Auto-resize textarea
  if (messageInput.value) {
    messageInput.value.style.height = 'auto';
    messageInput.value.style.height = Math.min(messageInput.value.scrollHeight, 120) + 'px';
  }
};

const handleScroll = () => {
  // Could implement scroll-based features like loading older messages
};

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
};

const formatTime = (timestamp: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(new Date(timestamp));
};

// Watch for challenge context changes
watch(
  () => props.challengeContext,
  (newContext, oldContext) => {
    if (newContext?.challenge.id !== oldContext?.challenge.id) {
      // Load conversation history for new challenge
      try {
        const aiService = getAIService();
        messages.value = aiService.getConversationHistory(
          `${newContext.challenge.id}-${props.userId || 'anonymous'}`
        );
      } catch (err) {
        console.error('Error loading conversation history:', err);
        messages.value = [];
      }
    }
  },
  { immediate: true }
);

// Lifecycle hooks
onMounted(() => {
  // Load existing conversation history
  try {
    const aiService = getAIService();
    messages.value = aiService.getConversationHistory(
      `${props.challengeContext.challenge.id}-${props.userId || 'anonymous'}`
    );
  } catch (err) {
    console.error('Error loading conversation history:', err);
    isConnected.value = false;
  }

  // Auto-focus input on desktop
  if (window.innerWidth >= 768) {
    nextTick(() => {
      messageInput.value?.focus();
    });
  }
});

onUnmounted(() => {
  // Cleanup if needed
});
</script>

<style scoped>
.ai-chat-interface {
  min-height: 400px;
}

/* Custom scrollbar for messages */
.ai-chat-interface ::-webkit-scrollbar {
  width: 6px;
}

.ai-chat-interface ::-webkit-scrollbar-track {
  background: transparent;
}

.ai-chat-interface ::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.5);
  border-radius: 3px;
}

.ai-chat-interface ::-webkit-scrollbar-thumb:hover {
  background: rgba(156, 163, 175, 0.7);
}

/* Dark mode scrollbar */
.dark .ai-chat-interface ::-webkit-scrollbar-thumb {
  background: rgba(75, 85, 99, 0.5);
}

.dark .ai-chat-interface ::-webkit-scrollbar-thumb:hover {
  background: rgba(75, 85, 99, 0.7);
}
</style>