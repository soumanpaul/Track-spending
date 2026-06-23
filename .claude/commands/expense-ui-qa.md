# Expense UI QA

Run a focused UI and behavior QA pass for the Expense Desk application.

## Usage

```text
/expense-ui-qa [area to test]
```

Examples:

```text
/expense-ui-qa filters and export
/expense-ui-qa mobile layout
```

## Instructions

Use `$ARGUMENTS` as the requested QA focus. If no area is provided, test the core app workflow.

Follow this process:

1. Read `CLAUDE.md` and `README.md`.
2. Start the app if it is not already running:
   - install dependencies only if needed with `npm install`
   - run `npm run dev`
3. Use browser automation when available to inspect the running UI.
4. Test the relevant workflow. For a full pass, cover:
   - initial render
   - light/dark theme toggle
   - add expense
   - invalid form submissions
   - edit expense
   - delete expense
   - reset demo data
   - budget edits
   - text search
   - date range filters
   - category filter
   - payment method filter
   - recurring filter
   - budget state filter
   - smart views
   - amount min/max filters
   - table, card, category rollup, and payment rollup display modes
   - CSV export
   - refresh persistence
5. Check layout at minimum:
   - desktop viewport
   - narrow/mobile viewport
6. Check quality details:
   - no overlapping text
   - no broken dark-mode contrast
   - controls are reachable by keyboard where practical
   - icon-only buttons have accessible labels
   - empty states appear when filters remove all rows
7. Run project verification:
   - `npm run lint`
   - `npm run build`

## Output

Use this structure:

```text
QA Scope
- What was tested.

Results
- Pass/fail notes by workflow.

Bugs
- [severity] File/area - Reproduction steps, expected result, actual result.

Verification
- Commands run and result.

Follow-up
- Targeted fixes or additional tests worth adding.
```

Be explicit about anything not tested.
