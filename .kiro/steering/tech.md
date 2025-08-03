# Technology Stack

## Frontend Stack
- **Framework**: Vue 3 with Composition API and TypeScript
- **Styling**: Tailwind CSS for responsive design and theming
- **State Management**: Pinia for Vue state management
- **Code Editor**: Monaco Editor (VS Code editor) with syntax highlighting
- **Build Tool**: Vite for fast development and optimized builds
- **HTTP Client**: Axios for API communication

## Testing & Quality
- **Unit Testing**: Vitest and Vue Testing Library
- **E2E Testing**: End-to-end testing suite for complete workflows
- **Code Coverage**: Target 85% coverage
- **Accessibility**: WCAG 2.1 AA compliance required

## Deployment Modes

### Local Mode (Kiro IDE Integration)
- Direct file system integration with Kiro IDE
- Built-in Kiro AI capabilities
- Local workspace file modifications
- No external dependencies

### AWS Cloud Mode
- **Backend**: AWS Lambda functions (serverless)
- **Database**: AWS DynamoDB for user progress and challenges
- **AI Provider**: OpenRouter API for AI assistance
- **Storage**: AWS services for scalable data storage

## Development Commands

### Setup
```bash
npm install          # Install dependencies
npm run dev         # Start development server
npm run build       # Build for production
npm run preview     # Preview production build
```

### Testing
```bash
npm run test        # Run unit tests
npm run test:watch  # Run tests in watch mode
npm run test:e2e    # Run end-to-end tests
npm run coverage    # Generate coverage report
```

### Code Quality
```bash
npm run lint        # Run ESLint
npm run type-check  # TypeScript type checking
npm run format      # Format code with Prettier
```

## Performance Considerations
- Code splitting and lazy loading for components
- Service worker for offline functionality
- Monaco Editor optimization for large files
- Mobile-first responsive design
- Progressive enhancement approach