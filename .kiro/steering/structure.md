# Project Structure

## Directory Organization

```
src/
├── components/           # Vue components
│   ├── challenge/       # Challenge-related components
│   │   ├── ChallengeSelector.vue
│   │   ├── CodeEditor.vue
│   │   └── EvaluationDashboard.vue
│   ├── ai/             # AI assistance components
│   │   ├── AIChatInterface.vue
│   │   └── ZoomAFriendPanel.vue
│   ├── kaiju/          # Kaiju monster components
│   │   └── KaijuDisplay.vue
│   ├── progress/       # User progress components
│   │   └── ProgressTracker.vue
│   └── common/         # Shared/common components
├── services/           # Business logic and API services
│   ├── challengeService.ts
│   ├── evaluationService.ts
│   ├── aiService.ts
│   └── progressService.ts
├── stores/             # Pinia state management
│   ├── challengeStore.ts
│   ├── userProgressStore.ts
│   └── appStore.ts
├── types/              # TypeScript type definitions
│   ├── challenge.ts
│   ├── kaiju.ts
│   ├── user.ts
│   └── api.ts
├── utils/              # Utility functions
│   ├── codeAnalysis.ts
│   ├── validation.ts
│   └── helpers.ts
├── assets/             # Static assets
│   ├── images/
│   │   └── kaiju/      # Kaiju monster images
│   └── styles/
└── views/              # Page-level components
    ├── ChallengeView.vue
    ├── ProgressView.vue
    └── HomeView.vue
```

## Component Architecture

### Component Naming Conventions
- Use PascalCase for component names
- Prefix with domain area when appropriate (Challenge*, Kaiju*, AI*)
- Use descriptive, action-oriented names

### Component Organization
- **challenge/**: Components for challenge selection, code editing, evaluation
- **ai/**: AI chat interface and Zoom-a-Friend functionality  
- **kaiju/**: Kaiju monster display and interaction components
- **progress/**: User progress tracking and achievement displays
- **common/**: Reusable UI components (buttons, modals, etc.)

## State Management Structure

### Pinia Stores
- **challengeStore**: Current challenge state, Kaiju monsters, code templates
- **userProgressStore**: User achievements, completed challenges, statistics
- **appStore**: Global app state, theme, mobile detection

## Service Layer Organization

### Core Services
- **challengeService**: Challenge generation, Kaiju monster logic
- **evaluationService**: Code quality analysis, scoring algorithms
- **aiService**: Kiro AI integration, OpenRouter API communication
- **progressService**: User progress tracking, achievement unlocking

## Type Definitions

### Key Interfaces
- **challenge.ts**: Challenge, ChallengeConfig, Requirement interfaces
- **kaiju.ts**: KaijuMonster, KaijuType enums and related types
- **user.ts**: UserProgress, Achievement, TeamMember interfaces
- **api.ts**: API request/response types for all services

## Mobile Responsiveness

### Breakpoint Strategy
- Mobile: 320px - 768px (touch-optimized)
- Tablet: 768px - 1024px (hybrid interaction)
- Desktop: 1024px+ (full feature set)

### Mobile-Specific Considerations
- Collapsible panels for AI chat and Zoom-a-Friend
- Touch-optimized Monaco Editor configuration
- Swipe gestures for navigation
- Optimized virtual keyboard handling

## Testing Structure

```
tests/
├── unit/               # Unit tests
│   ├── components/
│   ├── services/
│   └── stores/
├── integration/        # Integration tests
└── e2e/               # End-to-end tests
```

## Configuration Files

- **vite.config.ts**: Build configuration and development server
- **tailwind.config.js**: Tailwind CSS customization
- **tsconfig.json**: TypeScript compiler configuration
- **vitest.config.ts**: Testing framework configuration