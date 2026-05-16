---
trigger: manual
---

````md
# TypeScript + Expo Naming Verification Rules

## General Rules
- Always use English for all code, file names, variables, functions, classes, types, interfaces, comments, and folders.
- Use clear, descriptive, and meaningful names.
- Avoid abbreviations unless they are universally recognized.
- Keep naming conventions consistent across the entire project.
- Do not mix naming styles in the same module.

---

## File Naming Rules

### React Components
- Use PascalCase for component file names.
- Examples:
  - UserProfile.tsx
  - BibleVerseCard.tsx

### Hooks
- Hook files must start with `use`.
- Use camelCase.
- Examples:
  - useAuth.ts
  - useTheme.ts

### Screens
- Screen files must end with `Screen`.
- Use PascalCase.
- Examples:
  - HomeScreen.tsx
  - SettingsScreen.tsx

### Services
- Service files must end with `Service`.
- Use PascalCase.
- Examples:
  - AuthService.ts
  - ApiService.ts

### Contexts
- Context files must end with `Context`.
- Use PascalCase.
- Examples:
  - AuthContext.tsx
  - ThemeContext.tsx

### Store Files
- Store files must end with `Store`.
- Use PascalCase.
- Examples:
  - AuthStore.ts
  - SettingsStore.ts

### Types and Interfaces
- Use PascalCase.
- Do not prefix interfaces with `I`.
- Examples:
  - User
  - AuthResponse

### Enums
- Use PascalCase for enum names.
- Use UPPER_SNAKE_CASE for enum values.

### Folder Names
- Use kebab-case or lowercase consistently.
- Examples:
  - auth-services
  - bible-components

---

## Variable Naming Rules

### Variables
- Use camelCase.
- Names must be descriptive.

### Boolean Variables
- Must start with:
  - is
  - has
  - can
  - should

### Constants
- Use UPPER_SNAKE_CASE for global constants.
- Examples:
  - API_BASE_URL
  - MAX_RETRY_COUNT

---

## Function Naming Rules

### Functions
- Use camelCase.
- Function names must start with a verb.
- Examples:
  - fetchUserData
  - validateToken

### Async Functions
- Use action-oriented names.
- Examples:
  - loadBibleChapter
  - createUserAccount

### Event Handlers
- Must start with `handle`.
- Examples:
  - handleLogin
  - handleScrollEnd

---

## React Component Rules

- Use PascalCase for component names.
- Component names must describe the UI responsibility.
- File name must match the component name.

---

## Navigation Rules

### Navigation Stacks
- Must end with `Stack`.
- Examples:
  - AuthStack
  - MainStack

### Route Names
- Use descriptive names.
- Prefer UPPER_SNAKE_CASE for route constants.

---

## Verification Rules Before Any Commit

- Verify all new files follow naming conventions.
- Verify component names match file names.
- Verify hooks start with `use`.
- Verify screen files end with `Screen`.
- Verify service files end with `Service`.
- Verify store files end with `Store`.
- Verify context files end with `Context`.
- Verify boolean variables use valid prefixes.
- Verify constants use UPPER_SNAKE_CASE.
- Verify async functions use action-oriented names.
- Verify no duplicated or ambiguous names exist.
- Verify imports use the correct casing.
- Verify no case-sensitive conflicts exist between Android, iOS, and Linux environments.
- Verify Expo assets and folders follow consistent naming conventions.

---

## Required Validation Commands

- Always run TypeScript validation after modifications:
```bash
tsc
````

* Always run lint validation:

```bash
npm run lint
```

* Ensure the project compiles without TypeScript errors before commit.

---

## Clean Code Rules

* Follow SOLID principles.
* Keep functions small and with a single responsibility.
* Avoid duplicated code.
* Avoid using `any` unless absolutely necessary.
* Prefer strict typing whenever possible.
* Remove unused imports, variables, and functions.
* Ensure code remains readable, maintainable, and scalable.

* Use English names for components, pages and variables

```
```