# Implementation Plan

- [x] 1. Set up project structure and development environment
  - Initialize Vue 3 project with TypeScript using Vite
  - Configure Tailwind CSS for styling and responsive design
  - Set up Pinia for state management
  - Configure development scripts and build tools
  - _Requirements: 6.1, 6.2_

- [x] 2. Create core data models and TypeScript interfaces
  - Define Kaiju monster interfaces and enums (KaijuType, KaijuMonster)
  - Create challenge configuration interfaces (ChallengeConfig, Challenge)
  - Implement user progress and evaluation models
  - Define team member and dialog response interfaces for Zoom-a-Friend
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 4.2, 4.3, 4.4, 4.5, 7.1, 7.2, 7.3, 7.4_

- [x] 3. Implement Kaiju Monster Engine
  - Create KaijuMonster class with monster definitions
  - Implement HydraBug monster with bug multiplication logic
  - Implement Complexasaur monster with complex code generation
  - Implement Duplicatron monster with code duplication patterns
  - Implement Spaghettizilla monster with tangled dependency patterns
  - Implement Memoryleak-odactyl monster with memory management issues
  - Write unit tests for each Kaiju monster type
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 4. Create (or Update) Challenge Selector Component
  - Build Vue component with dropdowns for language, framework, category, difficulty
  - Implement dynamic framework filtering based on selected language
  - Add form validation and "Generate Challenge" button state management
  - Implement support for multiple active challenges simultaneously
  - Add smooth transition functionality to automatically open generated challenges
  - Integrate with Pinia store for challenge configuration
  - Write component tests for user interactions and multi-challenge support
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 5. Integrate Monaco Code Editor
  - Install and configure Monaco Editor for Vue 3
  - Create CodeEditor Vue component with syntax highlighting
  - Implement theme switching (light/dark) functionality
  - Add mobile-responsive controls and touch optimization
  - Configure language support for multiple programming languages
  - Write tests for editor functionality and mobile responsiveness
  - _Requirements: 6.1, 6.2, 6.3_

- [x] 6. Build Challenge Generation Service
  - Create challenge generation API service functions
  - Implement code template generation for different languages
  - Integrate Kaiju monster selection logic with challenge difficulty
  - Create problematic code patterns for each Kaiju type
  - Add requirement generation based on challenge parameters
  - Write unit tests for challenge generation logic
  - _Requirements: 1.4, 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 7. Implement AI Chat Interface Component
  - Create AIChatInterface Vue component with message display
  - Build chat input with send functionality
  - Implement message history and context management
  - Add automatic scroll to bottom at average reading speed when new messages are added (not expanding window size)
  - Add loading states and error handling for AI responses
  - Integrate with multiple AI providers (AWS LLM, Local LLM, Remote LLM)
  - Implement AI capabilities for refactoring assistance, unit test generation, and requirement implementation guidance
  - Ensure challenge and code state context is maintained throughout AI interactions
  - Write tests for chat functionality, auto-scroll behavior, and API integration
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 8. Create (or Update) Zoom-a-Friend Panel Component
  - Build team member selection interface with animal icons and role titles
  - Implement Quality Assurance (Pufferfish) dialog with bug-focused AI responses
  - Implement Architect (Owl) dialog with architectural AI advice including "Architecture" and "Redundancy"
  - Implement Product Owner (Pig) dialog with requirements clarification using AI Product Owner dialog
  - Implement Senior Developer (Cat) dialog with coding best practices using Software Development AI themed dialog
  - Create animal-themed dialog generation with sound effects and key terms interspersed
  - Implement AI-generated code comments functionality that adds role-specific comments to existing code
  - Write tests for each team member's dialog patterns and code comment generation
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [x] 9. Build Code Evaluation System
  - Create evaluation service for code quality analysis
  - Implement readability scoring using automated metrics
  - Build defect detection through static code analysis
  - Create requirement verification system
  - Implement overall scoring algorithm with weighted criteria
  - Add detailed feedback generation for improvement suggestions
  - Write comprehensive tests for evaluation accuracy
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 10. Implement AI-Based Multi-Role Grading System
  - Create AI grading service with single model approach for all role evaluations
  - Implement /v1/models endpoint querying to determine available models
  - Build unified prompt system that requests evaluation from all four roles in one API call
  - Create detailed grading prompts for Developer role focusing on code quality, best practices, maintainability, and technical implementation
  - Create detailed grading prompts for Architect role focusing on system design, scalability, patterns, and architectural decisions
  - Create detailed grading prompts for SQA role focusing on defects, edge cases, testing coverage, and quality assurance concerns
  - Create detailed grading prompts for Product Owner role focusing on requirement fulfillment, user experience, and business value delivery
  - Implement single API request system that sends code to one AI model and requests all four role perspectives simultaneously
  - Build JSON response parser to extract individual role scores and feedback in format: {"developer": [score, "reason"], "architect": [score, "reason"], "sqa": [score, "reason"], "productOwner": [score, "reason"]}
  - Build score calculation and averaging system for individual role scores
  - Create grading results display component showing individual and average scores
  - Integrate grading history tracking into user progress system
  - Add "Submit Code for Grading" button and workflow to challenge interface
  - Write comprehensive tests for AI grading service and unified role-based evaluation
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9_

- [x] 11. Implement (of Update) User Progress Tracking
  - Create UserProgress Pinia store for state management
  - Build progress profile creation and statistics tracking
  - Progress will be tracked after user clicks "Submit Code for Grading" from previous Task
  - Fix "Submit Code for Grading" error handling to properly handle successful grading responses
  - Go to the Progress page when Grade is successfully submitted so user can see their progress
  - Ensure grading results are properly processed and stored when grading is successful
  - Implement achievement system with badge unlocking
  - Create difficulty level progression logic
  - Add milestone tracking and encouraging feedback
  - Build progress visualization components
  - Write tests for progress tracking and achievement logic
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 12. Create Main Application Layout
  - Build responsive main layout component with mobile-first design
  - Implement navigation between challenge selection, coding, and progress views
  - Add collapsible panels for AI chat and Zoom-a-Friend on mobile
  - Create loading states and error boundaries
  - Implement swipe gestures for mobile navigation
  - Write tests for responsive layout and mobile interactions
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 13. Integrate Local Mode with Kiro IDE
  - Create file system integration for local code modification
  - Implement direct AI integration for local mode
  - Build local challenge submission and evaluation workflow
  - Add real-time file watching and synchronization
  - Write integration tests for Kiro IDE functionality
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 14. Implement Local LLM Integration
  - Configure OpenAI-compatible endpoint support for local LLM providers
  - Set default local endpoint to http://localhost:1234/v1 for LLM Studio compatibility
  - Implement connection detection and fallback logic for local LLM services
  - Add environment configuration for local LLM model selection
  - Create request delay mechanism to avoid quota issues
  - Implement clear error messages when local LLM endpoint is unreachable with fallback options
  - Write unit tests for local LLM integration and error handling
  - _Requirements: 9.1, 9.3, 9.5_

- [x] 15. Implement Remote LLM Integration with OpenRouter
  - Configure OpenRouter API integration with preferred model selection
  - Implement model preference hierarchy (openai/gpt-oss-20b, Claude, coding-focused models)
  - Add automatic model fallback when preferred models are unavailable to other coding-focused models
  - Implement request rate limiting and delay mechanisms to avoid hitting quotas
  - Create cost-aware model selection for free tier optimization
  - Write integration tests for OpenRouter API and model switching
  - _Requirements: 9.2, 9.3, 9.4, 9.6_

- [x] 16. Fix Build Process and Ensure Test Suite Passes
  - Fix TypeScript compilation errors in cloudService.ts (type-only imports)
  - Resolve failing unit tests in components and services
  - Fix E2E test configuration issues with Playwright
  - Address test assertion failures in AIChatInterface, ChallengeSelector, GradingResults, and ZoomAFriendPanel components
  - Fix service test failures in aiService, aiGradingService, challengeService, and localEvaluationService
  - Ensure all unit tests pass without errors or warnings
  - Verify build process completes successfully
  - Test development server stability and hot reload functionality
  - Commit changes after all tests pass
  - _Requirements: All requirements depend on a stable build process_

- [x] 17. Implement AWS Cloud Mode Services
  - Use serverless v3 for deploying AWS Code
  - Set up AWS Lambda functions for challenge generation and grading via AI Services
  - Configure DynamoDB for user progress and challenge storage
  - Do not expose AWS Credentials directly to the front-end
  - Keep back-end code in an "aws" folder
  - Implement user authentication and session management
  - Create API endpoints for all cloud-based functionality
  - Integrate multi-provider AI support using AWS Bedrock with an inexpensive model that can grade Code and an openai compatible interface (/v1/models, /v1/chat/completions) via one or more Lambdas
  - Login required in order to use most endpoints
  - Write mocked unit or integration tests for AWS services and AI provider switching.
  - Use minimal amount of AWS services and code to fullfill this Task
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 7.1, 7.2, 7.3_

- [x] 18. Implement AWS Cost Management and Budget Controls
  - Create AWS cost management service with configurable spending limits (default: $15/month)
  - Implement CloudWatch cost monitoring and alert system with thresholds at 50%, 80%, and 95% of budget
  - Build budget enforcement logic that prevents new API calls when budget is exceeded
  - Create automatic service shutdown mechanism when budget limit is reached
  - Implement cost-aware AI model selection to prioritize free-tier and low-cost options
  - Add user notification system for budget alerts and cost status using SNS
  - Create a JSON config file for budget management
  - Implement graceful degradation to local mode when AWS budget is exceeded
  - Front-end should fail over to Local Mode or require an OpenRouter API key to continue if user click "Cloud"
  - Add cost optimization strategies for AI service usage
  - Write basic unit tests for cost management logic and budget enforcement
  - _Requirements: 9.6, plus cost management requirements from design document_

- [x] 19. Add Error Handling and Offline Support
  - Implement comprehensive error handling with user-friendly messages
  - Create offline mode with cached challenges and local storage
  - Add network connectivity detection and graceful degradation
  - Implement retry logic for failed API requests
  - Create fallback UI states for various error conditions
  - Write tests for error scenarios and offline functionality
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 20. Implement Visual Display System
  - Create visual display component positioned in left sidebar between Progress link and Deployment Mode chooser
  - Implement Kaiju image display when challenge is first selected (from src/assets/images/kaiju/)
  - Implement team member image display when Zoom-a-Friend is clicked (from src/assets/images/team/${TeamRole}_sm.png)
  - Add smooth image transitions between Kaiju and team member images
  - Ensure responsive image sizing for different screen sizes
  - Integrate with challenge selection to show appropriate Kaiju monster image
  - Integrate with Zoom-a-Friend panel to show selected team member image
  - Write tests for image display logic and transitions
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 21. Implement Markdown to HTML Rendering for AI Messages
  - Create markdown rendering service for AI Assistant and Zoom-a-Friend messages
  - Implement HTML sanitization to prevent XSS attacks while allowing safe formatting
  - Add support for code blocks with syntax highlighting
  - Support inline code, bold/italic text, lists, links, and headers
  - Configure external links to open in new tabs for security
  - Update AI Chat Interface component to render markdown content as HTML
  - Update Zoom-a-Friend Panel component to render markdown content as HTML
  - Ensure grading responses remain as JSON format (not converted to HTML)
  - Update UI labels to display "AI Assistant" instead of "Kiro AI Assistant" and "Ask AI for help" instead of "Ask Kiro AI for help"
  - Write tests for markdown rendering, HTML sanitization, and security measures
  - _Requirements: 3.7, 4.7_

- [x] 22. Optimize Performance and Accessibility
  - Implement code splitting and lazy loading for components
  - Add service worker for offline functionality and caching
  - Optimize Monaco Editor performance for large code files
  - Ensure WCAG 2.1 AA accessibility compliance
  - Add keyboard navigation and screen reader support
  - Write performance tests and accessibility audits
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 23. Create End-to-End Testing Suite
  - Write E2E tests for complete challenge workflow
  - Test mobile responsiveness across different devices
  - Verify AI integration and Zoom-a-Friend functionality
  - Test evaluation system accuracy and feedback quality
  - Create performance benchmarks for challenge generation
  - Add cross-browser compatibility testing
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 24. Use AWS Cloud Mode Services by default
  - AWS backend services have been deployed to: https://wz1g0oat52.execute-api.us-west-2.amazonaws.com/dev
  - aiService.ts needs to updated to have an AWS service as well
  - Default should be AWS instead of Kiro
  - To use AWS, user most first POST their non-null userId to https://wz1g0oat52.execute-api.us-west-2.amazonaws.com/dev/api/auth/login and get back a sessionid, which will then be used for Authentication: Bearer ${sessionId} for AI related endpoints
  - Login required in order to use most endpoints
  - Do not write unit tests yet. You can write a test_plan.md file for manual testing. Any existing tests which fail should be skipped (it.skip or test.skip) for now.
  - Try to minimize the amount of code updated. Write new code similar to existing code. AWS Service routes in aws/servleress.yml are similar to OpenRouter but requires a different Authentication header on each login
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 7.1, 7.2, 7.3_

- [x] 25. Optimize Zoom-A-Friend Chat History
  - Zoom-A-Friend is currently sending more than 19,000 bytes in 8 messages
  - Instead of sending all the messages, you can just send the last message or last few messages
  - Implement message truncation to reduce payload size and improve performance
  - Chat History should be truncated when a Challenge is completed
  - The System Prompt should be shorter for Zoom-A-Friend than it is for Grading
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 26. Fix Monaco Editor Integration
  - Monaco Editor is installed in package.json but not properly integrated into CodeEditor component
  - Implement proper Monaco Editor setup with syntax highlighting for multiple languages
  - Add theme switching (light/dark) functionality
  - Configure mobile-responsive controls and touch optimization
  - Add language support for all supported programming languages
  - _Requirements: 6.1, 6.2, 6.3_

- [x] 27. Complete Missing Core Components
  - Implement KaijuDisplay component in src/components/kaiju/ directory (currently empty)
  - Clicking on the Kaiju or Team Member will show the full 1024x1024 image (same image without "_sm" or "_small" in the name, for example "developer.png" instead of "developer_sm.png") than can be dismissed by clicking (or touching) anywhere on the page
  - Add proper error boundaries and loading states throughout the application
  - _Requirements: 1.4, 2.1, 2.2, 2.3, 2.4, 2.5_
