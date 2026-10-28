import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import {
  Banknote,
  Download,
  HandCoins,
  Plus,
  ReceiptText,
  Trash2,
  TrendingDown,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import { StatusBadge } from "../../components/StatusBadge";
import { useAuth } from "../../features/auth/useAuth";
import { EmptyState, LoadingState } from "../../features/ui/FeedbackStates";
import { useToast } from "../../features/ui/useToast";
import {
  createFinancialTransaction,
  voidFinancialTransaction,
  getFinanceSnapshot,
  type FinanceSnapshot,
  type FinancialTransactionInput,
} from "../../features/finance/financeQueries";

const peso = (centavos: number) =>
  (centavos / 100).toLocaleString("en-PH", {
    style: "currency",
    currency: "PHP",
  });
const today = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });

const emptyForm = (): Omit<FinancialTransactionInput, "created_by"> => ({
  transaction_type: "expense",
  category: "",
  description: "",
  amount_centavos: 0,
  method: "",
  reference: "",
  transaction_date: today(),
});

export function FinancePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [snapshot, setSnapshot] = useState<FinanceSnapshot>({
    payments: [],
    transactions: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState("all");
  const [paymentMethod, setPaymentMethod] = useState("all");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    try {
      setSnapshot(await getFinanceSnapshot());
    } catch (error) {
      toast(
        error instanceof Error
          ? error.message
          : "Unable to load financial records.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const data = await getFinanceSnapshot();
        if (mounted) setSnapshot(data);
      } catch (error) {
        if (mounted)
          toast(
            error instanceof Error
              ? error.message
              : "Unable to load financial records.",
            "error",
          );
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [toast]);

  const totals = useMemo(() => {
    const collected = snapshot.payments
      .filter((payment) => payment.status === "verified")
      .reduce((sum, payment) => sum + payment.amount_centavos, 0);
    const pending = snapshot.payments
      .filter((payment) => payment.status === "submitted")
      .reduce((sum, payment) => sum + payment.amount_centavos, 0);
    const otherIncome = snapshot.transactions
      .filter((item) => item.transaction_type === "income")
      .reduce((sum, item) => sum + item.amount_centavos, 0);
    const expenses = snapshot.transactions
      .filter((item) => item.transaction_type === "expense")
      .reduce((sum, item) => sum + item.amount_centavos, 0);
    return {
      collected,
      pending,
      otherIncome,
      expenses,
      net: collected + otherIncome - expenses,
    };
  }, [snapshot]);

  const receiverTotals = useMemo(() => {
    const values = new Map<string, number>();
    for (const payment of snapshot.payments) {
      if (
        payment.method.toLowerCase() !== "cash" ||
        !["submitted", "verified"].includes(payment.status)
      )
        continue;
      const name = payment.receiver_name || "Receiver not recorded";
      values.set(name, (values.get(name) || 0) + payment.amount_centavos);
    }
    return [...values.entries()].sort((a, b) => b[1] - a[1]);
  }, [snapshot.payments]);

  const filteredPayments = useMemo(
    () =>
      snapshot.payments.filter((payment) => {
        const matchesStatus =
          paymentStatus === "all" || payment.status === paymentStatus;
        const matchesMethod =
          paymentMethod === "all" ||
          payment.method.toLowerCase() === paymentMethod;
        const needle = search.trim().toLowerCase();
        const matchesSearch =
          !needle ||
          [
            payment.participant_name,
            payment.registration_reference,
            payment.payer_reference || "",
            payment.receiver_name || "",
          ].some((value) => value.toLowerCase().includes(needle));
        return matchesStatus && matchesMethod && matchesSearch;
      }),
    [snapshot.payments, paymentStatus, paymentMethod, search],
  );

  async function submitEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    if (
      !form.category.trim() ||
      !form.description.trim() ||
      form.amount_centavos <= 0
    ) {
      toast("Complete the category, description, and amount.", "error");
      return;
    }
    try {
      setSaving(true);
      await createFinancialTransaction({ ...form, created_by: user.id });
      setForm(emptyForm());
      setShowEntryForm(false);
      await load();
      toast("Financial entry recorded.", "success");
    } catch (error) {
      toast(
        error instanceof Error
          ? error.message
          : "Unable to save the financial entry.",
        "error",
      );
    } finally {
      setSaving(false);
    }
  }

  async function removeEntry(id: string, description: string) {
    if (
      !window.confirm(
        `Void the financial entry “${description}”? It will be excluded from totals but retained in the audit record.`,
      )
    )
      return;
    try {
      await voidFinancialTransaction(id);
      await load();
      toast("Financial entry voided and retained for audit.", "success");
    } catch (error) {
      toast(
        error instanceof Error ? error.message : "Unable to delete the entry.",
        "error",
      );
    }
  }

  function exportPayments() {
    const rows = [
      [
        "Reference",
        "Runner",
        "Category",
        "Method",
        "Amount",
        "Status",
        "Received by",
        "Submitted at",
      ],
    ];
    for (const payment of filteredPayments)
      rows.push([
        payment.registration_reference,
        payment.participant_name,
        payment.category_name,
        payment.method,
        String(payment.amount_centavos / 100),
        payment.status,
        payment.receiver_name || "",
        payment.submitted_at || "",
      ]);
    const csv = rows
      .map((row) =>
        row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(","),
      )
      .join("\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `sinoog-finance-payments-${today()}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="admin-page finance-page">
      <div className="admin-heading finance-heading">
        <div>
          <p className="eyebrow">Administrator finance</p>
          <h1>Financial records</h1>
          <p>
            Track verified registration collections, cash accountability, other
            income, and expenses.
          </p>
        </div>
        <button
          className="button button--primary"
          type="button"
          onClick={() => setShowEntryForm((open) => !open)}
        >
          <Plus size={17} />{" "}
          {showEntryForm ? "Close entry form" : "Add income or expense"}
        </button>
      </div>

      {showEntryForm && (
        <form
          className="finance-entry-form"
          onSubmit={(event) => void submitEntry(event)}
        >
          <div className="finance-entry-form__heading">
            <ReceiptText size={20} />
            <div>
              <strong>New financial entry</strong>
              <small>For non-registration income and committee expenses.</small>
            </div>
          </div>
          <div className="finance-entry-form__grid">
            <label>
              Type
              <select
                value={form.transaction_type}
                onChange={(event) =>
                  setForm({
                    ...form,
                    transaction_type: event.target.value as
                      | "income"
                      | "expense",
                  })
                }
              >
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </label>
            <label>
              Date
              <input
                required
                type="date"
                value={form.transaction_date}
                onChange={(event) =>
                  setForm({ ...form, transaction_date: event.target.value })
                }
              />
            </label>
            <label>
              Category
              <input
                required
                placeholder="e.g. Sponsorship, supplies"
                value={form.category}
                onChange={(event) =>
                  setForm({ ...form, category: event.target.value })
                }
              />
            </label>
            <label>
              Amount
              <input
                required
                min="0.01"
                step="0.01"
                type="number"
                value={form.amount_centavos ? form.amount_centavos / 100 : ""}
                onChange={(event) =>
                  setForm({
                    ...form,
                    amount_centavos: Math.round(
                      Number(event.target.value) * 100,
                    ),
                  })
                }
              />
            </label>
            <label>
              Method
              <input
                placeholder="Cash, GCash, bank…"
                value={form.method || ""}
                onChange={(event) =>
                  setForm({ ...form, method: event.target.value })
                }
              />
            </label>
            <label>
              Reference
              <input
                placeholder="Receipt or voucher number"
                value={form.reference || ""}
                onChange={(event) =>
                  setForm({ ...form, reference: event.target.value })
                }
              />
            </label>
            <label className="finance-entry-form__wide">
              Description
              <textarea
                required
                rows={2}
                value={form.description}
                onChange={(event) =>
                  setForm({ ...form, description: event.target.value })
                }
              />
            </label>
          </div>
          <div className="finance-entry-form__actions">
            <button
              type="button"
              className="button button--ghost"
              onClick={() => setShowEntryForm(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="button button--primary"
              disabled={saving}
            >
              {saving ? "Saving…" : "Record entry"}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <LoadingState message="Loading financial records…" />
      ) : (
        <>
          <div className="finance-summary-grid">
            <article>
              <WalletCards />
              <span>Verified registration collections</span>
              <strong>{peso(totals.collected)}</strong>
            </article>
            <article>
              <HandCoins />
              <span>Payments awaiting review</span>
              <strong>{peso(totals.pending)}</strong>
            </article>
            <article>
              <TrendingUp />
              <span>Other recorded income</span>
              <strong>{peso(totals.otherIncome)}</strong>
            </article>
            <article>
              <TrendingDown />
              <span>Recorded expenses</span>
              <strong>{peso(totals.expenses)}</strong>
            </article>
            <article className="finance-summary-grid__net">
              <Banknote />
              <span>Current recorded balance</span>
              <strong>{peso(totals.net)}</strong>
            </article>
          </div>

          <div className="finance-layout">
            <section className="finance-panel">
              <div className="finance-panel__heading">
                <div>
                  <p className="eyebrow">Cash accountability</p>
                  <h2>Collected by administrator</h2>
                </div>
              </div>
              {receiverTotals.length ? (
                receiverTotals.map(([name, total]) => (
                  <div className="finance-receiver-row" key={name}>
                    <span>{name}</span>
                    <strong>{peso(total)}</strong>
                  </div>
                ))
              ) : (
                <EmptyState
                  title="No cash collections"
                  message="Cash payments will appear here once submitted."
                />
              )}
            </section>
            <section className="finance-panel">
              <div className="finance-panel__heading">
                <div>
                  <p className="eyebrow">Manual ledger</p>
                  <h2>Other income and expenses</h2>
                </div>
              </div>
              {snapshot.transactions.length ? (
                snapshot.transactions.map((entry) => (
                  <article className="finance-manual-row" key={entry.id}>
                    <div>
                      <strong>{entry.description}</strong>
                      <small>
                        {entry.transaction_date} · {entry.category}
                        {entry.method ? ` · ${entry.method}` : ""}
                      </small>
                    </div>
                    <span
                      className={
                        entry.transaction_type === "income"
                          ? "is-income"
                          : "is-expense"
                      }
                    >
                      {entry.transaction_type === "income" ? "+" : "−"}
                      {peso(entry.amount_centavos)}
                    </span>
                    <button
                      type="button"
                      className="icon-button"
                      aria-label={`Void ${entry.description}`}
                      title="Void entry"
                      onClick={() =>
                        void removeEntry(entry.id, entry.description)
                      }
                    >
                      <Trash2 size={16} />
                    </button>
                  </article>
                ))
              ) : (
                <EmptyState
                  title="No manual entries"
                  message="Add sponsorship income, purchases, reimbursements, or other committee transactions."
                />
              )}
            </section>
          </div>

          <section className="finance-panel finance-payments-panel">
            <div className="finance-panel__heading finance-payments-heading">
              <div>
                <p className="eyebrow">Registration payments</p>
                <h2>Payment ledger</h2>
              </div>
              <button
                className="button button--secondary"
                type="button"
                onClick={exportPayments}
              >
                <Download size={16} /> Export filtered CSV
              </button>
            </div>
            <div className="finance-filters">
              <input
                type="search"
                aria-label="Search payments"
                placeholder="Search runner, reference, or receiver…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                autoComplete="off"
                enterKeyHint="search"
              />
              <select
                aria-label="Payment method"
                value={paymentMethod}
                onChange={(event) => setPaymentMethod(event.target.value)}
              >
                <option value="all">All methods</option>
                <option value="gcash">GCash</option>
                <option value="cash">Cash</option>
              </select>
              <select
                aria-label="Payment status"
                value={paymentStatus}
                onChange={(event) => setPaymentStatus(event.target.value)}
              >
                <option value="all">All statuses</option>
                <option value="unpaid">Unpaid</option>
                <option value="submitted">Submitted</option>
                <option value="verified">Verified</option>
                <option value="rejected">Rejected</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
            <div className="finance-payment-list">
              {filteredPayments.length ? (
                filteredPayments.map((payment) => (
                  <article className="finance-payment-row" key={payment.id}>
                    <div className="finance-payment-row__runner">
                      <strong>{payment.participant_name}</strong>
                      <small>
                        {payment.registration_reference} ·{" "}
                        {payment.category_name}
                      </small>
                    </div>
                    <div>
                      <small>Method</small>
                      <strong>{payment.method}</strong>
                    </div>
                    <div>
                      <small>Amount</small>
                      <strong>{peso(payment.amount_centavos)}</strong>
                    </div>
                    <div>
                      <small>
                        {payment.method.toLowerCase() === "cash"
                          ? "Received by"
                          : "Reference"}
                      </small>
                      <strong>
                        {payment.method.toLowerCase() === "cash"
                          ? payment.receiver_name || "Not recorded"
                          : payment.payer_reference || "Not supplied"}
                      </strong>
                    </div>
                    <StatusBadge
                      tone={
                        payment.status === "verified"
                          ? "success"
                          : payment.status === "rejected" ||
                              payment.status === "refunded"
                            ? "danger"
                            : "warning"
                      }
                    >
                      {payment.status}
                    </StatusBadge>
                  </article>
                ))
              ) : (
                <EmptyState
                  title="No matching payments"
                  message="Change the filters or wait for registrations to submit payment."
                />
              )}
            </div>
          </section>
        </>
      )}
    </section>
  );
}
