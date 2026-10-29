import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Banknote,
  Download,
  FileSpreadsheet,
  HandCoins,
  Plus,
  Printer,
  ReceiptText,
  Trash2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { StatusBadge } from "../../components/StatusBadge";
import { useAuth } from "../../features/auth/useAuth";
import { EmptyState, LoadingState } from "../../features/ui/FeedbackStates";
import { useToast } from "../../features/ui/useToast";
import {
  createFinancialTransaction,
  voidFinancialTransaction,
  getFinanceSnapshot,
  type FinanceMethod,
  type FinanceScope,
  type FinanceSnapshot,
  type FinancialTransactionInput,
} from "../../features/finance/financeQueries";
import { Button } from "../../components/Button";
import { Card } from "../../components/m3/Card";
import { TextField } from "../../components/m3/TextField";
import { SelectField } from "../../components/m3/SelectField";
import { TextArea } from "../../components/m3/TextArea";
import { SearchBar } from "../../components/m3/SearchBar";

const CASH_INFLOW_CATEGORIES = ["Sponsorships", "PFC Budget", "Donations", "Others"] as const;
const EXPENSE_CATEGORIES = [
  "Cash Prizes",
  "Contingent Subsidy",
  "Committee Shirts",
  "Honorarium",
  "Stage Decoration & Program",
  "Trophies",
  "Tarpaulins",
  "Working Budget",
  "Sound System",
  "Photo Coverage",
  "Video Coverage",
  "Tokens & Certificates",
  "Others",
] as const;

type ScopeFilter = "overall" | FinanceScope;
type LedgerTypeFilter = "all" | "income" | "expense";
type LedgerStatusFilter = "all" | "active" | "voided";

interface LedgerRow {
  id: string;
  source: "manual" | "registration";
  transactionDate: string;
  transactionType: "income" | "expense";
  category: string;
  counterparty: string;
  receivedBy: string;
  method: string;
  reference: string;
  description: string;
  scope: FinanceScope;
  amountCentavos: number;
  recorder: string;
  recordedAt: string;
  voidedAt: string;
  voidedBy: string;
}

const peso = (centavos: number) =>
  (centavos / 100).toLocaleString("en-PH", { style: "currency", currency: "PHP" });
const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
const scopeLabel = (scope: FinanceScope) => scope === "festival" ? "Sinoog Festival" : scope === "run" ? "Sinoog Run" : "General";
const methodLabel = (method: string) => method.toLowerCase() === "gcash" ? "GCash" : method.charAt(0).toUpperCase() + method.slice(1).toLowerCase();

const emptyForm = (): Omit<FinancialTransactionInput, "created_by"> => ({
  transaction_type: "income",
  category: CASH_INFLOW_CATEGORIES[0],
  description: "",
  amount_centavos: 0,
  method: "cash",
  reference: "",
  counterparty_name: "",
  received_by_name: "",
  event_scope: "general",
  transaction_date: today(),
});

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function FinancePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [snapshot, setSnapshot] = useState<FinanceSnapshot>({ payments: [], transactions: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>("overall");
  const [ledgerType, setLedgerType] = useState<LedgerTypeFilter>("all");
  const [ledgerMethod, setLedgerMethod] = useState("all");
  const [ledgerStatus, setLedgerStatus] = useState<LedgerStatusFilter>("active");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("all");
  const [paymentMethod, setPaymentMethod] = useState("all");

  const load = useCallback(async () => {
    try {
      setSnapshot(await getFinanceSnapshot());
    } catch (error) {
      toast(error instanceof Error ? error.message : "Unable to load financial records.", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    const loadTimer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(loadTimer);
  }, [load]);

  const allLedgerRows = useMemo<LedgerRow[]>(() => {
    const manualRows: LedgerRow[] = snapshot.transactions.map((entry) => ({
      id: entry.id,
      source: "manual",
      transactionDate: entry.transaction_date,
      transactionType: entry.transaction_type,
      category: entry.category,
      counterparty: entry.counterparty_name || "Not recorded",
      receivedBy: entry.received_by_name || "",
      method: entry.method || "Not recorded",
      reference: entry.reference || "",
      description: entry.description,
      scope: entry.event_scope || "general",
      amountCentavos: entry.amount_centavos,
      recorder: entry.recorder_name,
      recordedAt: entry.created_at,
      voidedAt: entry.voided_at || "",
      voidedBy: entry.voided_by_name || "",
    }));
    const registrationRows: LedgerRow[] = snapshot.payments
      .filter((payment) => payment.status === "verified")
      .map((payment) => ({
        id: `payment-${payment.id}`,
        source: "registration",
        transactionDate: (payment.verified_at || payment.submitted_at || payment.created_at).slice(0, 10),
        transactionType: "income",
        category: "Runner Registration Fees",
        counterparty: payment.participant_name,
        receivedBy: "",
        method: payment.method,
        reference: payment.payer_reference || payment.registration_reference,
        description: `${payment.category_name} · ${payment.registration_reference}`,
        scope: "run",
        amountCentavos: payment.amount_centavos,
        recorder: payment.verifier_name || payment.receiver_name || "Committee administrator",
        recordedAt: payment.verified_at || payment.updated_at,
        voidedAt: "",
        voidedBy: "",
      }));
    return [...manualRows, ...registrationRows].sort((a, b) =>
      b.transactionDate.localeCompare(a.transactionDate) || b.recordedAt.localeCompare(a.recordedAt));
  }, [snapshot]);

  const scopeRows = useMemo(() => allLedgerRows.filter((row) =>
    scopeFilter === "overall" || row.scope === scopeFilter), [allLedgerRows, scopeFilter]);

  const totals = useMemo(() => {
    const active = scopeRows.filter((row) => !row.voidedAt);
    const inflows = active.filter((row) => row.transactionType === "income").reduce((sum, row) => sum + row.amountCentavos, 0);
    const expenses = active.filter((row) => row.transactionType === "expense").reduce((sum, row) => sum + row.amountCentavos, 0);
    const pending = scopeFilter === "festival" || scopeFilter === "general" ? 0 : snapshot.payments
      .filter((payment) => payment.status === "submitted")
      .reduce((sum, payment) => sum + payment.amount_centavos, 0);
    return { inflows, expenses, balance: inflows - expenses, pending };
  }, [scopeRows, snapshot.payments, scopeFilter]);

  const filteredLedger = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return scopeRows.filter((row) => {
      const statusMatches = ledgerStatus === "all" || (ledgerStatus === "voided" ? Boolean(row.voidedAt) : !row.voidedAt);
      const typeMatches = ledgerType === "all" || row.transactionType === ledgerType;
      const methodMatches = ledgerMethod === "all" || row.method.toLowerCase() === ledgerMethod;
      const dateMatches = (!dateFrom || row.transactionDate >= dateFrom) && (!dateTo || row.transactionDate <= dateTo);
      const searchMatches = !needle || [row.category, row.counterparty, row.receivedBy, row.description, row.reference, row.recorder]
        .some((value) => value.toLowerCase().includes(needle));
      return statusMatches && typeMatches && methodMatches && dateMatches && searchMatches;
    });
  }, [scopeRows, ledgerStatus, ledgerType, ledgerMethod, dateFrom, dateTo, search]);

  const receiverTotals = useMemo(() => {
    const values = new Map<string, number>();
    for (const payment of snapshot.payments) {
      if (payment.method.toLowerCase() !== "cash" || !["submitted", "verified"].includes(payment.status)) continue;
      const name = payment.receiver_name || "Receiver not recorded";
      values.set(name, (values.get(name) || 0) + payment.amount_centavos);
    }
    return [...values.entries()].sort((a, b) => b[1] - a[1]);
  }, [snapshot.payments]);

  const filteredPayments = useMemo(() => snapshot.payments.filter((payment) =>
    (paymentStatus === "all" || payment.status === paymentStatus)
    && (paymentMethod === "all" || payment.method.toLowerCase() === paymentMethod)),
  [snapshot.payments, paymentStatus, paymentMethod]);

  async function submitEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    if (!form.category || !form.counterparty_name.trim() || !form.description.trim() || !form.method || form.amount_centavos <= 0
      || (form.transaction_type === "expense" && !form.received_by_name?.trim())) {
      toast("Complete all required financial-entry details.", "error");
      return;
    }
    try {
      setSaving(true);
      await createFinancialTransaction({ ...form, created_by: user.id });
      setForm(emptyForm());
      setShowEntryForm(false);
      await load();
      toast(`${form.transaction_type === "income" ? "Cash inflow" : "Expense"} recorded.`, "success");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Unable to save the financial entry.", "error");
    } finally { setSaving(false); }
  }

  async function removeEntry(id: string, description: string) {
    if (!window.confirm(`Void “${description}”? It will remain in reports and the audit record but will be excluded from totals.`)) return;
    try {
      await voidFinancialTransaction(id);
      await load();
      toast("Financial entry voided and retained for audit.", "success");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Unable to void the entry.", "error");
    }
  }

  function exportDetailedLedger() {
    const rows = [["Date", "Allocation", "Type", "Category", "Received From / Paid To", "Received By", "Payment Method", "Amount", "Particulars / Purpose", "Reference", "Recorded By", "Recorded At", "Source", "Status", "Voided By", "Voided At"]];
    for (const row of filteredLedger) rows.push([
      row.transactionDate, scopeLabel(row.scope), row.transactionType === "income" ? "Cash Inflow" : "Expense",
      row.category, row.counterparty, row.receivedBy, methodLabel(row.method), String(row.amountCentavos / 100),
      row.description, row.reference, row.recorder, row.recordedAt, row.source === "registration" ? "Runner registration" : "Manual ledger",
      row.voidedAt ? "Voided" : "Active", row.voidedBy, row.voidedAt,
    ]);
    downloadCsv(`sinoog-financial-ledger-${scopeFilter}-${today()}.csv`, rows);
  }

  function exportSummary() {
    const scopes: Array<{ value: ScopeFilter; label: string }> = [
      { value: "overall", label: "Overall" }, { value: "festival", label: "Sinoog Festival" },
      { value: "run", label: "Sinoog Run" }, { value: "general", label: "General" },
    ];
    const rows = [["Report Section", "Allocation", "Type", "Category", "Amount"]];
    for (const scope of scopes) {
      const values = allLedgerRows.filter((row) => !row.voidedAt && (scope.value === "overall" || row.scope === scope.value));
      const inflows = values.filter((row) => row.transactionType === "income").reduce((sum, row) => sum + row.amountCentavos, 0);
      const expenses = values.filter((row) => row.transactionType === "expense").reduce((sum, row) => sum + row.amountCentavos, 0);
      rows.push(["Scope total", scope.label, "Cash Inflows", "All", String(inflows / 100)]);
      rows.push(["Scope total", scope.label, "Expenses", "All", String(expenses / 100)]);
      rows.push(["Scope total", scope.label, "Balance", "All", String((inflows - expenses) / 100)]);
      const categoriesMap = new Map<string, number>();
      values.forEach((row) => categoriesMap.set(`${row.transactionType}|${row.category}`, (categoriesMap.get(`${row.transactionType}|${row.category}`) || 0) + row.amountCentavos));
      [...categoriesMap.entries()].sort(([a], [b]) => a.localeCompare(b)).forEach(([key, amount]) => {
        const [type, category] = key.split("|");
        rows.push(["Category total", scope.label, type === "income" ? "Cash Inflows" : "Expenses", category, String(amount / 100)]);
      });
    }
    downloadCsv(`sinoog-financial-summary-${today()}.csv`, rows);
  }

  function exportPayments() {
    const rows = [["Registration Reference", "Runner", "Category", "Method", "Amount", "Status", "Received By", "Verified By", "Payer Reference", "Submitted At", "Verified At"]];
    filteredPayments.forEach((payment) => rows.push([
      payment.registration_reference, payment.participant_name, payment.category_name, payment.method,
      String(payment.amount_centavos / 100), payment.status, payment.receiver_name || "", payment.verifier_name || "",
      payment.payer_reference || "", payment.submitted_at || "", payment.verified_at || "",
    ]));
    downloadCsv(`sinoog-registration-payment-audit-${today()}.csv`, rows);
  }

  const categories = form.transaction_type === "income" ? CASH_INFLOW_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <section className="admin-page finance-page">
      <div className="admin-heading finance-heading">
        <div>
          <p className="eyebrow">Administrator finance</p>
          <h1>Financial records</h1>
          <p>Track cash inflows, expenses, balances, payment methods, allocations, and the administrator responsible for every record.</p>
        </div>
        <div className="finance-heading__actions" style={{ display: "flex", gap: "var(--md-space-2)", alignItems: "center", flexWrap: "wrap" }}>
          <Button variant="outlined" leadingIcon={<Printer size={16} />} onClick={() => window.print()}>
            Print report
          </Button>
          <Button variant="filled" leadingIcon={<Plus size={17} />} onClick={() => setShowEntryForm((open) => !open)}>
            {showEntryForm ? "Close entry form" : "Add financial entry"}
          </Button>
        </div>
      </div>

      <nav
        className="finance-scope-tabs admin-segmented-control"
        aria-label="Financial report allocation"
        style={{ marginBottom: "var(--md-space-6)" }}
      >
        {(["overall", "festival", "run", "general"] as ScopeFilter[]).map((scope) => (
          <button
            key={scope}
            type="button"
            className={scopeFilter === scope ? "is-active" : ""}
            onClick={() => setScopeFilter(scope)}
          >
            {scope === "overall" ? "Overall" : scopeLabel(scope)}
          </button>
        ))}
      </nav>

      {showEntryForm && (
        <Card variant="outlined" style={{ padding: "var(--md-space-6)", marginBottom: "var(--md-space-6)" }}>
          <form onSubmit={(event) => void submitEntry(event)} style={{ display: "flex", flexDirection: "column", gap: "var(--md-space-4)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--md-space-3)" }}>
              <ReceiptText size={22} style={{ color: "var(--md-sys-color-primary)" }} />
              <div>
                <strong style={{ fontSize: "1.1rem", display: "block" }}>New financial entry</strong>
                <small style={{ color: "var(--md-sys-color-on-surface-variant)" }}>The signed-in administrator is recorded automatically.</small>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "var(--md-space-3)" }}>
              <SelectField
                label="Transaction type"
                value={form.transaction_type}
                onChange={(event) => {
                  const type = event.target.value as "income" | "expense";
                  setForm({ ...form, transaction_type: type, category: type === "income" ? CASH_INFLOW_CATEGORIES[0] : EXPENSE_CATEGORIES[0], received_by_name: "" });
                }}
              >
                <option value="income">Cash Inflow</option>
                <option value="expense">Expense</option>
              </SelectField>

              <TextField
                label="Date"
                type="date"
                required
                value={form.transaction_date}
                onChange={(event) => setForm({ ...form, transaction_date: event.target.value })}
              />

              <SelectField
                label="Allocation"
                value={form.event_scope}
                onChange={(event) => setForm({ ...form, event_scope: event.target.value as FinanceScope })}
              >
                <option value="general">General</option>
                <option value="festival">Sinoog Festival</option>
                <option value="run">Sinoog Run</option>
              </SelectField>

              <SelectField
                label={form.transaction_type === "income" ? "Cash Inflow Category" : "Expense Category"}
                value={form.category}
                onChange={(event) => setForm({ ...form, category: event.target.value })}
              >
                {categories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </SelectField>

              <TextField
                label={form.transaction_type === "income" ? "Received From" : "Paid To"}
                required
                value={form.counterparty_name}
                onChange={(event) => setForm({ ...form, counterparty_name: event.target.value })}
              />

              {form.transaction_type === "expense" && (
                <TextField
                  label="Received By (Staff / Vendor)"
                  required
                  value={form.received_by_name || ""}
                  onChange={(event) => setForm({ ...form, received_by_name: event.target.value })}
                />
              )}

              <SelectField
                label="Payment Method"
                value={form.method || "cash"}
                onChange={(event) => setForm({ ...form, method: event.target.value as FinanceMethod })}
              >
                <option value="cash">Cash</option>
                <option value="gcash">GCash</option>
                <option value="bank">Bank</option>
              </SelectField>

              <TextField
                label="Amount (PHP)"
                type="number"
                min="0.01"
                step="0.01"
                required
                value={form.amount_centavos ? String(form.amount_centavos / 100) : ""}
                onChange={(event) => setForm({ ...form, amount_centavos: Math.round(Number(event.target.value) * 100) })}
              />

              <TextField
                label="Reference / Document No."
                placeholder="Optional receipt, voucher, or transfer no."
                value={form.reference || ""}
                onChange={(event) => setForm({ ...form, reference: event.target.value })}
              />
            </div>

            <TextArea
              label="Particulars / Purpose"
              required
              rows={3}
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
            />

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--md-space-2)", marginTop: "var(--md-space-2)" }}>
              <Button variant="text" onClick={() => setShowEntryForm(false)}>
                Cancel
              </Button>
              <Button variant="filled" type="submit" loading={saving}>
                Record entry
              </Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <LoadingState message="Loading financial records…" />
      ) : (
        <>
          <div className="stat-grid finance-stat-grid" style={{ marginBottom: "var(--md-space-6)" }}>
            <Card variant="outlined" className="stat-card">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--md-space-2)" }}>
                <span className="stat-label">Cash inflows</span>
                <TrendingUp size={22} style={{ color: "var(--md-sys-color-tertiary)" }} />
              </div>
              <strong className="stat-value" style={{ color: "var(--md-sys-color-tertiary)" }}>{peso(totals.inflows)}</strong>
            </Card>

            <Card variant="outlined" className="stat-card">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--md-space-2)" }}>
                <span className="stat-label">Expenses</span>
                <TrendingDown size={22} style={{ color: "var(--md-sys-color-error)" }} />
              </div>
              <strong className="stat-value" style={{ color: "var(--md-sys-color-error)" }}>{peso(totals.expenses)}</strong>
            </Card>

            <Card variant="outlined" className="stat-card">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--md-space-2)" }}>
                <span className="stat-label">Pending payment review</span>
                <HandCoins size={22} style={{ color: "var(--md-sys-color-secondary)" }} />
              </div>
              <strong className="stat-value">{peso(totals.pending)}</strong>
            </Card>

            <Card variant="outlined" className="stat-card" style={{ borderColor: "var(--md-sys-color-primary)", background: "var(--md-sys-color-surface-container-high)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--md-space-2)" }}>
                <span className="stat-label" style={{ fontWeight: 600 }}>Recorded balance</span>
                <Banknote size={22} style={{ color: "var(--md-sys-color-primary)" }} />
              </div>
              <strong className="stat-value" style={{ color: "var(--md-sys-color-primary)" }}>{peso(totals.balance)}</strong>
            </Card>
          </div>

          <Card variant="outlined" className="finance-ledger-panel" style={{ padding: "var(--md-space-6)", marginBottom: "var(--md-space-6)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--md-space-3)", marginBottom: "var(--md-space-4)" }}>
              <div>
                <p className="eyebrow">Reporting ledger</p>
                <h2 style={{ margin: 0 }}>{scopeFilter === "overall" ? "Overall" : scopeLabel(scopeFilter)} cashbook</h2>
              </div>
              <div style={{ display: "flex", gap: "var(--md-space-2)", flexWrap: "wrap" }}>
                <Button variant="outlined" leadingIcon={<FileSpreadsheet size={16} />} onClick={exportSummary}>
                  Summary CSV
                </Button>
                <Button variant="outlined" leadingIcon={<Download size={16} />} onClick={exportDetailedLedger}>
                  Detailed CSV
                </Button>
              </div>
            </div>

            <div className="table-tools admin-toolbar finance-toolbar">
              <div className="admin-toolbar__search-wrap finance-toolbar__search">
                <SearchBar
                  label="Search financial records"
                  placeholder="Category, person, purpose, ref…"
                  value={search}
                  onValueChange={setSearch}
                />
              </div>
              <div className="finance-toolbar__filters">
                <div className="finance-filter-field">
                  <SelectField
                    label="Entry type"
                    value={ledgerType}
                    onChange={(e) => setLedgerType(e.target.value as LedgerTypeFilter)}
                  >
                    <option value="all">All types</option>
                    <option value="income">Cash inflows</option>
                    <option value="expense">Expenses</option>
                  </SelectField>
                </div>
                <div className="finance-filter-field">
                  <SelectField
                    label="Payment method"
                    value={ledgerMethod}
                    onChange={(e) => setLedgerMethod(e.target.value)}
                  >
                    <option value="all">All methods</option>
                    <option value="cash">Cash</option>
                    <option value="gcash">GCash</option>
                    <option value="bank">Bank</option>
                  </SelectField>
                </div>
                <div className="finance-filter-field">
                  <SelectField
                    label="Record status"
                    value={ledgerStatus}
                    onChange={(e) => setLedgerStatus(e.target.value as LedgerStatusFilter)}
                  >
                    <option value="active">Active records</option>
                    <option value="voided">Voided records</option>
                    <option value="all">All records</option>
                  </SelectField>
                </div>
                <div className="finance-filter-field finance-filter-field--date">
                  <TextField
                    label="From"
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </div>
                <div className="finance-filter-field finance-filter-field--date">
                  <TextField
                    label="To"
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {filteredLedger.length ? (
              <div className="finance-ledger-table">
                <div className="finance-ledger-head">
                  <span className="finance-ledger-head__col finance-ledger-head__col--primary">Transaction</span>
                  <span className="finance-ledger-head__col">Counterparty</span>
                  <span className="finance-ledger-head__col">Particulars</span>
                  <span className="finance-ledger-head__col">Recorded by</span>
                  <span className="finance-ledger-head__col finance-ledger-head__col--amount">Amount</span>
                  <span className="finance-ledger-head__col finance-ledger-head__col--status">Status</span>
                </div>
                <div className="finance-ledger-list">
                  {filteredLedger.map((row) => (
                    <article
                      className={`finance-ledger-row ${row.voidedAt ? "is-voided" : ""}`}
                      key={row.id}
                    >
                      <div className="finance-ledger-col finance-ledger-col--primary">
                        <span
                          className={`finance-flow-icon ${row.transactionType === "income" ? "is-income" : "is-expense"}`}
                          aria-hidden="true"
                        >
                          {row.transactionType === "income" ? "+" : "−"}
                        </span>
                        <div className="finance-ledger-col__primary-text">
                          <strong className="finance-ledger-category">{row.category}</strong>
                          <small className="finance-ledger-meta">
                            {row.transactionDate} · {scopeLabel(row.scope)} · {methodLabel(row.method)}
                          </small>
                        </div>
                      </div>

                      <div className="finance-ledger-col finance-ledger-col--counterparty">
                        <small className="finance-col-label">
                          {row.transactionType === "income" ? "Received from" : "Paid to"}
                        </small>
                        <strong className="finance-counterparty-name">{row.counterparty}</strong>
                        {row.receivedBy && (
                          <small className="finance-received-by">
                            Received by: {row.receivedBy}
                          </small>
                        )}
                      </div>

                      <div className="finance-ledger-col finance-ledger-col--particulars">
                        <small className="finance-col-label">Particulars / Purpose</small>
                        <strong className="finance-particulars-desc">{row.description}</strong>
                        {row.reference && (
                          <small className="finance-ref-badge">
                            Ref: {row.reference}
                          </small>
                        )}
                      </div>

                      <div className="finance-ledger-row__footer">
                        <div className="finance-ledger-col finance-ledger-col--recorder">
                          <small className="finance-col-label">Recorded by</small>
                          <strong className="finance-recorder-name">{row.recorder}</strong>
                          <small className="finance-recorded-date">
                            {new Date(row.recordedAt).toLocaleString("en-PH", { timeZone: "Asia/Manila" })}
                          </small>
                        </div>

                        <div className="finance-ledger-col finance-ledger-col--amount">
                          <small className="finance-col-label">Amount</small>
                          <strong
                            className={`finance-amount-val ${row.transactionType === "income" ? "is-income" : "is-expense"}`}
                          >
                            {row.transactionType === "income" ? "+" : "−"}{peso(row.amountCentavos)}
                          </strong>
                        </div>
                      </div>

                      <div className="finance-ledger-col finance-ledger-col--actions">
                        {row.voidedAt ? (
                          <StatusBadge tone="danger">Voided</StatusBadge>
                        ) : row.source === "manual" ? (
                          <button
                            type="button"
                            className="button button--ghost button--sm finance-void-btn"
                            aria-label={`Void ${row.description}`}
                            title="Void entry"
                            onClick={() => void removeEntry(row.id, row.description)}
                          >
                            <Trash2 size={16} />
                          </button>
                        ) : (
                          <StatusBadge tone="success">Verified</StatusBadge>
                        )}
                      </div>

                      {row.voidedAt && (
                        <p className="finance-ledger-row__void-note">
                          Voided by {row.voidedBy || "administrator"} on {new Date(row.voidedAt).toLocaleString("en-PH", { timeZone: "Asia/Manila" })}
                        </p>
                      )}
                    </article>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState title="No matching financial records" message="Change the report filters or add a financial entry." />
            )}
          </Card>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "var(--md-space-6)" }}>
            <Card variant="outlined" style={{ padding: "var(--md-space-6)" }}>
              <div style={{ marginBottom: "var(--md-space-4)" }}>
                <p className="eyebrow">Cash accountability</p>
                <h2 style={{ margin: 0 }}>Registration cash collected by</h2>
              </div>
              {receiverTotals.length ? (
                receiverTotals.map(([name, total]) => (
                  <div
                    className="finance-receiver-row"
                    key={name}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "var(--md-space-3) 0",
                      borderBottom: "1px solid var(--md-sys-color-outline-variant)",
                    }}
                  >
                    <span>{name}</span>
                    <strong style={{ color: "var(--md-sys-color-primary)" }}>{peso(total)}</strong>
                  </div>
                ))
              ) : (
                <EmptyState title="No cash collections" message="Cash registration payments will appear here once submitted." />
              )}
            </Card>

            <Card variant="outlined" className="finance-audit-card" style={{ padding: "var(--md-space-6)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--md-space-2)", marginBottom: "var(--md-space-4)" }}>
                <div>
                  <p className="eyebrow">Registration payment audit</p>
                  <h2 style={{ margin: 0 }}>Payment records</h2>
                </div>
                <Button variant="outlined" size="small" leadingIcon={<Download size={15} />} onClick={exportPayments}>
                  Payment CSV
                </Button>
              </div>

              <div className="finance-audit-filters" style={{ display: "flex", gap: "var(--md-space-2)", marginBottom: "var(--md-space-4)" }}>
                <div style={{ flex: 1 }}>
                  <SelectField
                    label="Method"
                    value={paymentMethod}
                    onChange={(event) => setPaymentMethod(event.target.value)}
                  >
                    <option value="all">All methods</option>
                    <option value="gcash">GCash</option>
                    <option value="cash">Cash</option>
                  </SelectField>
                </div>
                <div style={{ flex: 1 }}>
                  <SelectField
                    label="Status"
                    value={paymentStatus}
                    onChange={(event) => setPaymentStatus(event.target.value)}
                  >
                    <option value="all">All statuses</option>
                    <option value="unpaid">Unpaid</option>
                    <option value="submitted">Submitted</option>
                    <option value="verified">Verified</option>
                    <option value="rejected">Rejected</option>
                    <option value="refunded">Refunded</option>
                  </SelectField>
                </div>
              </div>

              <div className="finance-payment-audit-list">
                {filteredPayments.length ? (
                  filteredPayments.map((payment) => (
                    <article
                      key={payment.id}
                      className="finance-payment-audit-item"
                    >
                      <div className="finance-payment-audit-item__info">
                        <strong className="finance-payment-audit-name">{payment.participant_name}</strong>
                        <small className="finance-payment-audit-meta">
                          {payment.registration_reference} · {payment.category_name}
                        </small>
                      </div>
                      <div className="finance-payment-audit-item__status-wrap">
                        <div className="finance-payment-audit-item__amount-line">
                          <span className="finance-payment-audit-method">{payment.method}</span>
                          <span className="finance-payment-audit-sep">·</span>
                          <strong className="finance-payment-audit-amount">{peso(payment.amount_centavos)}</strong>
                        </div>
                        <StatusBadge tone={payment.status === "verified" ? "success" : payment.status === "rejected" || payment.status === "refunded" ? "danger" : "warning"}>
                          {payment.status}
                        </StatusBadge>
                      </div>
                    </article>
                  ))
                ) : (
                  <EmptyState title="No matching payments" message="Change the payment filters." />
                )}
              </div>
            </Card>
          </div>
        </>
      )}
    </section>
  );
}
