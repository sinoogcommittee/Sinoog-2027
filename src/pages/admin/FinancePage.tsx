import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Banknote,
  Download,
  FileSpreadsheet,
  HandCoins,
  Plus,
  Printer,
  ReceiptText,
  Search,
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
      const categories = new Map<string, number>();
      values.forEach((row) => categories.set(`${row.transactionType}|${row.category}`, (categories.get(`${row.transactionType}|${row.category}`) || 0) + row.amountCentavos));
      [...categories.entries()].sort(([a], [b]) => a.localeCompare(b)).forEach(([key, amount]) => {
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

  return <section className="admin-page finance-page">
    <div className="admin-heading finance-heading">
      <div>
        <p className="eyebrow">Administrator finance</p>
        <h1>Financial records</h1>
        <p>Track cash inflows, expenses, balances, payment methods, allocations, and the administrator responsible for every record.</p>
      </div>
      <div className="finance-heading__actions">
        <button className="button button--secondary" type="button" onClick={() => window.print()}><Printer size={16}/> Print report</button>
        <button className="button button--primary" type="button" onClick={() => setShowEntryForm((open) => !open)}>
          <Plus size={17}/> {showEntryForm ? "Close entry form" : "Add financial entry"}
        </button>
      </div>
    </div>

    <nav className="finance-scope-tabs" aria-label="Financial report allocation">
      {(["overall", "festival", "run", "general"] as ScopeFilter[]).map((scope) => <button
        key={scope} type="button" className={scopeFilter === scope ? "is-active" : ""} onClick={() => setScopeFilter(scope)}
      >{scope === "overall" ? "Overall" : scopeLabel(scope)}</button>)}
    </nav>

    {showEntryForm && <form className="finance-entry-form" onSubmit={(event) => void submitEntry(event)}>
      <div className="finance-entry-form__heading"><ReceiptText size={20}/><div><strong>New financial entry</strong><small>The signed-in administrator is recorded automatically.</small></div></div>
      <div className="finance-entry-form__grid">
        <label>Type<select value={form.transaction_type} onChange={(event) => {
          const type = event.target.value as "income" | "expense";
          setForm({ ...form, transaction_type: type, category: type === "income" ? CASH_INFLOW_CATEGORIES[0] : EXPENSE_CATEGORIES[0], received_by_name: "" });
        }}><option value="income">Cash Inflow</option><option value="expense">Expense</option></select></label>
        <label>Date<input required type="date" value={form.transaction_date} onChange={(event) => setForm({ ...form, transaction_date: event.target.value })}/></label>
        <label>For<select value={form.event_scope} onChange={(event) => setForm({ ...form, event_scope: event.target.value as FinanceScope })}>
          <option value="general">General</option><option value="festival">Sinoog Festival</option><option value="run">Sinoog Run</option>
        </select></label>
        <label>{form.transaction_type === "income" ? "Cash Inflow Category" : "Expense Category"}<select required value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
          {categories.map((category) => <option key={category}>{category}</option>)}
        </select></label>
        <label>{form.transaction_type === "income" ? "Received From" : "Paid To"}<input required value={form.counterparty_name} onChange={(event) => setForm({ ...form, counterparty_name: event.target.value })}/></label>
        {form.transaction_type === "expense" && <label>Received By<input required value={form.received_by_name || ""} onChange={(event) => setForm({ ...form, received_by_name: event.target.value })}/></label>}
        <label>Payment Method<select required value={form.method || "cash"} onChange={(event) => setForm({ ...form, method: event.target.value as FinanceMethod })}>
          <option value="cash">Cash</option><option value="gcash">GCash</option><option value="bank">Bank</option>
        </select></label>
        <label>Amount<input required min="0.01" step="0.01" type="number" value={form.amount_centavos ? form.amount_centavos / 100 : ""} onChange={(event) => setForm({ ...form, amount_centavos: Math.round(Number(event.target.value) * 100) })}/></label>
        <label>Reference / Document No.<input value={form.reference || ""} placeholder="Optional receipt, voucher, or transfer no." onChange={(event) => setForm({ ...form, reference: event.target.value })}/></label>
        <label className="finance-entry-form__wide">Particulars / Purpose<textarea required rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })}/></label>
      </div>
      <div className="finance-entry-form__actions"><button type="button" className="button button--ghost" onClick={() => setShowEntryForm(false)}>Cancel</button><button type="submit" className="button button--primary" disabled={saving}>{saving ? "Saving…" : "Record entry"}</button></div>
    </form>}

    {loading ? <LoadingState message="Loading financial records…"/> : <>
      <div className="finance-summary-grid">
        <article><TrendingUp/><span>Cash inflows</span><strong>{peso(totals.inflows)}</strong></article>
        <article><TrendingDown/><span>Expenses</span><strong>{peso(totals.expenses)}</strong></article>
        <article><HandCoins/><span>Registration payments awaiting review</span><strong>{peso(totals.pending)}</strong></article>
        <article className="finance-summary-grid__net"><Banknote/><span>Recorded balance</span><strong>{peso(totals.balance)}</strong></article>
      </div>

      <section className="finance-panel finance-ledger-panel">
        <div className="finance-panel__heading finance-report-heading"><div><p className="eyebrow">Reporting ledger</p><h2>{scopeFilter === "overall" ? "Overall" : scopeLabel(scopeFilter)} cashbook</h2></div>
          <div className="finance-report-actions"><button className="button button--secondary" type="button" onClick={exportSummary}><FileSpreadsheet size={16}/> Summary CSV</button><button className="button button--secondary" type="button" onClick={exportDetailedLedger}><Download size={16}/> Detailed CSV</button></div>
        </div>
        <div className="finance-ledger-filters">
          <label className="finance-search"><Search size={17}/><input type="search" aria-label="Search financial records" placeholder="Search category, person, purpose, reference, or recorder…" value={search} onChange={(event) => setSearch(event.target.value)}/></label>
          <select aria-label="Entry type" value={ledgerType} onChange={(event) => setLedgerType(event.target.value as LedgerTypeFilter)}><option value="all">All types</option><option value="income">Cash inflows</option><option value="expense">Expenses</option></select>
          <select aria-label="Payment method" value={ledgerMethod} onChange={(event) => setLedgerMethod(event.target.value)}><option value="all">All methods</option><option value="cash">Cash</option><option value="gcash">GCash</option><option value="bank">Bank</option></select>
          <select aria-label="Record status" value={ledgerStatus} onChange={(event) => setLedgerStatus(event.target.value as LedgerStatusFilter)}><option value="active">Active records</option><option value="voided">Voided records</option><option value="all">All records</option></select>
          <label>From<input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)}/></label>
          <label>To<input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)}/></label>
        </div>
        {filteredLedger.length ? <div className="finance-ledger-list">{filteredLedger.map((row) => <article className={`finance-ledger-row ${row.voidedAt ? "is-voided" : ""}`} key={row.id}>
          <div className="finance-ledger-row__primary"><span className={`finance-flow-icon ${row.transactionType === "income" ? "is-income" : "is-expense"}`}>{row.transactionType === "income" ? "+" : "−"}</span><div><strong>{row.category}</strong><small>{row.transactionDate} · {scopeLabel(row.scope)} · {methodLabel(row.method)}</small></div></div>
          <div><small>{row.transactionType === "income" ? "Received from" : "Paid to"}</small><strong>{row.counterparty}</strong>{row.receivedBy && <small>Received by: {row.receivedBy}</small>}</div>
          <div><small>Particulars / Purpose</small><strong>{row.description}</strong>{row.reference && <small>Ref: {row.reference}</small>}</div>
          <div className="finance-ledger-row__amount"><small>Amount</small><strong className={row.transactionType === "income" ? "is-income" : "is-expense"}>{row.transactionType === "income" ? "+" : "−"}{peso(row.amountCentavos)}</strong></div>
          <div><small>Recorded by</small><strong>{row.recorder}</strong><small>{new Date(row.recordedAt).toLocaleString("en-PH", { timeZone: "Asia/Manila" })}</small></div>
          <div className="finance-ledger-row__actions">{row.voidedAt ? <StatusBadge tone="danger">Voided</StatusBadge> : row.source === "manual" ? <button type="button" className="icon-button" aria-label={`Void ${row.description}`} title="Void entry" onClick={() => void removeEntry(row.id, row.description)}><Trash2 size={16}/></button> : <StatusBadge tone="success">Verified</StatusBadge>}</div>
          {row.voidedAt && <p className="finance-ledger-row__void-note">Voided by {row.voidedBy || "administrator"} on {new Date(row.voidedAt).toLocaleString("en-PH", { timeZone: "Asia/Manila" })}</p>}
        </article>)}</div> : <EmptyState title="No matching financial records" message="Change the report filters or add a financial entry."/>}
      </section>

      <div className="finance-layout">
        <section className="finance-panel"><div className="finance-panel__heading"><div><p className="eyebrow">Cash accountability</p><h2>Registration cash collected by</h2></div></div>
          {receiverTotals.length ? receiverTotals.map(([name, total]) => <div className="finance-receiver-row" key={name}><span>{name}</span><strong>{peso(total)}</strong></div>) : <EmptyState title="No cash collections" message="Cash registration payments will appear here once submitted."/>}
        </section>
        <section className="finance-panel"><div className="finance-panel__heading finance-payments-heading"><div><p className="eyebrow">Registration payment audit</p><h2>Payment records</h2></div><button className="button button--secondary" type="button" onClick={exportPayments}><Download size={16}/> Payment CSV</button></div>
          <div className="finance-payment-filters"><select aria-label="Payment method" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}><option value="all">All methods</option><option value="gcash">GCash</option><option value="cash">Cash</option></select><select aria-label="Payment status" value={paymentStatus} onChange={(event) => setPaymentStatus(event.target.value)}><option value="all">All statuses</option><option value="unpaid">Unpaid</option><option value="submitted">Submitted</option><option value="verified">Verified</option><option value="rejected">Rejected</option><option value="refunded">Refunded</option></select></div>
          <div className="finance-payment-audit-list">{filteredPayments.length ? filteredPayments.map((payment) => <article key={payment.id}><div><strong>{payment.participant_name}</strong><small>{payment.registration_reference} · {payment.category_name}</small></div><div><small>{payment.method} · {peso(payment.amount_centavos)}</small><StatusBadge tone={payment.status === "verified" ? "success" : payment.status === "rejected" || payment.status === "refunded" ? "danger" : "warning"}>{payment.status}</StatusBadge></div></article>) : <EmptyState title="No matching payments" message="Change the payment filters."/>}</div>
        </section>
      </div>
    </>}
  </section>;
}
