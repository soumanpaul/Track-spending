# Export Implementation Audit

Audit data export behavior in the Expense Desk app, with special attention to CSV correctness, user privacy, and consistency with visible filters.

## Usage

```text
/export-implementation-audit [scope]
```

Examples:

```text
/export-implementation-audit current branch
/export-implementation-audit compare feature-data-export-v2
```

## Instructions

Use `$ARGUMENTS` as the requested scope. If no scope is provided, audit the current branch.

Follow this process:

1. Read `CLAUDE.md`.
2. Inspect export-related code, especially:
   - `components/expense-tracker.tsx`
   - `lib/expense-data.ts`
   - any newly added export helpers, API routes, cloud integrations, or dependencies
3. Determine the exact export behavior:
   - which rows are exported
   - which columns are exported
   - how file names are generated
   - whether the export uses filtered data or all data
   - how empty states are handled
   - what formats are supported
4. Verify CSV/file-generation correctness:
   - quotes are escaped correctly
   - commas, quotes, and newlines in fields remain valid
   - numeric amounts preserve the intended precision
   - dates remain machine-readable
   - object URLs are revoked when used
   - browser-only APIs are not called during server render
5. Review user interaction:
   - button placement and labeling
   - feedback after export
   - disabled/loading/error states where relevant
   - whether the user can understand the export scope
6. Review security and privacy:
   - no unexpected network transfer of financial data
   - no sensitive data in URLs
   - explicit user action before cloud/share behavior
   - safe handling of generated downloadable files
7. Review maintainability:
   - export logic is separated when complexity warrants it
   - types are explicit
   - dependencies are justified
   - behavior is easy to extend to more formats

## Output

Use this structure:

```text
Export Behavior
- Concise technical description of how export works.

Findings
- [severity] File:line - Issue and impact.

Edge Cases Checked
- Empty export
- Quotes/commas/newlines
- Invalid date range
- Filtered vs all rows
- Browser compatibility

Security and Privacy
- Data-flow observations and risks.

Recommendations
- Concrete fixes or improvements, ordered by value.
```

Prefer specific file and line references over general advice.
