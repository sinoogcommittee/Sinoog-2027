import { useCallback, useEffect, useMemo, useState } from 'react';
import { ClipboardCopy, KeyRound, Mail, MapPin, Pencil, Phone, Search, Shield, Trash2, Save, UserPlus, X } from 'lucide-react';
import {
  createManagedStaffAccount,
  deleteManagedUserAsAdmin,
  getManagedUserDeletionPreview,
  getManagedUserDetails,
  listUsersForAdmin,
  updateManagedUserAsAdmin,
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
  const [editEmail, setEditEmail] = useState('');
  const [editName, setEditName] = useState('');
  const [editMobile, setEditMobile] = useState('');
  const [editLocality, setEditLocality] = useState('');
  const [editRoles, setEditRoles] = useState<StaffRole[]>([]);
  const [editSuspended, setEditSuspended] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createName, setCreateName] = useState('');
  const [createMobile, setCreateMobile] = useState('');
  const [createLocality, setCreateLocality] = useState('');
  const [createRoles, setCreateRoles] = useState<StaffRole[]>([]);
  const [createdCredentials, setCreatedCredentials] = useState<{ name: string; email: string; password: string } | null>(null);

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
    const rolePriority = (u: ManagedUser) => {
      if (u.roles.includes('admin')) return 0;
      if (u.roles.includes('news_in_charge')) return 1;
      if (u.roles.includes('delegation_head')) return 2;
      return 3;
    };

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
    }).sort((a, b) => {
      const priorityDifference = rolePriority(a) - rolePriority(b);
      if (priorityDifference !== 0) return priorityDifference;
      return (a.full_name || 'Unnamed account').localeCompare(b.full_name || 'Unnamed account', 'en', {
        sensitivity: 'base',
      });
    });
  }, [users, searchQuery, roleFilter]);

  async function openEditor(u: ManagedUser) {
    setSelected(u);
    setEditEmail(u.email || '');
    setEditName(u.full_name || '');
    setEditMobile(u.mobile || '');
    setEditLocality(u.locality || '');
    setEditRoles(u.roles.filter((r): r is StaffRole => r === 'admin' || r === 'news_in_charge' || r === 'delegation_head'));
    setEditSuspended(Boolean(u.suspended_at));
    setNewPassword('');
    setLoadingDetails(true);
    try {
      const details = await getManagedUserDetails(u.id);
      setSelected(details);
      setEditEmail(details.email || '');
      setEditName(details.full_name || '');
      setEditMobile(details.mobile || '');
      setEditLocality(details.locality || '');
      setEditRoles(details.roles.filter((r): r is StaffRole => r === 'admin' || r === 'news_in_charge' || r === 'delegation_head'));
      setEditSuspended(Boolean(details.suspended_at));
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Unable to load the complete user record.', 'error');
      setSelected(null);
    } finally {
      setLoadingDetails(false);
    }
  }

  function toggleRole(role: StaffRole) {
    setEditRoles((prev) => (prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]));
  }

  function openCreateStaff() {
    setCreateEmail('');
    setCreatePassword('');
    setCreateName('');
    setCreateMobile('');
    setCreateLocality('');
    setCreateRoles([]);
    setCreatedCredentials(null);
    setCreateOpen(true);
  }

  function closeCreateStaff() {
    if (creating) return;
    setCreateOpen(false);
    setCreatedCredentials(null);
    setCreatePassword('');
  }

  function toggleCreateRole(role: StaffRole) {
    setCreateRoles((prev) => (prev.includes(role) ? prev.filter((item) => item !== role) : [...prev, role]));
  }

  async function handleCreateStaff() {
    if (!canManage || createRoles.length === 0) return;
    setCreating(true);
    try {
      await createManagedStaffAccount({
        email: createEmail.trim(),
        password: createPassword,
        full_name: createName.trim(),
        mobile: createMobile.trim(),
        locality: createLocality.trim(),
        roles: createRoles,
      });
      setCreatedCredentials({ name: createName.trim(), email: createEmail.trim(), password: createPassword });
      toast('Staff account created and recorded in the audit log.', 'success');
      await load();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Unable to create the staff account.', 'error');
    } finally {
      setCreating(false);
    }
  }

  async function copyCreatedCredentials() {
    if (!createdCredentials) return;
    try {
      await navigator.clipboard.writeText(
        `Sinoog 2027 staff account\nName: ${createdCredentials.name}\nEmail: ${createdCredentials.email}\nTemporary password: ${createdCredentials.password}`
      );
      toast('Staff sign-in details copied.', 'success');
    } catch {
      toast('Unable to copy automatically. Copy the details manually.', 'error');
    }
  }

  async function handleSave() {
    if (!selected || !canManage) return;
    setSaving(true);
    try {
      await updateManagedUserAsAdmin({
        user_id: selected.id,
        email: editEmail.trim(),
        full_name: editName.trim(),
        mobile: editMobile.trim(),
        locality: editLocality.trim(),
        roles: editRoles,
        suspended: editSuspended,
        new_password: newPassword || undefined,
      });
      toast(newPassword ? 'User details, access, and password updated.' : 'User details and access updated.', 'success');
      setSelected(null);
      setNewPassword('');
      await load();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Unable to save user.', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(u: ManagedUser) {
    if (!canManage || deletingId) return;
    if (u.id === user?.id) {
      toast('You cannot delete the administrator account currently signed in.', 'error');
      return;
    }
    try {
      setDeletingId(u.id);
      const preview = await getManagedUserDeletionPreview(u.id);
      if (!preview.eligible) {
        throw new Error('This account still has an active or approved registration. Reject the registration or suspend the account before deleting it.');
      }
      const reason = preview.eligibility === 'suspended'
        ? 'The account is suspended.'
        : preview.eligibility === 'rejected_or_cancelled'
          ? 'All run registrations are rejected or cancelled.'
          : 'The account has no run registration.';
      const confirmed = window.confirm(
        `Permanently delete ${u.full_name || 'this user'}?\n\n${reason}\n\nThis will permanently remove:\n` +
        `• The login account and profile\n` +
        `• ${preview.registration_count} run registration(s), including payments, waivers, bib, QR, and finish record\n` +
        `• ${preview.payment_evidence_count} private payment screenshot(s)\n\n` +
        `${preview.preserved_content_count} official content/audit record(s) will be preserved, but their link to this account will be cleared.\n\n` +
        `The signed-in administrator will be recorded in the audit log. This cannot be undone.`
      );
      if (!confirmed) return;
      await deleteManagedUserAsAdmin(u.id);
      toast('User account and related personal records deleted. The administrator action was recorded.', 'success');
      await load();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Unable to delete the user account.', 'error');
    } finally {
      setDeletingId(null);
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
            Create staff sign-in accounts, update profile details, and assign committee access roles.
          </p>
        </div>
        <button type="button" className="button button--primary users-create-button" onClick={openCreateStaff}>
          <UserPlus size={17} aria-hidden="true" /> Create staff account
        </button>
      </div>

      <div className="users-access-note">
        <strong>How staff access works:</strong> There is no public staff sign-up. An administrator creates the account
        here, assigns Administrator, News in charge, or Delegation head access, and securely gives the temporary
        credentials to the staff member. They then use <em>Staff login</em>.
      </div>

      <section className="admin-panel users-admin-panel">
        <div className="table-tools users-toolbar">
          <label className="users-toolbar__search" htmlFor="users-search-input">
            <Search size={18} aria-hidden="true" />
            <input
              id="users-search-input"
              type="search"
              placeholder="Search by name, mobile, or address…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoComplete="off"
              enterKeyHint="search"
            />
          </label>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}
            aria-label="Filter by role"
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
          <div className="admin-table users-table">
            <div
              className="admin-table__head users-table__grid"
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
                  className="admin-table__row users-table__grid users-table__row"
                >
                  <div className="users-table__identity">
                    <strong>{u.full_name || 'Unnamed account'}</strong>
                    <small style={{ display: 'block', color: 'var(--muted)', fontSize: '0.75rem' }}>
                      {u.id.slice(0, 8)}…
                    </small>
                  </div>
                  <div className="users-table__contact">
                    <div><Phone size={15} aria-hidden="true" /><span>{u.mobile || '—'}</span></div>
                    <div><MapPin size={15} aria-hidden="true" /><small>{u.locality || '—'}</small></div>
                  </div>
                  <div className="users-table__roles">
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
                  <div className="users-table__status">
                    <StatusBadge tone={u.suspended_at ? 'danger' : 'success'}>
                      {u.suspended_at ? 'Suspended' : 'Active'}
                    </StatusBadge>
                  </div>
                  <div className="users-table__actions">
                    <button
                      type="button"
                      className="button button--ghost button--sm users-table__icon-button"
                      onClick={() => void openEditor(u)}
                      title={`Edit ${u.full_name || 'user'}`}
                      aria-label={`Edit ${u.full_name || 'user'}`}
                    >
                      <Pencil size={16} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="button button--ghost button--sm users-table__icon-button users-table__delete"
                      onClick={() => void handleDelete(u)}
                      disabled={deletingId === u.id || u.id === user?.id}
                      title={u.id === user?.id ? 'You cannot delete your own account' : 'Delete user account'}
                      aria-label={`Delete ${u.full_name || 'user'}`}
                    >
                      <Trash2 size={16} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {createOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="staff-create-title">
          <form className="modal-card users-edit-modal" onSubmit={(event) => { event.preventDefault(); void handleCreateStaff(); }}>
            <div className="users-edit-modal__heading">
              <div>
                <p className="eyebrow">Committee access</p>
                <h2 id="staff-create-title">Create staff account</h2>
                <p>Create the login, profile, temporary password, and assigned roles together.</p>
              </div>
              <button type="button" className="button button--ghost" disabled={creating} onClick={closeCreateStaff} aria-label="Close">
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            {createdCredentials ? (
              <div className="users-create-success">
                <StatusBadge tone="success">Account created</StatusBadge>
                <h3>Give these details to {createdCredentials.name}</h3>
                <p>The temporary password is shown only here. Send it through a secure channel.</p>
                <div className="users-edit-modal__identity">
                  <span>Email address</span>
                  <strong>{createdCredentials.email}</strong>
                  <span>Temporary password</span>
                  <strong>{createdCredentials.password}</strong>
                </div>
                <div className="users-edit-modal__actions">
                  <button type="button" className="button button--secondary" onClick={() => void copyCreatedCredentials()}>
                    <ClipboardCopy size={16} aria-hidden="true" /> Copy details
                  </button>
                  <button type="button" className="button button--primary" onClick={closeCreateStaff}>Done</button>
                </div>
              </div>
            ) : (
              <>
                <fieldset>
                  <legend>Staff account details</legend>
                  <div className="users-edit-modal__grid">
                    <label className="users-edit-modal__wide">
                      <span><Mail size={15} aria-hidden="true" /> Email address</span>
                      <input type="email" required value={createEmail} onChange={(event) => setCreateEmail(event.target.value)} autoComplete="off" />
                    </label>
                    <label>
                      Full name
                      <input type="text" required value={createName} onChange={(event) => setCreateName(event.target.value)} autoComplete="off" />
                    </label>
                    <label>
                      Mobile number
                      <input type="tel" value={createMobile} onChange={(event) => setCreateMobile(event.target.value)} autoComplete="off" />
                    </label>
                    <label className="users-edit-modal__wide">
                      Full address
                      <textarea rows={2} value={createLocality} onChange={(event) => setCreateLocality(event.target.value)} />
                    </label>
                    <label className="users-edit-modal__wide users-edit-modal__password">
                      <span><KeyRound size={16} aria-hidden="true" /> Temporary password</span>
                      <input type="password" required minLength={8} value={createPassword} onChange={(event) => setCreatePassword(event.target.value)} autoComplete="new-password" placeholder="At least 8 characters" />
                    </label>
                  </div>
                </fieldset>

                <fieldset>
                  <legend>Staff roles</legend>
                  <div className="users-edit-modal__roles">
                    {(Object.keys(ROLE_LABELS) as StaffRole[]).map((role) => (
                      <label key={role}>
                        <input type="checkbox" checked={createRoles.includes(role)} onChange={() => toggleCreateRole(role)} />
                        <span><Shield size={16} aria-hidden="true" /> {ROLE_LABELS[role]}</span>
                      </label>
                    ))}
                  </div>
                  <p className="users-edit-modal__note">Assign at least one role. Staff accounts cannot be created as runner-only accounts here.</p>
                </fieldset>

                <div className="users-edit-modal__actions">
                  <button type="button" className="button button--ghost" disabled={creating} onClick={closeCreateStaff}>Cancel</button>
                  <button type="submit" className="button button--primary" disabled={creating || !createEmail.trim() || !createName.trim() || createPassword.length < 8 || createRoles.length === 0}>
                    <UserPlus size={16} aria-hidden="true" /> {creating ? 'Creating…' : 'Create staff account'}
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      )}

      {selected && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="user-edit-title">
          <form className="modal-card users-edit-modal" onSubmit={(event) => { event.preventDefault(); void handleSave(); }}>
            <div className="users-edit-modal__heading">
              <div>
                <p className="eyebrow">Account administration</p>
                <h2 id="user-edit-title">Edit user</h2>
                <p>Update profile information, access, roles, and login credentials.</p>
              </div>
              <button type="button" className="button button--ghost" disabled={saving} onClick={() => setSelected(null)} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            {loadingDetails ? <LoadingState message="Loading complete user details…" /> : <>
              <div className="users-edit-modal__identity">
                <span>Account ID</span>
                <strong>{selected.id}</strong>
                <span>Created</span>
                <strong>{new Date(selected.created_at).toLocaleString('en-PH')}</strong>
              </div>

              <fieldset>
                <legend>Account details</legend>
                <div className="users-edit-modal__grid">
                  <label className="users-edit-modal__wide">
                    <span><Mail size={15} /> Email address</span>
                    <input type="email" required value={editEmail} onChange={(event) => setEditEmail(event.target.value)} autoComplete="off" />
                  </label>
                  <label>
                    Full name
                    <input type="text" required value={editName} onChange={(event) => setEditName(event.target.value)} />
                  </label>
                  <label>
                    Mobile number
                    <input type="tel" value={editMobile} onChange={(event) => setEditMobile(event.target.value)} />
                  </label>
                  <label className="users-edit-modal__wide">
                    Full address
                    <textarea rows={2} value={editLocality} onChange={(event) => setEditLocality(event.target.value)} />
                  </label>
                </div>
              </fieldset>

              <fieldset>
                <legend>Access and staff roles</legend>
                <div className="users-edit-modal__roles">
                  {(Object.keys(ROLE_LABELS) as StaffRole[]).map((role) => (
                    <label key={role}>
                      <input type="checkbox" checked={editRoles.includes(role)} onChange={() => toggleRole(role)} />
                      <span><Shield size={16} /> {ROLE_LABELS[role]}</span>
                    </label>
                  ))}
                </div>
                <label className="users-edit-modal__suspended">
                  <input type="checkbox" checked={editSuspended} disabled={selected.id === user?.id} onChange={(event) => setEditSuspended(event.target.checked)} />
                  <span><strong>Suspend this account</strong><small>Prevents the user from using protected website features. Your current account cannot suspend itself.</small></span>
                </label>
                <p className="users-edit-modal__note">Runner access is always retained. Clearing all staff roles leaves this as a runner-only account.</p>
              </fieldset>

              <fieldset>
                <legend>Password reset</legend>
                <label className="users-edit-modal__password">
                  <span><KeyRound size={16} /> New password</span>
                  <input type="password" minLength={8} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} autoComplete="new-password" placeholder="Leave blank to keep the current password" />
                </label>
                <p className="users-edit-modal__note">If entered, the new password takes effect immediately. Give it to the user through a secure channel.</p>
              </fieldset>

              <div className="users-edit-modal__actions">
                <button type="button" className="button button--ghost" disabled={saving} onClick={() => setSelected(null)}>Cancel</button>
                <button type="submit" className="button button--primary" disabled={saving || !editEmail.trim() || !editName.trim()}>
                  <Save size={16} /> {saving ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </>}
          </form>
        </div>
      )}
    </div>
  );
}
