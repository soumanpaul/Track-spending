"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Divider,
  Input,
  Progress,
  Select,
  SelectItem,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Textarea,
  Tooltip,
} from "@nextui-org/react";
import {
  Banknote,
  CalendarDays,
  CreditCard,
  Download,
  Edit3,
  Filter,
  LayoutGrid,
  Layers3,
  ListFilter,
  Plus,
  ReceiptText,
  RefreshCcw,
  Search,
  SlidersHorizontal,
  Trash2,
  TrendingDown,
  X,
  WalletCards,
} from "lucide-react";
import {
  Budget,
  Expense,
  ExpenseCategory,
  categories,
  categoryColors,
  defaultBudgets,
  formatCurrency,
  seedExpenses,
} from "@/lib/expense-data";

const storageKey = "expense-desk-data-v1";
const currentMonth = "2026-05";
const currentMonthStart = `${currentMonth}-01`;
const currentMonthEnd = "2026-05-31";
const categoryFilterOptions = ["All", ...categories] as const;
const paymentMethods = ["Card", "Cash", "UPI", "Bank"] as const;

type SortKey = "date-desc" | "date-asc" | "amount-desc" | "amount-asc" | "category" | "merchant" | "budget-risk";
type DisplayMode = "table" | "cards" | "category" | "payment";
type PaymentFilter = "All" | Expense["paymentMethod"];
type RecurringFilter = "All" | "Recurring" | "One-time";
type BudgetFilter = "All" | "Over budget" | "Near limit" | "Within budget";
type SmartView = "All" | "Needs review" | "Recurring bills" | "Large purchases" | "Discretionary";
type FormErrors = Partial<Record<"title" | "amount" | "date" | "range", string>>;

const sortOptions: { key: SortKey; label: string }[] = [
  { key: "date-desc", label: "Newest first" },
  { key: "date-asc", label: "Oldest first" },
  { key: "amount-desc", label: "Highest amount" },
  { key: "amount-asc", label: "Lowest amount" },
  { key: "budget-risk", label: "Budget risk" },
  { key: "category", label: "Category" },
  { key: "merchant", label: "Name A-Z" },
];

const smartViews: { key: SmartView; label: string }[] = [
  { key: "All", label: "All" },
  { key: "Needs review", label: "Needs review" },
  { key: "Recurring bills", label: "Recurring bills" },
  { key: "Large purchases", label: "Large purchases" },
  { key: "Discretionary", label: "Discretionary" },
];

type StoredData = {
  expenses: Expense[];
  budgets: Budget;
};

const emptyForm = {
  title: "",
  amount: "",
  category: "Food" as ExpenseCategory,
  date: "2026-05-21",
  paymentMethod: "Card" as Expense["paymentMethod"],
  note: "",
  recurring: false,
};

export function ExpenseTracker() {
  const [expenses, setExpenses] = useState<Expense[]>(seedExpenses);
  const [budgets, setBudgets] = useState<Budget>(defaultBudgets);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [feedback, setFeedback] = useState("");
  const [storageError, setStorageError] = useState("");
  const [isReady, setIsReady] = useState(false);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"All" | ExpenseCategory>("All");
  const [dateStart, setDateStart] = useState(currentMonthStart);
  const [dateEnd, setDateEnd] = useState(currentMonthEnd);
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("All");
  const [recurringFilter, setRecurringFilter] = useState<RecurringFilter>("All");
  const [budgetFilter, setBudgetFilter] = useState<BudgetFilter>("All");
  const [smartView, setSmartView] = useState<SmartView>("All");
  const [sortKey, setSortKey] = useState<SortKey>("date-desc");
  const [displayMode, setDisplayMode] = useState<DisplayMode>("table");
  const [amountMin, setAmountMin] = useState("");
  const [amountMax, setAmountMax] = useState("");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (!saved) return;

      const parsed = JSON.parse(saved) as StoredData;
      setExpenses((parsed.expenses ?? seedExpenses).map(normalizeExpense));
      setBudgets(normalizeBudgets(parsed.budgets));
    } catch {
      setStorageError("Saved data could not be loaded, so the demo data is being shown.");
      try {
        window.localStorage.removeItem(storageKey);
      } catch {
        setStorageError("Saved data could not be loaded or reset in this browser.");
      }
    } finally {
      setIsReady(true);
    }
  }, []);

  useEffect(() => {
    if (!isReady) return;

    try {
      window.localStorage.setItem(storageKey, JSON.stringify({ expenses, budgets }));
      setStorageError("");
    } catch {
      setStorageError("Changes are visible now but could not be saved to localStorage.");
    }
  }, [budgets, expenses, isReady]);

  const filteredExpenses = useMemo(() => {
    const min = amountMin ? Number(amountMin) : null;
    const max = amountMax ? Number(amountMax) : null;

    return expenses
      .filter((expense) => !dateStart || expense.date >= dateStart)
      .filter((expense) => !dateEnd || expense.date <= dateEnd)
      .filter((expense) => categoryFilter === "All" || expense.category === categoryFilter)
      .filter((expense) => paymentFilter === "All" || expense.paymentMethod === paymentFilter)
      .filter((expense) => recurringFilter === "All" || (recurringFilter === "Recurring" ? expense.recurring : !expense.recurring))
      .filter((expense) => min === null || expense.amount >= min)
      .filter((expense) => max === null || expense.amount <= max)
      .filter((expense) => {
        const categorySpend = expenses
          .filter((candidate) => candidate.category === expense.category && isInDateRange(candidate.date, dateStart, dateEnd))
          .reduce((sum, candidate) => sum + candidate.amount, 0);
        const budget = budgets[expense.category];
        const ratio = budget > 0 ? categorySpend / budget : 0;

        if (budgetFilter === "Over budget") return ratio >= 1;
        if (budgetFilter === "Near limit") return ratio >= 0.75 && ratio < 1;
        if (budgetFilter === "Within budget") return ratio < 0.75;
        return true;
      })
      .filter((expense) => {
        if (smartView === "Recurring bills") return expense.recurring;
        if (smartView === "Large purchases") return expense.amount >= 100;
        if (smartView === "Discretionary") return ["Entertainment", "Shopping"].includes(expense.category);
        if (smartView === "Needs review") return expense.amount >= 100 || !expense.note || expense.recurring;
        return true;
      })
      .filter((expense) => {
        const text = `${expense.title} ${expense.category} ${expense.note ?? ""}`.toLowerCase();
        return text.includes(query.toLowerCase());
      })
      .sort((a, b) => sortExpenses(a, b, sortKey, expenses, budgets, dateStart, dateEnd));
  }, [amountMax, amountMin, budgetFilter, budgets, categoryFilter, dateEnd, dateStart, expenses, paymentFilter, query, recurringFilter, smartView, sortKey]);

  const totals = useMemo(() => {
    const rangeExpenses = expenses.filter((expense) => isInDateRange(expense.date, dateStart, dateEnd));
    const total = rangeExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const recurring = rangeExpenses
      .filter((expense) => expense.recurring)
      .reduce((sum, expense) => sum + expense.amount, 0);
    const budgetTotal = Object.values(budgets).reduce((sum, budget) => sum + budget, 0);
    const dailyAverage = total / getRangeDays(dateStart, dateEnd);

    return {
      total,
      recurring,
      budgetTotal,
      remaining: budgetTotal - total,
      dailyAverage,
      transactionCount: rangeExpenses.length,
    };
  }, [budgets, dateEnd, dateStart, expenses]);

  const categoryTotals = useMemo(() => {
    return categories.map((category) => {
      const spent = expenses
        .filter((expense) => expense.category === category && isInDateRange(expense.date, dateStart, dateEnd))
        .reduce((sum, expense) => sum + expense.amount, 0);
      const budget = budgets[category];
      return {
        category,
        spent,
        budget,
        percent: budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0,
      };
    });
  }, [budgets, dateEnd, dateStart, expenses]);

  const topCategories = [...categoryTotals]
    .filter((item) => item.spent > 0)
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 5);

  const filteredTotal = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const filteredAverage = filteredExpenses.length > 0 ? filteredTotal / filteredExpenses.length : 0;

  const groupedByCategory = useMemo(() => {
    return categories
      .map((category) => {
        const items = filteredExpenses.filter((expense) => expense.category === category);
        const spent = items.reduce((sum, expense) => sum + expense.amount, 0);
        const budget = budgets[category];
        return {
          category,
          budget,
          count: items.length,
          items,
          percent: budget > 0 ? Math.round((spent / budget) * 100) : 0,
          spent,
        };
      })
      .filter((item) => item.count > 0)
      .sort((a, b) => b.spent - a.spent);
  }, [budgets, filteredExpenses]);

  const groupedByPayment = useMemo(() => {
    return paymentMethods
      .map((method) => {
        const items = filteredExpenses.filter((expense) => expense.paymentMethod === method);
        const spent = items.reduce((sum, expense) => sum + expense.amount, 0);
        return { method, count: items.length, items, spent };
      })
      .filter((item) => item.count > 0)
      .sort((a, b) => b.spent - a.spent);
  }, [filteredExpenses]);

  const rangeLabel = dateStart && dateEnd ? `${dateStart} to ${dateEnd}` : "selected range";
  const dateRangeError = dateStart && dateEnd && dateStart > dateEnd ? "Start date must be before end date." : "";

  function submitExpense() {
    const amount = Number(form.amount);
    const errors = validateExpenseForm(form);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const expense: Expense = {
      id: editingId ?? crypto.randomUUID(),
      title: form.title.trim(),
      amount,
      category: form.category,
      date: form.date,
      paymentMethod: form.paymentMethod,
      note: form.note.trim(),
      recurring: form.recurring,
    };

    if (editingId) {
      setExpenses((current) => current.map((item) => (item.id === editingId ? expense : item)));
      setFeedback("Expense updated.");
    } else {
      setExpenses((current) => [expense, ...current]);
      setFeedback("Expense added.");
    }

    cancelEdit({ keepContext: true });
  }

  function removeExpense(id: string) {
    setExpenses((current) => current.filter((expense) => expense.id !== id));
    if (editingId === id) cancelEdit();
    setFeedback("Expense deleted.");
  }

  function startEdit(expense: Expense) {
    setEditingId(expense.id);
    setForm({
      title: expense.title,
      amount: String(expense.amount),
      category: expense.category,
      date: expense.date,
      paymentMethod: expense.paymentMethod,
      note: expense.note ?? "",
      recurring: expense.recurring,
    });
    setFormErrors({});
    setFeedback("Editing selected expense.");
  }

  function cancelEdit(options?: { keepContext?: boolean }) {
    setEditingId(null);
    setForm({ ...emptyForm, category: options?.keepContext ? form.category : "Food", date: options?.keepContext ? form.date : emptyForm.date });
    setFormErrors({});
  }

  function resetDemoData() {
    setExpenses(seedExpenses);
    setBudgets(defaultBudgets);
    setQuery("");
    setCategoryFilter("All");
    setDateStart(currentMonthStart);
    setDateEnd(currentMonthEnd);
    setPaymentFilter("All");
    setRecurringFilter("All");
    setBudgetFilter("All");
    setSmartView("All");
    setSortKey("date-desc");
    setDisplayMode("table");
    setAmountMin("");
    setAmountMax("");
    cancelEdit();
    setFeedback("Demo data restored.");
  }

  function exportCsv() {
    const rows = [
      ["Date", "Title", "Category", "Amount", "Payment method", "Recurring", "Note"],
      ...filteredExpenses.map((expense) => [
        expense.date,
        expense.title,
        expense.category,
        expense.amount.toFixed(2),
        expense.paymentMethod,
        expense.recurring ? "Yes" : "No",
        expense.note ?? "",
      ]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `expenses-${dateStart || "start"}-to-${dateEnd || "end"}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setFeedback("CSV export created.");
  }

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <WalletCards size={18} />
              Expense Desk
            </div>
            <h1 className="text-3xl font-semibold tracking-normal text-slate-950 sm:text-4xl">
              Track spending with budgets that stay visible.
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              Add purchases, monitor category limits, search transactions, and export a clean CSV from one focused dashboard.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button color="primary" startContent={<Download size={18} />} variant="flat" onPress={exportCsv}>
              Export CSV
            </Button>
            <Button startContent={<RefreshCcw size={18} />} variant="bordered" onPress={resetDemoData}>
              Reset
            </Button>
          </div>
        </header>

        {!isReady ? (
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
            Loading saved expenses...
          </div>
        ) : null}

        {storageError ? (
          <div className="rounded-lg border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700">
            {storageError}
          </div>
        ) : null}

        {feedback ? (
          <div className="rounded-lg border border-primary-200 bg-primary-50 px-4 py-3 text-sm text-primary-700">
            {feedback}
          </div>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard icon={<TrendingDown size={20} />} label="Spent in range" value={formatCurrency(totals.total)} detail={`${totals.transactionCount} transactions`} />
          <MetricCard icon={<Banknote size={20} />} label="Budget left" value={formatCurrency(totals.remaining)} detail={`${Math.round((totals.total / totals.budgetTotal) * 100)}% of total budget used`} tone={totals.remaining < 0 ? "danger" : "success"} />
          <MetricCard icon={<CalendarDays size={20} />} label="Daily average" value={formatCurrency(totals.dailyAverage)} detail={rangeLabel} />
          <MetricCard icon={<CreditCard size={20} />} label="Recurring" value={formatCurrency(totals.recurring)} detail="Scheduled monthly expenses" />
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(340px,420px)_1fr]">
          <Card radius="sm" shadow="sm" className="border border-slate-200/70">
            <CardHeader className="flex gap-3 px-5 pt-5">
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <Plus size={20} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-950">{editingId ? "Edit expense" : "New expense"}</h2>
                <p className="text-sm text-slate-500">Capture the amount, category, and payment context.</p>
              </div>
            </CardHeader>
            <CardBody className="gap-4 px-5 pb-5">
              <Input
                isInvalid={Boolean(formErrors.title)}
                errorMessage={formErrors.title}
                label="Description"
                placeholder="Coffee, rent, train ticket"
                value={form.title}
                onValueChange={(title) => setForm((current) => ({ ...current, title }))}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  isInvalid={Boolean(formErrors.amount)}
                  errorMessage={formErrors.amount}
                  label="Amount"
                  min="0"
                  placeholder="0.00"
                  startContent="$"
                  type="number"
                  value={form.amount}
                  onValueChange={(amount) => setForm((current) => ({ ...current, amount }))}
                />
                <Input
                  isInvalid={Boolean(formErrors.date)}
                  errorMessage={formErrors.date}
                  label="Date"
                  type="date"
                  value={form.date}
                  onValueChange={(date) => setForm((current) => ({ ...current, date }))}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Select label="Category" selectedKeys={[form.category]} onSelectionChange={(keys) => setForm((current) => ({ ...current, category: Array.from(keys)[0] as ExpenseCategory }))}>
                  {categories.map((category) => <SelectItem key={category}>{category}</SelectItem>)}
                </Select>
                <Select label="Payment" selectedKeys={[form.paymentMethod]} onSelectionChange={(keys) => setForm((current) => ({ ...current, paymentMethod: Array.from(keys)[0] as Expense["paymentMethod"] }))}>
                  {paymentMethods.map((method) => <SelectItem key={method}>{method}</SelectItem>)}
                </Select>
              </div>
              <Textarea label="Note" minRows={2} placeholder="Optional details" value={form.note} onValueChange={(note) => setForm((current) => ({ ...current, note }))} />
              <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-slate-900">Recurring</p>
                  <p className="text-xs text-slate-500">Mark repeating monthly payments.</p>
                </div>
                <Switch isSelected={form.recurring} onValueChange={(recurring) => setForm((current) => ({ ...current, recurring }))} />
              </div>
              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <Button color="primary" size="lg" startContent={editingId ? <Edit3 size={18} /> : <Plus size={18} />} onPress={submitExpense}>
                  {editingId ? "Save changes" : "Add expense"}
                </Button>
                {editingId ? (
                  <Button size="lg" startContent={<X size={18} />} variant="flat" onPress={() => cancelEdit()}>
                    Cancel
                  </Button>
                ) : null}
              </div>
            </CardBody>
          </Card>

          <div className="grid gap-6">
            <Card radius="sm" shadow="sm" className="border border-slate-200/70">
              <CardHeader className="flex-col items-start gap-1 px-5 pt-5">
                <h2 className="text-lg font-semibold text-slate-950">Budget health</h2>
                <p className="text-sm text-slate-500">Adjust category budgets and watch usage across the selected date range.</p>
              </CardHeader>
              <CardBody className="grid gap-4 px-5 pb-5 lg:grid-cols-2">
                {categoryTotals.map(({ category, spent, budget, percent }) => (
                  <div key={category} className="space-y-2 rounded-lg border border-slate-200 bg-white p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: categoryColors[category] }} />
                        <span className="text-sm font-medium text-slate-900">{category}</span>
                      </div>
                      <span className="text-xs text-slate-500">{formatCurrency(spent)} / {formatCurrency(budget)}</span>
                    </div>
                    <Progress aria-label={`${category} budget usage`} color={percent > 90 ? "danger" : percent > 70 ? "warning" : "primary"} size="sm" value={percent} />
                    <Input
                      aria-label={`${category} budget`}
                      classNames={{ inputWrapper: "h-9 min-h-9" }}
                      min="0"
                      size="sm"
                      startContent="$"
                      type="number"
                      value={String(budget)}
                      onValueChange={(value) => setBudgets((current) => ({ ...current, [category]: Number(value) || 0 }))}
                    />
                  </div>
                ))}
              </CardBody>
            </Card>

            <Card radius="sm" shadow="sm" className="border border-slate-200/70">
              <CardHeader className="flex flex-col gap-4 px-5 pt-5">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">Transactions</h2>
                  <p className="text-sm text-slate-500">
                    Showing {filteredExpenses.length} expense{filteredExpenses.length === 1 ? "" : "s"} worth {formatCurrency(filteredTotal)}.
                    Average item: {formatCurrency(filteredAverage)}.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {smartViews.map((view) => (
                    <Button
                      key={view.key}
                      color={smartView === view.key ? "primary" : "default"}
                      size="sm"
                      startContent={view.key === "All" ? undefined : <ListFilter size={15} />}
                      variant={smartView === view.key ? "solid" : "flat"}
                      onPress={() => setSmartView(view.key)}
                    >
                      {view.label}
                    </Button>
                  ))}
                </div>
                <div className="grid w-full gap-2 md:grid-cols-2 xl:grid-cols-4">
                  <Input aria-label="Search expenses" startContent={<Search size={16} />} placeholder="Search" value={query} onValueChange={setQuery} />
                  <Input aria-label="Filter start date" label="Start date" startContent={<Filter size={16} />} type="date" value={dateStart} onValueChange={setDateStart} />
                  <Input isInvalid={Boolean(dateRangeError)} errorMessage={dateRangeError} aria-label="Filter end date" label="End date" type="date" value={dateEnd} onValueChange={setDateEnd} />
                  <Select aria-label="Filter by category" selectedKeys={[categoryFilter]} onSelectionChange={(keys) => setCategoryFilter(Array.from(keys)[0] as "All" | ExpenseCategory)}>
                    {categoryFilterOptions.map((category) => (
                      <SelectItem key={category}>{category === "All" ? "All categories" : category}</SelectItem>
                    ))}
                  </Select>
                  <Select aria-label="Filter by payment method" selectedKeys={[paymentFilter]} onSelectionChange={(keys) => setPaymentFilter(Array.from(keys)[0] as PaymentFilter)}>
                    {(["All", ...paymentMethods] as const).map((method) => (
                      <SelectItem key={method}>{method === "All" ? "All payments" : method}</SelectItem>
                    ))}
                  </Select>
                  <Select aria-label="Filter by recurring status" selectedKeys={[recurringFilter]} onSelectionChange={(keys) => setRecurringFilter(Array.from(keys)[0] as RecurringFilter)}>
                    {(["All", "Recurring", "One-time"] as const).map((mode) => (
                      <SelectItem key={mode}>{mode}</SelectItem>
                    ))}
                  </Select>
                  <Select aria-label="Filter by budget status" selectedKeys={[budgetFilter]} onSelectionChange={(keys) => setBudgetFilter(Array.from(keys)[0] as BudgetFilter)}>
                    {(["All", "Over budget", "Near limit", "Within budget"] as const).map((mode) => (
                      <SelectItem key={mode}>{mode === "All" ? "All budget states" : mode}</SelectItem>
                    ))}
                  </Select>
                  <Select aria-label="Sort expenses" startContent={<SlidersHorizontal size={16} />} selectedKeys={[sortKey]} onSelectionChange={(keys) => setSortKey(Array.from(keys)[0] as SortKey)}>
                    {sortOptions.map((option) => (
                      <SelectItem key={option.key}>{option.label}</SelectItem>
                    ))}
                  </Select>
                  <Select aria-label="Choose display mode" selectedKeys={[displayMode]} onSelectionChange={(keys) => setDisplayMode(Array.from(keys)[0] as DisplayMode)}>
                    <SelectItem key="table">Table view</SelectItem>
                    <SelectItem key="cards">Card view</SelectItem>
                    <SelectItem key="category">Category rollup</SelectItem>
                    <SelectItem key="payment">Payment rollup</SelectItem>
                  </Select>
                </div>
                <div className="grid w-full gap-2 sm:grid-cols-2">
                  <Input label="Minimum amount" min="0" size="sm" startContent="$" type="number" value={amountMin} onValueChange={setAmountMin} />
                  <Input label="Maximum amount" min="0" size="sm" startContent="$" type="number" value={amountMax} onValueChange={setAmountMax} />
                </div>
              </CardHeader>
              <Divider />
              <CardBody className={displayMode === "table" ? "px-0 py-0" : "p-5"}>
                {displayMode === "table" ? (
                  <ExpenseTable expenses={filteredExpenses} onEdit={startEdit} onRemove={removeExpense} />
                ) : null}

                {displayMode === "cards" ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    {filteredExpenses.length === 0 ? <EmptyState /> : null}
                    {filteredExpenses.map((expense) => (
                      <ExpenseCard key={expense.id} expense={expense} onEdit={startEdit} onRemove={removeExpense} />
                    ))}
                  </div>
                ) : null}

                {displayMode === "category" ? (
                  <div className="grid gap-3">
                    {groupedByCategory.length === 0 ? <EmptyState /> : null}
                    {groupedByCategory.map((group) => (
                      <RollupCard
                        key={group.category}
                        color={categoryColors[group.category]}
                        label={group.category}
                        meta={`${group.count} transaction${group.count === 1 ? "" : "s"} · ${group.percent}% of budget`}
                        total={group.spent}
                      />
                    ))}
                  </div>
                ) : null}

                {displayMode === "payment" ? (
                  <div className="grid gap-3">
                    {groupedByPayment.length === 0 ? <EmptyState /> : null}
                    {groupedByPayment.map((group) => (
                      <RollupCard
                        key={group.method}
                        color="#3457d5"
                        label={group.method}
                        meta={`${group.count} transaction${group.count === 1 ? "" : "s"} · ${Math.round((group.spent / Math.max(filteredTotal, 1)) * 100)}% of filtered spend`}
                        total={group.spent}
                      />
                    ))}
                  </div>
                ) : null}
              </CardBody>
            </Card>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-5">
          {topCategories.map((item) => (
            <Card key={item.category} radius="sm" shadow="sm" className="border border-slate-200/70">
              <CardBody className="gap-3">
                <span className="h-2 w-full rounded-full" style={{ backgroundColor: categoryColors[item.category] }} />
                <div>
                  <p className="text-sm text-slate-500">Top category</p>
                  <h3 className="text-lg font-semibold text-slate-950">{item.category}</h3>
                </div>
                <p className="text-2xl font-semibold text-slate-950">{formatCurrency(item.spent)}</p>
              </CardBody>
            </Card>
          ))}
        </section>
      </div>
    </main>
  );
}

function MetricCard({ icon, label, value, detail, tone = "default" }: { icon: React.ReactNode; label: string; value: string; detail: string; tone?: "default" | "success" | "danger" }) {
  const toneClass = tone === "danger" ? "text-danger" : tone === "success" ? "text-primary" : "text-slate-950";

  return (
    <Card radius="sm" shadow="sm" className="border border-slate-200/70">
      <CardBody className="gap-3 p-5">
        <div className="flex items-center justify-between">
          <span className="rounded-lg bg-slate-100 p-2 text-slate-600">{icon}</span>
          <span className="text-xs font-medium uppercase tracking-normal text-slate-400">{label}</span>
        </div>
        <div>
          <p className={`text-2xl font-semibold ${toneClass}`}>{value}</p>
          <p className="text-sm text-slate-500">{detail}</p>
        </div>
      </CardBody>
    </Card>
  );
}

function ExpenseTable({ expenses, onEdit, onRemove }: { expenses: Expense[]; onEdit: (expense: Expense) => void; onRemove: (id: string) => void }) {
  return (
    <Table removeWrapper aria-label="Expense transactions" classNames={{ th: "bg-slate-50 text-slate-600", td: "py-4" }}>
      <TableHeader>
        <TableColumn>EXPENSE</TableColumn>
        <TableColumn>CATEGORY</TableColumn>
        <TableColumn>DATE</TableColumn>
        <TableColumn>PAYMENT</TableColumn>
        <TableColumn align="end">AMOUNT</TableColumn>
        <TableColumn align="center">ACTIONS</TableColumn>
      </TableHeader>
      <TableBody emptyContent="No expenses match these filters." items={expenses}>
        {(expense) => (
          <TableRow key={expense.id}>
            <TableCell>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-slate-100 p-2 text-slate-600"><ReceiptText size={18} /></div>
                <div>
                  <p className="font-medium text-slate-950">{expense.title}</p>
                  <p className="max-w-[260px] truncate text-xs text-slate-500">{expense.note || "No note"}</p>
                </div>
              </div>
            </TableCell>
            <TableCell>
              <Chip size="sm" variant="flat" style={{ color: categoryColors[expense.category] }}>{expense.category}</Chip>
            </TableCell>
            <TableCell>{expense.date}</TableCell>
            <TableCell>{expense.paymentMethod}{expense.recurring ? " · recurring" : ""}</TableCell>
            <TableCell className="text-right font-semibold text-slate-950">{formatCurrency(expense.amount)}</TableCell>
            <TableCell>
              <div className="flex justify-center gap-1">
                <Tooltip content="Edit expense">
                  <Button isIconOnly aria-label="Edit expense" color="primary" size="sm" variant="light" onPress={() => onEdit(expense)}>
                    <Edit3 size={17} />
                  </Button>
                </Tooltip>
                <Tooltip content="Delete expense">
                  <Button isIconOnly aria-label="Delete expense" color="danger" size="sm" variant="light" onPress={() => onRemove(expense.id)}>
                    <Trash2 size={17} />
                  </Button>
                </Tooltip>
              </div>
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

function ExpenseCard({ expense, onEdit, onRemove }: { expense: Expense; onEdit: (expense: Expense) => void; onRemove: (id: string) => void }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="rounded-lg bg-slate-100 p-2 text-slate-600"><LayoutGrid size={18} /></div>
          <div className="min-w-0">
            <p className="truncate font-medium text-slate-950">{expense.title}</p>
            <p className="text-xs text-slate-500">{expense.date} · {expense.paymentMethod}{expense.recurring ? " · recurring" : ""}</p>
          </div>
        </div>
        <div className="flex gap-1">
          <Button isIconOnly aria-label="Edit expense" color="primary" size="sm" variant="light" onPress={() => onEdit(expense)}>
            <Edit3 size={17} />
          </Button>
          <Button isIconOnly aria-label="Delete expense" color="danger" size="sm" variant="light" onPress={() => onRemove(expense.id)}>
            <Trash2 size={17} />
          </Button>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <Chip size="sm" variant="flat" style={{ color: categoryColors[expense.category] }}>{expense.category}</Chip>
        <p className="text-xl font-semibold text-slate-950">{formatCurrency(expense.amount)}</p>
      </div>
      <p className="mt-3 line-clamp-2 text-sm text-slate-500">{expense.note || "No note added."}</p>
    </div>
  );
}

function RollupCard({ color, label, meta, total }: { color: string; label: string; meta: string; total: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="h-10 w-2 rounded-full" style={{ backgroundColor: color }} />
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-950">{label}</p>
            <p className="text-sm text-slate-500">{meta}</p>
          </div>
        </div>
        <p className="text-xl font-semibold text-slate-950">{formatCurrency(total)}</p>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
      <Layers3 className="mx-auto mb-3 text-slate-400" size={24} />
      <p className="font-medium text-slate-700">No expenses match these filters.</p>
    </div>
  );
}

function sortExpenses(a: Expense, b: Expense, sortKey: SortKey, allExpenses: Expense[], budgets: Budget, dateStart: string, dateEnd: string) {
  if (sortKey === "date-asc") return a.date.localeCompare(b.date) || b.amount - a.amount;
  if (sortKey === "amount-desc") return b.amount - a.amount || b.date.localeCompare(a.date);
  if (sortKey === "amount-asc") return a.amount - b.amount || b.date.localeCompare(a.date);
  if (sortKey === "category") return a.category.localeCompare(b.category) || b.amount - a.amount;
  if (sortKey === "merchant") return a.title.localeCompare(b.title) || b.date.localeCompare(a.date);
  if (sortKey === "budget-risk") {
    return getBudgetRatio(b, allExpenses, budgets, dateStart, dateEnd) - getBudgetRatio(a, allExpenses, budgets, dateStart, dateEnd) || b.amount - a.amount;
  }

  return b.date.localeCompare(a.date) || b.amount - a.amount;
}

function getBudgetRatio(expense: Expense, allExpenses: Expense[], budgets: Budget, dateStart: string, dateEnd: string) {
  const spent = allExpenses
    .filter((candidate) => candidate.category === expense.category && isInDateRange(candidate.date, dateStart, dateEnd))
    .reduce((sum, candidate) => sum + candidate.amount, 0);

  return budgets[expense.category] > 0 ? spent / budgets[expense.category] : 0;
}

function isInDateRange(date: string, dateStart: string, dateEnd: string) {
  if (dateStart && date < dateStart) return false;
  if (dateEnd && date > dateEnd) return false;
  return true;
}

function getRangeDays(dateStart: string, dateEnd: string) {
  if (!dateStart || !dateEnd || dateStart > dateEnd) return 1;

  const start = new Date(`${dateStart}T00:00:00`);
  const end = new Date(`${dateEnd}T00:00:00`);
  const days = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
  return Math.max(days, 1);
}

function validateExpenseForm(form: typeof emptyForm): FormErrors {
  const amount = Number(form.amount);
  const errors: FormErrors = {};

  if (!form.title.trim()) errors.title = "Description is required.";
  if (!form.amount || Number.isNaN(amount) || amount <= 0) errors.amount = "Enter an amount greater than zero.";
  if (!form.date) errors.date = "Date is required.";

  return errors;
}

function normalizeExpense(expense: Expense): Expense {
  return {
    ...expense,
    category: normalizeCategory(expense.category),
    paymentMethod: paymentMethods.includes(expense.paymentMethod) ? expense.paymentMethod : "Card",
    recurring: Boolean(expense.recurring),
  };
}

function normalizeBudgets(savedBudgets?: Partial<Record<string, number>>) {
  const budgets = { ...defaultBudgets };

  if (!savedBudgets) return budgets;

  Object.entries(savedBudgets).forEach(([category, budget]) => {
    const normalizedCategory = normalizeCategory(category);
    budgets[normalizedCategory] = Math.max(0, Number(budget) || 0);
  });

  return budgets;
}

function normalizeCategory(category: string): ExpenseCategory {
  if (categories.includes(category as ExpenseCategory)) return category as ExpenseCategory;
  if (["Transport", "Travel"].includes(category)) return "Transportation";
  if (["Housing", "Utilities"].includes(category)) return "Bills";
  if (["Healthcare", "Savings"].includes(category)) return "Other";
  return "Other";
}
