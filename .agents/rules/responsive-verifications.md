---
trigger: always_on
---

# Responsive Design System Rules

---

## Mandatory useResponsive Usage

### Required Pattern
- All spacing, sizing, and layout values must use the `useResponsive` hook.
- Do not use static design constants directly inside styles.
- Responsive values must always be generated through `useResponsive`.

---

## Forbidden Patterns

### Do Not Use
```typescript
padding: SPACING.md
marginTop: SPACING.lg
fontSize: FONT_SIZES.body
borderRadius: BORDER_RADIUS.md
width: 300
height: 200