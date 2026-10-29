import { useState } from "react";
import { Plus, SlidersHorizontal } from "lucide-react";
import { Button } from "../../components/Button";
import { Card } from "../../components/m3/Card";
import { SearchBar } from "../../components/m3/SearchBar";
import { EmptyState } from "../../features/ui/FeedbackStates";

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
  const [search, setSearch] = useState("");
  const c = config[type];

  return (
    <div className="admin-page">
      <div className="admin-heading">
        <div>
          <p className="eyebrow">Sinoog 2027</p>
          <h1>{c.title}</h1>
          <p>{c.description}</p>
        </div>
        <Button variant="filled" leadingIcon={<Plus size={17} />}>
          {c.action}
        </Button>
      </div>

      <Card variant="outlined" style={{ padding: "var(--md-space-4)" }}>
        <div className="table-tools" style={{ display: "flex", gap: "var(--md-space-3)", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", marginBottom: "var(--md-space-4)" }}>
          <div style={{ flex: "1 1 280px", minWidth: "220px" }}>
            <SearchBar
              label="Search records"
              placeholder="Search records…"
              value={search}
              onValueChange={setSearch}
            />
          </div>
          <Button variant="outlined" size="small" leadingIcon={<SlidersHorizontal size={16} />}>
            Filter
          </Button>
        </div>

        <div className="admin-table">
          <div className="admin-table__head">
            {c.columns.map((x) => (
              <span key={x}>{x}</span>
            ))}
          </div>
          <EmptyState
            title="No records yet"
            message="Records will appear here after Supabase is connected and the feature is opened."
          />
        </div>
      </Card>
    </div>
  );
}
