---
name: playwright-expert
description: "Use when analyzing, designing, implementing, debugging, or reviewing Playwright E2E automation. Apply for browser-based QA workflows, Page Object Model, locators, fixtures, flaky-test diagnosis, trace analysis, UI exploration with Playwright MCP, API mocking, visual testing, or Playwright configuration. Trigger on Playwright, E2E, browser testing, UI automation, Page Object Model, test flakiness, locator validation, browser exploration, or MCP-assisted test development."
---

# Playwright Expert

Specialize in robust, maintainable Playwright E2E automation. Treat project-specific instructions as authoritative and use Playwright MCP as a browser exploration and validation tool, not as a source of business truth.

## Project Instructions Take Precedence

Before implementing or modifying tests:

1. Read the repository `AGENTS.md` and any project-local instructions.
2. Inspect the existing framework structure, fixtures, helpers, Page Objects, utilities and reporting mechanisms.
3. Reuse existing project abstractions before introducing new ones.
4. Adapt all examples in this skill to repository-specific conventions.
5. Never replace a project-specific import, fixture, naming convention or evidence mechanism with a generic example from this skill.

## Core Workflow

1. **Read project context** - Load repository instructions and inspect the existing automation structure.
2. **Analyze requirements** - Identify the functional objective, actors, preconditions, business rules, data, expected results and relevant risks.
3. **Inspect existing automation** - Reuse current Page Objects, fixtures, helpers, data builders and reporting utilities where possible.
4. **Explore the UI when useful** - Use Playwright MCP when browser exploration can remove uncertainty or validate real behavior.
5. **Design tests** - Cover the relevant positive, negative and boundary scenarios according to risk and requirement scope.
6. **Validate locators** - Prefer accessible and stable locators; validate uncertain candidates against the real application with MCP when appropriate.
7. **Implement** - Follow the repository's POM, fixture, data and evidence conventions.
8. **Run** - Execute the relevant Playwright tests with the project's normal commands.
9. **Debug** - Use logs, traces, screenshots, code inspection and MCP-based reproduction as appropriate.
10. **Fix and verify** - Correct the root cause and rerun the affected scope; check for regressions when needed.
11. **Report** - Summarize what was tested, what changed, failures found, evidence generated and unresolved risks.

## Browser Exploration with Playwright MCP

Use Playwright MCP when interaction with the real application can reduce assumptions or validate browser behavior.

Use MCP to:

- Explore pages, menus, dialogs, forms and user flows before implementing unknown functionality.
- Inspect accessible roles, labels, placeholders, text and interactive controls.
- Validate candidate locators against the real application.
- Reproduce browser failures when implementation and actual UI differ.
- Verify observable UI behavior before or after changing automation code.
- Confirm whether an element exists, is visible, enabled, reachable or rendered in a different structure such as a modal or iframe.

Do not use MCP as the source of truth for business requirements.

Treat these separately:

- **Expected behavior**: defined by requirements, acceptance criteria, functional documentation and project instructions.
- **Observed behavior**: what the application currently does when inspected through MCP or a browser.

When observed behavior conflicts with expected behavior:

1. Record the observed behavior.
2. Record the expected behavior.
3. Do not silently weaken or rewrite the test to make the current application pass.
4. Report the discrepancy as a potential defect, requirement gap, data issue or environment issue according to available evidence.

## MCP Decision Rule

Do not invoke Playwright MCP automatically for every task.

Use MCP when:

- the UI structure is unknown;
- a locator must be discovered or validated;
- the current browser behavior matters;
- a test failure cannot be explained from code, logs, screenshots or traces;
- a workflow must be reproduced interactively;
- the user explicitly requests application exploration.

Skip MCP when:

- changing isolated utilities;
- editing configuration unrelated to browser behavior;
- refactoring known Page Objects without changing selectors;
- the required browser evidence already exists in the repository;
- running the existing automated suite is sufficient.

## Reference Guide

Load detailed guidance only when relevant:

| Topic | Reference | Load When |
|---|---|---|
| Selectors | `references/selectors-locators.md` | Writing, reviewing or validating locators |
| Page Objects | `references/page-object-model.md` | Designing or refactoring POM and fixtures |
| API Mocking | `references/api-mocking.md` | Intercepting or mocking network requests |
| Configuration | `references/configuration.md` | Changing `playwright.config.ts` or environment setup |
| Debugging | `references/debugging-flaky.md` | Diagnosing flaky or failing browser tests |

If a referenced file does not exist, do not invent its contents. Continue with the rules in this `SKILL.md` and report the missing reference if it materially blocks the task.

## Test Design Rules

Before automating a functional flow, identify as applicable:

- objective and actor;
- preconditions;
- input data;
- business rules;
- expected result;
- relevant negative scenarios;
- boundary conditions;
- external dependencies;
- state transitions;
- evidence needed for execution or audit.

Do not create unnecessary permutations. Prioritize scenarios by risk, business impact, probability and requirement scope.

If critical functional information is missing, do not invent expected behavior.

## Locator Strategy

Prefer stable, user-facing locators in this order when they accurately identify the target:

1. `getByRole()` with accessible name.
2. `getByLabel()`.
3. `getByPlaceholder()`.
4. `getByText()` when text is stable and unambiguous.
5. `getByTestId()` when the application exposes a stable test identifier.
6. Stable CSS selectors as a fallback.

Avoid by default:

- CSS classes tied to styling;
- long XPath expressions;
- `nth-child` chains;
- generated or volatile IDs;
- `first()` or `nth()` used only to silence strict-mode ambiguity.

When a locator is uncertain, validate it against the real application with Playwright MCP before committing it.

## Page Object Model

Use Page Object Model for maintainability when the repository follows or benefits from POM.

Keep Page Objects focused on:

- locators;
- page-level actions;
- reusable interaction flows;
- navigation helpers closely related to the page.

Keep functional assertions primarily in tests unless the repository already defines reusable assertion helpers or component abstractions.

Do not create duplicate Page Objects or helpers when an equivalent abstraction already exists.

## Test Independence and Shared State

Prefer independent tests and isolated data.

Do not impose independence or parallelism when the business flow intentionally depends on persisted data produced by another case.

When a dependent flow exists:

- preserve the real generated identifier through the repository's approved persistence mechanism;
- recover it from the actual artifact, metadata, Excel or state store used by the project;
- never reconstruct a dependent identifier from the current timestamp;
- do not run dependent cases in parallel if they share mutable state.

Run tests in parallel only when their data and state model safely allow it.

## Reliability Constraints

### MUST DO

- Prefer role-based and accessibility-oriented selectors when possible.
- Leverage Playwright auto-waiting and web-first assertions.
- Reuse repository fixtures, helpers and utilities before creating new ones.
- Keep tests deterministic and explicit about preconditions.
- Enable or preserve traces/screenshots according to the repository's debugging policy.
- Diagnose flaky tests instead of masking them.
- Validate fixes by rerunning the affected scenario and, when relevant, a broader regression scope.

### MUST NOT DO

- Use `waitForTimeout()` as a synchronization strategy.
- Add arbitrary sleeps to hide timing problems.
- Rely on brittle CSS classes when a stable user-facing locator exists.
- Share mutable state between tests unless the functional flow explicitly requires it and the project defines how to persist that state.
- Ignore flaky tests.
- Use `first()` or `nth()` without a justified reason.
- Treat observed browser behavior as proof that the application meets the requirement.
- Change tests merely to conform to a current defect in the application.

## Code Examples

### Locator: role-based vs brittle CSS

```typescript
// Preferred when accessible name is stable
await page.getByRole('button', { name: 'Submit' }).click();
await page.getByLabel('Email address').fill('user@example.com');

// Avoid when the class is only presentational or volatile
await page.locator('.btn-primary.submit-btn').click();
await page.locator('.email-input').fill('user@example.com');
```

### Page Object Model

```typescript
// pages/LoginPage.ts
import { type Page, type Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel('Email address');
    this.passwordInput = page.getByLabel('Password');
    this.submitButton = page.getByRole('button', { name: 'Sign in' });
    this.errorMessage = page.getByRole('alert');
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}
```

### Test import

Follow the repository-specific fixture import defined in `AGENTS.md` or existing tests.

```typescript
// Generic Playwright example only. Replace with the project's fixture import when required.
import { test, expect } from '@playwright/test';
```

For a project that defines a custom fixture, use that project convention instead, for example:

```typescript
import { test, expect } from '@fixtures/base.fixture';
```

## Debugging Workflow

1. Run the failing test with the repository's normal trace/screenshot policy.
2. Inspect the error, stack trace and test artifacts.
3. Open the trace when it can explain timing, navigation or locator failures.
4. Inspect the relevant Page Object, fixture and test data.
5. Use Playwright MCP when reproduction against the current UI can clarify the failure.
6. Classify the most likely cause before changing code: automation defect, product defect, data issue, environment issue or requirement ambiguity.
7. Fix the root cause.
8. Rerun the affected case.
9. Repeat or broaden execution when flakiness or regression risk remains.

Example configuration pattern:

```typescript
use: {
  trace: 'on-first-retry',
  screenshot: 'only-on-failure',
}
```

Avoid this:

```typescript
await page.waitForTimeout(2000);
await page.getByRole('button', { name: 'Save' }).click();
```

Prefer a condition that expresses the actual expected state:

```typescript
const saveButton = page.getByRole('button', { name: 'Save' });
await expect(saveButton).toBeVisible();
await saveButton.click();
```

For suspected flakiness, repeat the affected test when appropriate:

```bash
npx playwright test --repeat-each=10
```

## Code Review Mode

When the user requests a code review, audit or analysis without code changes:

1. Do not modify files.
2. Read `AGENTS.md` first and identify all project-specific rules that apply to the reviewed scope.
3. Classify each applicable rule using one of these states:
   - **PASS**: clear evidence confirms compliance.
   - **FAIL**: clear evidence confirms non-compliance.
   - **N/A**: the rule does not apply to the reviewed case.
   - **UNKNOWN**: available evidence is insufficient to verify the rule.
4. Cite the relevant file and line or code location when possible.
5. Separate findings into:
   - verified non-compliance;
   - risks or uncertainties;
   - optional maintainability or readability improvements.
6. Do not present assumptions, preferences or style choices as verified defects.
7. Do not infer compliance for repository-wide rules unless the required repository evidence was actually inspected.
8. Do not assign numeric scores unless the project explicitly defines a scoring rubric.
9. Before recommending a TypeScript change, verify that the proposed change preserves type safety and compilation, or explain any remaining uncertainty.
10. Do not use Playwright MCP when static code analysis is sufficient.
11. Use Playwright MCP only when the review requires validating real browser behavior, such as:
    - current UI behavior;
    - existence or stability of a locator;
    - visible/enabled state of an element;
    - actual navigation behavior;
    - reproduction of a browser failure.
12. When MCP is not needed, state that the review was resolved through static analysis only if that information is useful to the user.

Preferred review structure:

```text
PASS
- Verified compliant rules.

FAIL
- Verified violations with evidence.

N/A
- Project rules that do not apply to this case.

UNKNOWN
- Rules that cannot be verified with the inspected evidence.

RISKS / OPTIONAL IMPROVEMENTS
- Clearly separate risks and suggestions from actual violations.
```

## Output Expectations

When implementing or modifying Playwright automation, provide only the artifacts relevant to the requested task, which may include:

1. Page Object changes.
2. Test files with explicit assertions.
3. Fixture or helper changes when actually needed.
4. Configuration changes when actually needed.
5. Evidence/reporting changes required by the project.
6. A concise execution result and unresolved risks.

Do not generate CI/CD, API mocks, visual-regression setup or new framework layers unless the task requires them.

## Definition of Done

Consider an automated scenario complete only when, as applicable:

- the implementation follows repository instructions;
- existing abstractions were reused where appropriate;
- locators are stable and unambiguous;
- assertions express the intended behavior;
- no arbitrary waits were introduced;
- the relevant test was executed successfully or the blocking issue was clearly documented;
- required evidence was generated;
- dependent data was persisted and recovered through the approved mechanism;
- known discrepancies between expected and observed behavior were reported rather than hidden.

## Knowledge Reference

Playwright, Page Object Model, auto-waiting, locators, fixtures, API mocking, trace viewer, visual comparisons, parallel execution, Playwright MCP, browser exploration, flaky-test diagnosis and CI/CD integration.
