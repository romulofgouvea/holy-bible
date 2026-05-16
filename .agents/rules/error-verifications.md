---
trigger: always_on
---

## Rules for Verifications When Modifying a TypeScript File

* Verify that the modification does not break existing functionality.
* Ensure all TypeScript types remain correct and strongly typed.
* Avoid using `any` unless strictly necessary and justified.
* Check if interfaces, DTOs, or types need to be updated after the change.
* Validate that imports are still correct and remove unused imports.
* Confirm that the code follows SOLID principles and clean code practices.
* Ensure naming conventions remain consistent across the project.
* Verify that asynchronous operations use proper `async/await` handling.
* Check for possible null or undefined values before accessing properties.
* Ensure error handling is implemented correctly.
* Verify that no duplicated logic was introduced.
* Confirm that environment variables and configuration values are not hardcoded.
* Ensure backward compatibility with existing modules and APIs.
* Check if unit tests need to be updated or added.
* Run linting and formatting tools after modifications.
* Verify that the code compiles without TypeScript errors.
* Check for performance impacts caused by the modification.
* Ensure no sensitive data or secrets were exposed in the code.
* Validate that dependency injection remains correctly configured.
* Confirm that logs and debugging statements are removed before production.
* Ensure comments and documentation are updated if necessary.
* Verify that database entities and migrations remain synchronized.
* Check that API responses and contracts were not unintentionally changed.
* Ensure the file structure and architecture patterns remain consistent.
* Validate that the change does not introduce circular dependencies.
* Confirm that all new methods and classes have clear responsibilities.
* Verify compatibility with the current TypeScript version and project standards.
* Ensure that code remains readable, maintainable, and scalable.
* Run the `tsc` command after every modification to verify that the TypeScript project compiles without errors.
* Ensure there are no TypeScript compilation warnings or type inconsistencies.
* Validate that generated type definitions remain compatible with the existing codebase.
* Confirm that all updated files are included correctly in the TypeScript compilation process.
* Check that no path alias or module resolution issues were introduced after the modification.
