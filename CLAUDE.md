# CLAUDE.md

Project guide for Claude and other coding agents working in this repo.

## Overview

Expense Desk is a small Next.js App Router expense tracker. It is mostly a client-side React app for adding expenses, editing/deleting transactions, tracking category budgets, filtering/searching records, showing dashboard insights, toggling light/dark mode, persisting demo data in `localStorage`, and exporting filtered transactions as CSV.

Stack:

- Next.js 14, React 18, TypeScript strict mode
- NextUI v2 and Tailwind CSS
- Lucide React icons
- Browser `localStorage`; no backend/API/database in the shipped app

## Layout

```text
app/layout.tsx              Root metadata and Providers
app/page.tsx                Renders ExpenseTracker
app/providers.tsx           NextUIProvider and theme context
app/globals.css             Tailwind layers, backgrounds, dark overrides
components/expense-tracker.tsx
                             Main UI, state, filters, calculations, export
lib/expense-data.ts         Domain types, categories, budgets, seed data
public/icon.svg             App icon
```

Important config:

- `package.json`: scripts/dependencies
- `tailwind.config.ts`: Tailwind content and NextUI theme
- `tsconfig.json`: strict TS and `@/*` path alias
- `next.config.mjs`: currently empty

## Commands

Run from repo root:

```bash
npm install
npm run dev
npm run lint
npm run build
```

Use npm only; this repo uses `package-lock.json`. There is no test suite yet, so `npm run lint` and `npm run build` are the main automated checks.

## Architecture

Current architecture is intentionally simple:

- `app/page.tsx` only renders `<ExpenseTracker />`.
- `app/providers.tsx` owns light/dark theme state and wraps `NextUIProvider`.
- `components/expense-tracker.tsx` owns most app behavior: React state, form handling, filtering, sorting, totals, Money Coach insights, localStorage persistence, UI, and CSV export.
- `lib/expense-data.ts` owns reusable domain definitions and seed data.

Prefer matching existing patterns. For narrow changes, local helper functions in `expense-tracker.tsx` are acceptable. Extract to `lib/` or smaller components only when logic becomes shared, independently testable, or meaningfully easier to maintain.

## Data Model

`lib/expense-data.ts` defines:

- `ExpenseCategory`: `Food`, `Transportation`, `Entertainment`, `Shopping`, `Bills`, `Other`
- `Expense`: `id`, `title`, `amount`, `category`, `date`, optional `note`, `recurring`, `paymentMethod`
- `Budget`: category-to-number record

Payment methods are `Card`, `Cash`, `UPI`, and `Bank`.

When adding categories or payment methods, update the type definitions, constants, colors/budgets, filters, rollups, normalization helpers, and UI display paths together.

## State and Persistence

The app uses React `useState`, `useMemo`, and `useEffect`; there is no global state library.

Data persistence:

- Expenses and budgets use `localStorage` key `expense-desk-data-v1`.
- Theme uses `localStorage` key `expense-desk-theme`.
- Saved expenses and budgets are normalized on load.
- Failed load/save paths set visible `storageError` text.

Browser APIs must stay in client components/effects. `ExpenseTracker` is marked `"use client"`; do not move browser-only code into server components.

## UI Conventions

Use the existing NextUI + Tailwind style:

- Prefer NextUI controls already in use: `Button`, `Card`, `Input`, `Select`, `Switch`, `Table`, `Chip`, `Progress`, `Tooltip`.
- Use `lucide-react` icons for actions.
- Keep the app dashboard-like, compact, and workflow-focused.
- Icon-only buttons need `aria-label`; add tooltips where helpful.
- Preserve responsive grids and test narrow/mobile layouts.
- Cards currently use `radius="sm"`.
- Test both light and dark modes; dark styling is split between NextUI theme config and manual `.dark` selectors in `app/globals.css`.

## Calculations and Filters

Important derived state in `ExpenseTracker`:

- `filteredExpenses`
- totals, recurring spend, budget remaining, daily average
- category totals and budget percentages
- Money Coach actions and watch list
- top categories
- category and payment rollups

Date filtering relies on ISO `YYYY-MM-DD` string comparison. If changing date handling, update all filter, sort, export filename, and range helper paths together.

Watch edge cases:

- empty filtered results
- invalid date range (`dateStart > dateEnd`)
- zero budgets or totals
- amount min/max input values
- budget-risk sort using repeated category scans

For larger datasets, consider precomputed maps for category spend instead of repeated `expenses.filter(...).reduce(...)` calls.

## CSV Export

CSV export is implemented by `exportCsv()` in `components/expense-tracker.tsx`.

Current behavior:

- Exports currently filtered transactions, not all transactions.
- Writes a header row plus one row per filtered expense.
- Wraps every cell in quotes.
- Escapes quotes by doubling them.
- Creates a `Blob` with `text/csv;charset=utf-8`.
- Uses `URL.createObjectURL`, triggers an anchor click, then revokes the URL.
- Filename includes selected date range.
- Empty exports produce a header-only CSV.

When changing export behavior, be explicit about filtered vs all rows, preserve CSV escaping for commas/quotes/newlines, avoid server-render browser API calls, and do not send financial data to external services without explicit user approval.

## Validation and Errors

Current form validation requires:

- non-empty description
- numeric amount greater than zero
- date value

Storage errors are user-visible. Keep new failures visible through the existing feedback/error style. Avoid uncaught errors in event handlers. Normalize persisted data before using it in calculations.

## Security and Privacy

Treat expense data as sensitive.

- Do not add analytics, remote logging, cloud sync, sharing, or third-party export destinations without explicit approval.
- Do not place expense data in URLs.
- Avoid persisting sensitive data outside the current localStorage model unless requested.
- CSV export creates a portable financial-data copy; label and scope export behavior clearly.

## Accessibility

Maintain the current baseline:

- Icon-only buttons need `aria-label`.
- Tables need meaningful `aria-label` values.
- Inputs should keep labels and validation messages.
- Do not rely on color alone for important state.
- Preserve keyboard-friendly NextUI controls.

## Verification Checklist

For meaningful changes, run:

```bash
npm run lint
npm run build
```

Manual checks to consider:

- add valid expense
- invalid form submissions
- edit/delete expense
- reset demo data
- update budgets
- filters: search, date range, category, payment, recurring, budget state, smart view, amount range
- display modes: table, cards, category rollup, payment rollup
- CSV export uses the expected filtered rows
- refresh persistence for expenses, budgets, and theme
- light/dark mode
- desktop and mobile layout

## Common Pitfalls

- `currentMonth`, default dates, and seed data are hardcoded around May 2026.
- Currency formatting is `en-US`/`USD` with no fractional display.
- Theme defaults to dark until saved theme loads.
- Dark mode depends partly on manual CSS overrides.
- Avoid broad rewrites of `expense-tracker.tsx` for small feature changes.
- Do not add heavy state, form, date, chart, or export libraries unless the feature clearly justifies them.

## Agent Workflow

- Read relevant files before editing.
- Keep changes scoped to the request.
- Use existing TypeScript types and UI patterns.
- Prefer `rg` for search.
- Do not delete files without confirmation.
- Do not discard user changes.
- For database work, follow project instructions: use sqlite MCP for `~/codex/test.db` and prefer structured MCP tools over raw SQL where possible.
- For browser automation, use available Playwright/browser MCP tooling.

## Natural Refactor Boundaries

If the main component becomes hard to maintain, extract incrementally:

- `components/expense-form.tsx`
- `components/expense-table.tsx`
- `components/filter-panel.tsx`
- `components/budget-panel.tsx`
- `components/money-coach.tsx`
- `lib/expense-calculations.ts`
- `lib/export-csv.ts`
- `lib/storage.ts`

Verify persistence, filtering, totals, display modes, and export after any extraction.
