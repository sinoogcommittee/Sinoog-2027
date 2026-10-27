import { useEffect, useState, useCallback } from "react";
import {
  Search,
  Download,
  Check,
  XCircle,
  FileText,
  X,
  AlertCircle,
  Printer,
  ExternalLink,
  CreditCard,
  UserPlus,
  Copy,
  Trash2,
} from "lucide-react";
import {
  getAllRegistrationsForAdmin,
  updateRegistrationReview,
  getRunEventAndCategories,
  type RunCategory,
  getAdminPaymentDetails,
  getRunnerQrValue,
  type AdminPaymentDetails,
  adminCreateCashRunner,
  deleteRejectedRegistration,
  type AdminCashRegistrationInput,
  EMERGENCY_RELATIONSHIPS,
} from "../../features/run/runQueries";
import { getCurrentEdition } from "../../features/editions/editionQueries";
import { StatusBadge } from "../../components/StatusBadge";
import { LoadingState, EmptyState } from "../../features/ui/FeedbackStates";
import { useToast } from "../../features/ui/useToast";
import type { DbRunRegistration } from "../../types";
import { QRCodeSVG } from "qrcode.react";

export function RegistrationsManagerPage() {
  const { toast } = useToast();
  const [registrations, setRegistrations] = useState<DbRunRegistration[]>([]);
  const [categories, setCategories] = useState<RunCategory[]>([]);
  const [runEventId, setRunEventId] = useState("");
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Review Modal State
  const [selectedReg, setSelectedReg] = useState<DbRunRegistration | null>(
    null,
  );
  const [reviewNotes, setReviewNotes] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const [paymentDetails, setPaymentDetails] =
    useState<AdminPaymentDetails | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [showWalkIn, setShowWalkIn] = useState(false);
  const [walkInSaving, setWalkInSaving] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{
    email: string;
    password: string;
    bib: string | null;
  } | null>(null);
  const [walkIn, setWalkIn] = useState<AdminCashRegistrationInput>({
    email: "",
    temporary_password: "",
    run_event_id: "",
    category_id: "",
    participant_name: "",
    division: "male",
    birth_date: "",
    mobile: "",
    locality: "",
    shirt_size: "",
    club_name: "",
    emergency_name: "",
    emergency_relationship: "",
    emergency_mobile: "",
    accessibility_notes: "",
    offline_consent_confirmed: false,
  });

  const fetchRegistrations = useCallback(async () => {
    try {
      const ed = await getCurrentEdition();
      const [{ event, categories: cats }, list] = await Promise.all([
        getRunEventAndCategories(ed.id),
        getAllRegistrationsForAdmin(),
      ]);
      setCategories(cats);
      setRunEventId(event.id);
      setRegistrations(list);
    } catch (err: unknown) {
      console.error("Failed to load registrations:", err);
      toast("Failed to load registrations from database.", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const ed = await getCurrentEdition();
        const [{ event, categories: cats }, list] = await Promise.all([
          getRunEventAndCategories(ed.id),
          getAllRegistrationsForAdmin(),
        ]);
        if (!mounted) return;
        setCategories(cats);
        setRunEventId(event.id);
        setRegistrations(list);
      } catch (err: unknown) {
        if (!mounted) return;
        console.error("Failed to load registrations:", err);
        toast("Failed to load registrations from database.", "error");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [toast]);

  const openWalkInRegistration = () => {
    const random = crypto
      .getRandomValues(new Uint32Array(1))[0]
      .toString(36)
      .slice(0, 6);
    setCreatedCredentials(null);
    setWalkIn((current) => ({
      ...current,
      run_event_id: runEventId,
      category_id: current.category_id || categories[0]?.id || "",
      temporary_password: `Sinoog!${random}7`,
    }));
    setShowWalkIn(true);
  };

  const handleWalkInSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    try {
      setWalkInSaving(true);
      const registration = await adminCreateCashRunner({
        ...walkIn,
        run_event_id: runEventId,
      });
      setCreatedCredentials({
        email: walkIn.email,
        password: walkIn.temporary_password,
        bib: registration.bib_number,
      });
      toast(
        `Cash registration approved. Bib #${registration.bib_number}.`,
        "success",
      );
      await fetchRegistrations();
    } catch (error: unknown) {
      toast(
        error instanceof Error
          ? error.message
          : "Unable to register the walk-in runner.",
        "error",
      );
    } finally {
      setWalkInSaving(false);
    }
  };

  const closeWalkIn = () => {
    setShowWalkIn(false);
    setCreatedCredentials(null);
    setWalkIn({
      email: "",
      temporary_password: "",
      run_event_id: runEventId,
      category_id: categories[0]?.id || "",
      participant_name: "",
      division: "male",
      birth_date: "",
      mobile: "",
      locality: "",
      shirt_size: "",
      club_name: "",
      emergency_name: "",
      emergency_relationship: "",
      emergency_mobile: "",
      accessibility_notes: "",
      offline_consent_confirmed: false,
    });
  };

  const handleUpdateStatus = async (
    status: "approved" | "needs_changes" | "rejected",
  ) => {
    if (!selectedReg) return;
    try {
      setReviewing(true);
      await updateRegistrationReview(selectedReg.id, status, reviewNotes);
      toast(`Registration marked as ${status}.`, "success");
      setSelectedReg(null);
      setPaymentDetails(null);
      setReviewNotes("");
      await fetchRegistrations();
    } catch (err: unknown) {
      console.error("Error updating registration:", err);
      toast("Failed to update registration status.", "error");
    } finally {
      setReviewing(false);
    }
  };

  const openReview = async (registration: DbRunRegistration) => {
    setSelectedReg(registration);
    setReviewNotes(registration.review_notes || "");
    setPaymentDetails(null);
    setPaymentLoading(true);
    try {
      setPaymentDetails(await getAdminPaymentDetails(registration.id));
    } catch (err: unknown) {
      toast(
        err instanceof Error ? err.message : "Unable to load payment proof.",
        "error",
      );
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleDeleteRegistration = async (registration: DbRunRegistration) => {
    if (registration.status === "approved") {
      window.alert(
        "Approved runners cannot be deleted. Their bib, QR code, and race records must remain protected.",
      );
      return;
    }
    if (registration.status !== "rejected") {
      window.alert(
        "Only rejected registrations can be deleted. Reject the entry first if it should be removed.",
      );
      return;
    }
    if (
      !window.confirm(
        `Delete the rejected registration for ${registration.participant_name}? This removes its payment proof and cannot be undone.`,
      )
    )
      return;

    try {
      await deleteRejectedRegistration(registration.id);
      toast(
        "Rejected registration deleted. The runner can register again.",
        "success",
      );
      await fetchRegistrations();
    } catch (error: unknown) {
      toast(
        error instanceof Error
          ? error.message
          : "Unable to delete registration.",
        "error",
      );
    }
  };

  const filteredRegistrations = registrations.filter((r) => {
    const matchSearch =
      !searchQuery ||
      r.participant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.mobile.includes(searchQuery);
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    const matchCategory =
      categoryFilter === "all" || r.category_id === categoryFilter;
    return matchSearch && matchStatus && matchCategory;
  });

  const handleExportCSV = () => {
    if (registrations.length === 0) {
      toast("No registration records to export.", "info");
      return;
    }

    const headers = [
      "Runner Number",
      "Reference",
      "Participant",
      "Category",
      "Division",
      "Shirt Size",
      "Mobile",
      "Address",
      "Emergency Name",
      "Emergency Mobile",
      "Registration Source",
      "Registered By User ID",
      "Status",
      "Submitted At",
    ];
    const rows = filteredRegistrations.map((r) => {
      const cat = categories.find((c) => c.id === r.category_id)?.name || "Run";
      return [
        r.bib_number || "",
        r.reference,
        `"${r.participant_name.replace(/"/g, '""')}"`,
        `"${cat}"`,
        r.division || "",
        r.shirt_size || "",
        `"${r.mobile}"`,
        `"${(r.locality || "").replace(/"/g, '""')}"`,
        `"${r.emergency_name.replace(/"/g, '""')}"`,
        `"${r.emergency_mobile}"`,
        r.registration_source === "admin_cash" ? "Admin Cash" : "Online",
        r.registered_by || "",
        r.status,
        r.submitted_at || "",
      ].join(",");
    });

    const csvContent =
      "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "sinoog-2027-runners.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast("Exported runner records to CSV.", "success");
  };

  // Shirt Size Totals
  const shirtCounts: Record<string, number> = {
    XS: 0,
    S: 0,
    M: 0,
    L: 0,
    XL: 0,
    "2XL": 0,
  };
  for (const r of registrations) {
    if (r.shirt_size && shirtCounts[r.shirt_size] !== undefined) {
      shirtCounts[r.shirt_size] += 1;
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-heading">
        <div>
          <p className="eyebrow">Sinoog Run Operations</p>
          <h1>Runner Registrations</h1>
          <p>
            Review participant entries, payments, shirt sizes, and allocate
            official bib numbers.
          </p>
        </div>
        <div className="registration-heading-actions">
          <button
            type="button"
            className="button button--primary"
            onClick={openWalkInRegistration}
          >
            <UserPlus size={16} /> Register walk-in runner
          </button>
          <button
            type="button"
            className="button button--secondary"
            onClick={() => window.print()}
          >
            <Printer size={16} /> Print approved runners
          </button>
          <button
            type="button"
            className="button button--secondary"
            onClick={handleExportCSV}
          >
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {/* Shirt Sizing Summary Strip */}
      <div className="registration-size-summary">
        <strong className="registration-size-summary__title">
          Shirt Kit Counts
        </strong>
        {Object.entries(shirtCounts).map(([size, count]) => (
          <div className="registration-size-summary__size" key={size}>
            <strong>{size}:</strong> {count}
          </div>
        ))}
        <div className="registration-size-summary__total">
          Total registered: <strong>{registrations.length}</strong>
        </div>
      </div>

      <section className="admin-panel">
        <div className="registrations-toolbar">
          <label
            className="registrations-search"
            htmlFor="registrations-search-input"
          >
            <Search size={18} aria-hidden="true" />
            <input
              id="registrations-search-input"
              type="search"
              placeholder="Search name, reference, or mobile…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoComplete="off"
              enterKeyHint="search"
            />
          </label>

          <div className="registrations-filters">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              aria-label="Filter by category"
            >
              <option value="all">All Distances</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by status"
            >
              <option value="all">All Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="needs_changes">Needs Changes</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: "3rem" }}>
            <LoadingState message="Loading runner registrations…" />
          </div>
        ) : filteredRegistrations.length === 0 ? (
          <EmptyState
            title="No registrations found"
            message={
              searchQuery || statusFilter !== "all" || categoryFilter !== "all"
                ? "No participants matched the current filter criteria."
                : "Runner submissions will appear here once public registration opens."
            }
          />
        ) : (
          <div className="admin-table registrations-table">
            <div className="admin-table__head registrations-table__grid">
              <span>Reference</span>
              <span>Participant & Address</span>
              <span>Category / Shirt</span>
              <span>Fee</span>
              <span>Status</span>
              <span style={{ textAlign: "right" }}>Actions</span>
            </div>

            {filteredRegistrations.map((r) => {
              const cat = categories.find((c) => c.id === r.category_id);
              const feeFormatted = (r.fee_centavos / 100).toLocaleString(
                "en-PH",
                {
                  style: "currency",
                  currency: "PHP",
                },
              );

              return (
                <div
                  key={r.id}
                  className="admin-table__row registrations-table__grid registrations-table__row"
                >
                  <div className="registration-cell registration-cell--reference">
                    {r.bib_number && (
                      <span
                        style={{
                          display: "block",
                          fontWeight: 800,
                          fontSize: "1.15rem",
                        }}
                      >
                        #{r.bib_number}
                      </span>
                    )}
                    <strong
                      style={{ fontFamily: "monospace", color: "var(--wine)" }}
                    >
                      {r.reference}
                    </strong>
                    <small
                      style={{
                        display: "block",
                        color: "var(--muted)",
                        fontSize: "0.78rem",
                      }}
                    >
                      {r.submitted_at
                        ? new Date(r.submitted_at).toLocaleDateString("en-US")
                        : ""}
                    </small>
                    <small
                      style={{
                        display: "block",
                        color: "var(--muted)",
                        fontSize: "0.72rem",
                      }}
                    >
                      {r.registration_source === "admin_cash"
                        ? "Admin cash registration"
                        : "Online registration"}
                    </small>
                  </div>

                  <div className="registration-cell registration-cell--participant">
                    <span className="registration-card-label">Runner</span>
                    <strong style={{ display: "block", fontSize: "1rem" }}>
                      {r.participant_name}
                    </strong>
                    <small
                      style={{ color: "var(--muted)", fontSize: "0.82rem" }}
                    >
                      {r.locality || "Address not provided"} · {r.mobile}
                    </small>
                  </div>

                  <div className="registration-cell registration-cell--category">
                    <span className="registration-card-label">
                      Category and shirt
                    </span>
                    <span style={{ fontWeight: 600, fontSize: "0.88rem" }}>
                      {cat?.name || "Run"}
                    </span>
                    <small style={{ display: "block", color: "var(--muted)" }}>
                      Shirt: <strong>{r.shirt_size || "N/A"}</strong>
                    </small>
                  </div>

                  <div className="registration-cell registration-cell--fee">
                    <span className="registration-card-label">Fee</span>
                    <span
                      style={{
                        fontWeight: 600,
                        color: "var(--wine)",
                        fontSize: "0.9rem",
                      }}
                    >
                      {feeFormatted}
                    </span>
                  </div>

                  <div className="registration-cell registration-cell--status">
                    <StatusBadge
                      tone={
                        r.status === "approved"
                          ? "success"
                          : r.status === "rejected"
                            ? "danger"
                            : "warning"
                      }
                    >
                      {r.status}
                    </StatusBadge>
                  </div>

                  <div className="registration-row-actions">
                    <button
                      type="button"
                      className="button button--ghost button--sm"
                      onClick={() => void openReview(r)}
                    >
                      <FileText size={16} /> Review
                    </button>
                    <button
                      type="button"
                      className="button button--ghost button--sm"
                      aria-label={`Delete registration for ${r.participant_name}`}
                      title={
                        r.status === "approved"
                          ? "Approved runners cannot be deleted"
                          : r.status === "rejected"
                            ? "Delete rejected registration"
                            : "Reject this registration before deleting"
                      }
                      onClick={() => void handleDeleteRegistration(r)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {showWalkIn && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="walk-in-title"
        >
          <div className="modal-card activity-modal walk-in-modal">
            <div className="walk-in-modal__heading">
              <div>
                <p className="eyebrow">Cash registration</p>
                <h2 id="walk-in-title">Register a walk-in runner</h2>
                <p>
                  Create the runner login, record cash payment, and issue the
                  bib and QR immediately.
                </p>
              </div>
              <button
                type="button"
                className="button button--ghost"
                onClick={closeWalkIn}
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            {createdCredentials ? (
              <div className="walk-in-success">
                <Check size={28} />
                <h3>Runner registered and approved</h3>
                <p>
                  Give these sign-in details to the runner now. The temporary
                  password is not stored or shown again.
                </p>
                <dl>
                  <div>
                    <dt>Bib number</dt>
                    <dd>#{createdCredentials.bib}</dd>
                  </div>
                  <div>
                    <dt>Email</dt>
                    <dd>{createdCredentials.email}</dd>
                  </div>
                  <div>
                    <dt>Temporary password</dt>
                    <dd>{createdCredentials.password}</dd>
                  </div>
                </dl>
                <div className="walk-in-actions">
                  <button
                    type="button"
                    className="button button--secondary"
                    onClick={() =>
                      void navigator.clipboard.writeText(
                        `Sinoog Run 2027\nBib: #${createdCredentials.bib}\nEmail: ${createdCredentials.email}\nTemporary password: ${createdCredentials.password}`,
                      )
                    }
                  >
                    <Copy size={16} /> Copy details
                  </button>
                  <button
                    type="button"
                    className="button button--primary"
                    onClick={closeWalkIn}
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form
                className="walk-in-form"
                onSubmit={(event) => void handleWalkInSubmit(event)}
              >
                <fieldset>
                  <legend>Runner login</legend>
                  <div className="walk-in-form__grid">
                    <label>
                      Email address
                      <input
                        type="email"
                        required
                        value={walkIn.email}
                        onChange={(e) =>
                          setWalkIn({ ...walkIn, email: e.target.value })
                        }
                        autoComplete="off"
                      />
                    </label>
                    <label>
                      Temporary password
                      <input
                        type="text"
                        required
                        minLength={8}
                        value={walkIn.temporary_password}
                        onChange={(e) =>
                          setWalkIn({
                            ...walkIn,
                            temporary_password: e.target.value,
                          })
                        }
                        autoComplete="off"
                      />
                    </label>
                  </div>
                </fieldset>

                <fieldset>
                  <legend>Registration details</legend>
                  <div className="walk-in-form__grid">
                    <label className="walk-in-form__wide">
                      Full name
                      <input
                        required
                        value={walkIn.participant_name}
                        onChange={(e) =>
                          setWalkIn({
                            ...walkIn,
                            participant_name: e.target.value,
                          })
                        }
                      />
                    </label>
                    <label>
                      Category
                      <select
                        required
                        value={walkIn.category_id}
                        onChange={(e) =>
                          setWalkIn({ ...walkIn, category_id: e.target.value })
                        }
                      >
                        <option value="">Select category</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name} —{" "}
                            {(category.fee_centavos / 100).toLocaleString(
                              "en-PH",
                              { style: "currency", currency: "PHP" },
                            )}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Division
                      <select
                        required
                        value={walkIn.division}
                        onChange={(e) =>
                          setWalkIn({
                            ...walkIn,
                            division: e.target.value as "male" | "female",
                          })
                        }
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    </label>
                    <label>
                      Birth date
                      <input
                        type="date"
                        required
                        value={walkIn.birth_date}
                        onChange={(e) =>
                          setWalkIn({ ...walkIn, birth_date: e.target.value })
                        }
                      />
                    </label>
                    <label>
                      Mobile number
                      <input
                        required
                        value={walkIn.mobile}
                        onChange={(e) =>
                          setWalkIn({ ...walkIn, mobile: e.target.value })
                        }
                      />
                    </label>
                    <label>
                      Shirt size
                      <select
                        required
                        value={walkIn.shirt_size}
                        onChange={(e) =>
                          setWalkIn({ ...walkIn, shirt_size: e.target.value })
                        }
                      >
                        <option value="">Select size</option>
                        {["XS", "S", "M", "L", "XL", "2XL"].map((size) => (
                          <option key={size}>{size}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Club / team (optional)
                      <input
                        value={walkIn.club_name || ""}
                        onChange={(e) =>
                          setWalkIn({ ...walkIn, club_name: e.target.value })
                        }
                      />
                    </label>
                    <label className="walk-in-form__wide">
                      Address
                      <textarea
                        rows={2}
                        required
                        value={walkIn.locality}
                        onChange={(e) =>
                          setWalkIn({ ...walkIn, locality: e.target.value })
                        }
                      />
                    </label>
                  </div>
                </fieldset>

                <fieldset>
                  <legend>Emergency and health details</legend>
                  <div className="walk-in-form__grid">
                    <label>
                      Emergency contact
                      <input
                        required
                        value={walkIn.emergency_name}
                        onChange={(e) =>
                          setWalkIn({
                            ...walkIn,
                            emergency_name: e.target.value,
                          })
                        }
                      />
                    </label>
                    <label>
                      Relationship
                      <select
                        required
                        value={walkIn.emergency_relationship}
                        onChange={(e) =>
                          setWalkIn({
                            ...walkIn,
                            emergency_relationship: e.target.value,
                          })
                        }
                      >
                        <option value="">Select relationship</option>
                        {EMERGENCY_RELATIONSHIPS.map((relationship) => (
                          <option key={relationship}>{relationship}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Emergency mobile
                      <input
                        required
                        value={walkIn.emergency_mobile}
                        onChange={(e) =>
                          setWalkIn({
                            ...walkIn,
                            emergency_mobile: e.target.value,
                          })
                        }
                      />
                    </label>
                    <label>
                      Medical / assistance notes
                      <textarea
                        rows={2}
                        value={walkIn.accessibility_notes || ""}
                        onChange={(e) =>
                          setWalkIn({
                            ...walkIn,
                            accessibility_notes: e.target.value,
                          })
                        }
                      />
                    </label>
                  </div>
                </fieldset>

                <div className="walk-in-cash-summary">
                  <CreditCard size={20} />
                  <div>
                    <strong>Cash payment</strong>
                    <span>
                      {(
                        (categories.find(
                          (category) => category.id === walkIn.category_id,
                        )?.fee_centavos || 0) / 100
                      ).toLocaleString("en-PH", {
                        style: "currency",
                        currency: "PHP",
                      })}
                    </span>
                    <small>Automatically recorded under the administrator creating this entry.</small>
                  </div>
                </div>
                <label className="walk-in-consent">
                  <input
                    type="checkbox"
                    required
                    checked={walkIn.offline_consent_confirmed}
                    onChange={(e) =>
                      setWalkIn({
                        ...walkIn,
                        offline_consent_confirmed: e.target.checked,
                      })
                    }
                  />
                  <span>
                    I confirm that cash payment was received and the runner
                    signed the printed waiver and privacy notice.
                  </span>
                </label>
                <div className="walk-in-actions">
                  <button
                    type="button"
                    className="button button--ghost"
                    onClick={closeWalkIn}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="button button--primary"
                    disabled={walkInSaving}
                  >
                    {walkInSaving
                      ? "Creating runner…"
                      : "Receive cash & register"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Review Modal */}
      {selectedReg && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="review-modal-title"
        >
          <div
            className="modal-card activity-modal"
            style={{ maxWidth: "720px", width: "95%" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1.25rem",
              }}
            >
              <div>
                <h2
                  id="review-modal-title"
                  style={{ fontSize: "1.35rem", margin: 0 }}
                >
                  Review Registration
                </h2>
                <small
                  style={{ fontFamily: "monospace", color: "var(--wine)" }}
                >
                  {selectedReg.reference}
                </small>
              </div>
              <button
                type="button"
                className="button button--ghost"
                onClick={() => {
                  setSelectedReg(null);
                  setPaymentDetails(null);
                }}
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            <div
              className="responsive-two-column"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0.75rem",
                background: "#faf8f4",
                padding: "1rem",
                borderRadius: "6px",
                marginBottom: "1rem",
                fontSize: "0.9rem",
              }}
            >
              <div>
                <strong>Name:</strong> {selectedReg.participant_name}
              </div>
              <div>
                <strong>Category:</strong>{" "}
                {categories.find((c) => c.id === selectedReg.category_id)?.name}
              </div>
              <div>
                <strong>Division:</strong>{" "}
                {selectedReg.division === "female"
                  ? "Female"
                  : selectedReg.division === "male"
                    ? "Male"
                    : "Not set"}
              </div>
              <div>
                <strong>Mobile:</strong> {selectedReg.mobile}
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <strong>Address:</strong>{" "}
                {selectedReg.locality || "Not provided"}
              </div>
              <div>
                <strong>Shirt Size:</strong> {selectedReg.shirt_size}
              </div>
              <div>
                <strong>Birth Date:</strong> {selectedReg.birth_date || "N/A"}
              </div>
              <div>
                <strong>Emergency Contact:</strong> {selectedReg.emergency_name}{" "}
                ({selectedReg.emergency_relationship})
              </div>
              <div>
                <strong>Emergency Mobile:</strong>{" "}
                {selectedReg.emergency_mobile}
              </div>
              <div>
                <strong>Registration Source:</strong>{" "}
                {selectedReg.registration_source === "admin_cash"
                  ? "Admin cash registration"
                  : "Online registration"}
              </div>
              {selectedReg.registered_by && (
                <div>
                  <strong>Registered By:</strong>{" "}
                  <code>{selectedReg.registered_by}</code>
                </div>
              )}
            </div>

            {selectedReg.accessibility_notes && (
              <div
                style={{
                  background: "#fef3c7",
                  padding: "0.75rem",
                  borderRadius: "6px",
                  fontSize: "0.88rem",
                  color: "#92400e",
                  marginBottom: "1rem",
                }}
              >
                <AlertCircle
                  size={16}
                  style={{
                    display: "inline",
                    marginRight: "0.35rem",
                    verticalAlign: "-2px",
                  }}
                />
                <strong>Medical / Assistance Notes:</strong>{" "}
                {selectedReg.accessibility_notes}
              </div>
            )}

            <div className="registration-payment-review">
              <h3>
                <CreditCard size={18} /> {paymentDetails?.method || "Payment"} Review
              </h3>
              {paymentLoading ? (
                <LoadingState message="Loading payment proof…" />
              ) : paymentDetails ? (
                <>
                  <div className="registration-payment-review__meta">
                    <span>
                      <strong>Status:</strong> {paymentDetails.status}
                    </span>
                    <span>
                      <strong>Amount:</strong>{" "}
                      {(paymentDetails.amount_centavos / 100).toLocaleString(
                        "en-PH",
                        { style: "currency", currency: "PHP" },
                      )}
                    </span>
                    <span>
                      <strong>Method:</strong> {paymentDetails.method}
                    </span>
                    <span>
                      <strong>Reference:</strong>{" "}
                      {paymentDetails.payer_reference || (paymentDetails.method.toLowerCase() === "cash" ? "Cash receipt" : "Not supplied")}
                    </span>
                  </div>
                  {paymentDetails.evidence.length > 0 ? (
                    paymentDetails.evidence.map(
                      (evidence) =>
                        evidence.signed_url && (
                          <a
                            key={evidence.id}
                            className="payment-proof-link"
                            href={evidence.signed_url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <ExternalLink size={16} /> Open submitted payment proof
                          </a>
                        ),
                    )
                  ) : (
                    <p className="form-message">
                      No payment proof has been uploaded.
                    </p>
                  )}
                </>
              ) : (
                <p className="form-message">No payment record was found.</p>
              )}
            </div>

            <div style={{ marginBottom: "1.25rem" }}>
              <label
                style={{
                  display: "block",
                  fontWeight: 600,
                  fontSize: "0.88rem",
                  marginBottom: "0.25rem",
                }}
              >
                Review Notes / Instructions to Runner
              </label>
              <textarea
                rows={3}
                placeholder="Notes visible to runner in case of changes or rejection…"
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.6rem 0.75rem",
                  borderRadius: "6px",
                  border: "1px solid #d4c5b9",
                }}
              />
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderTop: "1px solid #eee",
                paddingTop: "1rem",
                flexWrap: "wrap",
                gap: "0.5rem",
              }}
            >
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  type="button"
                  className="button button--danger button--sm"
                  disabled={reviewing}
                  onClick={() => void handleUpdateStatus("rejected")}
                >
                  <XCircle size={14} /> Reject
                </button>
                <button
                  type="button"
                  className="button button--secondary button--sm"
                  disabled={reviewing}
                  onClick={() => void handleUpdateStatus("needs_changes")}
                >
                  Request Changes
                </button>
              </div>

              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  type="button"
                  className="button button--ghost button--sm"
                  onClick={() => {
                    setSelectedReg(null);
                    setPaymentDetails(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="button button--primary button--sm"
                  disabled={
                    reviewing ||
                    paymentLoading ||
                    !paymentDetails ||
                    !["submitted", "verified"].includes(
                      paymentDetails.status,
                    ) ||
                    (paymentDetails.method.toLowerCase() !== "cash" &&
                      paymentDetails.evidence.length === 0)
                  }
                  onClick={() => void handleUpdateStatus("approved")}
                >
                  <Check size={14} /> Approve Entry
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <section className="runner-print-sheet" aria-hidden="true">
        <h1>Sinoog Run 2027 — Approved Runners</h1>
        <p>Sto. Niño Parish — Guinacot, Guindulman, Bohol</p>
        <div className="runner-print-grid">
          {registrations
            .filter(
              (registration) =>
                registration.status === "approved" &&
                registration.bib_number &&
                registration.qr_token,
            )
            .map((registration) => {
              const qrValue = getRunnerQrValue(registration);
              const category = categories.find(
                (item) => item.id === registration.category_id,
              );
              return (
                <article key={registration.id}>
                  {qrValue && (
                    <QRCodeSVG
                      value={qrValue}
                      size={92}
                      level="H"
                      marginSize={1}
                    />
                  )}
                  <div>
                    <strong className="runner-print-bib">
                      {registration.bib_number}
                    </strong>
                    <b>{registration.participant_name}</b>
                    <span>{category?.name || "Sinoog Run 2027"}</span>
                    <small>{registration.reference}</small>
                  </div>
                </article>
              );
            })}
        </div>
      </section>
    </div>
  );
}
