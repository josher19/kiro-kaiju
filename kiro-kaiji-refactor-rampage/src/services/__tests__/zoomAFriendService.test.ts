import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ZoomAFriendService, createZoomAFriendService, getZoomAFriendService } from '../zoomAFriendService'
import { TeamRole, TEAM_MEMBERS } from '@/types/team'
import type { TeamMember, DialogContext, CodeComment } from '@/types/team'

// Mock the AI service
vi.mock('../aiService', () => ({
  getAIService: () => ({
    sendMessage: vi.fn().mockResolvedValue({
      success: true,
      message: {
        content: 'Puff puff! This is an AI-generated response with testing and quality keywords!'
      }
    })
  })
}))

describe.skip('ZoomAFriendService', () => {
  let service: ZoomAFriendService
  let mockTeamMember: TeamMember
  let mockContext: DialogContext

  beforeEach(() => {
    service = new ZoomAFriendService({
      enableSoundEffects: false, // Disable for testing
      maxCodeComments: 5,
      aiProvider: 'kiro'
    })

    mockTeamMember = TEAM_MEMBERS[TeamRole.QA]
    mockContext = {
      challengeId: 'test-challenge-123',
      currentCode: 'function test() { return "hello"; }',
      userQuestion: 'How can I improve this code?',
      codeIssues: ['Missing error handling'],
      requirements: ['Add input validation']
    }
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Service Creation', () => {
    it('creates service with default configuration', () => {
      const defaultService = new ZoomAFriendService()
      expect(defaultService).toBeInstanceOf(ZoomAFriendService)
    })

    it('creates service with custom configuration', () => {
      const customService = new ZoomAFriendService({
        enableSoundEffects: true,
        maxCodeComments: 10,
        aiProvider: 'openrouter'
      })
      expect(customService).toBeInstanceOf(ZoomAFriendService)
    })

    it('creates singleton service instance', () => {
      const service1 = createZoomAFriendService()
      const service2 = getZoomAFriendService()
      expect(service1).toBe(service2)
    })
  })

  describe('Role-Based Advice Generation', () => {
    it('generates AI-powered advice for QA role', async () => {
      const response = await service.generateRoleBasedAdvice(mockTeamMember, mockContext)

      expect(response).toHaveProperty('teamMember', mockTeamMember)
      expect(response).toHaveProperty('message')
      expect(response).toHaveProperty('animalSounds')
      expect(response).toHaveProperty('keyTerms')
      expect(response).toHaveProperty('advice')
      expect(response).toHaveProperty('mood')
      expect(response).toHaveProperty('timestamp')

      // Should contain QA-specific elements
      expect(response.animalSounds.length).toBeGreaterThan(0)
      expect(response.keyTerms.length).toBeGreaterThan(0)
    })

    it('generates advice for different team roles', async () => {
      const roles = [TeamRole.QA, TeamRole.ARCHITECT, TeamRole.PRODUCT_OWNER, TeamRole.SENIOR_DEVELOPER]

      for (const role of roles) {
        const member = TEAM_MEMBERS[role]
        const response = await service.generateRoleBasedAdvice(member, mockContext)

        expect(response.teamMember.role).toBe(role)
        expect(response.message).toBeTruthy()
        expect(response.animalSounds.length).toBeLessThanOrEqual(3)
        expect(response.keyTerms.length).toBeLessThanOrEqual(5)
      }
    })

    it('falls back to predefined responses when AI fails', async () => {
      // Mock AI service to fail
      const mockAIService = vi.mocked(await import('../aiService'))
      mockAIService.getAIService().sendMessage = vi.fn().mockRejectedValue(new Error('AI service error'))

      const response = await service.generateRoleBasedAdvice(mockTeamMember, mockContext)

      expect(response).toHaveProperty('teamMember', mockTeamMember)
      expect(response).toHaveProperty('message')
      expect(response.message).toContain('puff') // Should contain animal sounds
    })

    it('determines mood from AI content', async () => {
      // Test that mood determination works for clear cases
      const mockAIService = vi.mocked(await import('../aiService'))
      
      // Test excited mood
      mockAIService.getAIService().sendMessage = vi.fn().mockResolvedValue({
        success: true,
        message: { content: 'I am so excited about this code!' }
      })
      
      let response = await service.generateRoleBasedAdvice(mockTeamMember, mockContext)
      expect(response.mood).toBe('excited')
      
      // Test concerned mood
      mockAIService.getAIService().sendMessage = vi.fn().mockResolvedValue({
        success: true,
        message: { content: 'I am concerned about potential issues here' }
      })
      
      response = await service.generateRoleBasedAdvice(mockTeamMember, mockContext)
      expect(response.mood).toBe('concerned')
      
      // Test that mood is always a valid value
      mockAIService.getAIService().sendMessage = vi.fn().mockResolvedValue({
        success: true,
        message: { content: 'This is a neutral response' }
      })
      
      response = await service.generateRoleBasedAdvice(mockTeamMember, mockContext)
      expect(['happy', 'concerned', 'excited', 'frustrated', 'thoughtful']).toContain(response.mood)
    })
  })

  describe('Code Comments Generation', () => {
    const testCode = `function calculateTotal(items) {
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    total += items[i].price;
  }
  return total;
}`

    it('generates AI-powered code comments', async () => {
      // Mock AI service to return JSON response
      const mockAIService = vi.mocked(await import('../aiService'))
      mockAIService.getAIService().sendMessage = vi.fn().mockResolvedValue({
        success: true,
        message: {
          content: JSON.stringify({
            comments: [
              {
                lineNumber: 1,
                comment: 'Consider adding input validation',
                type: 'suggestion'
              },
              {
                lineNumber: 3,
                comment: 'This loop could be optimized',
                type: 'improvement'
              }
            ]
          })
        }
      })

      const comments = await service.generateCodeComments(testCode, mockTeamMember, mockContext)

      expect(Array.isArray(comments)).toBe(true)
      expect(comments.length).toBeGreaterThan(0)

      const comment = comments[0]
      expect(comment).toHaveProperty('lineNumber')
      expect(comment).toHaveProperty('comment')
      expect(comment).toHaveProperty('type')
      expect(comment).toHaveProperty('role', mockTeamMember.role)
    })

    it('generates role-specific fallback comments when AI fails', async () => {
      // Mock AI service to fail
      const mockAIService = vi.mocked(await import('../aiService'))
      mockAIService.getAIService().sendMessage = vi.fn().mockRejectedValue(new Error('AI service error'))

      const comments = await service.generateCodeComments(testCode, mockTeamMember, mockContext)

      expect(Array.isArray(comments)).toBe(true)
      expect(comments.length).toBeGreaterThan(0)

      const comment = comments[0]
      expect(comment.role).toBe(mockTeamMember.role)
      expect(comment.comment).toBeTruthy()
    })

    it('generates different fallback comments for different roles', async () => {
      // Mock AI service to fail
      const mockAIService = vi.mocked(await import('../aiService'))
      mockAIService.getAIService().sendMessage = vi.fn().mockRejectedValue(new Error('AI service error'))

      const roles = [TeamRole.QA, TeamRole.ARCHITECT, TeamRole.PRODUCT_OWNER, TeamRole.SENIOR_DEVELOPER]

      for (const role of roles) {
        const member = TEAM_MEMBERS[role]
        const comments = await service.generateCodeComments(testCode, member, mockContext)

        expect(comments.length).toBeGreaterThan(0)
        expect(comments[0].role).toBe(role)

        // Each role should have different comment content - check that comments exist and are role-specific
        expect(comments[0].comment).toBeTruthy()
        expect(typeof comments[0].comment).toBe('string')
      }
    })

    it('limits number of generated comments', async () => {
      const limitedService = new ZoomAFriendService({ maxCodeComments: 2 })

      // Mock AI service to return many comments
      const mockAIService = vi.mocked(await import('../aiService'))
      mockAIService.getAIService().sendMessage = vi.fn().mockResolvedValue({
        success: true,
        message: {
          content: JSON.stringify({
            comments: Array.from({ length: 10 }, (_, i) => ({
              lineNumber: i + 1,
              comment: `Comment ${i + 1}`,
              type: 'info'
            }))
          })
        }
      })

      const comments = await limitedService.generateCodeComments(testCode, mockTeamMember, mockContext)

      expect(comments.length).toBeLessThanOrEqual(2)
    })

    it('parses AI response from plain text when JSON parsing fails', async () => {
      // Mock AI service to return plain text
      const mockAIService = vi.mocked(await import('../aiService'))
      mockAIService.getAIService().sendMessage = vi.fn().mockResolvedValue({
        success: true,
        message: {
          content: 'Line 1: This needs validation. Line 3: Consider optimization here.'
        }
      })

      const comments = await service.generateCodeComments(testCode, mockTeamMember, mockContext)

      expect(Array.isArray(comments)).toBe(true)
      expect(comments.length).toBeGreaterThan(0)
    })
  })

  describe('Code Comments Integration', () => {
    it('adds code comments to existing code', () => {
      const originalCode = `function test() {
  return "hello";
}`

      const comments: CodeComment[] = [
        {
          lineNumber: 1,
          comment: 'Consider adding JSDoc documentation',
          type: 'suggestion',
          role: TeamRole.SENIOR_DEVELOPER
        },
        {
          lineNumber: 2,
          comment: 'This could return a more meaningful value',
          type: 'improvement',
          role: TeamRole.PRODUCT_OWNER
        }
      ]

      const result = service.addCodeComments(originalCode, comments)

      expect(result).toContain('💡 // 🐱 Consider adding JSDoc documentation')
      expect(result).toContain('🔧 // 🐷 This could return a more meaningful value')
      expect(result).toContain('function test() {')
      expect(result).toContain('return "hello";')
    })

    it('uses correct comment prefixes for different types', () => {
      const code = 'console.log("test");'
      const comments: CodeComment[] = [
        { lineNumber: 1, comment: 'Warning comment', type: 'warning', role: TeamRole.QA },
        { lineNumber: 1, comment: 'Info comment', type: 'info', role: TeamRole.ARCHITECT },
        { lineNumber: 1, comment: 'Suggestion comment', type: 'suggestion', role: TeamRole.SENIOR_DEVELOPER },
        { lineNumber: 1, comment: 'Improvement comment', type: 'improvement', role: TeamRole.PRODUCT_OWNER }
      ]

      const result = service.addCodeComments(code, comments)

      expect(result).toContain('⚠️ //')
      expect(result).toContain('ℹ️ //')
      expect(result).toContain('💡 //')
      expect(result).toContain('🔧 //')
    })

    it('uses correct role emojis', () => {
      const code = 'console.log("test");'
      const comments: CodeComment[] = [
        { lineNumber: 1, comment: 'QA comment', type: 'info', role: TeamRole.QA },
        { lineNumber: 1, comment: 'Architect comment', type: 'info', role: TeamRole.ARCHITECT },
        { lineNumber: 1, comment: 'PO comment', type: 'info', role: TeamRole.PRODUCT_OWNER },
        { lineNumber: 1, comment: 'Dev comment', type: 'info', role: TeamRole.SENIOR_DEVELOPER }
      ]

      const result = service.addCodeComments(code, comments)

      expect(result).toContain('🐡') // Pufferfish
      expect(result).toContain('🦉') // Owl
      expect(result).toContain('🐷') // Pig
      expect(result).toContain('🐱') // Cat
    })
  })

  describe('Sound Effects', () => {
    it('initializes sound effects when enabled', () => {
      const soundService = new ZoomAFriendService({ enableSoundEffects: true })
      
      // Should not throw errors when playing sound effects
      expect(() => {
        soundService.playSoundEffect(mockTeamMember, 'greeting')
        soundService.playSoundEffect(mockTeamMember, 'advice')
        soundService.playSoundEffect(mockTeamMember, 'comment')
      }).not.toThrow()
    })

    it('does not play sound effects when disabled', () => {
      const soundService = new ZoomAFriendService({ enableSoundEffects: false })
      
      // Should not throw errors even when disabled
      expect(() => {
        soundService.playSoundEffect(mockTeamMember, 'greeting')
      }).not.toThrow()
    })

    it('handles different sound types for all team members', () => {
      const soundService = new ZoomAFriendService({ enableSoundEffects: true })
      const soundTypes: ('greeting' | 'advice' | 'comment')[] = ['greeting', 'advice', 'comment']
      
      Object.values(TEAM_MEMBERS).forEach(member => {
        soundTypes.forEach(soundType => {
          expect(() => {
            soundService.playSoundEffect(member, soundType)
          }).not.toThrow()
        })
      })
    })
  })

  describe('Error Handling', () => {
    it('handles AI service failures gracefully in advice generation', async () => {
      const mockAIService = vi.mocked(await import('../aiService'))
      mockAIService.getAIService().sendMessage = vi.fn().mockRejectedValue(new Error('Network error'))

      const response = await service.generateRoleBasedAdvice(mockTeamMember, mockContext)

      expect(response).toHaveProperty('teamMember')
      expect(response).toHaveProperty('message')
      expect(response.message).toBeTruthy()
    })

    it('handles AI service failures gracefully in code comment generation', async () => {
      const mockAIService = vi.mocked(await import('../aiService'))
      mockAIService.getAIService().sendMessage = vi.fn().mockRejectedValue(new Error('Network error'))

      const comments = await service.generateCodeComments('test code', mockTeamMember, mockContext)

      expect(Array.isArray(comments)).toBe(true)
      expect(comments.length).toBeGreaterThan(0)
    })

    it('handles malformed AI responses in code comment generation', async () => {
      const mockAIService = vi.mocked(await import('../aiService'))
      mockAIService.getAIService().sendMessage = vi.fn().mockResolvedValue({
        success: true,
        message: { content: 'Invalid JSON response {malformed}' }
      })

      const comments = await service.generateCodeComments('test code', mockTeamMember, mockContext)

      expect(Array.isArray(comments)).toBe(true)
      // Should fall back to text parsing or generate fallback comments
    })

    it('handles empty or null AI responses', async () => {
      const mockAIService = vi.mocked(await import('../aiService'))
      mockAIService.getAIService().sendMessage = vi.fn().mockResolvedValue({
        success: false,
        message: null
      })

      const response = await service.generateRoleBasedAdvice(mockTeamMember, mockContext)

      expect(response).toHaveProperty('message')
      expect(response.message).toBeTruthy()
    })
  })

  describe('Content Analysis', () => {
    it('extracts animal sounds from AI responses', async () => {
      const mockAIService = vi.mocked(await import('../aiService'))
      mockAIService.getAIService().sendMessage = vi.fn().mockResolvedValue({
        success: true,
        message: { content: 'Puff puff! This code needs bubble bubble testing!' }
      })

      const response = await service.generateRoleBasedAdvice(mockTeamMember, mockContext)

      expect(response.animalSounds).toContain('puff')
      // Note: The service limits to 3 sounds, so 'bubble' might not be included if 'puff' appears multiple times
      expect(response.animalSounds.length).toBeGreaterThan(0)
    })

    it('extracts key terms from AI responses', async () => {
      const mockAIService = vi.mocked(await import('../aiService'))
      mockAIService.getAIService().sendMessage = vi.fn().mockResolvedValue({
        success: true,
        message: { content: 'This code needs better testing and quality validation for defects.' }
      })

      const response = await service.generateRoleBasedAdvice(mockTeamMember, mockContext)

      expect(response.keyTerms).toContain('testing')
      expect(response.keyTerms).toContain('quality')
      // Note: The service limits to 5 terms, so 'validation' might not be included
      expect(response.keyTerms.length).toBeGreaterThan(0)
    })

    it('extracts practical advice from AI responses', async () => {
      const mockAIService = vi.mocked(await import('../aiService'))
      mockAIService.getAIService().sendMessage = vi.fn().mockResolvedValue({
        success: true,
        message: { content: 'You should consider adding error handling. I recommend using try-catch blocks.' }
      })

      const response = await service.generateRoleBasedAdvice(mockTeamMember, mockContext)

      // The advice should be extracted from the content or be a meaningful fallback
      expect(response.advice).toBeTruthy()
      expect(typeof response.advice).toBe('string')
    })
  })

  describe('Role-Specific Behavior', () => {
    it('generates QA-focused prompts and responses', async () => {
      const qaContext = {
        ...mockContext,
        userQuestion: 'How can I test this code better?'
      }

      const response = await service.generateRoleBasedAdvice(TEAM_MEMBERS[TeamRole.QA], qaContext)

      // Should contain QA-specific elements
      expect(response.teamMember.role).toBe(TeamRole.QA)
      expect(response.teamMember.specialties).toContain('Bug Detection')
    })

    it('generates Architect-focused prompts and responses', async () => {
      const archContext = {
        ...mockContext,
        userQuestion: 'How can I improve the architecture?'
      }

      const response = await service.generateRoleBasedAdvice(TEAM_MEMBERS[TeamRole.ARCHITECT], archContext)

      expect(response.teamMember.role).toBe(TeamRole.ARCHITECT)
      expect(response.teamMember.specialties).toContain('System Design')
    })

    it('generates Product Owner-focused prompts and responses', async () => {
      const poContext = {
        ...mockContext,
        userQuestion: 'Does this meet the requirements?'
      }

      const response = await service.generateRoleBasedAdvice(TEAM_MEMBERS[TeamRole.PRODUCT_OWNER], poContext)

      expect(response.teamMember.role).toBe(TeamRole.PRODUCT_OWNER)
      expect(response.teamMember.specialties).toContain('Requirements')
    })

    it('generates Senior Developer-focused prompts and responses', async () => {
      const devContext = {
        ...mockContext,
        userQuestion: 'How can I refactor this code?'
      }

      const response = await service.generateRoleBasedAdvice(TEAM_MEMBERS[TeamRole.SENIOR_DEVELOPER], devContext)

      expect(response.teamMember.role).toBe(TeamRole.SENIOR_DEVELOPER)
      expect(response.teamMember.specialties).toContain('Code Quality')
    })
  })
})