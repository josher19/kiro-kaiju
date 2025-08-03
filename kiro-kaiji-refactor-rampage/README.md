# Kiro Kaiji: Refactor Rampage

An award-winning educational web application that gamifies code refactoring and feature development skills. Face programming "Kaiju" monsters representing coding anti-patterns and learn to refactor code with AI assistance and quirky virtual team members.

## Features

- 🦖 **Kaiju Monsters**: Face different coding challenges themed around programming anti-patterns
- 🤖 **AI Assistance**: Get help from Kiro AI for refactoring, testing, and implementation
- 👥 **Zoom-a-Friend**: Consult with animal-themed team role avatars for different perspectives
- 📱 **Mobile Responsive**: Code anywhere with touch-optimized interface
- 🏆 **Progress Tracking**: Unlock achievements and track your improvement

## Technology Stack

- **Frontend**: Vue 3 with TypeScript and Composition API
- **Styling**: Tailwind CSS for responsive design
- **State Management**: Pinia
- **Code Editor**: Monaco Editor (VS Code editor)
- **Build Tool**: Vite
- **Testing**: Vitest and Vue Testing Library

## Project Setup

```sh
npm install
```

### Development Commands

```sh
npm run dev         # Start development server
npm run build       # Build for production
npm run preview     # Preview production build
```

### Testing Commands

```sh
npm run test        # Run unit tests
npm run test:watch  # Run tests in watch mode
npm run coverage    # Generate coverage report
```

### Code Quality Commands

```sh
npm run lint        # Run ESLint
npm run type-check  # TypeScript type checking
npm run format      # Format code with Prettier
```

## Project Structure

```
src/
├── components/           # Vue components
│   ├── challenge/       # Challenge-related components
│   ├── ai/             # AI assistance components
│   ├── kaiju/          # Kaiju monster components
│   ├── progress/       # User progress components
│   └── common/         # Shared/common components
├── services/           # Business logic and API services
├── stores/             # Pinia state management
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── views/              # Page-level components
```

## Deployment Modes

### Local Mode (Kiro IDE Integration)
- Direct file system integration with Kiro IDE
- Built-in Kiro AI capabilities
- No external dependencies

### AWS Cloud Mode
- AWS Lambda functions for serverless backend
- DynamoDB for user progress storage
- OpenRouter API for AI assistance

## Development Guidelines

- Follow Vue 3 Composition API patterns
- Use TypeScript for type safety
- Implement mobile-first responsive design
- Maintain 85% code coverage target
- Follow WCAG 2.1 AA accessibility standards