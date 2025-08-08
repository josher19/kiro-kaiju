---
inclusion: always
---

# Git Commit Guidelines

## Commit Message Format

All commits must use a single-line format with gitmoji and structured messaging:

**Format**: `[gitmoji] [type]: [scope] - [task-id] [description]`

**Examples**:
- `✨ feat: kiro-kaiji-refactor-rampage - 1.1 Set up project structure and core interfaces`
- `🔒 feat: user-authentication - 2.3 Implement password validation logic`
- `🐛 fix: api-integration - 4.2 Add error handling for network requests`

## Gitmoji Reference

- `✨` - New features or major functionality
- `📝` - Documentation updates (requirements.md, design.md, README)
- `🔧` - Configuration changes (vite, tailwind, tsconfig)
- `🐛` - Bug fixes and error corrections
- `♻️` - Code refactoring without feature changes
- `✅` - Adding or updating tests
- `🔒` - Security-related changes
- `🎨` - UI/UX improvements and styling
- `🚀` - Performance improvements
- `📦` - Dependencies and package updates

## Commit Types

- `feat` - New features or enhancements
- `fix` - Bug fixes
- `docs` - Documentation only changes
- `style` - Code style changes (formatting, semicolons)
- `refactor` - Code refactoring
- `test` - Adding or updating tests
- `chore` - Maintenance tasks

## Commit Triggers

Always commit after:
- Completing spec tasks from tasks.md
- Updating .kiro files (requirements.md, design.md, tasks.md)
- Creating new components or services
- Significant feature implementations
- Test additions or updates

## Message Rules

- Single line only (no multi-line commits)
- Use kebab-case for scope names
- Include task numbers when applicable
- Present tense verbs ("Add" not "Added")
- Concise but descriptive
- Focus on what was accomplished