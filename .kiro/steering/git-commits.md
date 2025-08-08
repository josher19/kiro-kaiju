# Git Commit Guidelines

## Automatic Commit Messages

When modifying .kiro files or completing spec tasks, always add a one-line git commit message that follows this format:

**Format**: `[gitmoji] feat: [feature-name] - [task-number] [brief-description]`

**Examples**:
- `✨ feat: kiro-kaiji-refactor-rampage - 1.1 Set up project structure and core interfaces`
- `🔒 feat: user-authentication - 2.3 Implement password validation logic`
- `🐛 feat: api-integration - 4.2 Add error handling for network requests`

## Common Gitmoji for Spec Work

- `✨` `:sparkles:` - New features or major functionality
- `📝` `:memo:` - Documentation updates (requirements.md, design.md)
- `🔧` `:wrench:` - Configuration changes
- `🐛` `:bug:` - Bug fixes
- `♻️` `:recycle:` - Refactoring code
- `✅` `:white_check_mark:` - Adding or updating tests
- `🔒` `:lock:` - Security-related changes
- `🎨` `:art:` - UI/UX improvements

## When to Commit

- After completing any task from a spec's tasks.md file
- After modifying requirements.md, design.md, or tasks.md files
- After creating new spec directories or files
- After significant updates to steering files

## Commit Message Rules

- Use lowercase for feature names (kebab-case)
- Include the task number when completing specific tasks
- Keep descriptions concise but descriptive
- Use present tense ("Add" not "Added")
- Focus on what was accomplished, not how