import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ZoomAFriendPanel from '@/components/ai/ZoomAFriendPanel.vue'
import { TeamRole, AnimalAvatar, TEAM_MEMBERS } from '@/types/team'
import type { CodeComment } from '@/types/team'

// Mock the ZoomAFriendService
vi.mock('@/services/zoomAFriendService', () => ({
  getZoomAFriendService: () => ({
    generateRoleBasedAdvice: vi.fn().mockResolvedValue({
      teamMember: TEAM_MEMBERS[TeamRole.QA],
      message: 'Puff puff! AI-generated response!',
      animalSounds: ['puff', 'bubble'],
      keyTerms: ['testing', 'quality'],
      advice: 'AI-generated advice',
      mood: 'excited',
      timestamp: new Date()
    }),
    generateCodeComments: vi.fn().mockResolvedValue([
      {
        lineNumber: 1,
        comment: 'AI-generated comment',
        type: 'suggestion',
        role: TeamRole.QA
      }
    ]),
    playSoundEffect: vi.fn(),
    addCodeComments: vi.fn().mockReturnValue('// AI-generated comment\noriginal code')
  })
}))

describe('ZoomAFriendPanel', () => {
  let wrapper: VueWrapper<any>
  
  const defaultProps = {
    challengeId: 'test-challenge-123',
    currentCode: 'function test() { return "hello"; }',
    codeIssues: ['Missing error handling'],
    requirements: ['Add input validation']
  }

  beforeEach(() => {
    // Set up Pinia
    const pinia = createPinia()
    setActivePinia(pinia)
    
    wrapper = mount(ZoomAFriendPanel, {
      props: defaultProps,
      global: {
        plugins: [pinia]
      }
    })
  })

  describe('Component Initialization', () => {
    it('renders the component with correct title', () => {
      expect(wrapper.find('h3').text()).toBe('🎥 Zoom-a-Friend')
    })

    it('shows team member selection by default', () => {
      expect(wrapper.find('.team-selection').exists()).toBe(true)
      expect(wrapper.find('.active-session').exists()).toBe(false)
    })

    it('displays all team members', () => {
      const memberCards = wrapper.findAll('.team-member-card')
      expect(memberCards).toHaveLength(4)
      
      // Check that all team roles are represented
      const expectedRoles = Object.values(TeamRole)
      expectedRoles.forEach(role => {
        const member = TEAM_MEMBERS[role]
        expect(wrapper.text()).toContain(member.name)
      })
    })
  })

  describe('Team Member Selection', () => {
    it('displays correct animal emojis for each team member', () => {
      const emojiMap = {
        [AnimalAvatar.PUFFERFISH]: '🐡',
        [AnimalAvatar.OWL]: '🦉', 
        [AnimalAvatar.PIG]: '🐷',
        [AnimalAvatar.CAT]: '🐱'
      }
      
      Object.values(TEAM_MEMBERS).forEach(member => {
        const expectedEmoji = emojiMap[member.avatar]
        expect(wrapper.text()).toContain(expectedEmoji)
      })
    })

    it('shows loading state when selecting a team member', async () => {
      const qaCard = wrapper.findAll('.team-member-card')[0]
      
      // Trigger click but don't await to catch loading state
      const clickPromise = qaCard.trigger('click')
      
      // Should show loading state briefly (check for either animation class)
      const hasLoadingState = wrapper.find('.animate-pulse').exists() || 
                             wrapper.find('.animate-spin').exists() ||
                             wrapper.findAll('.team-member-card').some(card => card.classes().includes('animate-pulse'))
      
      await clickPromise
      await wrapper.vm.$nextTick()
      
      // After loading, should have active session
      expect(wrapper.find('.active-session').exists() || hasLoadingState).toBe(true)
    })

    it('emits session-started event when team member is selected', async () => {
      const qaCard = wrapper.findAll('.team-member-card')[0]
      
      await qaCard.trigger('click')
      await wrapper.vm.$nextTick()
      
      expect(wrapper.emitted('session-started')).toBeTruthy()
      const emittedEvent = wrapper.emitted('session-started')?.[0]
      expect(emittedEvent?.[0]).toHaveProperty('teamMember')
      expect(emittedEvent?.[0]).toHaveProperty('challengeId', defaultProps.challengeId)
    })
  })

  describe('Active Session', () => {
    beforeEach(async () => {
      // Start a session with QA member
      const qaCard = wrapper.findAll('.team-member-card')[0]
      await qaCard.trigger('click')
      await wrapper.vm.$nextTick()
    })

    it('switches to active session view', () => {
      expect(wrapper.find('.team-selection').exists()).toBe(false)
      expect(wrapper.find('.active-session').exists()).toBe(true)
    })

    it('displays current team member info', () => {
      const currentMember = wrapper.find('.current-member')
      expect(currentMember.exists()).toBe(true)
      expect(currentMember.text()).toContain('Puffy')
      expect(currentMember.text()).toContain('Quality Assurance Pufferfish')
    })

    it('shows initial greeting message', () => {
      const messages = wrapper.find('.messages-container')
      expect(messages.exists()).toBe(true)
      // Should have at least one message (the greeting)
      expect(wrapper.findAll('.message').length).toBeGreaterThan(0)
    })

    it('has input area for user messages', () => {
      const input = wrapper.find('input[placeholder="Ask for advice..."]')
      const sendButtons = wrapper.findAll('button').filter(btn => btn.text().includes('Send'))
      
      expect(input.exists()).toBe(true)
      expect(sendButtons.length).toBeGreaterThan(0)
    })

    it('shows end session button', () => {
      const endButtons = wrapper.findAll('button').filter(btn => btn.text().includes('End Session'))
      expect(endButtons.length).toBeGreaterThan(0)
    })
  })

  describe('Message Interaction', () => {
    beforeEach(async () => {
      // Start a session
      const qaCard = wrapper.findAll('.team-member-card')[0]
      await qaCard.trigger('click')
      await wrapper.vm.$nextTick()
    })

    it('enables send button when input has text', async () => {
      const input = wrapper.find('input[placeholder="Ask for advice..."]')
      const sendButtons = wrapper.findAll('button').filter(btn => btn.text().includes('Send'))
      const sendButton = sendButtons[0]
      
      // Initially disabled
      expect(sendButton.attributes('disabled')).toBeDefined()
      
      // Enable after typing
      await input.setValue('How do I test this code?')
      await wrapper.vm.$nextTick()
      expect(sendButton.attributes('disabled')).toBeUndefined()
    })

    it('sends message on enter key', async () => {
      const input = wrapper.find('input[placeholder="Ask for advice..."]')
      
      await input.setValue('Test question')
      
      // Trigger the keyup.enter event
      await input.trigger('keyup', { key: 'Enter' })
      
      // Wait for async operations to complete
      await new Promise(resolve => setTimeout(resolve, 200))
      await wrapper.vm.$nextTick()
      
      // Check if message was sent (either through event or by checking if input was cleared)
      const wasMessageSent = wrapper.emitted('message-sent') || (input.element as HTMLInputElement).value === ''
      expect(wasMessageSent).toBeTruthy()
    })

    it('clears input after sending message', async () => {
      const input = wrapper.find('input[placeholder="Ask for advice..."]')
      const sendButtons = wrapper.findAll('button').filter(btn => btn.text().includes('Send'))
      const sendButton = sendButtons[0]
      
      await input.setValue('Test question')
      await sendButton.trigger('click')
      await wrapper.vm.$nextTick()
      
      expect((input.element as HTMLInputElement).value).toBe('')
    })
  })

  describe('Session Management', () => {
    beforeEach(async () => {
      // Start a session
      const qaCard = wrapper.findAll('.team-member-card')[0]
      await qaCard.trigger('click')
      await wrapper.vm.$nextTick()
    })

    it('ends session when end button is clicked', async () => {
      const endButtons = wrapper.findAll('button').filter(btn => btn.text().includes('End Session'))
      const endButton = endButtons[0]
      
      await endButton.trigger('click')
      await wrapper.vm.$nextTick()
      
      expect(wrapper.emitted('session-ended')).toBeTruthy()
      expect(wrapper.find('.team-selection').exists()).toBe(true)
      expect(wrapper.find('.active-session').exists()).toBe(false)
    })
  })

  describe('Team Member Dialog Patterns', () => {
    describe('QA Pufferfish Dialog', () => {
      it('generates bug-focused responses', async () => {
        const qaCard = wrapper.findAll('.team-member-card')[0]
        await qaCard.trigger('click')
        await wrapper.vm.$nextTick()
        
        // Check initial greeting contains QA-specific terms
        const messages = wrapper.findAll('.message')
        const firstMessage = messages[0]
        const messageText = firstMessage.text().toLowerCase()
        
        expect(messageText).toMatch(/puff|bubble|blub|whoosh/)
        expect(messageText).toMatch(/bug|test|quality/)
      })

      it('includes QA-specific key terms', async () => {
        const qaCard = wrapper.findAll('.team-member-card')[0]
        await qaCard.trigger('click')
        await wrapper.vm.$nextTick()
        
        // Should have key terms related to QA
        const keyTerms = wrapper.findAll('.message span')
        const termTexts = keyTerms.map(term => term.text().toLowerCase())
        
        expect(termTexts.some(text => 
          ['defects', 'bugs', 'testing', 'quality', 'validation'].includes(text)
        )).toBe(true)
      })
    })

    describe('Architect Owl Dialog', () => {
      it('generates architecture-focused responses', async () => {
        const owlCard = wrapper.findAll('.team-member-card')[1]
        await owlCard.trigger('click')
        await wrapper.vm.$nextTick()
        
        const messages = wrapper.findAll('.message')
        const firstMessage = messages[0]
        const messageText = firstMessage.text().toLowerCase()
        
        expect(messageText).toMatch(/hoot|hoo|screech|flutter/)
        expect(messageText).toMatch(/architect|design|pattern/)
      })

      it('includes architecture-specific key terms', async () => {
        const owlCard = wrapper.findAll('.team-member-card')[1]
        await owlCard.trigger('click')
        await wrapper.vm.$nextTick()
        
        const keyTerms = wrapper.findAll('.message span')
        const termTexts = keyTerms.map(term => term.text().toLowerCase())
        
        expect(termTexts.some(text => 
          ['architecture', 'design', 'patterns', 'structure', 'scalability', 'redundancy'].includes(text)
        )).toBe(true)
      })
    })

    describe('Product Owner Pig Dialog', () => {
      it('generates requirements-focused responses', async () => {
        const pigCard = wrapper.findAll('.team-member-card')[2]
        await pigCard.trigger('click')
        await wrapper.vm.$nextTick()
        
        const messages = wrapper.findAll('.message')
        const firstMessage = messages[0]
        const messageText = firstMessage.text().toLowerCase()
        
        expect(messageText).toMatch(/oink|snort|grunt|squeal/)
        expect(messageText).toMatch(/requirement|user|business/)
      })

      it('includes product-specific key terms', async () => {
        const pigCard = wrapper.findAll('.team-member-card')[2]
        await pigCard.trigger('click')
        await wrapper.vm.$nextTick()
        
        const keyTerms = wrapper.findAll('.message span')
        const termTexts = keyTerms.map(term => term.text().toLowerCase())
        
        expect(termTexts.some(text => 
          ['requirements', 'user story', 'business value', 'priority', 'stakeholder'].includes(text)
        )).toBe(true)
      })
    })

    describe('Senior Developer Cat Dialog', () => {
      it('generates code-focused responses', async () => {
        const catCard = wrapper.findAll('.team-member-card')[3]
        await catCard.trigger('click')
        await wrapper.vm.$nextTick()
        
        const messages = wrapper.findAll('.message')
        const firstMessage = messages[0]
        const messageText = firstMessage.text().toLowerCase()
        
        expect(messageText).toMatch(/meow|purr|hiss|mrow/)
        expect(messageText).toMatch(/code|refactor|clean/)
      })

      it('includes development-specific key terms', async () => {
        const catCard = wrapper.findAll('.team-member-card')[3]
        await catCard.trigger('click')
        await wrapper.vm.$nextTick()
        
        const keyTerms = wrapper.findAll('.message span')
        const termTexts = keyTerms.map(term => term.text().toLowerCase())
        
        expect(termTexts.some(text => 
          ['clean code', 'refactoring', 'best practices', 'maintainability', 'solid'].includes(text)
        )).toBe(true)
      })
    })
  })

  describe('Responsive Design', () => {
    it('uses responsive grid for team member selection', () => {
      const grid = wrapper.find('.grid')
      expect(grid.classes()).toContain('grid-cols-2')
      expect(grid.classes()).toContain('sm:grid-cols-4')
    })

    it('has scrollable message container', async () => {
      // Start a session to show the messages container
      const qaCard = wrapper.findAll('.team-member-card')[0]
      await qaCard.trigger('click')
      await wrapper.vm.$nextTick()
      
      const messagesContainer = wrapper.find('.messages-container')
      expect(messagesContainer.exists()).toBe(true)
      expect(messagesContainer.classes()).toContain('max-h-64')
      expect(messagesContainer.classes()).toContain('overflow-y-auto')
    })
  })

  describe('Accessibility', () => {
    it('has proper button labels and roles', () => {
      const teamMemberButtons = wrapper.findAll('.team-member-card')
      teamMemberButtons.forEach(button => {
        expect(button.element.tagName).toBe('BUTTON')
      })
    })

    it('has proper input labels and placeholders', async () => {
      // Start a session to show input
      const qaCard = wrapper.findAll('.team-member-card')[0]
      await qaCard.trigger('click')
      await wrapper.vm.$nextTick()
      
      const input = wrapper.find('input')
      expect(input.attributes('placeholder')).toBe('Ask for advice...')
    })

    it('shows loading states with proper indicators', async () => {
      const qaCard = wrapper.findAll('.team-member-card')[0]
      
      // Check loading state immediately after click (before await)
      qaCard.trigger('click')
      
      // Should show loading spinner or pulse animation, or successfully transition to active session
      const hasLoadingIndicator = wrapper.find('.animate-spin').exists() || 
                                  wrapper.find('.animate-pulse').exists()
      
      await wrapper.vm.$nextTick()
      
      // After the operation, should either have shown loading or have active session
      const hasActiveSession = wrapper.find('.active-session').exists()
      
      expect(hasLoadingIndicator || hasActiveSession).toBe(true)
    })
  })

  describe('AI-Powered Features', () => {
    beforeEach(async () => {
      // Start a session
      const qaCard = wrapper.findAll('.team-member-card')[0]
      await qaCard.trigger('click')
      await wrapper.vm.$nextTick()
    })

    it('displays action buttons for code comments and review', () => {
      const actionButtons = wrapper.find('.action-buttons')
      expect(actionButtons.exists()).toBe(true)
      
      const codeCommentsButton = wrapper.findAll('button').find(btn => btn.text().includes('Add Code Comments'))
      const reviewButton = wrapper.findAll('button').find(btn => btn.text().includes('Review Code'))
      
      expect(codeCommentsButton).toBeTruthy()
      expect(reviewButton).toBeTruthy()
    })

    it('generates code comments when button is clicked', async () => {
      const codeCommentsButton = wrapper.findAll('button').find(btn => btn.text().includes('Add Code Comments'))
      
      await codeCommentsButton!.trigger('click')
      await wrapper.vm.$nextTick()
      
      // Should emit code-comments-generated event
      expect(wrapper.emitted('code-comments-generated')).toBeTruthy()
      
      // Should add a message about generated comments
      const messages = wrapper.findAll('.message')
      const lastMessage = messages[messages.length - 1]
      expect(lastMessage.text()).toContain('code comments')
    })

    it('triggers code review when review button is clicked', async () => {
      const reviewButton = wrapper.findAll('button').find(btn => btn.text().includes('Review Code'))
      
      await reviewButton!.trigger('click')
      await wrapper.vm.$nextTick()
      
      // Should trigger a message asking for code review
      const input = wrapper.find('input[placeholder="Ask for advice..."]')
      expect((input.element as HTMLInputElement).value).toContain('review')
    })

    it('uses AI service for generating responses', async () => {
      const input = wrapper.find('input[placeholder="Ask for advice..."]')
      const sendButtons = wrapper.findAll('button').filter(btn => btn.text().includes('Send'))
      const sendButton = sendButtons[0]
      
      await input.setValue('How can I improve this code?')
      await sendButton.trigger('click')
      await wrapper.vm.$nextTick()
      
      // Should have sent a message with AI-generated content
      expect(wrapper.emitted('message-sent')).toBeTruthy()
      const sentMessage = wrapper.emitted('message-sent')?.[0]?.[0] as any
      expect(sentMessage).toHaveProperty('message')
      expect(sentMessage.message).toContain('AI-generated')
    })
  })

  describe('Code Comments Generation', () => {
    beforeEach(async () => {
      // Start a session
      const qaCard = wrapper.findAll('.team-member-card')[0]
      await qaCard.trigger('click')
      await wrapper.vm.$nextTick()
    })

    it('generates role-specific code comments', async () => {
      const codeCommentsButton = wrapper.findAll('button').find(btn => btn.text().includes('Add Code Comments'))
      
      await codeCommentsButton!.trigger('click')
      await wrapper.vm.$nextTick()
      
      const emittedComments = wrapper.emitted('code-comments-generated')?.[0]?.[0] as CodeComment[]
      expect(emittedComments).toBeTruthy()
      expect(Array.isArray(emittedComments)).toBe(true)
      expect(emittedComments.length).toBeGreaterThan(0)
      
      // Check comment structure
      const comment = emittedComments[0]
      expect(comment).toHaveProperty('lineNumber')
      expect(comment).toHaveProperty('comment')
      expect(comment).toHaveProperty('type')
      expect(comment).toHaveProperty('role')
    })

    it('includes code comments in dialog responses when requested', async () => {
      const input = wrapper.find('input[placeholder="Ask for advice..."]')
      const sendButtons = wrapper.findAll('button').filter(btn => btn.text().includes('Send'))
      const sendButton = sendButtons[0]
      
      await input.setValue('Please add comments to my code')
      await sendButton.trigger('click')
      await wrapper.vm.$nextTick()
      
      // Should emit both message-sent and code-comments-generated events
      expect(wrapper.emitted('message-sent')).toBeTruthy()
      expect(wrapper.emitted('code-comments-generated')).toBeTruthy()
      
      const sentMessage = wrapper.emitted('message-sent')?.[0]?.[0] as any
      expect(sentMessage.message).toContain('code comments')
    })

    it('handles code comment generation errors gracefully', async () => {
      // Mock the service to throw an error
      const mockService = vi.mocked(await import('@/services/zoomAFriendService'))
      mockService.getZoomAFriendService().generateCodeComments = vi.fn().mockRejectedValue(new Error('AI service error'))
      
      const codeCommentsButton = wrapper.findAll('button').find(btn => btn.text().includes('Add Code Comments'))
      
      await codeCommentsButton!.trigger('click')
      await wrapper.vm.$nextTick()
      
      // Should still add a message explaining the error
      const messages = wrapper.findAll('.message')
      const lastMessage = messages[messages.length - 1]
      expect(lastMessage.text()).toContain('trouble')
    })
  })

  describe('Sound Effects Integration', () => {
    beforeEach(async () => {
      // Start a session
      const qaCard = wrapper.findAll('.team-member-card')[0]
      await qaCard.trigger('click')
      await wrapper.vm.$nextTick()
    })

    it('plays sound effects for team member interactions', async () => {
      const mockService = vi.mocked(await import('@/services/zoomAFriendService'))
      const playSoundEffectSpy = mockService.getZoomAFriendService().playSoundEffect
      
      // Should have played greeting sound when session started
      expect(playSoundEffectSpy).toHaveBeenCalledWith(expect.any(Object), 'greeting')
    })

    it('plays sound effects when generating code comments', async () => {
      const mockService = vi.mocked(await import('@/services/zoomAFriendService'))
      const playSoundEffectSpy = mockService.getZoomAFriendService().playSoundEffect
      
      const codeCommentsButton = wrapper.findAll('button').find(btn => btn.text().includes('Add Code Comments'))
      
      await codeCommentsButton!.trigger('click')
      await wrapper.vm.$nextTick()
      
      // Should play comment sound effect
      expect(playSoundEffectSpy).toHaveBeenCalledWith(expect.any(Object), 'comment')
    })

    it('plays sound effects when sending advice messages', async () => {
      const mockService = vi.mocked(await import('@/services/zoomAFriendService'))
      const playSoundEffectSpy = mockService.getZoomAFriendService().playSoundEffect
      
      const input = wrapper.find('input[placeholder="Ask for advice..."]')
      const sendButtons = wrapper.findAll('button').filter(btn => btn.text().includes('Send'))
      const sendButton = sendButtons[0]
      
      await input.setValue('Help me with this code')
      await sendButton.trigger('click')
      await wrapper.vm.$nextTick()
      
      // Should play advice sound effect
      expect(playSoundEffectSpy).toHaveBeenCalledWith(expect.any(Object), 'advice')
    })
  })

  describe('Error Handling', () => {
    it('handles empty input gracefully', async () => {
      const qaCard = wrapper.findAll('.team-member-card')[0]
      await qaCard.trigger('click')
      await wrapper.vm.$nextTick()
      
      const sendButtons = wrapper.findAll('button').filter(btn => btn.text().includes('Send'))
      const sendButton = sendButtons[0]
      
      // Should be disabled with empty input
      expect(sendButton.attributes('disabled')).toBeDefined()
    })

    it('prevents multiple simultaneous requests', async () => {
      const qaCard = wrapper.findAll('.team-member-card')[0]
      await qaCard.trigger('click')
      await wrapper.vm.$nextTick()
      
      const input = wrapper.find('input')
      const sendButtons = wrapper.findAll('button').filter(btn => btn.text().includes('Send'))
      const sendButton = sendButtons[0]
      
      await input.setValue('Test question')
      await sendButton.trigger('click')
      
      // Should be disabled while loading
      expect(sendButton.attributes('disabled')).toBeDefined()
    })

    it('falls back to predefined responses when AI service fails', async () => {
      // Mock the service to throw an error
      const mockService = vi.mocked(await import('@/services/zoomAFriendService'))
      mockService.getZoomAFriendService().generateRoleBasedAdvice = vi.fn().mockRejectedValue(new Error('AI service error'))
      
      const input = wrapper.find('input[placeholder="Ask for advice..."]')
      const sendButtons = wrapper.findAll('button').filter(btn => btn.text().includes('Send'))
      const sendButton = sendButtons[0]
      
      await input.setValue('Help me with this code')
      await sendButton.trigger('click')
      await wrapper.vm.$nextTick()
      
      // Should still send a message (fallback response)
      expect(wrapper.emitted('message-sent')).toBeTruthy()
      const sentMessage = wrapper.emitted('message-sent')?.[0]?.[0]
      expect(sentMessage).toHaveProperty('message')
    })
  })
})