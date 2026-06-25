# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Dev
expo start                    # start Metro bundler (scan QR in Expo Go)
expo run:android              # run on Android device/emulator (debug)
npm run lint                  # ESLint via expo lint
npm run tsc                   # type-check without emitting
npm run format                # prettier on src/**

# Tests
npx jest                      # run all tests
npx jest BibleText            # run a specific test file by name pattern

# Build & deploy (Android only)
npm run eas:build:preview     # EAS cloud build → internal track
npm run eas:build:production  # EAS cloud build → production track
npm run local:build:preview   # local APK via PowerShell (Windows)
```

## Architecture

### Provider hierarchy (`src/app/_layout.tsx`)

```
SafeAreaProvider
  ThemeProvider          ← dark mode, color theme, haptics (AsyncStorage)
    ReaderSettingsProvider ← font size, text align, reader theme/font (AsyncStorage)
      BibleProvider      ← global navigation state: version/book/chapter/verse, highlights, history
        BibleModalProvider ← controls which modal step is active and its nav state
          AppLayout
            GlobalBibleModals  ← single instance rendering all selection modals
```

All providers are React Contexts consumed via their matching hooks (`useTheme`, `useReaderSettings`, `useBible`, `useBibleModals`). Every setting change is persisted to AsyncStorage using the keys in `src/constants/storage.ts`.

### Bible data layer (`src/data/`)

- `bible-version/` — one JSON per version (NAA, ARA, NVI, KJA, KJF, ACF, NVT). Each file has a `books` array of `Book` (`{ abbrev, name, chapters: string[][] }`). `getBibleData(sigla)` loads from a `require.context` bundle.
- `bible-titles/` — optional per-version section headings (`VerseTitle`). `getBibleTitles(sigla)` returns them; used in `useBible` to enrich `sectionData`.
- `bible-plan/` — JSON templates for reading plans (classic, chronological, NT/AT short/long). Registered in `biblePlanRegistry.ts`.
- `bible-voice/` — audio data (voice IDs per version/book).

### Navigation & routing (`src/app/`)

Expo Router file-based routing. Main routes:
- `/` → `index.tsx` redirects to `/bible`
- `/bible/[version]` → `BibleScreen`
- `/search` → `SearchScreen`
- `/studies/` and `/studies/study/[id]` → `StudiesScreen`, `StudyEditorScreen`
- `/reading-plan` → `ReadingPlanScreen`
- `/configuration` → `ConfigurationScreen`, `/configuration/trash` → `TrashScreen`

Route constants and labels live in `src/constants/routes.ts`.

### Modal selection flow (`GlobalBibleModals`)

The `BibleModalProvider` manages a linear selection wizard with steps: `version → book → chapter → verse`. `openModal({ initialStep, onSelect, skipVerseSelection, ... })` lets callers jump to any step. Navigation state (`navBook`, `navChapter`) is kept separately from the global Bible state so the user can browse without committing.

### Verse list rendering (`BibleVerseReader`)

Uses `@shopify/flash-list` with a flat array (`flatData`) structured as:
- index `0`: `{ type: 'header' }` (chapter title)
- index `N`: `{ type: 'verse', verse: N }` for each verse
- last index: `{ type: 'footer' }` (copyright, if present)

Because the header occupies index 0, **verse number equals its flat index**. `scrollToIndex({ index: verseNumber })` is the correct way to jump to a verse. `scrollToVerse(verse, chapter)` in `BibleScreen` implements this.

### State persistence

All user state is AsyncStorage-only (no remote DB). Keys are centralized in `src/constants/storage.ts`. Backup/restore fires `BACKUP_RESTORED_EVENT` via `DeviceEventEmitter`, which all providers listen to in order to reload their state.

### Styling system

`useResponsive()` returns `ms(value)` (a scaling function) and the `DESIGN` token object (`src/constants/design.ts`). All sizes — spacing, font, border radius, icon sizes — come from `DESIGN` and are passed through `ms()`. Never use raw pixel values.

`useTheme()` returns `colors` (the current light/dark palette). `useReaderSettings()` returns `readerColors` (light/sepia/dark reader palette), which overrides `colors` inside the reading view when `readerTheme !== 'light'`.

### Icons

`BibleIcon` wraps `@expo/vector-icons/Feather`. Use Feather icon names everywhere UI icons are needed.

## Project Rules (from `.kiro/steering/`)

### Naming conventions

- **Components** — PascalCase, filename must match component name (`BibleVerseCard.tsx`)
- **Hooks** — `use` prefix, camelCase (`useResponsive.ts`)
- **Screens** — must end with `Screen` (`BibleScreen.tsx`)
- **Services / Contexts** — end with `Service` or `Context`
- **Booleans** — prefix with `is`, `has`, `can`, or `should`
- **Global constants** — `UPPER_SNAKE_CASE`
- **Scripts** — kebab-case in `/scripts/`; machine-only temporaries go in `/local-scripts/` (gitignored)

### Styling rules

All spacing, sizing, typography, and border-radius **must** go through `useResponsive`:

```typescript
const { ms, DESIGN } = useResponsive();
// ✅
padding: ms(DESIGN.spacing.md)
fontSize: ms(DESIGN.fontSize.lg)
borderRadius: ms(DESIGN.borderRadius.md)

// ❌ forbidden
padding: 12
padding: SPACING.md   // raw constant without ms()
container: {}         // empty style objects
```

### Performance rules

- Memoize expensive calculations (`useMemo`, `useCallback`).
- `React.memo` on list items and pure components.
- Avoid unnecessary re-renders; keep local state local.

### Architecture rules

- Business logic lives in hooks and services — not in components.
- Services contain no UI logic.
- No circular dependencies.
- **No comments in code.**

### Pre-commit checklist

```bash
npm run format   # prettier
npm run lint     # eslint
npm run tsc      # type-check
```

Also verify: no hardcoded style values, no unused imports, no `console.log` left in code.
