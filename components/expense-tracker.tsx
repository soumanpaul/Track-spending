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
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Progress,
  Select,
  SelectItem,
  Switch,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Tabs,
  Textarea,
  Tooltip,
} from "@nextui-org/react";
import {
  Banknote,
  CalendarDays,
  CheckCircle2,
  Clock,
  Cloud,
  CloudUpload,
  Copy,
  CreditCard,
  FileSpreadsheet,
  Folder,
  Edit3,
  Filter,
  Gauge,
  History,
  Link2,
  Lightbulb,
  LayoutGrid,
  Layers3,
  ListFilter,
  Mail,
  Moon,
  Plus,
  QrCode,
  ReceiptText,
  RefreshCcw,
  Search,
  Send,
  Share2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp,
  X,
  WalletCards,
  Zap,
} from "lucide-react";
import { useThemeMode } from "@/app/providers";
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
type ExportTemplate = "Tax Report" | "Monthly Summary" | "Category Analysis";
type CloudProvider = "Google Sheets" | "Dropbox" | "OneDrive" | "Email";
type BackupFrequency = "Off" | "Weekly" | "Monthly" | "Quarterly";
type ExportHistoryEntry = {
  id: string;
  action: string;
  destination: string;
  template: ExportTemplate;
  timestamp: string;
  status: "Completed" | "Scheduled" | "Shared";
};
type FormErrors = Partial<Record<"title" | "amount" | "date" | "range", string>>;
type CoachAction = {
  title: string;
  detail: string;
  impact: string;
  priority: "High" | "Medium" | "Low";
  icon: React.ReactNode;
};
type CategoryTotal = {
  category: ExpenseCategory;
  spent: number;
  budget: number;
  percent: number;
};

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

const exportTemplates: { name: ExportTemplate; detail: string; fields: string; accent: string }[] = [
  {
    name: "Tax Report",
    detail: "Deduction-ready export with dates, categories, notes, and totals.",
    fields: "Date, category, amount, notes",
    accent: "#0f766e",
  },
  {
    name: "Monthly Summary",
    detail: "Executive snapshot for recurring finance reviews and budget meetings.",
    fields: "Totals, recurring spend, budget variance",
    accent: "#3457d5",
  },
  {
    name: "Category Analysis",
    detail: "Category rollups designed for pivots, charts, and trend reviews.",
    fields: "Category, transaction count, spend share",
    accent: "#a855f7",
  },
];

const cloudIntegrations: { name: CloudProvider; detail: string; status: "Connected" | "Ready" | "Mock setup"; icon: React.ReactNode }[] = [
  { name: "Google Sheets", detail: "Sync exports into a shared workbook.", status: "Connected", icon: <FileSpreadsheet size={18} /> },
  { name: "Dropbox", detail: "Archive monthly reports in cloud folders.", status: "Ready", icon: <Folder size={18} /> },
  { name: "OneDrive", detail: "Keep finance backups near Office files.", status: "Ready", icon: <Cloud size={18} /> },
  { name: "Email", detail: "Send reports to yourself or collaborators.", status: "Mock setup", icon: <Mail size={18} /> },
];

const initialExportHistory: ExportHistoryEntry[] = [
  {
    id: "hist-1",
    action: "Monthly Summary synced",
    destination: "Google Sheets",
    template: "Monthly Summary",
    timestamp: "2026-05-31 18:42",
    status: "Completed",
  },
  {
    id: "hist-2",
    action: "Tax Report shared",
    destination: "Secure link",
    template: "Tax Report",
    timestamp: "2026-05-15 09:10",
    status: "Shared",
  },
  {
    id: "hist-3",
    action: "Category Analysis backup",
    destination: "Dropbox",
    template: "Category Analysis",
    timestamp: "2026-05-01 07:00",
    status: "Scheduled",
  },
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
  const { theme, toggleTheme } = useThemeMode();
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
  const [isCloudExportOpen, setIsCloudExportOpen] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState<ExportTemplate>("Monthly Summary");
  const [cloudProvider, setCloudProvider] = useState<CloudProvider>("Google Sheets");
  const [backupFrequency, setBackupFrequency] = useState<BackupFrequency>("Monthly");
  const [recipientEmail, setRecipientEmail] = useState("finance@example.com");
  const [shareLink, setShareLink] = useState("https://expense-desk.app/share/may-summary-8f42");
  const [isQrVisible, setIsQrVisible] = useState(false);
  const [isCloudProcessing, setIsCloudProcessing] = useState(false);
  const [exportHistory, setExportHistory] = useState<ExportHistoryEntry[]>(initialExportHistory);

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

  const moneyCoach = useMemo(() => {
    return buildMoneyCoach(expenses, categoryTotals, dateStart, dateEnd, totals);
  }, [categoryTotals, dateEnd, dateStart, expenses, totals]);

  const topCategories = [...categoryTotals]
    .filter((item) => item.spent > 0)
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 5);

  const filteredTotal = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const filteredAverage = filteredExpenses.length > 0 ? filteredTotal / filteredExpenses.length : 0;
  const cloudSyncTotal = expenses.filter((expense) => isInDateRange(expense.date, currentMonthStart, currentMonthEnd)).reduce((sum, expense) => sum + expense.amount, 0);
  const cloudSyncSummary = `${expenses.length} records ready, ${formatCurrency(cloudSyncTotal)} this month`;

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

  function openCloudExport() {
    setIsCloudExportOpen(true);
  }

  async function simulateCloudExport(action: "sync" | "email" | "backup" | "share") {
    setIsCloudProcessing(true);
    await new Promise((resolve) => window.setTimeout(resolve, 650));

    const entry = createCloudHistoryEntry(action, activeTemplate, cloudProvider, recipientEmail);
    setExportHistory((current) => [entry, ...current].slice(0, 6));

    if (action === "share") {
      setShareLink(`https://expense-desk.app/share/${activeTemplate.toLowerCase().replaceAll(" ", "-")}-${Math.random().toString(16).slice(2, 6)}`);
      setIsQrVisible(true);
    }

    setIsCloudProcessing(false);
    setFeedback(getCloudFeedback(action, activeTemplate, cloudProvider));
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
            <Button
              startContent={theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
              variant="bordered"
              onPress={toggleTheme}
            >
              {theme === "dark" ? "Light mode" : "Dark mode"}
            </Button>
            <Button color="primary" startContent={<CloudUpload size={18} />} variant="flat" onPress={openCloudExport}>
              Cloud Export
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

        <Modal isOpen={isCloudExportOpen} scrollBehavior="inside" size="5xl" onOpenChange={setIsCloudExportOpen}>
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <CloudUpload size={21} />
                      Cloud export center
                    </div>
                    <CloudStatusPill label="Live sync ready" tone="success" />
                  </div>
                  <p className="text-sm font-normal text-slate-500">
                    Publish reports, share secure links, schedule backups, and connect your expense data to the tools your team already uses.
                  </p>
                </ModalHeader>
                <ModalBody className="gap-5">
                  <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                    <div className="space-y-4">
                      <div className="rounded-lg border border-slate-200 bg-gradient-to-r from-slate-950 to-primary p-4 text-white">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-sm text-white/70">Workspace sync</p>
                            <h2 className="mt-1 text-2xl font-semibold tracking-normal">Expenses are ready for cloud workflows.</h2>
                            <p className="mt-2 text-sm text-white/75">{cloudSyncSummary}</p>
                          </div>
                          <div className="rounded-lg bg-white/15 px-3 py-2 text-right">
                            <p className="text-xs uppercase tracking-normal text-white/60">Next backup</p>
                            <p className="text-sm font-semibold">{backupFrequency === "Off" ? "Paused" : `${backupFrequency} cycle`}</p>
                          </div>
                        </div>
                      </div>

                      <Tabs aria-label="Cloud export workflows" color="primary" variant="underlined">
                        <Tab key="templates" title="Templates">
                          <div className="grid gap-3 pt-3 md:grid-cols-3">
                            {exportTemplates.map((template) => (
                              <TemplateOption
                                key={template.name}
                                template={template}
                                isSelected={activeTemplate === template.name}
                                onSelect={() => setActiveTemplate(template.name)}
                              />
                            ))}
                          </div>
                        </Tab>
                        <Tab key="services" title="Services">
                          <div className="grid gap-3 pt-3 md:grid-cols-2">
                            {cloudIntegrations.map((integration) => (
                              <IntegrationTile
                                key={integration.name}
                                integration={integration}
                                isSelected={cloudProvider === integration.name}
                                onSelect={() => setCloudProvider(integration.name)}
                              />
                            ))}
                          </div>
                        </Tab>
                        <Tab key="schedule" title="Automations">
                          <div className="grid gap-3 pt-3 md:grid-cols-[1fr_1fr]">
                            <div className="rounded-lg border border-slate-200 p-4">
                              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-900">
                                <Clock size={17} />
                                Recurring backups
                              </div>
                              <Select
                                label="Backup schedule"
                                selectedKeys={[backupFrequency]}
                                onSelectionChange={(keys) => setBackupFrequency(Array.from(keys)[0] as BackupFrequency)}
                              >
                                {(["Off", "Weekly", "Monthly", "Quarterly"] as const).map((frequency) => (
                                  <SelectItem key={frequency}>{frequency}</SelectItem>
                                ))}
                              </Select>
                              <p className="mt-3 text-sm leading-5 text-slate-500">
                                Scheduled exports run in the background and write the selected template to {cloudProvider}.
                              </p>
                            </div>
                            <div className="rounded-lg border border-slate-200 p-4">
                              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-900">
                                <ShieldCheck size={17} />
                                Sync safeguards
                              </div>
                              <div className="space-y-2 text-sm text-slate-600">
                                <CloudStatusPill label="Encrypted in transit" tone="success" />
                                <CloudStatusPill label="Version history enabled" tone="default" />
                                <CloudStatusPill label="Owner approval required" tone="warning" />
                              </div>
                            </div>
                          </div>
                        </Tab>
                      </Tabs>

                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="rounded-lg border border-slate-200 p-4">
                          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-900">
                            <Mail size={17} />
                            Email export
                          </div>
                          <Input
                            label="Recipient"
                            placeholder="finance@example.com"
                            type="email"
                            value={recipientEmail}
                            onValueChange={setRecipientEmail}
                          />
                          <Button
                            className="mt-3"
                            color="primary"
                            isLoading={isCloudProcessing}
                            startContent={isCloudProcessing ? undefined : <Send size={17} />}
                            variant="flat"
                            onPress={() => simulateCloudExport("email")}
                          >
                            Send report
                          </Button>
                        </div>

                        <div className="rounded-lg border border-slate-200 p-4">
                          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-900">
                            <Share2 size={17} />
                            Share workspace snapshot
                          </div>
                          <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
                            <p className="truncate">{shareLink}</p>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Button size="sm" startContent={<Link2 size={16} />} variant="flat" onPress={() => simulateCloudExport("share")}>
                              Generate link
                            </Button>
                            <Button size="sm" startContent={<Copy size={16} />} variant="flat" onPress={() => setFeedback("Share link copied to clipboard simulation.")}>
                              Copy
                            </Button>
                            <Button size="sm" startContent={<QrCode size={16} />} variant="flat" onPress={() => setIsQrVisible((current) => !current)}>
                              QR
                            </Button>
                          </div>
                          {isQrVisible ? <MiniQrCode value={shareLink} /> : null}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-lg border border-slate-200 p-4">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-slate-900">Cloud destination</p>
                            <p className="text-xs text-slate-500">{activeTemplate} will publish to {cloudProvider}.</p>
                          </div>
                          <CloudStatusPill label="Mock connected" tone="success" />
                        </div>
                        <div className="space-y-2">
                          <Button
                            fullWidth
                            color="primary"
                            isLoading={isCloudProcessing}
                            startContent={isCloudProcessing ? undefined : <FileSpreadsheet size={18} />}
                            onPress={() => simulateCloudExport("sync")}
                          >
                            Sync to {cloudProvider}
                          </Button>
                          <Button
                            fullWidth
                            isLoading={isCloudProcessing}
                            startContent={isCloudProcessing ? undefined : <Clock size={18} />}
                            variant="bordered"
                            onPress={() => simulateCloudExport("backup")}
                          >
                            Schedule backup
                          </Button>
                        </div>
                      </div>

                      <div className="rounded-lg border border-slate-200 p-4">
                        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-900">
                          <History size={17} />
                          Export history
                        </div>
                        <div className="space-y-3">
                          {exportHistory.map((entry) => (
                            <ExportHistoryRow key={entry.id} entry={entry} />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </ModalBody>
                <ModalFooter>
                  <Button variant="flat" onPress={onClose}>
                    Close
                  </Button>
                  <Button color="primary" startContent={<Cloud size={18} />} onPress={() => simulateCloudExport("sync")}>
                    Publish selected workflow
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard icon={<TrendingDown size={20} />} label="Spent in range" value={formatCurrency(totals.total)} detail={`${totals.transactionCount} transactions`} />
          <MetricCard icon={<Banknote size={20} />} label="Budget left" value={formatCurrency(totals.remaining)} detail={`${Math.round((totals.total / totals.budgetTotal) * 100)}% of total budget used`} tone={totals.remaining < 0 ? "danger" : "success"} />
          <MetricCard icon={<CalendarDays size={20} />} label="Daily average" value={formatCurrency(totals.dailyAverage)} detail={rangeLabel} />
          <MetricCard icon={<CreditCard size={20} />} label="Recurring" value={formatCurrency(totals.recurring)} detail="Scheduled monthly expenses" />
        </section>

        <section className="grid gap-4 lg:grid-cols-[minmax(300px,0.9fr)_1.4fr_1fr]">
          <Card radius="sm" shadow="sm" className="border border-slate-200/70">
            <CardBody className="gap-4 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
                    <Sparkles size={17} />
                    Money Coach
                  </div>
                  <h2 className="text-xl font-semibold text-slate-950">{moneyCoach.status}</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-500">{moneyCoach.summary}</p>
                </div>
                <div className={`rounded-lg px-3 py-2 text-right ${moneyCoach.score >= 75 ? "bg-primary-50 text-primary-700" : moneyCoach.score >= 55 ? "bg-warning-50 text-warning-700" : "bg-danger-50 text-danger-700"}`}>
                  <p className="text-xs font-medium uppercase tracking-normal">Score</p>
                  <p className="text-2xl font-semibold">{moneyCoach.score}</p>
                </div>
              </div>
              <Progress
                aria-label="Money health score"
                color={moneyCoach.score >= 75 ? "primary" : moneyCoach.score >= 55 ? "warning" : "danger"}
                value={moneyCoach.score}
              />
              <div className="grid grid-cols-3 gap-2 text-center">
                <MiniStat label="Forecast" value={formatCurrency(moneyCoach.forecast)} tone={moneyCoach.forecast > totals.budgetTotal ? "danger" : "default"} />
                <MiniStat label="Runway" value={`${moneyCoach.runwayDays}d`} tone={moneyCoach.runwayDays < 7 ? "danger" : "default"} />
                <MiniStat label="Savings" value={formatCurrency(moneyCoach.savingsOpportunity)} tone="success" />
              </div>
            </CardBody>
          </Card>

          <Card radius="sm" shadow="sm" className="border border-slate-200/70">
            <CardHeader className="flex items-center justify-between gap-3 px-5 pt-5">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Recommended actions</h2>
                <p className="text-sm text-slate-500">Prioritized from budget pressure, recurring spend, and transaction patterns.</p>
              </div>
              <Chip color={moneyCoach.highPriorityCount > 0 ? "danger" : "primary"} variant="flat">
                {moneyCoach.highPriorityCount} urgent
              </Chip>
            </CardHeader>
            <CardBody className="grid gap-3 px-5 pb-5 md:grid-cols-3">
              {moneyCoach.actions.map((action) => (
                <CoachActionCard key={action.title} action={action} />
              ))}
            </CardBody>
          </Card>

          <Card radius="sm" shadow="sm" className="border border-slate-200/70">
            <CardHeader className="flex-col items-start gap-1 px-5 pt-5">
              <h2 className="text-lg font-semibold text-slate-950">Spending rhythm</h2>
              <p className="text-sm text-slate-500">See where this month is drifting before it becomes expensive.</p>
            </CardHeader>
            <CardBody className="gap-4 px-5 pb-5">
              {moneyCoach.watchList.map((item) => (
                <div key={item.label} className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-slate-900">{item.label}</p>
                    <p className="text-sm text-slate-500">{item.value}</p>
                  </div>
                  <Progress aria-label={`${item.label} usage`} color={item.percent > 90 ? "danger" : item.percent > 70 ? "warning" : "primary"} size="sm" value={item.percent} />
                </div>
              ))}
            </CardBody>
          </Card>
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

function MiniStat({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "success" | "danger" }) {
  const toneClass = tone === "success" ? "text-primary" : tone === "danger" ? "text-danger" : "text-slate-950";

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`truncate text-base font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}

function CoachActionCard({ action }: { action: CoachAction }) {
  const priorityColor = action.priority === "High" ? "danger" : action.priority === "Medium" ? "warning" : "primary";

  return (
    <div className="flex min-h-[164px] flex-col justify-between rounded-lg border border-slate-200 bg-white p-4">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <span className="rounded-lg bg-slate-100 p-2 text-slate-700">{action.icon}</span>
          <Chip color={priorityColor} size="sm" variant="flat">{action.priority}</Chip>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-950">{action.title}</h3>
          <p className="mt-1 text-sm leading-5 text-slate-500">{action.detail}</p>
        </div>
      </div>
      <p className="mt-4 text-sm font-medium text-primary">{action.impact}</p>
    </div>
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

function TemplateOption({
  template,
  isSelected,
  onSelect,
}: {
  template: { name: ExportTemplate; detail: string; fields: string; accent: string };
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      className={`min-h-[178px] rounded-lg border p-4 text-left transition ${isSelected ? "border-primary bg-primary-50" : "border-slate-200 bg-white hover:border-primary-200"}`}
      type="button"
      onClick={onSelect}
    >
      <span className="mb-4 block h-1.5 w-12 rounded-full" style={{ backgroundColor: template.accent }} />
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-950">{template.name}</h3>
        {isSelected ? <CheckCircle2 className="text-primary" size={18} /> : null}
      </div>
      <p className="mt-2 text-sm leading-5 text-slate-500">{template.detail}</p>
      <p className="mt-3 text-xs font-medium text-slate-400">{template.fields}</p>
    </button>
  );
}

function IntegrationTile({
  integration,
  isSelected,
  onSelect,
}: {
  integration: { name: CloudProvider; detail: string; status: "Connected" | "Ready" | "Mock setup"; icon: React.ReactNode };
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      className={`rounded-lg border p-4 text-left transition ${isSelected ? "border-primary bg-primary-50" : "border-slate-200 bg-white hover:border-primary-200"}`}
      type="button"
      onClick={onSelect}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="rounded-lg bg-slate-100 p-2 text-slate-700">{integration.icon}</span>
        <CloudStatusPill label={integration.status} tone={integration.status === "Connected" ? "success" : "default"} />
      </div>
      <h3 className="mt-3 text-sm font-semibold text-slate-950">{integration.name}</h3>
      <p className="mt-1 text-sm leading-5 text-slate-500">{integration.detail}</p>
    </button>
  );
}

function CloudStatusPill({ label, tone }: { label: string; tone: "success" | "warning" | "default" }) {
  const toneClass =
    tone === "success"
      ? "border-primary-200 bg-primary-50 text-primary-700"
      : tone === "warning"
        ? "border-warning-200 bg-warning-50 text-warning-700"
        : "border-slate-200 bg-slate-50 text-slate-600";

  return (
    <span className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${toneClass}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}

function ExportHistoryRow({ entry }: { entry: ExportHistoryEntry }) {
  const tone = entry.status === "Completed" ? "success" : entry.status === "Scheduled" ? "warning" : "default";

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-950">{entry.action}</p>
          <p className="mt-1 text-xs text-slate-500">{entry.destination} · {entry.timestamp}</p>
        </div>
        <CloudStatusPill label={entry.status} tone={tone} />
      </div>
      <p className="mt-2 text-xs font-medium text-slate-400">{entry.template}</p>
    </div>
  );
}

function MiniQrCode({ value }: { value: string }) {
  const cells = Array.from({ length: 49 }, (_, index) => {
    const code = value.charCodeAt(index % value.length);
    return (code + index * 7) % 3 !== 0;
  });

  return (
    <div className="mt-3 flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3">
      <div className="grid h-20 w-20 grid-cols-7 gap-1 rounded-md bg-white p-1">
        {cells.map((isFilled, index) => (
          <span key={index} className={`rounded-[1px] ${isFilled ? "bg-slate-950" : "bg-slate-100"}`} />
        ))}
      </div>
      <div>
        <p className="text-sm font-medium text-slate-900">Share QR ready</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">Mock code for the generated secure link.</p>
      </div>
    </div>
  );
}

function createCloudHistoryEntry(action: "sync" | "email" | "backup" | "share", template: ExportTemplate, provider: CloudProvider, recipientEmail: string): ExportHistoryEntry {
  const timestamp = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date());

  if (action === "email") {
    return {
      id: crypto.randomUUID(),
      action: `${template} emailed`,
      destination: recipientEmail,
      template,
      timestamp,
      status: "Completed",
    };
  }

  if (action === "backup") {
    return {
      id: crypto.randomUUID(),
      action: `${template} backup scheduled`,
      destination: provider,
      template,
      timestamp,
      status: "Scheduled",
    };
  }

  if (action === "share") {
    return {
      id: crypto.randomUUID(),
      action: `${template} link generated`,
      destination: "Secure link",
      template,
      timestamp,
      status: "Shared",
    };
  }

  return {
    id: crypto.randomUUID(),
    action: `${template} synced`,
    destination: provider,
    template,
    timestamp,
    status: "Completed",
  };
}

function getCloudFeedback(action: "sync" | "email" | "backup" | "share", template: ExportTemplate, provider: CloudProvider) {
  if (action === "email") return `${template} email export queued.`;
  if (action === "backup") return `${template} backup scheduled for ${provider}.`;
  if (action === "share") return `${template} share link generated.`;
  return `${template} synced to ${provider}.`;
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

function buildMoneyCoach(
  expenses: Expense[],
  categoryTotals: CategoryTotal[],
  dateStart: string,
  dateEnd: string,
  totals: { total: number; recurring: number; budgetTotal: number; remaining: number; dailyAverage: number; transactionCount: number },
) {
  const rangeDays = getRangeDays(dateStart, dateEnd);
  const elapsedDays = getElapsedDays(dateStart, dateEnd);
  const rangeExpenses = expenses.filter((expense) => isInDateRange(expense.date, dateStart, dateEnd));
  const forecast = Math.round(totals.dailyAverage * rangeDays);
  const discretionary = rangeExpenses
    .filter((expense) => ["Entertainment", "Shopping"].includes(expense.category))
    .reduce((sum, expense) => sum + expense.amount, 0);
  const highValueItems = rangeExpenses.filter((expense) => expense.amount >= Math.max(100, totals.dailyAverage * 2));
  const overBudget = categoryTotals.filter((item) => item.budget > 0 && item.spent > item.budget);
  const nearLimit = categoryTotals.filter((item) => item.budget > 0 && item.percent >= 75 && item.percent <= 100);
  const biggestCategory = [...categoryTotals].sort((a, b) => b.spent - a.spent)[0];
  const recurringShare = totals.total > 0 ? totals.recurring / totals.total : 0;
  const paceRatio = totals.budgetTotal > 0 ? forecast / totals.budgetTotal : 0;
  const savingsOpportunity = Math.round(discretionary * 0.18 + Math.max(0, totals.recurring - totals.budgetTotal * 0.35) * 0.25);
  const runwayDays = totals.dailyAverage > 0 ? Math.max(0, Math.floor(totals.remaining / totals.dailyAverage)) : rangeDays;

  const score = clamp(
    Math.round(
      92
        - Math.max(0, paceRatio - 0.82) * 60
        - overBudget.length * 13
        - nearLimit.length * 5
        - Math.max(0, recurringShare - 0.35) * 24
        - highValueItems.length * 3,
    ),
    28,
    98,
  );

  const actions = buildCoachActions({
    biggestCategory,
    discretionary,
    forecast,
    highValueItems,
    nearLimit,
    overBudget,
    recurringShare,
    savingsOpportunity,
    totals,
  });

  const watchList = [
    {
      label: "Budget pace",
      value: `${Math.round(paceRatio * 100)}% projected`,
      percent: clamp(Math.round(paceRatio * 100), 0, 100),
    },
    {
      label: "Recurring load",
      value: `${Math.round(recurringShare * 100)}% of spend`,
      percent: clamp(Math.round(recurringShare * 100), 0, 100),
    },
    {
      label: "Month progress",
      value: `${elapsedDays}/${rangeDays} days`,
      percent: clamp(Math.round((elapsedDays / rangeDays) * 100), 0, 100),
    },
  ];

  const status = score >= 75 ? "On track with room to optimize" : score >= 55 ? "Watch the pace this month" : "Action needed to protect budget";
  const summary =
    forecast > totals.budgetTotal
      ? `At the current pace, spending may land ${formatCurrency(forecast - totals.budgetTotal)} over budget.`
      : `At the current pace, spending may finish ${formatCurrency(totals.budgetTotal - forecast)} under budget.`;

  return {
    actions,
    forecast,
    highPriorityCount: actions.filter((action) => action.priority === "High").length,
    runwayDays,
    savingsOpportunity,
    score,
    status,
    summary,
    watchList,
  };
}

function buildCoachActions({
  biggestCategory,
  discretionary,
  forecast,
  highValueItems,
  nearLimit,
  overBudget,
  recurringShare,
  savingsOpportunity,
  totals,
}: {
  biggestCategory?: CategoryTotal;
  discretionary: number;
  forecast: number;
  highValueItems: Expense[];
  nearLimit: CategoryTotal[];
  overBudget: CategoryTotal[];
  recurringShare: number;
  savingsOpportunity: number;
  totals: { total: number; recurring: number; budgetTotal: number; remaining: number; dailyAverage: number; transactionCount: number };
}) {
  const actions: CoachAction[] = [];

  if (overBudget.length > 0) {
    const category = overBudget[0];
    actions.push({
      title: `Pause ${category.category} spend`,
      detail: `${category.category} is ${formatCurrency(category.spent - category.budget)} over its budget.`,
      impact: "Highest immediate recovery",
      priority: "High",
      icon: <Zap size={18} />,
    });
  }

  if (forecast > totals.budgetTotal) {
    actions.push({
      title: "Set a weekly guardrail",
      detail: `Keep new spending below ${formatCurrency(Math.max(0, totals.remaining) / 2)} per week to narrow the forecast gap.`,
      impact: `${formatCurrency(forecast - totals.budgetTotal)} projected risk`,
      priority: "High",
      icon: <Gauge size={18} />,
    });
  }

  if (recurringShare > 0.35) {
    actions.push({
      title: "Review recurring payments",
      detail: `Recurring items represent ${Math.round(recurringShare * 100)}% of current spend.`,
      impact: "Best place for permanent savings",
      priority: "Medium",
      icon: <RefreshCcw size={18} />,
    });
  }

  if (nearLimit.length > 0) {
    actions.push({
      title: `Protect ${nearLimit[0].category}`,
      detail: `${nearLimit[0].category} has used ${nearLimit[0].percent}% of its budget.`,
      impact: "Prevents the next overrun",
      priority: "Medium",
      icon: <Target size={18} />,
    });
  }

  if (highValueItems.length > 0) {
    actions.push({
      title: "Audit large purchases",
      detail: `${highValueItems.length} transaction${highValueItems.length === 1 ? "" : "s"} crossed the review threshold.`,
      impact: "Catch mistakes and impulse buys",
      priority: "Low",
      icon: <Search size={18} />,
    });
  }

  if (discretionary > 0) {
    actions.push({
      title: "Trim flexible categories",
      detail: `Entertainment and shopping total ${formatCurrency(discretionary)} in this range.`,
      impact: `${formatCurrency(savingsOpportunity)} realistic savings`,
      priority: "Low",
      icon: <TrendingUp size={18} />,
    });
  }

  if (actions.length === 0 && biggestCategory) {
    actions.push({
      title: `Keep ${biggestCategory.category} visible`,
      detail: `${biggestCategory.category} is the largest category at ${formatCurrency(biggestCategory.spent)}.`,
      impact: "Maintains current momentum",
      priority: "Low",
      icon: <CheckCircle2 size={18} />,
    });
  }

  actions.push({
    title: "Add notes to every expense",
    detail: "Clear notes make search, reviews, and export handoffs easier.",
    impact: "Improves month-end review",
    priority: "Low",
    icon: <Lightbulb size={18} />,
  });

  return actions.slice(0, 3);
}

function getElapsedDays(dateStart: string, dateEnd: string) {
  if (!dateStart || !dateEnd || dateStart > dateEnd) return 1;

  const today = new Date();
  const start = new Date(`${dateStart}T00:00:00`);
  const end = new Date(`${dateEnd}T00:00:00`);
  const effectiveEnd = new Date(Math.min(today.getTime(), end.getTime()));
  const days = Math.round((effectiveEnd.getTime() - start.getTime()) / 86_400_000) + 1;
  return clamp(days, 1, getRangeDays(dateStart, dateEnd));
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
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
