# Expense Desk

Modern Next.js expense tracker for managing personal spending behind a Next.js authentication backend.

## Run locally

```bash
npm install
npx prisma generate
npm run dev
```

Open `http://localhost:3000`.

The local auth database is configured in `.env.local` and `.env.example` as:

```bash
DATABASE_URL="file:/Users/soumanpaul/codex/test.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="replace-with-a-32-byte-random-secret"
```

The SQLite `User` table stores registered users with bcrypt-hashed passwords. Dashboard access is protected by middleware and unauthenticated users are redirected to `/login`.

## Verify features

- Add an expense with description, amount, category, date, payment method, note, and recurring status.
- Create an account from `/login`, sign in, and confirm the dashboard loads.
- Sign out from the dashboard and confirm `/` redirects back to `/login`.
- Try submitting an empty or zero-amount expense to confirm validation feedback.
- Edit an existing expense with the edit icon, save it, and confirm it updates in the list.
- Delete an expense with the trash icon.
- Filter transactions by search text, start/end date range, category, payment method, recurring status, budget state, and amount range.
- Switch between table, card, category rollup, and payment rollup views.
- Adjust category budgets and check the dashboard cards, budget bars, and top-category summaries.
- Click `Export CSV` and confirm the downloaded file contains the currently filtered transactions.
- Refresh the page to confirm expenses and budgets persist through `localStorage`.

## Checks

```bash
npm run lint
npm run build
```
