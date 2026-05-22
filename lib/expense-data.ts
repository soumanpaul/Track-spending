export type ExpenseCategory =
  | "Food"
  | "Transportation"
  | "Entertainment"
  | "Shopping"
  | "Bills"
  | "Other";

export type Expense = {
  id: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
  note?: string;
  recurring: boolean;
  paymentMethod: "Card" | "Cash" | "UPI" | "Bank";
};

export type Budget = Record<ExpenseCategory, number>;

export const categories: ExpenseCategory[] = [
  "Food",
  "Transportation",
  "Entertainment",
  "Shopping",
  "Bills",
  "Other",
];

export const categoryColors: Record<ExpenseCategory, string> = {
  Food: "#1aa878",
  Transportation: "#3457d5",
  Entertainment: "#ec4899",
  Shopping: "#a855f7",
  Bills: "#f5a524",
  Other: "#71717a",
};

export const defaultBudgets: Budget = {
  Food: 650,
  Transportation: 320,
  Entertainment: 260,
  Shopping: 420,
  Bills: 1800,
  Other: 250,
};

export const seedExpenses: Expense[] = [
  {
    id: "seed-1",
    title: "Apartment rent",
    amount: 1450,
    category: "Bills",
    date: "2026-05-01",
    note: "Monthly lease payment",
    recurring: true,
    paymentMethod: "Bank",
  },
  {
    id: "seed-2",
    title: "Grocery run",
    amount: 126.45,
    category: "Food",
    date: "2026-05-04",
    note: "Fresh produce and pantry restock",
    recurring: false,
    paymentMethod: "Card",
  },
  {
    id: "seed-3",
    title: "Metro card top-up",
    amount: 55,
    category: "Transportation",
    date: "2026-05-06",
    recurring: false,
    paymentMethod: "Card",
  },
  {
    id: "seed-4",
    title: "Electricity bill",
    amount: 89.2,
    category: "Bills",
    date: "2026-05-09",
    recurring: true,
    paymentMethod: "Bank",
  },
  {
    id: "seed-5",
    title: "Dinner with friends",
    amount: 74.8,
    category: "Entertainment",
    date: "2026-05-11",
    recurring: false,
    paymentMethod: "UPI",
  },
  {
    id: "seed-6",
    title: "Pharmacy",
    amount: 38.9,
    category: "Other",
    date: "2026-05-13",
    recurring: false,
    paymentMethod: "Card",
  },
  {
    id: "seed-7",
    title: "Weekend getaway booking",
    amount: 312,
    category: "Entertainment",
    date: "2026-05-15",
    recurring: false,
    paymentMethod: "Card",
  },
  {
    id: "seed-8",
    title: "Index fund contribution",
    amount: 500,
    category: "Other",
    date: "2026-05-18",
    recurring: true,
    paymentMethod: "Bank",
  }
];

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function monthKey(date: string) {
  return date.slice(0, 7);
}
