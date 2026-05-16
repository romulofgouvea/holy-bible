---
trigger: always_on
---

# Script Organization Rules

---

## Script Folder Rules

### Mandatory Script Location
- Any utility script, automation script, maintenance script, migration helper, build helper, or development helper must be created inside the `scripts` folder.

### Allowed Script Types
- build scripts
- deploy scripts
- migration scripts
- cleanup scripts
- code generation scripts
- validation scripts
- automation scripts
- development utilities
- release scripts
- backup scripts
- database helper scripts

---

## Forbidden Patterns

- Do not create utility scripts in:
  - root folder
  - src folder
  - components folder
  - services folder
  - random project directories

- Do not duplicate script functionality across multiple locations.

---

## Preferred Structure

```txt
/scripts
  build-app.ts
  generate-icons.ts
  clean-cache.ts
  validate-translations.ts
  backup-database.ts


# Local Scripts Rules

---

## Local Scripts Folder Rules

### Non-Versioned Scripts
- Scripts that are only used locally and should not be committed to the repository must be created inside the `local-scripts` folder.

### Examples of Local Scripts
- personal development helpers
- local environment setup scripts
- temporary migration scripts
- debug scripts
- local testing utilities
- machine-specific automation
- temporary maintenance scripts

---

## Git Rules

### Ignore Local Scripts
- The `local-scripts` folder must be included in `.gitignore`.
- Local scripts must never be committed to the repository.

### Example
```gitignore
/local-scripts