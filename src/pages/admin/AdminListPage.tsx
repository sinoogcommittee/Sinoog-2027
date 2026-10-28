import { Plus, Search, SlidersHorizontal } from "lucide-react";
import { StatusBadge } from "../../components/StatusBadge";
const config = {
  registrations: {
    title: "Run registrations",
    description: "Review participant and payment status.",
    action: "Export list",
    columns: ["Reference", "Participant", "Distance", "Payment", "Status"],
  },
  delegations: {
    title: "Festival delegations",
    description: "Review rosters, music, and requested revisions.",
    action: "Add delegation",
    columns: ["Delegation", "Head", "Submitted", "Files", "Status"],
  },
  posts: {
    title: "News posts",
    description: "Draft, review, and publish official announcements.",
    action: "Create post",
    columns: ["Title", "Category", "Updated", "Author", "Status"],
  },
  activities: {
    title: "Activities",
    description: "Manage Masses, nightly events, and festival schedules.",
    action: "Add activity",
    columns: ["Activity", "Type", "Date", "Venue", "Status"],
  },
  users: {
    title: "Website users",
    description: "Invite staff and manage assigned roles.",
    action: "Invite user",
    columns: ["Name", "Email", "Role", "Last active", "Status"],
  },
  settings: {
    title: "Website settings",
    description: "Edit event dates, contacts, and feature availability.",
    action: "Save changes",
    columns: ["Setting", "Value", "Updated", "Owner", "Status"],
  },
} as const;
export function AdminListPage({ type }: { type: keyof typeof config }) {
  const c = config[type];
  return (
    <div className="admin-page">
      <div className="admin-heading">
        <div>
          <p className="eyebrow">Sinoog 2027</p>
          <h1>{c.title}</h1>
          <p>{c.description}</p>
        </div>
        <button className="button button--primary">
          <Plus size={17} />
          {c.action}
        </button>
      </div>
      <section className="admin-panel">
        <div className="table-tools">
          <label className="modern-search" htmlFor="admin-list-search">
            <Search size={18} aria-hidden="true" />
            <input
              id="admin-list-search"
              type="search"
              placeholder="Search records"
              autoComplete="off"
              enterKeyHint="search"
            />
          </label>
          <button type="button">
            <SlidersHorizontal size={16} /> Filter
          </button>
        </div>
        <div className="admin-table">
          <div className="admin-table__head">
            {c.columns.map((x) => (
              <span key={x}>{x}</span>
            ))}
          </div>
          <div className="admin-table__empty">
            <StatusBadge>Empty</StatusBadge>
            <h3>No records yet</h3>
            <p>
              Records will appear here after Supabase is connected and the
              feature is opened.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
