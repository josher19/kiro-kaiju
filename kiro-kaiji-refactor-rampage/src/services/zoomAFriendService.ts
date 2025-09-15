/**
 * Zoom-a-Friend Service
 * 
 * Handles AI-powered team member dialog generation and code comment functionality
 * for the Zoom-a-Friend feature with animal-themed team role avatars
 */

import type { TeamMember, DialogResponse, DialogContext, CodeComment } from '@/types/team';
import { TeamRole } from '@/types/team';
import { getAIService } from './aiService';

export interface ZoomAFriendServiceConfig {
  enableSoundEffects?: boolean;
  maxCodeComments?: number;
  aiProvider?: 'kiro' | 'local-llm' | 'openrouter';
  maxHistoryMessages?: number; // Maximum conversation history messages to send (default: 1)
  enableHistoryOptimization?: boolean; // Enable conversation history truncation (default: true)
  useShortSystemPrompt?: boolean; // Use shorter system prompt for Zoom-A-Friend (default: true)
}

export class ZoomAFriendService {
  private config: ZoomAFriendServiceConfig;
  private soundEffects: Map<string, HTMLAudioElement> = new Map();

  constructor(config: ZoomAFriendServiceConfig = {}) {
    this.config = {
      enableSoundEffects: config.enableSoundEffects ?? true,
      maxCodeComments: config.maxCodeComments ?? 10,
      aiProvider: config.aiProvider ?? 'kiro',
      maxHistoryMessages: config.maxHistoryMessages ?? 1, // Reduced from 2 to 1 to minimize payload
      enableHistoryOptimization: config.enableHistoryOptimization ?? true,
      useShortSystemPrompt: config.useShortSystemPrompt ?? true
    };

    if (this.config.enableSoundEffects) {
      this.initializeSoundEffects();
    }
  }

  /**
   * Send optimized AI request with truncated conversation history to reduce payload size
   * This addresses the issue of Zoom-A-Friend sending 19,000+ bytes in 8 messages
   */
  private async sendOptimizedAIRequest(
    prompt: string,
    challengeContext: any,
    maxHistoryMessages?: number
  ): Promise<any> {
    const aiService = getAIService();
    
    // Use configuration values if not explicitly provided
    const historyLimit = maxHistoryMessages ?? this.config.maxHistoryMessages ?? 1;
    const optimizationEnabled = this.config.enableHistoryOptimization ?? true;
    
    // If optimization is disabled, use normal AI service
    if (!optimizationEnabled) {
      return await aiService.sendMessage(prompt, challengeContext);
    }
    
    // Store original sendMessage method
    const originalSendMessage = aiService.sendMessage.bind(aiService);
    
    // Create optimized sendMessage that truncates conversation history
    const optimizedSendMessage = async (message: string, challengeCtx: any, userId?: string) => {
      const conversationId = `${challengeCtx.challenge.id}-${userId || 'anonymous'}`;
      const fullHistory = aiService.getConversationHistory(conversationId);
      
      // Keep only the last N messages to reduce payload size
      // This prevents sending 19,000+ bytes and improves performance
      const truncatedHistory = historyLimit > 0 ? fullHistory.slice(-historyLimit) : [];
      
      // Log optimization for debugging
      if (fullHistory.length > historyLimit) {
        console.log(`ZoomAFriend: Optimized conversation history from ${fullHistory.length} to ${truncatedHistory.length} messages (saved ~${Math.round((fullHistory.length - truncatedHistory.length) * 2400)} bytes)`);
      }
      
      // Temporarily replace the conversation history
      const originalHistory = [...fullHistory];
      (aiService as any).conversationHistory.set(conversationId, truncatedHistory);
      
      try {
        return await originalSendMessage(message, challengeCtx, userId);
      } finally {
        // Always restore the full conversation history
        (aiService as any).conversationHistory.set(conversationId, originalHistory);
      }
    };

    // Temporarily override the sendMessage method
    aiService.sendMessage = optimizedSendMessage;

    try {
      return await aiService.sendMessage(prompt, challengeContext);
    } finally {
      // Always restore the original sendMessage method
      aiService.sendMessage = originalSendMessage;
    }
  }

  /**
   * Clear conversation history for Zoom-A-Friend when challenge is completed
   * This prevents accumulation of large conversation histories
   */
  clearChallengeHistory(challengeId: string, userId?: string): void {
    const aiService = getAIService();
    aiService.clearConversationHistory(challengeId, userId);
    console.log(`ZoomAFriend: Cleared conversation history for challenge ${challengeId}`);
  }

  /**
   * Generate AI-powered role-based advice for a team member
   */
  async generateRoleBasedAdvice(
    teamMember: TeamMember,
    context: DialogContext
  ): Promise<DialogResponse> {
    try {
      const prompt = this.buildRoleSpecificPrompt(teamMember, context);

      // Create a mock challenge context for AI service
      const challengeContext = {
        challenge: {
          id: context.challengeId,
          title: 'Current Challenge',
          description: 'Code refactoring challenge',
          kaiju: { name: 'Code Monster', description: 'Various code issues' },
          config: { language: 'javascript', difficulty: 3, category: 'refactoring' },
          requirements: context.requirements?.map(req => ({ description: req })) || []
        },
        currentCode: context.currentCode
      };

      // Use optimized AI request with truncated conversation history
      // This reduces payload size from potentially 19,000+ bytes to much smaller size
      const aiResponse = await this.sendOptimizedAIRequest(prompt, challengeContext);

      if (aiResponse.success && aiResponse.message) {
        return this.parseAIResponseToDialog(teamMember, aiResponse.message.content, context);
      } else {
        // Fallback to predefined responses
        return this.generateFallbackResponse(teamMember, context);
      }
    } catch (error) {
      console.warn('AI-powered dialog generation failed, using fallback:', error);
      return this.generateFallbackResponse(teamMember, context);
    }
  }

  /**
   * Generate AI-powered code comments for existing code based on team member role
   */
  async generateCodeComments(
    code: string,
    teamMember: TeamMember,
    context: DialogContext
  ): Promise<CodeComment[]> {
    try {
      const prompt = this.buildCodeCommentPrompt(teamMember, code, context);

      const challengeContext = {
        challenge: {
          id: context.challengeId,
          title: 'Code Comment Generation',
          description: 'Generate role-specific code comments',
          kaiju: { name: 'Code Monster', description: 'Various code issues' },
          config: { language: 'javascript', difficulty: 3, category: 'refactoring' },
          requirements: context.requirements?.map(req => ({ description: req })) || []
        },
        currentCode: code
      };

      // Use optimized AI request with no conversation history for code comment generation
      // This significantly reduces payload size since code comments don't need conversation context
      const aiResponse = await this.sendOptimizedAIRequest(prompt, challengeContext, 0);

      if (aiResponse.success && aiResponse.message) {
        return this.parseAIResponseToCodeComments(aiResponse.message.content, teamMember.role);
      } else {
        return this.generateFallbackCodeComments(code, teamMember);
      }
    } catch (error) {
      console.warn('AI-powered code comment generation failed, using fallback:', error);
      return this.generateFallbackCodeComments(code, teamMember);
    }
  }

  /**
   * Add role-specific code comments to existing code
   */
  addCodeComments(code: string, comments: CodeComment[]): string {
    const lines = code.split('\n');
    const result: string[] = [];

    // Sort comments by line number in descending order to avoid line number shifts
    const sortedComments = [...comments].sort((a, b) => b.lineNumber - a.lineNumber);

    for (let i = 0; i < lines.length; i++) {
      const lineNumber = i + 1;
      const lineComments = sortedComments.filter(comment => comment.lineNumber === lineNumber);

      // Add the original line
      result.push(lines[i]);

      // Add comments for this line
      lineComments.forEach(comment => {
        const commentPrefix = this.getCommentPrefix(comment.type);
        const roleEmoji = this.getRoleEmoji(comment.role);
        result.push(`  ${commentPrefix} ${roleEmoji} ${comment.comment}`);
      });
    }

    return result.join('\n');
  }

  /**
   * Play sound effect for team member interaction
   */
  playSoundEffect(teamMember: TeamMember, soundType: 'greeting' | 'advice' | 'comment' = 'advice'): void {
    if (!this.config.enableSoundEffects) return;

    const soundKey = `${teamMember.role}-${soundType}`;
    const audio = this.soundEffects.get(soundKey);

    if (audio && audio.play) {
      try {
        audio.currentTime = 0;
        const playPromise = audio.play();
        if (playPromise && playPromise.catch) {
          playPromise.catch(error => {
            console.warn('Failed to play sound effect:', error);
          });
        }
      } catch (error) {
        console.warn('Failed to play sound effect:', error);
      }
    }
  }

  /**
   * Build role-specific prompt for AI dialog generation
   * Uses shorter system prompt to reduce payload size compared to grading prompts
   */
  private buildRoleSpecificPrompt(teamMember: TeamMember, context: DialogContext): string {
    const useShortPrompt = this.config.useShortSystemPrompt ?? true;
    
    if (useShortPrompt) {
      // Shorter system prompt to reduce payload size for Zoom-A-Friend
      const roleInstructions = this.getRoleInstructions(teamMember.role);
      
      return `You are ${teamMember.name}, a ${teamMember.title}. ${roleInstructions}

Character: ${teamMember.avatar} - use sounds: ${teamMember.animalSounds.slice(0, 3).join(', ')}
Focus: ${teamMember.keyTerms.slice(0, 3).join(', ')}

Question: "${context.userQuestion}"
Code: ${context.currentCode.slice(0, 500)}${context.currentCode.length > 500 ? '...' : ''}

Give brief, role-specific advice with animal sounds. Keep response under 200 words.`;
    } else {
      // Full system prompt (original version)
      const roleInstructions = this.getRoleInstructions(teamMember.role);
      const animalPersonality = this.getAnimalPersonality(teamMember);

      return `You are ${teamMember.name}, a ${teamMember.title} in a coding team. ${roleInstructions}

IMPORTANT: You must respond in character as ${teamMember.avatar} with the following personality:
- Use animal sounds from this list frequently: ${teamMember.animalSounds.join(', ')}
- Incorporate these key terms naturally: ${teamMember.keyTerms.join(', ')}
- Personality traits: ${teamMember.personality.join(', ')}
- Specialties: ${teamMember.specialties.join(', ')}

${animalPersonality}

Current situation:
- User question: "${context.userQuestion}"
- Code issues: ${context.codeIssues?.join(', ') || 'None specified'}
- Requirements: ${context.requirements?.join(', ') || 'None specified'}

Code to analyze:
\`\`\`
${context.currentCode}
\`\`\`

Respond with advice that includes:
1. Animal sounds interspersed naturally in your speech
2. Role-specific technical advice
3. Key terms from your specialty area
4. Practical, actionable suggestions

Keep your response conversational but professional, and stay in character as a ${teamMember.avatar}!`;
    }
  }

  /**
   * Build prompt for AI code comment generation
   * Uses shorter prompt to reduce payload size
   */
  private buildCodeCommentPrompt(teamMember: TeamMember, code: string, context: DialogContext): string {
    const useShortPrompt = this.config.useShortSystemPrompt ?? true;
    
    if (useShortPrompt) {
      // Shorter prompt for code comments to reduce payload size
      const roleInstructions = this.getRoleInstructions(teamMember.role);
      
      return `${teamMember.name} (${teamMember.title}): ${roleInstructions}

JSON format: {"comments": [{"lineNumber": 1, "comment": "text", "type": "suggestion|warning|info|improvement"}]}

Code (first 800 chars):
\`\`\`
${code.slice(0, 800)}${code.length > 800 ? '...' : ''}
\`\`\`

Provide max 3 comments from your role's perspective.`;
    } else {
      // Full prompt (original version)
      const roleInstructions = this.getRoleInstructions(teamMember.role);

      return `You are ${teamMember.name}, a ${teamMember.title}. ${roleInstructions}

Please analyze this code and provide role-specific comments. Return your response in this exact JSON format:
{
  "comments": [
    {
      "lineNumber": 1,
      "comment": "Your comment here",
      "type": "suggestion|warning|info|improvement"
    }
  ]
}

Focus on:
${this.getRoleSpecificFocus(teamMember.role)}

Code to analyze:
\`\`\`
${code}
\`\`\`

Provide ${Math.min(this.config.maxCodeComments!, 5)} most important comments from your role's perspective.
Make comments concise but actionable. Include line numbers where issues or improvements are needed.`;
    }
  }

  /**
   * Get role-specific instructions for AI prompts
   */
  private getRoleInstructions(role: TeamRole): string {
    switch (role) {
      case TeamRole.QA:
        return 'You focus on finding bugs, testing edge cases, and ensuring code quality. You are thorough and detail-oriented.';
      case TeamRole.ARCHITECT:
        return 'You focus on system design, architecture patterns, scalability, and overall code structure. You think about the big picture.';
      case TeamRole.PRODUCT_OWNER:
        return 'You focus on requirements, user stories, business value, and ensuring the code meets user needs.';
      case TeamRole.SENIOR_DEVELOPER:
        return 'You focus on code quality, best practices, refactoring, and mentoring. You care about clean, maintainable code.';
      default:
        return 'You provide general coding advice and support.';
    }
  }

  /**
   * Get animal personality description for prompts
   */
  private getAnimalPersonality(teamMember: TeamMember): string {
    switch (teamMember.avatar) {
      case 'pufferfish':
        return 'As a pufferfish, you can "puff up" when you find serious issues, and you\'re protective of code quality. You make "bubble" and "puff" sounds when excited or concerned.';
      case 'owl':
        return 'As an owl, you are wise and see the big picture from your high perch. You make "hoot" and "screech" sounds when thinking or emphasizing points.';
      case 'pig':
        return 'As a pig, you\'re practical and down-to-earth, focused on what really matters to users. You make "oink" and "snort" sounds when discussing business value.';
      case 'cat':
        return 'As a cat, you\'re independent and particular about code cleanliness. You "purr" when happy with clean code and "hiss" when you see messy code.';
      default:
        return 'You have a friendly, helpful personality.';
    }
  }

  /**
   * Get role-specific focus areas for code comments
   */
  private getRoleSpecificFocus(role: TeamRole): string {
    switch (role) {
      case TeamRole.QA:
        return '- Potential bugs and edge cases\n- Missing error handling\n- Test coverage gaps\n- Input validation issues';
      case TeamRole.ARCHITECT:
        return '- Code structure and organization\n- Design patterns usage\n- Scalability concerns\n- Architecture improvements';
      case TeamRole.PRODUCT_OWNER:
        return '- Requirements fulfillment\n- User experience impact\n- Business logic clarity\n- Feature completeness';
      case TeamRole.SENIOR_DEVELOPER:
        return '- Code quality and readability\n- Best practices adherence\n- Refactoring opportunities\n- Performance optimizations';
      default:
        return '- General code improvements\n- Best practices\n- Potential issues';
    }
  }

  /**
   * Parse AI response into dialog format
   */
  private parseAIResponseToDialog(
    teamMember: TeamMember,
    aiContent: string,
    context: DialogContext
  ): DialogResponse {
    // Extract animal sounds from the response
    const animalSounds = teamMember.animalSounds.filter(sound => 
      aiContent.toLowerCase().includes(sound.toLowerCase())
    );

    // Extract key terms from the response
    const keyTerms = teamMember.keyTerms.filter(term => 
      aiContent.toLowerCase().includes(term.toLowerCase())
    );

    // Determine mood based on content
    const mood = this.determineMoodFromContent(aiContent);

    // Extract advice (look for practical suggestions)
    const advice = this.extractAdviceFromContent(aiContent);

    return {
      teamMember,
      message: aiContent,
      animalSounds: animalSounds.slice(0, 3), // Limit to 3 sounds
      keyTerms: keyTerms.slice(0, 5), // Limit to 5 terms
      advice,
      mood,
      timestamp: new Date()
    };
  }

  /**
   * Parse AI response into code comments
   */
  private parseAIResponseToCodeComments(aiContent: string, role: TeamRole): CodeComment[] {
    try {
      // Try to parse JSON response
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.comments && Array.isArray(parsed.comments)) {
          return parsed.comments.map((comment: any) => ({
            lineNumber: comment.lineNumber || 1,
            comment: comment.comment || 'Code review comment',
            type: comment.type || 'info',
            role
          }));
        }
      }

      // Fallback: extract comments from text
      return this.extractCommentsFromText(aiContent, role);
    } catch (error) {
      console.warn('Failed to parse AI code comments:', error);
      return this.extractCommentsFromText(aiContent, role);
    }
  }

  /**
   * Extract comments from plain text AI response
   */
  private extractCommentsFromText(content: string, role: TeamRole): CodeComment[] {
    const comments: CodeComment[] = [];
    const lines = content.split('\n');

    lines.forEach((line) => {
      // Look for line number references
      const lineMatch = line.match(/line\s*(\d+)/i);
      if (lineMatch) {
        const lineNumber = parseInt(lineMatch[1]);
        const comment = line.replace(/line\s*\d+[:\-\s]*/i, '').trim();
        if (comment) {
          comments.push({
            lineNumber,
            comment,
            type: this.determineCommentType(comment),
            role
          });
        }
      }
    });

    // If no line-specific comments found, create general comments
    if (comments.length === 0) {
      const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
      sentences.slice(0, 3).forEach((sentence, index) => {
        comments.push({
          lineNumber: index + 1,
          comment: sentence.trim(),
          type: 'info',
          role
        });
      });
    }

    return comments.slice(0, this.config.maxCodeComments!);
  }

  /**
   * Generate fallback response when AI is not available
   */
  private generateFallbackResponse(teamMember: TeamMember, _context: DialogContext): DialogResponse {
    const responses = this.getFallbackResponses(teamMember.role);
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];

    return {
      teamMember,
      message: randomResponse.message,
      animalSounds: teamMember.animalSounds.slice(0, 2),
      keyTerms: teamMember.keyTerms.slice(0, 3),
      advice: randomResponse.advice,
      mood: randomResponse.mood,
      timestamp: new Date()
    };
  }

  /**
   * Generate fallback code comments when AI is not available
   */
  private generateFallbackCodeComments(code: string, teamMember: TeamMember): CodeComment[] {
    const lines = code.split('\n');
    const comments: CodeComment[] = [];

    // Generate role-specific fallback comments
    switch (teamMember.role) {
      case TeamRole.QA:
        comments.push({
          lineNumber: 1,
          comment: 'Consider adding input validation here',
          type: 'suggestion',
          role: teamMember.role
        });
        if (lines.length > 5) {
          comments.push({
            lineNumber: Math.floor(lines.length / 2),
            comment: 'This section might need error handling',
            type: 'warning',
            role: teamMember.role
          });
        }
        break;

      case TeamRole.ARCHITECT:
        comments.push({
          lineNumber: 1,
          comment: 'Consider the overall architecture pattern here',
          type: 'info',
          role: teamMember.role
        });
        break;

      case TeamRole.PRODUCT_OWNER:
        comments.push({
          lineNumber: 1,
          comment: 'Ensure this meets the user requirements',
          type: 'info',
          role: teamMember.role
        });
        break;

      case TeamRole.SENIOR_DEVELOPER:
        comments.push({
          lineNumber: 1,
          comment: 'This could be refactored for better readability',
          type: 'improvement',
          role: teamMember.role
        });
        break;
    }

    return comments;
  }

  /**
   * Get fallback responses for each role
   */
  private getFallbackResponses(role: TeamRole) {
    const responses = {
      [TeamRole.QA]: [
        {
          message: 'Puff puff! I can smell potential bugs in this code! Bubble bubble, let me help you test this thoroughly!',
          advice: 'Always test edge cases and boundary conditions!',
          mood: 'excited' as const
        },
        {
          message: 'Blub blub! Quality is my specialty! Whoosh, let\'s make sure this code is rock solid!',
          advice: 'Consider both positive and negative test scenarios!',
          mood: 'thoughtful' as const
        }
      ],
      [TeamRole.ARCHITECT]: [
        {
          message: 'Hoot hoot! Let me take a bird\'s eye view of this architecture! Flutter flutter, I see some design opportunities!',
          advice: 'Think about scalability and maintainability!',
          mood: 'thoughtful' as const
        },
        {
          message: 'Screech! From up here, I can see the bigger picture! Hoo hoo, let\'s build something magnificent!',
          advice: 'Consider SOLID principles and design patterns!',
          mood: 'excited' as const
        }
      ],
      [TeamRole.PRODUCT_OWNER]: [
        {
          message: 'Oink oink! Let\'s focus on what the users really need! Snort snort, business value is key!',
          advice: 'Always ask: what problem are we solving for the user?',
          mood: 'excited' as const
        },
        {
          message: 'Grunt grunt! Requirements clarity is essential! Squeal, let\'s make sure we understand the stakeholder needs!',
          advice: 'Prioritize features based on user impact!',
          mood: 'thoughtful' as const
        }
      ],
      [TeamRole.SENIOR_DEVELOPER]: [
        {
          message: 'Meow meow! Clean code is beautiful code! Purr purr, let\'s make this maintainable!',
          advice: 'Remember: code is read more often than it\'s written!',
          mood: 'excited' as const
        },
        {
          message: 'Mrow! I can sense some code smells from here! Purr purr, refactoring time!',
          advice: 'Apply the Boy Scout Rule: leave code cleaner than you found it!',
          mood: 'thoughtful' as const
        }
      ]
    };

    return responses[role] || responses[TeamRole.SENIOR_DEVELOPER];
  }

  /**
   * Determine mood from AI content
   */
  private determineMoodFromContent(content: string): 'happy' | 'concerned' | 'excited' | 'frustrated' | 'thoughtful' {
    const lowerContent = content.toLowerCase();

    // Check for explicit mood words first
    if (lowerContent.includes('excited') || lowerContent.includes('exciting')) {
      return 'excited';
    }
    if (lowerContent.includes('concerned') || lowerContent.includes('worried') || lowerContent.includes('concerning')) {
      return 'concerned';
    }
    if (lowerContent.includes('frustrated') || lowerContent.includes('frustrating')) {
      return 'frustrated';
    }
    if (lowerContent.includes('think') || lowerContent.includes('consider') || lowerContent.includes('analyze') || lowerContent.includes('carefully')) {
      return 'thoughtful';
    }

    // Check for positive indicators
    if (lowerContent.includes('great') || lowerContent.includes('excellent') || lowerContent.includes('awesome') || lowerContent.includes('wonderful')) {
      return 'excited';
    }

    // Check for problem indicators
    if (lowerContent.includes('problem') || lowerContent.includes('issue') || lowerContent.includes('error')) {
      return 'concerned';
    }

    // Check for difficulty indicators
    if (lowerContent.includes('difficult') || lowerContent.includes('complex') || lowerContent.includes('challenging')) {
      return 'frustrated';
    }

    return 'happy';
  }

  /**
   * Extract practical advice from AI content
   */
  private extractAdviceFromContent(content: string): string {
    // Look for sentences that contain advice keywords
    const sentences = content.split(/[.!?]+/);
    const adviceSentence = sentences.find(sentence => {
      const lower = sentence.toLowerCase();
      return lower.includes('should') || lower.includes('consider') || 
             lower.includes('try') || lower.includes('recommend') ||
             lower.includes('suggest') || lower.includes('tip');
    });

    return adviceSentence?.trim() || 'Keep up the great work on your code!';
  }

  /**
   * Determine comment type from content
   */
  private determineCommentType(comment: string): 'suggestion' | 'warning' | 'info' | 'improvement' {
    const lower = comment.toLowerCase();

    if (lower.includes('warning') || lower.includes('error') || lower.includes('bug')) {
      return 'warning';
    }
    if (lower.includes('improve') || lower.includes('refactor') || lower.includes('optimize')) {
      return 'improvement';
    }
    if (lower.includes('consider') || lower.includes('try') || lower.includes('suggest')) {
      return 'suggestion';
    }

    return 'info';
  }

  /**
   * Get comment prefix based on type
   */
  private getCommentPrefix(type: 'suggestion' | 'warning' | 'info' | 'improvement'): string {
    switch (type) {
      case 'warning': return '⚠️ //';
      case 'improvement': return '🔧 //';
      case 'suggestion': return '💡 //';
      case 'info': return 'ℹ️ //';
      default: return '//';
    }
  }

  /**
   * Get emoji for team role
   */
  private getRoleEmoji(role: TeamRole): string {
    switch (role) {
      case TeamRole.QA: return '🐡';
      case TeamRole.ARCHITECT: return '🦉';
      case TeamRole.PRODUCT_OWNER: return '🐷';
      case TeamRole.SENIOR_DEVELOPER: return '🐱';
      default: return '👤';
    }
  }

  /**
   * Initialize sound effects for team members
   */
  private initializeSoundEffects(): void {
    // Note: In a real implementation, you would load actual audio files
    // For now, we'll create placeholder audio elements
    const roles = Object.values(TeamRole);
    const soundTypes = ['greeting', 'advice', 'comment'];

    roles.forEach(role => {
      soundTypes.forEach(soundType => {
        const soundKey = `${role}-${soundType}`;
        // In a real implementation, you would load actual audio files:
        // const audio = new Audio(`/sounds/${role}-${soundType}.mp3`);
        // For now, we'll create a silent audio element
        const audio = new Audio();
        audio.volume = 0.3; // Set reasonable volume
        this.soundEffects.set(soundKey, audio);
      });
    });
  }
}

// Export singleton instance
let zoomAFriendServiceInstance: ZoomAFriendService | null = null;

export function createZoomAFriendService(config?: ZoomAFriendServiceConfig): ZoomAFriendService {
  zoomAFriendServiceInstance = new ZoomAFriendService(config);
  return zoomAFriendServiceInstance;
}

export function getZoomAFriendService(): ZoomAFriendService {
  if (!zoomAFriendServiceInstance) {
    // Create with optimized settings to reduce payload size from 19,000+ bytes
    zoomAFriendServiceInstance = new ZoomAFriendService({
      enableHistoryOptimization: true,
      maxHistoryMessages: 1, // Reduced to 1 message to minimize payload size
      useShortSystemPrompt: true, // Use shorter system prompts
      maxCodeComments: 3 // Limit code comments to reduce response size
    });
  }
  return zoomAFriendServiceInstance;
}