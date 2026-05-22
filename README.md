# Expense Desk

Modern Next.js expense tracker for managing personal spending with local demo persistence.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Verify features

- Add an expense with description, amount, category, date, payment method, note, and recurring status.
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
