/**
 * Team Member and Dialog Response Types
 * 
 * Defines the Zoom-a-Friend feature with animal-themed team role avatars
 * and their dialog response patterns
 */

export enum TeamRole {
  QA = 'quality-assurance',
  ARCHITECT = 'architect',
  PRODUCT_OWNER = 'product-owner',
  SENIOR_DEVELOPER = 'senior-developer'
}

export enum AnimalAvatar {
  PUFFERFISH = 'pufferfish',
  OWL = 'owl',
  PIG = 'pig',
  CAT = 'cat'
}

export interface TeamMember {
  id: string;
  role: TeamRole;
  avatar: AnimalAvatar;
  name: string;
  title: string;
  specialties: string[];
  personality: string[];
  catchPhrases: string[];
  animalSounds: string[];
  keyTerms: string[];
}

export interface DialogContext {
  challengeId: string;
  currentCode: string;
  userQuestion: string;
  codeIssues?: string[];
  requirements?: string[];
}

export interface CodeComment {
  lineNumber: number;
  comment: string;
  type: 'suggestion' | 'warning' | 'info' | 'improvement';
  role: TeamRole;
}

export interface DialogResponse {
  teamMember: TeamMember;
  message: string;
  animalSounds: string[];
  keyTerms: string[];
  advice: string;
  mood: 'happy' | 'concerned' | 'excited' | 'frustrated' | 'thoughtful';
  soundEffect?: string;
  codeComments?: CodeComment[];
  timestamp: Date;
}

export interface ZoomSession {
  id: string;
  challengeId: string;
  teamMember: TeamMember;
  messages: DialogResponse[];
  startedAt: Date;
  isActive: boolean;
}

// Predefined team members with their characteristics
export const TEAM_MEMBERS: Record<TeamRole, TeamMember> = {
  [TeamRole.QA]: {
    id: 'qa-pufferfish',
    role: TeamRole.QA,
    avatar: AnimalAvatar.PUFFERFISH,
    name: 'Puffy',
    title: 'Quality Assurance Pufferfish',
    specialties: ['Bug Detection', 'Test Cases', 'Edge Cases', 'Quality Standards'],
    personality: ['Detail-oriented', 'Cautious', 'Thorough', 'Protective'],
    catchPhrases: ['Puff puff, that looks fishy!', 'Bubble bubble, test trouble!'],
    animalSounds: ['puff', 'bubble', 'blub', 'whoosh'],
    keyTerms: ['defects', 'bugs', 'testing', 'quality', 'validation']
  },

  [TeamRole.ARCHITECT]: {
    id: 'architect-owl',
    role: TeamRole.ARCHITECT,
    avatar: AnimalAvatar.OWL,
    name: 'Archie',
    title: 'Architect Owl',
    specialties: ['System Design', 'Architecture Patterns', 'Scalability', 'Best Practices'],
    personality: ['Wise', 'Strategic', 'Big-picture thinker', 'Methodical'],
    catchPhrases: ['Hoot hoot, let me think about this...', 'Wise architecture choices!'],
    animalSounds: ['hoot', 'hoo', 'screech', 'flutter'],
    keyTerms: ['architecture', 'design', 'patterns', 'structure', 'scalability', 'redundancy']
  },

  [TeamRole.PRODUCT_OWNER]: {
    id: 'po-pig',
    role: TeamRole.PRODUCT_OWNER,
    avatar: AnimalAvatar.PIG,
    name: 'Porgy',
    title: 'Product Owner Pig',
    specialties: ['Requirements', 'User Stories', 'Priorities', 'Business Value'],
    personality: ['Business-focused', 'User-centric', 'Practical', 'Results-driven'],
    catchPhrases: ['Oink oink, what about the user?', 'Snort snort, business value!'],
    animalSounds: ['oink', 'snort', 'grunt', 'squeal'],
    keyTerms: ['requirements', 'user story', 'business value', 'priority', 'stakeholder']
  },

  [TeamRole.SENIOR_DEVELOPER]: {
    id: 'senior-cat',
    role: TeamRole.SENIOR_DEVELOPER,
    avatar: AnimalAvatar.CAT,
    name: 'Kitty',
    title: 'Senior Developer Cat',
    specialties: ['Code Quality', 'Best Practices', 'Refactoring', 'Mentoring'],
    personality: ['Experienced', 'Pragmatic', 'Code-focused', 'Helpful'],
    catchPhrases: ['Meow meow, clean code matters!', 'Purr purr, refactor time!'],
    animalSounds: ['meow', 'purr', 'hiss', 'mrow'],
    keyTerms: ['clean code', 'refactoring', 'best practices', 'maintainability', 'SOLID']
  }
};