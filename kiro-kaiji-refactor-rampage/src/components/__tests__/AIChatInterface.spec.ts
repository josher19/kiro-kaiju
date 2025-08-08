/**
 * AIChatInterface Component Tests
 * 
 * Tests for the AI chat interface component including message display,
 * user interactions, and integration with the AI service
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import { nextTick } from 'vue';
import AIChatInterface from '../ai/AIChatInterface.vue';
import type { ChallengeContext } from '@/types/challenge';
import type { KaijuMonster } from '@/types/kaiju';
import { KaijuType } from '@/types/kaiju';
import { ProgrammingLanguage, ChallengeCategory, DifficultyLevel } from '@/types/challenge';
import { createAIService } from '@/services/aiService';

// Mock the AI service
vi.mock('@/services/aiService', () => ({
  getAIService: vi.fn(),
  createAIService: vi.fn()
}));

describe('AIChatInterface', () => {
  let wrapper: VueWrapper<any>;
  let mockChallengeContext: ChallengeContext;
  let mockAIService: any;

  beforeEach(async () => {
    // Create mock AI service
    mockAIService = {
      sendMessage: vi.fn(),
      getConversationHistory: vi.fn().mockReturnValue([]),
      clearConversationHistory: vi.fn()
    };

    // Mock the getAIService function
    const { getAIService } = await import('@/services/aiService');
    vi.mocked(getAIService).mockReturnValue(mockAIService);

    // Create mock challenge context
    const mockKaiju: KaijuMonster = {
      id: 'hydra-bug',
      name: 'HydraBug',
      type: KaijuType.HYDRA_BUG,
      description: 'A monster that multiplies bugs',
      avatar: '/images/hydra-bug.png',
      codePatterns: [],
      difficultyModifiers: [],
      specialAbilities: ['Bug multiplication', 'Recursive spawning'],
      weaknesses: ['Proper error handling', 'Unit testing'],
      flavorText: 'Ancient bug multiplier'
    };

    mockChallengeContext = {
      challenge: {
        id: 'test-challenge-1',
        kaiju: mockKaiju,
        config: {
          language: ProgrammingLanguage.JAVASCRIPT,
          category: ChallengeCategory.REFACTORING,
          difficulty: DifficultyLevel.INTERMEDIATE
        },
        title: 'Test Challenge',
        description: 'A test challenge',
        initialCode: 'function test() { return true; }',
        requirements: [
          {
            id: 'req-1',
            description: 'Fix the bugs',
            priority: 'must',
            testable: true,
            acceptanceCriteria: ['No bugs remain']
          }
        ],
        testCases: [],
        hints: [],
        createdAt: new Date()
      },
      currentCode: 'function test() { return true; }',
      attempts: 1,
      startTime: new Date(),
      lastModified: new Date()
    };
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
    vi.restoreAllMocks();
  });

  const createWrapper = (props = {}) => {
    return mount(AIChatInterface, {
      props: {
        challengeContext: mockChallengeContext,
        userId: 'test-user',
        ...props
      }
    });
  };

  describe('component rendering', () => {
    it('should render the chat interface', () => {
      wrapper = createWrapper();
      
      expect(wrapper.find('.ai-chat-interface').exists()).toBe(true);
      expect(wrapper.find('h3').text()).toBe('Kiro AI Assistant');
    });

    it('should show welcome message when no messages exist', () => {
      wrapper = createWrapper();
      
      expect(wrapper.text()).toContain('Ready to help with your HydraBug challenge!');
      expect(wrapper.text()).toContain('Ask me about refactoring, testing, implementing requirements');
    });

    it('should display challenge context in welcome message', () => {
      wrapper = createWrapper();
      
      expect(wrapper.text()).toContain('HydraBug challenge');
    });

    it('should render message input and send button', () => {
      wrapper = createWrapper();
      
      const textarea = wrapper.find('textarea');
      const buttons = wrapper.findAll('button');
      const sendButton = buttons[buttons.length - 1]; // Last button should be send
      
      expect(textarea.exists()).toBe(true);
      expect(sendButton.exists()).toBe(true);
      expect(textarea.attributes('placeholder')).toContain('Ask Kiro AI for help');
    });

    it('should render quick action buttons', () => {
      wrapper = createWrapper();
      
      const quickActions = wrapper.findAll('.px-3.py-1');
      expect(quickActions.length).toBeGreaterThan(0);
      expect(quickActions[0].text()).toContain('Help me refactor');
    });
  });

  describe('message handling', () => {
    it('should enable send button when message is entered', async () => {
      wrapper = createWrapper();
      
      const textarea = wrapper.find('textarea');
      const sendButton = wrapper.find('button[class*="bg-blue-500"], button[class*="bg-gray-300"]');
      
      // Initially disabled (check if button has disabled class or attribute)
      expect(sendButton?.classes()).toContain('cursor-not-allowed');
      
      // Enter message
      await textarea.setValue('Help me with this code');
      
      // Should be enabled
      expect(sendButton?.attributes('disabled')).toBeUndefined();
    });

    it('should send message when send button is clicked', async () => {
      mockAIService.sendMessage.mockResolvedValue({
        success: true,
        message: {
          id: 'msg-1',
          role: 'assistant',
          content: 'AI response',
          timestamp: new Date()
        }
      });

      wrapper = createWrapper();
      
      const textarea = wrapper.find('textarea');
      const sendButton = wrapper.find('button[class*="bg-blue-500"], button[class*="bg-gray-300"]');
      
      await textarea.setValue('Help me refactor this code');
      await sendButton?.trigger('click');
      
      expect(mockAIService.sendMessage).toHaveBeenCalledWith(
        'Help me refactor this code',
        mockChallengeContext,
        'test-user'
      );
    });

    it('should send message when Enter is pressed', async () => {
      mockAIService.sendMessage.mockResolvedValue({
        success: true,
        message: {
          id: 'msg-1',
          role: 'assistant',
          content: 'AI response',
          timestamp: new Date()
        }
      });

      wrapper = createWrapper();
      
      const textarea = wrapper.find('textarea');
      
      await textarea.setValue('Test message');
      await textarea.trigger('keydown', { key: 'Enter' });
      
      expect(mockAIService.sendMessage).toHaveBeenCalledWith(
        'Test message',
        mockChallengeContext,
        'test-user'
      );
    });

    it('should not send message when Shift+Enter is pressed', async () => {
      wrapper = createWrapper();
      
      const textarea = wrapper.find('textarea');
      
      await textarea.setValue('Test message');
      await textarea.trigger('keydown', { key: 'Enter', shiftKey: true });
      
      expect(mockAIService.sendMessage).not.toHaveBeenCalled();
    });

    it('should clear input after sending message', async () => {
      mockAIService.sendMessage.mockResolvedValue({
        success: true,
        message: {
          id: 'msg-1',
          role: 'assistant',
          content: 'AI response',
          timestamp: new Date()
        }
      });

      wrapper = createWrapper();
      
      const textarea = wrapper.find('textarea');
      const buttons = wrapper.findAll('button');
      const sendButton = buttons[buttons.length - 1];
      
      await textarea.setValue('Test message');
      await sendButton?.trigger('click');
      await nextTick();
      
      expect((textarea.element as HTMLTextAreaElement).value).toBe('');
    });
  });

  describe('quick actions', () => {
    it('should send quick action message when clicked', async () => {
      mockAIService.sendMessage.mockResolvedValue({
        success: true,
        message: {
          id: 'msg-1',
          role: 'assistant',
          content: 'AI response',
          timestamp: new Date()
        }
      });

      wrapper = createWrapper();
      
      const quickActionButton = wrapper.find('.px-3.py-1');
      await quickActionButton.trigger('click');
      
      expect(mockAIService.sendMessage).toHaveBeenCalled();
    });

    it('should disable quick actions when loading', async () => {
      // Mock a slow response to test loading state
      mockAIService.sendMessage.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );

      wrapper = createWrapper();
      
      const textarea = wrapper.find('textarea');
      await textarea.setValue('Test message');
      
      const buttons = wrapper.findAll('button');
      const sendButton = buttons[buttons.length - 1];
      await sendButton?.trigger('click');
      
      // Quick actions should be disabled during loading
      const quickActions = wrapper.findAll('.px-3.py-1');
      quickActions.forEach(action => {
        expect(action.attributes('disabled')).toBeDefined();
      });
    });
  });

  describe('loading states', () => {
    it('should show loading indicator when sending message', async () => {
      // Mock a slow response
      mockAIService.sendMessage.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );

      wrapper = createWrapper();
      
      const textarea = wrapper.find('textarea');
      const buttons = wrapper.findAll('button');
      const sendButton = buttons[buttons.length - 1];
      
      await textarea.setValue('Test message');
      await sendButton?.trigger('click');
      
      // Should show loading state
      expect(wrapper.text()).toContain('Kiro AI is thinking...');
      expect(wrapper.find('.animate-bounce').exists()).toBe(true);
    });

    it('should disable input during loading', async () => {
      mockAIService.sendMessage.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );

      wrapper = createWrapper();
      
      const textarea = wrapper.find('textarea');
      const buttons = wrapper.findAll('button');
      const sendButton = buttons[buttons.length - 1];
      
      await textarea.setValue('Test message');
      await sendButton?.trigger('click');
      
      expect(textarea.attributes('disabled')).toBeDefined();
      expect(sendButton?.attributes('disabled')).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should display error message when AI service fails', async () => {
      mockAIService.sendMessage.mockResolvedValue({
        success: false,
        error: 'Network error occurred'
      });

      wrapper = createWrapper();
      
      const textarea = wrapper.find('textarea');
      const buttons = wrapper.findAll('button');
      const sendButton = buttons[buttons.length - 1];
      
      await textarea.setValue('Test message');
      await sendButton?.trigger('click');
      await nextTick();
      
      expect(wrapper.text()).toContain('Network error occurred');
      expect(wrapper.find('.text-red-800').exists()).toBe(true);
    });

    it('should provide retry functionality on error', async () => {
      mockAIService.sendMessage
        .mockResolvedValueOnce({
          success: false,
          error: 'Network error'
        })
        .mockResolvedValueOnce({
          success: true,
          message: {
            id: 'msg-1',
            role: 'assistant',
            content: 'Success on retry',
            timestamp: new Date()
          }
        });

      wrapper = createWrapper();
      
      const textarea = wrapper.find('textarea');
      const buttons = wrapper.findAll('button');
      const sendButton = buttons[buttons.length - 1];
      
      // First attempt fails
      await textarea.setValue('Test message');
      await sendButton?.trigger('click');
      await nextTick();
      
      expect(wrapper.text()).toContain('Network error');
      
      // Click retry
      const retryButton = wrapper.find('.underline');
      await retryButton.trigger('click');
      await nextTick();
      
      expect(mockAIService.sendMessage).toHaveBeenCalledTimes(2);
    });
  });

  describe('conversation history', () => {
    it('should load existing conversation history on mount', () => {
      const mockHistory = [
        {
          id: 'msg-1',
          role: 'user',
          content: 'Previous message',
          timestamp: new Date()
        },
        {
          id: 'msg-2',
          role: 'assistant',
          content: 'Previous response',
          timestamp: new Date()
        }
      ];

      mockAIService.getConversationHistory.mockReturnValue(mockHistory);

      wrapper = createWrapper();
      
      expect(mockAIService.getConversationHistory).toHaveBeenCalledWith(
        'test-challenge-1-test-user'
      );
    });

    it('should clear conversation history when clear button is clicked', async () => {
      wrapper = createWrapper();
      
      const clearButton = wrapper.find('button[title="Clear conversation"]');
      await clearButton.trigger('click');
      
      expect(mockAIService.clearConversationHistory).toHaveBeenCalledWith(
        'test-challenge-1',
        'test-user'
      );
    });
  });

  describe('character limit', () => {
    it('should show character count', async () => {
      wrapper = createWrapper();
      
      const textarea = wrapper.find('textarea');
      await textarea.setValue('Test message');
      
      expect(wrapper.text()).toContain('12/2000');
    });

    it('should enforce character limit', () => {
      wrapper = createWrapper();
      
      const textarea = wrapper.find('textarea');
      expect(textarea.attributes('maxlength')).toBe('2000');
    });
  });

  describe('responsive behavior', () => {
    it('should handle mobile viewport', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500
      });

      wrapper = createWrapper();
      
      // Component should still render properly on mobile
      expect(wrapper.find('.ai-chat-interface').exists()).toBe(true);
    });
  });
});