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

## Build Process & Troubleshooting

### Common Build Issues
- **Monaco Editor**: Large bundle size - use dynamic imports and code splitting
- **TypeScript Errors**: Ensure all type definitions are properly imported
- **Tailwind CSS**: Verify PostCSS configuration and purge settings
- **Vite Configuration**: Check for proper plugin setup and path resolution

### Build Optimization
- Use `npm run build` to identify bundle size issues
- Check `dist/` folder for proper asset generation
- Verify source maps are generated for debugging
- Ensure proper tree-shaking for unused code elimination

### Dependency Management
- Run `npm ci` for clean installs in production
- Use `npm audit` to check for security vulnerabilities
- Keep dependencies updated but test thoroughly
- Consider using `npm-check-updates` for version management

### Development Server Issues
- Clear Vite cache: `rm -rf node_modules/.vite`
- Restart dev server if hot reload stops working
- Check for port conflicts (default: 5173)
- Verify environment variables are properly loaded

## Performance Considerations
- Code splitting and lazy loading for components
- Service worker for offline functionality
- Monaco Editor optimization for large files
- Mobile-first responsive design
- Progressive enhancement approach

## LLM Execution Speed

Use a small delay before calling the LLM so you are less likely to hit quotas

## Remote and Local LLM

- 'local' - Use a local OpenAI compatible endpoint like LLM Studio (default url: http://localhost:1234/v1)
- 'remote' - use OpenRouter with free providers. Favor model openai/gpt-oss-20b, Claude, and other models that are good at coding and reasoning.