# Expense Feature Review

Review an expense-tracker feature implementation for correctness, maintainability, and fit with the current app architecture.

## Usage

```text
/expense-feature-review [feature or branch name]
```

## Instructions

You are reviewing a change in this Expense Desk project. Focus on concrete risks and implementation quality, not broad stylistic preferences.

Use the feature or branch name from `$ARGUMENTS` if provided. If no argument is provided, review the current working tree.

Follow this process:

1. Read `CLAUDE.md`, `package.json`, and the relevant changed files.
2. Identify the changed files with `git status --short` and, when useful, `git diff --stat`.
3. Inspect the implementation against the app's current architecture:
   - App Router structure in `app/`
   - main client behavior in `components/expense-tracker.tsx`
   - domain types and seed data in `lib/expense-data.ts`
   - NextUI and Tailwind conventions
   - localStorage persistence model
4. Check for functional issues:
   - incorrect expense or budget calculations
   - filter, sort, date-range, or display-mode regressions
   - add/edit/delete/reset behavior regressions
   - localStorage load/save problems
   - export behavior mismatches
5. Check for code quality issues:
   - unnecessary dependency additions
   - weak TypeScript typing
   - duplicated calculation logic that can drift
   - client/server boundary mistakes
   - hydration-sensitive browser API use
6. Check UI quality:
   - responsive layout
   - dark and light theme behavior
   - accessible labels for icon-only controls
   - NextUI component consistency
7. Run verification when appropriate:
   - `npm run lint`
   - `npm run build`

## Output

Return findings first, ordered by severity.

Use this structure:

```text
Findings
- [severity] File:line - Issue and impact.

Open Questions
- Any assumptions or unclear product decisions.

Verification
- Commands run and result.

Summary
- Short assessment of whether the change is ready, risky, or needs follow-up.
```

If no issues are found, say that clearly and mention remaining test or manual QA gaps.
