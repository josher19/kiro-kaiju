# Requirements Document

## Introduction

Kiro Kaiju: Refactor Rampage is an award-winning educational web application that gamifies the learning of code refactoring and feature development skills. The app presents users with deliberately problematic code challenges themed around programming "Kaiju" monsters, where each monster represents a specific type of coding anti-pattern or challenge. Users must refactor the code, add new features, and overcome the monstrous coding obstacles while being able to get help from AI assistance and quirky virtual team members.

## Requirements

### Requirement 1

**User Story:** As a developer learning refactoring skills, I want to select programming challenges based on language, framework, category, and difficulty, so that I can practice relevant skills at my level. It should smoothly transition to the challenge once it is created. I can have multiple challenges active at one time.

#### Acceptance Criteria

1. WHEN a user visits the challenge selection page THEN the system SHALL display dropdown menus for programming language, front-end framework (optional), programming category, and difficulty level
2. WHEN a user selects a programming language THEN the system SHALL update available framework options to match the selected language
3. WHEN a user selects all required parameters THEN the system SHALL enable the "Generate Challenge" button
4. WHEN a user clicks "Generate Challenge" THEN the system SHALL create a themed coding challenge with appropriate Kaiju monster and problematic code and open the challenge.

### Requirement 2

**User Story:** As a user facing coding challenges, I want to encounter different types of Kaiju monsters that represent specific coding problems, so that I can learn to identify and solve various anti-patterns.

#### Acceptance Criteria

1. WHEN a challenge is generated THEN the system SHALL assign one of the available Kaiju monsters based on the challenge type
2. WHEN HydraBug is assigned THEN the system SHALL create code where fixing one bug introduces two new bugs if not handled carefully
3. WHEN Complexasaur is assigned THEN the system SHALL generate overly complex code with excessive nesting and unclear logic
4. WHEN Duplicatron is assigned THEN the system SHALL create code with massive code duplication across multiple functions
5. WHEN Spaghettizilla is assigned THEN the system SHALL generate code with tangled dependencies and unclear data flow
6. WHEN Memoryleak-odactyl is assigned THEN the system SHALL create code with resource management issues and memory leaks

### Requirement 3

**User Story:** As a user working on challenges, I want to access AI assistance for refactoring, testing, and implementing requirements, so that I can learn best practices while solving the challenge.

#### Acceptance Criteria

1. WHEN a user is viewing a challenge THEN the system SHALL provide an integrated AI Assistant chat interface
2. WHEN a user asks for refactoring help THEN AI Assistant SHALL provide specific suggestions for improving the code structure
3. WHEN a user requests unit test creation THEN AI Assistant SHALL generate appropriate test cases for the code
4. WHEN a user needs help implementing new requirements THEN AI Assistant SHALL guide them through the implementation process
5. WHEN a user interacts with AI Assistant THEN the system SHALL maintain context of the current challenge and code state
6. WHEN new messages are added to the AI chat THEN the system SHALL automatically scroll the chat history to the bottom at average reading speed rather than expanding the window size
7. WHEN AI Assistant and Zoom-A-Friend messages are displayed, Markdown format will be converted into HTML

### Requirement 4

**User Story:** As a user seeking additional guidance, I want to "Zoom-a-Friend" and get advice from different team role avatars, so that I can understand various perspectives on code quality and requirements. The advice will be provided by the AI given different roles, and code comments added to the existing code.

#### Acceptance Criteria

1. WHEN a user clicks "Zoom-a-Friend" THEN the system SHALL display a selection of animal icons with role titles underneath for user selection
2. WHEN a user selects Quality Assurance (Pufferfish) THEN the system SHALL provide feedback focused on defects and bugs AI dialog
3. WHEN a user selects Architect (Owl) THEN the system SHALL provide architectural advice with owl-themed AI dialog including "Architecture" and "Redundancy"
4. WHEN a user selects Product Owner (Pig) THEN the system SHALL provide requirements clarification with AI Product Owner dialog
5. WHEN a user selects Senior Developer (Cat) THEN the system SHALL provide coding best practices with Software Development AI themed dialog
6. WHEN any avatar provides advice THEN the dialog SHALL consist mostly of animal sounds with key technical terms interspersed
7. WHEN Zoom-A-Friend messages are displayed, Markdown format will be converted into HTML

### Requirement 5

**User Story:** As a user completing challenges, I want my solutions to be automatically evaluated on multiple criteria, so that I can receive comprehensive feedback on my coding skills.

#### Acceptance Criteria

1. WHEN a user submits their refactored code THEN the system SHALL evaluate code readability using automated metrics
2. WHEN a user submits their solution THEN the system SHALL assess code quality including maintainability and best practices
3. WHEN a user submits their code THEN the system SHALL check for defects and bugs through automated testing
4. WHEN a user submits their solution THEN the system SHALL verify that all new requirements have been properly implemented
5. WHEN evaluation is complete THEN the system SHALL display a detailed score breakdown with specific feedback for improvement

### Requirement 6

**User Story:** As a mobile user, I want the application to work seamlessly on my mobile device, so that I can practice coding challenges anywhere.

#### Acceptance Criteria

1. WHEN a user accesses the app on a mobile device THEN the system SHALL display a responsive interface optimized for touch interaction
2. WHEN a user views code on mobile THEN the system SHALL provide horizontal scrolling and appropriate text sizing
3. WHEN a user interacts with the AI chat on mobile THEN the system SHALL maintain usability with touch-friendly controls
4. WHEN a user uses Zoom-a-Friend on mobile THEN the avatar interface SHALL be optimized for smaller screens
5. WHEN a user submits code on mobile THEN the system SHALL provide the same functionality as desktop users

### Requirement 7

**User Story:** As a user progressing through challenges, I want to track my improvement and unlock new difficulty levels, so that I can see my growth and stay motivated.

#### Acceptance Criteria

1. WHEN a user completes their first challenge THEN the system SHALL create a progress profile tracking their performance
2. WHEN a user achieves high scores THEN the system SHALL unlock higher difficulty levels and new Kaiju monsters
3. WHEN a user views their profile THEN the system SHALL display statistics on challenges completed, average scores, and improvement trends
4. WHEN a user defeats a specific Kaiju type THEN the system SHALL award achievement badges
5. WHEN a user reaches milestones THEN the system SHALL provide encouraging feedback and unlock special challenges

### Requirement 8

**User Story:** As a user completing challenges, I want to submit my code for comprehensive AI-based grading from multiple role perspectives, so that I can receive detailed feedback and track my progress with recorded scores.

#### Acceptance Criteria

1. WHEN a user clicks "Submit Code for Grading" THEN the system SHALL evaluate the code using AI from four different role perspectives in sequence: Developer, Architect, SQA, and Product Owner
2. WHEN the system evaluates code THEN it SHALL send the code to a single AI model and request evaluation from all four role perspectives in one request
3. WHEN the AI model responds THEN it SHALL return a JSON object with scores and brief reasons for each role in the format: {"developer": [score, "reason"], "architect": [score, "reason"], "sqa": [score, "reason"], "productOwner": [score, "reason"]}
4. WHEN evaluating as Developer role THEN the system SHALL provide detailed prompts focusing on code quality, best practices, maintainability, and technical implementation
5. WHEN evaluating as Architect role THEN the system SHALL provide detailed prompts focusing on system design, scalability, patterns, and architectural decisions
6. WHEN evaluating as SQA role THEN the system SHALL provide detailed prompts focusing on defects, edge cases, testing coverage, and quality assurance concerns
7. WHEN evaluating as Product Owner role THEN the system SHALL provide detailed prompts focusing on requirement fulfillment, user experience, and business value delivery
8. WHEN all role evaluations are complete THEN the system SHALL display individual scores from each role and calculate an average overall score
9. WHEN grading is complete THEN the system SHALL record the individual role scores and average score in the user's Progress page for tracking improvement over time

### Requirement 9

**User Story:** As a developer using the application, I want flexible AI provider options including local and remote LLM support, so that I can choose the most appropriate AI solution for my environment and needs.

#### Acceptance Criteria

1. WHEN the system is configured for local LLM THEN it SHALL connect to an OpenAI-compatible endpoint at http://localhost:1234/v1 by default
2. WHEN the system is configured for remote LLM THEN it SHALL use OpenRouter API with preferred models including openai/gpt-oss-20b and Claude
3. WHEN making LLM requests THEN the system SHALL implement a small delay before calling the LLM to avoid hitting quotas
4. WHEN a preferred remote model is unavailable THEN the system SHALL automatically fallback to other coding-focused models
5. WHEN local LLM endpoint is unreachable THEN the system SHALL provide clear error messages and fallback options
6. WHEN using remote LLM THEN the system SHALL optimize for free tier usage and cost-aware model selection