---
trigger: always_on
---

# Additional Design System Rules

---

## Responsive Rules

### useResponsive Hook
- Always use the `useResponsive` hook for responsive layouts and sizing.
- Do not use hardcoded screen dimensions directly inside components.
- Avoid repeated responsive calculations in multiple components.
- Centralize responsive behavior using the project's responsive utilities.

## Design Constants Rules

### Mandatory Design Constants Usage
- Always use centralized design constants for:
  - colors
  - spacing
  - font sizes
  - border radius
  - shadows
  - z-index
  - icon sizes
  - layout dimensions

- Never hardcode design values directly inside components.

### Forbidden Patterns
- Do not use hardcoded values like:
  - `padding: 12`
  - `fontSize: 16`
  - `borderRadius: 8`
  - `color: '#FFFFFF'`

### Preferred Pattern
- Always import values from the design system constants.

### Example
```typescript
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '@/constants/design';

padding: SPACING.md;
fontSize: FONT_SIZES.body;
borderRadius: BORDER_RADIUS.md;
color: COLORS.primary;