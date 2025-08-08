<template>
  <div class="zoom-friend-panel bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-gray-800 dark:text-white">
        🎥 Zoom-a-Friend
      </h3>
      <button
        v-if="activeSession"
        @click="endSession"
        class="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        End Session
      </button>
    </div>

    <!-- Team Member Selection -->
    <div v-if="!activeSession" class="team-selection">
      <p class="text-sm text-gray-600 dark:text-gray-300 mb-4">
        Choose a team member to get advice:
      </p>
      
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <button
          v-for="member in teamMembers"
          :key="member.id"
          @click="selectTeamMember(member)"
          class="team-member-card flex flex-col items-center p-3 rounded-lg border-2 border-gray-200 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200"
          :class="{ 'animate-pulse': isLoading }"
        >
          <div class="text-4xl mb-2">{{ getAnimalEmoji(member.avatar) }}</div>
          <div class="text-xs font-medium text-gray-700 dark:text-gray-300 text-center">
            {{ member.name }}
          </div>
          <div class="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">
            {{ member.title.split(' ').slice(-1)[0] }}
          </div>
        </button>
      </div>
    </div>

    <!-- Active Session -->
    <div v-if="activeSession" class="active-session">
      <!-- Current Team Member -->
      <div class="current-member flex items-center mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <div class="text-3xl mr-3">{{ getAnimalEmoji(activeSession.teamMember.avatar) }}</div>
        <div>
          <div class="font-medium text-gray-800 dark:text-white">
            {{ activeSession.teamMember.name }}
          </div>
          <div class="text-sm text-gray-600 dark:text-gray-300">
            {{ activeSession.teamMember.title }}
          </div>
        </div>
      </div>

      <!-- Chat Messages -->
      <div class="messages-container max-h-64 overflow-y-auto mb-4 space-y-3">
        <div
          v-for="message in activeSession.messages"
          :key="message.timestamp.getTime()"
          class="message p-3 rounded-lg bg-gray-50 dark:bg-gray-700"
        >
          <div class="flex items-start space-x-2">
            <div class="text-lg">{{ getAnimalEmoji(message.teamMember.avatar) }}</div>
            <div class="flex-1">
              <div class="text-sm font-medium text-gray-800 dark:text-white mb-1">
                {{ message.teamMember.name }}
                <span class="ml-2 text-xs text-gray-500">
                  {{ formatTime(message.timestamp) }}
                </span>
              </div>
              <div class="text-sm text-gray-700 dark:text-gray-300 mb-2">
                {{ message.message }}
              </div>
              <div v-if="message.advice" class="text-sm text-blue-600 dark:text-blue-400 italic">
                💡 {{ message.advice }}
              </div>
              <div v-if="message.keyTerms.length" class="flex flex-wrap gap-1 mt-2">
                <span
                  v-for="term in message.keyTerms"
                  :key="term"
                  class="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded"
                >
                  {{ term }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Input Area -->
      <div class="input-area">
        <div class="flex space-x-2">
          <input
            v-model="userInput"
            @keyup.enter="sendMessage"
            :disabled="isLoading"
            placeholder="Ask for advice..."
            class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
          />
          <button
            @click="sendMessage"
            :disabled="isLoading || !userInput.trim()"
            class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            <span v-if="isLoading">...</span>
            <span v-else>Send</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading && !activeSession" class="text-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
      <p class="text-sm text-gray-600 dark:text-gray-300 mt-2">Starting session...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { TeamRole, AnimalAvatar, TEAM_MEMBERS } from '@/types/team'
import type { TeamMember, DialogResponse, ZoomSession, DialogContext } from '@/types/team'

interface Props {
  challengeId: string
  currentCode: string
  codeIssues?: string[]
  requirements?: string[]
}

interface Emits {
  (e: 'session-started', session: ZoomSession): void
  (e: 'session-ended', session: ZoomSession): void
  (e: 'message-sent', message: DialogResponse): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const activeSession = ref<ZoomSession | null>(null)
const userInput = ref('')
const isLoading = ref(false)

const teamMembers = computed(() => Object.values(TEAM_MEMBERS))

const getAnimalEmoji = (avatar: AnimalAvatar): string => {
  const emojiMap = {
    [AnimalAvatar.PUFFERFISH]: '🐡',
    [AnimalAvatar.OWL]: '🦉',
    [AnimalAvatar.PIG]: '🐷',
    [AnimalAvatar.CAT]: '🐱'
  }
  return emojiMap[avatar]
}

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const selectTeamMember = async (member: TeamMember) => {
  isLoading.value = true
  
  try {
    // Create new session
    const session: ZoomSession = {
      id: `session-${Date.now()}`,
      challengeId: props.challengeId,
      teamMember: member,
      messages: [],
      startedAt: new Date(),
      isActive: true
    }
    
    activeSession.value = session
    
    // Generate initial greeting
    const greeting = await generateInitialGreeting(member)
    session.messages.push(greeting)
    
    emit('session-started', session)
  } finally {
    isLoading.value = false
  }
}

const sendMessage = async () => {
  if (!userInput.value.trim() || !activeSession.value || isLoading.value) return
  
  isLoading.value = true
  const question = userInput.value.trim()
  userInput.value = ''
  
  try {
    const context: DialogContext = {
      challengeId: props.challengeId,
      currentCode: props.currentCode,
      userQuestion: question,
      codeIssues: props.codeIssues,
      requirements: props.requirements
    }
    
    const response = await generateDialogResponse(activeSession.value.teamMember, context)
    activeSession.value.messages.push(response)
    
    emit('message-sent', response)
  } finally {
    isLoading.value = false
  }
}

const endSession = () => {
  if (activeSession.value) {
    activeSession.value.isActive = false
    emit('session-ended', activeSession.value)
    activeSession.value = null
  }
}

const generateInitialGreeting = async (member: TeamMember): Promise<DialogResponse> => {
  const greetings = {
    [TeamRole.QA]: [
      "Puff puff! I'm here to help you catch those sneaky bugs! Bubble bubble, what code are we testing today?",
      "Blub blub! Quality Assurance Pufferfish reporting for duty! Puff puff, let's make sure this code is rock solid!",
      "Whoosh! I can already smell some potential issues in the water... I mean, code! Bubble bubble!"
    ],
    [TeamRole.ARCHITECT]: [
      "Hoot hoot! Wise Architect Owl at your service! Let me take a bird's eye view of your architecture... Hoo hoo!",
      "Flutter flutter! I see you need some architectural guidance! Hoot hoot, let's build something magnificent!",
      "Screech! From up here in my tree, I can see the big picture! Hoot hoot, what design challenges are we facing?"
    ],
    [TeamRole.PRODUCT_OWNER]: [
      "Oink oink! Product Owner Pig here! Snort snort, let's make sure we're building what the users actually need!",
      "Grunt grunt! I'm here to help clarify those requirements! Oink oink, business value is my specialty!",
      "Squeal! Time to get down and dirty with the requirements! Snort snort, what are we trying to achieve?"
    ],
    [TeamRole.SENIOR_DEVELOPER]: [
      "Meow meow! Senior Developer Cat reporting for duty! Purr purr, let's make this code purr-fect!",
      "Mrow! I can sense some code that needs refactoring... Purr purr, clean code is the way!",
      "Hiss! Don't worry, I'm not angry - just passionate about good code! Meow meow, let's get started!"
    ]
  }
  
  const roleGreetings = greetings[member.role]
  const greeting = roleGreetings[Math.floor(Math.random() * roleGreetings.length)]
  
  return {
    teamMember: member,
    message: greeting,
    animalSounds: member.animalSounds.slice(0, 2),
    keyTerms: member.keyTerms.slice(0, 3),
    advice: `I'm here to help with ${member.specialties.join(', ').toLowerCase()}!`,
    mood: 'excited',
    timestamp: new Date()
  }
}

const generateDialogResponse = async (member: TeamMember, context: DialogContext): Promise<DialogResponse> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000))
  
  const responses = generateRoleSpecificResponse(member, context)
  const response = responses[Math.floor(Math.random() * responses.length)]
  
  return {
    teamMember: member,
    message: response.message,
    animalSounds: response.sounds,
    keyTerms: response.keyTerms,
    advice: response.advice,
    mood: response.mood,
    timestamp: new Date()
  }
}

const generateRoleSpecificResponse = (member: TeamMember, context: DialogContext) => {
  const question = context.userQuestion.toLowerCase()
  
  switch (member.role) {
    case TeamRole.QA:
      return generateQAResponse(question, context)
    case TeamRole.ARCHITECT:
      return generateArchitectResponse(question, context)
    case TeamRole.PRODUCT_OWNER:
      return generatePOResponse(question, context)
    case TeamRole.SENIOR_DEVELOPER:
      return generateSeniorDevResponse(question, context)
    default:
      return [{ message: "Hmm, I'm not sure how to help with that!", sounds: [], keyTerms: [], advice: "", mood: 'thoughtful' as const }]
  }
}

const generateQAResponse = (question: string, context: DialogContext) => {
  if (question.includes('bug') || question.includes('test') || question.includes('error')) {
    return [
      {
        message: "Puff puff! I can smell bugs from a mile away! Bubble bubble, let me help you test this thoroughly!",
        sounds: ['puff', 'bubble'],
        keyTerms: ['testing', 'bugs', 'quality'],
        advice: "Always test edge cases and boundary conditions!",
        mood: 'excited' as const
      },
      {
        message: "Blub blub! That's definitely something we need to validate! Whoosh, let's write some test cases!",
        sounds: ['blub', 'whoosh'],
        keyTerms: ['validation', 'test cases', 'defects'],
        advice: "Consider both positive and negative test scenarios!",
        mood: 'thoughtful' as const
      }
    ]
  }
  
  return [
    {
      message: "Bubble bubble! Quality is my middle name! Puff puff, what specific quality concerns do you have?",
      sounds: ['bubble', 'puff'],
      keyTerms: ['quality', 'standards', 'validation'],
      advice: "Remember: prevention is better than detection!",
      mood: 'happy' as const
    }
  ]
}

const generateArchitectResponse = (question: string, context: DialogContext) => {
  if (question.includes('design') || question.includes('structure') || question.includes('pattern')) {
    return [
      {
        message: "Hoot hoot! From my perch, I can see the bigger picture! Flutter flutter, let's think about the overall architecture!",
        sounds: ['hoot', 'flutter'],
        keyTerms: ['architecture', 'design', 'patterns'],
        advice: "Consider SOLID principles and design patterns!",
        mood: 'thoughtful' as const
      },
      {
        message: "Screech! That's a wise architectural question! Hoo hoo, redundancy and scalability are key!",
        sounds: ['screech', 'hoo'],
        keyTerms: ['redundancy', 'scalability', 'structure'],
        advice: "Think about future maintenance and extensibility!",
        mood: 'excited' as const
      }
    ]
  }
  
  return [
    {
      message: "Hoot hoot! Let me spread my wings and think about this architecturally! Flutter flutter!",
      sounds: ['hoot', 'flutter'],
      keyTerms: ['architecture', 'design', 'best practices'],
      advice: "Always consider the long-term implications of your design decisions!",
      mood: 'thoughtful' as const
    }
  ]
}

const generatePOResponse = (question: string, context: DialogContext) => {
  if (question.includes('requirement') || question.includes('user') || question.includes('feature')) {
    return [
      {
        message: "Oink oink! That's exactly what I was thinking about! Snort snort, let's focus on user value!",
        sounds: ['oink', 'snort'],
        keyTerms: ['requirements', 'user story', 'business value'],
        advice: "Always ask: what problem are we solving for the user?",
        mood: 'excited' as const
      },
      {
        message: "Grunt grunt! Business value is what matters! Squeal, let's make sure we understand the stakeholder needs!",
        sounds: ['grunt', 'squeal'],
        keyTerms: ['stakeholder', 'priority', 'business value'],
        advice: "Prioritize features based on user impact and business value!",
        mood: 'thoughtful' as const
      }
    ]
  }
  
  return [
    {
      message: "Snort snort! Let me think about this from a business perspective! Oink oink, what's the user story here?",
      sounds: ['snort', 'oink'],
      keyTerms: ['user story', 'requirements', 'priority'],
      advice: "Remember to consider the user's perspective in every decision!",
      mood: 'thoughtful' as const
    }
  ]
}

const generateSeniorDevResponse = (question: string, context: DialogContext) => {
  if (question.includes('refactor') || question.includes('clean') || question.includes('code')) {
    return [
      {
        message: "Meow meow! Now you're speaking my language! Purr purr, clean code is beautiful code!",
        sounds: ['meow', 'purr'],
        keyTerms: ['clean code', 'refactoring', 'best practices'],
        advice: "Remember: code is read more often than it's written!",
        mood: 'excited' as const
      },
      {
        message: "Mrow! I can sense some code smells from here! Purr purr, let's make it maintainable!",
        sounds: ['mrow', 'purr'],
        keyTerms: ['maintainability', 'SOLID', 'refactoring'],
        advice: "Apply the Boy Scout Rule: leave the code cleaner than you found it!",
        mood: 'thoughtful' as const
      }
    ]
  }
  
  return [
    {
      message: "Purr purr! That's a great question! Meow meow, let me share some wisdom from my years of coding!",
      sounds: ['purr', 'meow'],
      keyTerms: ['best practices', 'clean code', 'experience'],
      advice: "Focus on readability, maintainability, and simplicity!",
      mood: 'happy' as const
    }
  ]
}
</script>

<style scoped>
.team-member-card:hover {
  transform: translateY(-2px);
}

.messages-container::-webkit-scrollbar {
  width: 4px;
}

.messages-container::-webkit-scrollbar-track {
  background: transparent;
}

.messages-container::-webkit-scrollbar-thumb {
  background: #cbd5e0;
  border-radius: 2px;
}

.dark .messages-container::-webkit-scrollbar-thumb {
  background: #4a5568;
}
</style>