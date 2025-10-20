# E2E Tests

End-to-end tests using Playwright to test the complete application flows.

## Running Tests

```bash
# Run all E2E tests (headless)
bun run test:e2e

# Run with UI mode (recommended for development)
bun run test:e2e:ui

# Run in headed mode (see the browser)
bun run test:e2e:headed

# Debug mode (step through tests)
bun run test:e2e:debug
```

## Test Structure

- **projects.spec.ts** - Tests for project CRUD operations, version history, soft deletes
- **tickets.spec.ts** - Tests for ticket CRUD operations, detail pages, status updates
- **members.spec.ts** - Tests for member management, email validation
- **navigation.spec.ts** - Tests for navigation, routing, and URL state

## Prerequisites

The E2E tests require:
1. The development server to be running (or will start automatically)
2. A clean database state (tests create/modify data)
3. Playwright browsers installed (`bunx playwright install chromium`)

## Configuration

See `playwright.config.ts` for configuration options.

## Note on Linting

The E2E tests use inline regex patterns which trigger `useTopLevelRegex` lint warnings.
This is acceptable and standard practice in Playwright tests as these are not
performance-critical code paths.

