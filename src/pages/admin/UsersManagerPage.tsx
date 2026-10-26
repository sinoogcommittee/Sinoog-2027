import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, Shield, UserX, UserCheck, Save, X } from 'lucide-react';
import {
  listUsersForAdmin,
  setUserStaffRoles,
  setUserSuspended,
  updateUserProfileAsAdmin,
  type ManagedUser,
  type StaffRole,
} from '../../features/users/userQueries';
import { StatusBadge } from '../../components/StatusBadge';
import { LoadingState, EmptyState } from '../../features/ui/FeedbackStates';
import { useToast } from '../../features/ui/useToast';
import { useAuth } from '../../features/auth/useAuth';

const ROLE_LABELS: Record<StaffRole, string> = {
  admin: 'Administrator',
  news_in_charge: 'News in charge',
  delegation_head: 'Delegation head',
};

export function UsersManagerPage() {
  const { user, isAdmin, isDemoAdmin } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | StaffRole | 'runner'>('all');

  const [selected, setSelected] = useState<ManagedUser | null>(null);
  const [editName, setEditName] = useState('');
  const [editMobile, setEditMobile] = useState('');
  const [editLocality, setEditLocality] = useState('');
  const [editRoles, setEditRoles] = useState<StaffRole[]>([]);
  const [saving, setSaving] = useState(false);

  const canManage = isAdmin || isDemoAdmin;

  const load = useCallback(async () => {
    if (isDemoAdmin && !user) {
      setUsers([]);
      setLoading(false);
      return;
    }
    try {
      const list = await listUsersForAdmin();
      setUsers(list);
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to load users.', 'error');
    } finally {
      setLoading(false);
    }
  }, [isDemoAdmin, user, toast]);

  useEffect(() => {
    const loadTimer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(loadTimer);
  }, [load]);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        (u.full_name || '').toLowerCase().includes(q) ||
        (u.mobile || '').includes(q) ||
        (u.locality || '').toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q);

      const staffRoles = u.roles.filter((r) => r !== 'public_user');
      let matchRole = true;
      if (roleFilter === 'runner') matchRole = staffRoles.length === 0;
      else if (roleFilter !== 'all') matchRole = u.roles.includes(roleFilter);

      return matchSearch && matchRole;
    });
  }, [users, searchQuery, roleFilter]);

  function openEditor(u: ManagedUser) {
    setSelected(u);
    setEditName(u.full_name || '');
    setEditMobile(u.mobile || '');
    setEditLocality(u.locality || '');
    setEditRoles(u.roles.filter((r): r is StaffRole => r === 'admin' || r === 'news_in_charge' || r === 'delegation_head'));
  }

  function toggleRole(role: StaffRole) {
    setEditRoles((prev) => (prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]));
  }

  async function handleSave() {
    if (!selected || !canManage) return;
    setSaving(true);
    try {
      await updateUserProfileAsAdmin(selected.id, {
        full_name: editName.trim() || null,
        mobile: editMobile.trim() || null,
        locality: editLocality.trim() || null,
      });
      await setUserStaffRoles(selected.id, editRoles, user?.id ?? null);
      toast('User updated and roles saved.', 'success');
      setSelected(null);
      await load();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Unable to save user.', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleSuspendToggle(u: ManagedUser) {
    if (!canManage) return;
    if (u.id === user?.id) {
      toast('You cannot suspend your own account.', 'error');
      return;
    }
    try {
      const next = !u.suspended_at;
      await setUserSuspended(u.id, next);
      toast(next ? 'User suspended.' : 'User reactivated.', 'success');
      await load();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Unable to update suspension.', 'error');
    }
  }

  if (!canManage) {
    return (
      <div className="admin-page">
        <EmptyState
          title="Administrators only"
          message="Only administrators can manage users and assign staff roles. Update your own profile under My account."
        />
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-heading">
        <div>
          <p className="eyebrow">Committee administration</p>
          <h1>Users & staff</h1>
          <p>
            Assign administrator and staff roles to existing accounts. New staff must create an account first; an admin
            then approves access by adding roles.
          </p>
        </div>
      </div>

      <div
        style={{
          background: '#faf8f4',
          border: '1px solid var(--line)',
          borderRadius: '8px',
          padding: '1rem 1.25rem',
          marginBottom: '1.25rem',
          fontSize: '0.92rem',
          lineHeight: 1.55,
        }}
      >
        <strong>How staff access works:</strong> There is no public staff sign-up. The person signs up as a normal
        account (runner sign-up is fine). An administrator finds them here and adds roles such as Administrator, News
        in charge, or Delegation head. They then use <em>Staff login</em>.
      </div>

      <section className="admin-panel">
        <div className="table-tools" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
          <label style={{ flex: '1 1 240px' }}>
            <Search size={16} />
            <input
              type="text"
              placeholder="Search by name, mobile, or address…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </label>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}
            aria-label="Filter by role"
            style={{ padding: '0.45rem 0.75rem', borderRadius: '6px', border: '1px solid #d4c5b9' }}
          >
            <option value="all">All accounts</option>
            <option value="admin">Administrators</option>
            <option value="news_in_charge">News in charge</option>
            <option value="delegation_head">Delegation heads</option>
            <option value="runner">Runners only (no staff role)</option>
          </select>
        </div>

        {loading ? (
          <div style={{ padding: '3rem' }}>
            <LoadingState message="Loading users…" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No users found"
            message={
              isDemoAdmin && !user
                ? 'Connect Supabase and sign in as an admin to manage real accounts.'
                : 'No profiles matched this filter. Users appear after they create an account.'
            }
          />
        ) : (
          <div className="admin-table">
            <div
              className="admin-table__head"
              style={{ gridTemplateColumns: '1.6fr 1.2fr 1.4fr 100px 120px' }}
            >
              <span>Name</span>
              <span>Contact</span>
              <span>Roles</span>
              <span>Status</span>
              <span style={{ textAlign: 'right' }}>Actions</span>
            </div>

            {filtered.map((u) => {
              const staffRoles = u.roles.filter((r) => r !== 'public_user') as StaffRole[];
              return (
                <div
                  key={u.id}
                  className="admin-table__row users-table__row"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1.6fr 1.2fr 1.4fr 100px 120px',
                    padding: '1rem',
                    borderBottom: '1px solid #ede4dc',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <div>
                    <strong>{u.full_name || 'Unnamed account'}</strong>
                    <small style={{ display: 'block', color: 'var(--muted)', fontSize: '0.75rem' }}>
                      {u.id.slice(0, 8)}…
                    </small>
                  </div>
                  <div style={{ fontSize: '0.9rem' }}>
                    <div>{u.mobile || '—'}</div>
                    <small style={{ color: 'var(--muted)' }}>{u.locality || '—'}</small>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {staffRoles.length === 0 ? (
                      <StatusBadge tone="warning">runner</StatusBadge>
                    ) : (
                      staffRoles.map((r) => (
                        <StatusBadge key={r} tone={r === 'admin' ? 'success' : 'warning'}>
                          {ROLE_LABELS[r]}
                        </StatusBadge>
                      ))
                    )}
                  </div>
                  <div>
                    <StatusBadge tone={u.suspended_at ? 'danger' : 'success'}>
                      {u.suspended_at ? 'Suspended' : 'Active'}
                    </StatusBadge>
                  </div>
                  <div style={{ textAlign: 'right', display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                    <button type="button" className="button button--ghost button--sm" onClick={() => openEditor(u)}>
                      <Shield size={14} /> Roles
                    </button>
                    <button
                      type="button"
                      className="button button--ghost button--sm"
                      onClick={() => void handleSuspendToggle(u)}
                      title={u.suspended_at ? 'Reactivate' : 'Suspend'}
                    >
                      {u.suspended_at ? <UserCheck size={14} /> : <UserX size={14} />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {selected && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="user-edit-title">
          <div className="modal-card" style={{ maxWidth: '560px', width: '95%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 id="user-edit-title" style={{ margin: 0, fontSize: '1.35rem' }}>
                Edit user & roles
              </h2>
              <button type="button" className="button button--ghost" onClick={() => setSelected(null)} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'grid', gap: '0.85rem', marginBottom: '1.25rem' }}>
              <label>
                Full name
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem 0.7rem', borderRadius: '6px', border: '1px solid #d4c5b9' }}
                />
              </label>
              <label>
                Mobile
                <input
                  type="tel"
                  value={editMobile}
                  onChange={(e) => setEditMobile(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem 0.7rem', borderRadius: '6px', border: '1px solid #d4c5b9' }}
                />
              </label>
              <label>
                Address
                <input
                  type="text"
                  value={editLocality}
                  onChange={(e) => setEditLocality(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem 0.7rem', borderRadius: '6px', border: '1px solid #d4c5b9' }}
                />
              </label>
            </div>

            <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Staff roles (admin approval)</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
              {(Object.keys(ROLE_LABELS) as StaffRole[]).map((role) => (
                <label key={role} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={editRoles.includes(role)}
                    onChange={() => toggleRole(role)}
                  />
                  <span>{ROLE_LABELS[role]}</span>
                </label>
              ))}
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '1rem' }}>
              Runner access uses the built-in <code>public_user</code> role and is always kept. Clearing all staff
              roles leaves the account as a runner-only account.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button type="button" className="button button--ghost" onClick={() => setSelected(null)}>
                Cancel
              </button>
              <button type="button" className="button button--primary" disabled={saving} onClick={() => void handleSave()}>
                <Save size={16} /> {saving ? 'Saving…' : 'Save user'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
