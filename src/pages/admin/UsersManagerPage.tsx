import { useCallback, useEffect, useMemo, useState } from 'react';
import { ClipboardCopy, MapPin, Pencil, Phone, Trash2, Save, UserPlus } from 'lucide-react';
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
import { Button } from '../../components/Button';
import { Card } from '../../components/m3/Card';
import { Dialog } from '../../components/m3/Dialog';
import { TextField } from '../../components/m3/TextField';
import { TextArea } from '../../components/m3/TextArea';
import { SelectField } from '../../components/m3/SelectField';
import { Checkbox } from '../../components/m3/Checkbox';
import { SearchBar } from '../../components/m3/SearchBar';

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
        <Button variant="filled" leadingIcon={<UserPlus size={17} />} onClick={openCreateStaff}>
          Create staff account
        </Button>
      </div>

      <div className="users-access-note">
        <strong>How staff access works:</strong> There is no public staff sign-up. An administrator creates the account
        here, assigns Administrator, News in charge, or Delegation head access, and securely gives the temporary
        credentials to the staff member. They then use <em>Staff login</em>.
      </div>

      <Card variant="outlined" className="users-admin-panel" style={{ padding: 'var(--md-space-4)' }}>
        <div className="table-tools admin-toolbar users-toolbar">
          <div className="users-toolbar__search-wrap">
            <SearchBar
              label="Search accounts"
              placeholder="Search by name, mobile, or address…"
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
          </div>
          <div className="users-toolbar__filter-wrap">
            <SelectField
              label="Filter by role"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}
            >
              <option value="all">All accounts</option>
              <option value="admin">Administrators</option>
              <option value="news_in_charge">News in charge</option>
              <option value="delegation_head">Delegation heads</option>
              <option value="runner">Runners only (no staff role)</option>
            </SelectField>
          </div>
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
            <div className="admin-table__head users-table__grid">
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
                    <small style={{ display: 'block', color: 'var(--md-sys-color-on-surface-variant)', fontSize: '0.75rem' }}>
                      {u.id.slice(0, 8)}…
                    </small>
                  </div>
                  <div className="users-table__contact">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Phone size={14} aria-hidden="true" />
                      <span>{u.mobile || '—'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={14} aria-hidden="true" />
                      <small>{u.locality || '—'}</small>
                    </div>
                  </div>
                  <div className="users-table__roles" style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
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
                  <div className="users-table__actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '4px' }}>
                    <button
                      type="button"
                      className="button button--ghost button--sm users-table__icon-button"
                      onClick={() => void openEditor(u)}
                      title={`Edit ${u.full_name || 'user'}`}
                      aria-label={`Edit ${u.full_name || 'user'}`}
                      style={{ minWidth: '44px', minHeight: '44px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
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
                      style={{ minWidth: '44px', minHeight: '44px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Trash2 size={16} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Create staff modal */}
      <Dialog
        open={createOpen}
        onClose={closeCreateStaff}
        title="Create staff account"
      >
        <p style={{ margin: '0 0 var(--md-space-4) 0', color: 'var(--md-sys-color-on-surface-variant)', fontSize: '0.875rem' }}>
          Create the login, profile, temporary password, and assigned roles together.
        </p>
        {createdCredentials ? (
          <div className="users-create-success" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-space-3)' }}>
            <StatusBadge tone="success">Account created</StatusBadge>
            <h3>Give these details to {createdCredentials.name}</h3>
            <p style={{ color: 'var(--md-sys-color-on-surface-variant)', fontSize: '0.9rem' }}>
              The temporary password is shown only here. Send it through a secure channel.
            </p>
            <Card variant="filled" style={{ padding: 'var(--md-space-4)', display: 'grid', gridTemplateColumns: '120px 1fr', gap: 'var(--md-space-2)', alignItems: 'center' }}>
              <span style={{ color: 'var(--md-sys-color-on-surface-variant)', fontSize: '0.85rem' }}>Email address</span>
              <strong>{createdCredentials.email}</strong>
              <span style={{ color: 'var(--md-sys-color-on-surface-variant)', fontSize: '0.85rem' }}>Temporary password</span>
              <strong>{createdCredentials.password}</strong>
            </Card>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--md-space-2)', marginTop: 'var(--md-space-3)' }}>
              <Button variant="outlined" leadingIcon={<ClipboardCopy size={16} />} onClick={() => void copyCreatedCredentials()}>
                Copy details
              </Button>
              <Button variant="filled" onClick={closeCreateStaff}>
                Done
              </Button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void handleCreateStaff();
            }}
            style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-space-4)' }}
          >
            <fieldset style={{ border: '1px solid var(--md-sys-color-outline-variant)', borderRadius: 'var(--md-sys-shape-corner-medium)', padding: 'var(--md-space-4)', margin: 0 }}>
              <legend style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--md-sys-color-on-surface)', padding: '0 var(--md-space-2)' }}>Staff account details</legend>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-space-3)', marginTop: 'var(--md-space-2)' }}>
                <TextField
                  label="Email address"
                  type="email"
                  required
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                  autoComplete="off"
                />
                <TextField
                  label="Full name"
                  type="text"
                  required
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  autoComplete="off"
                />
                <TextField
                  label="Mobile number"
                  type="tel"
                  value={createMobile}
                  onChange={(e) => setCreateMobile(e.target.value)}
                  autoComplete="off"
                />
                <TextArea
                  label="Full address"
                  rows={2}
                  value={createLocality}
                  onChange={(e) => setCreateLocality(e.target.value)}
                />
                <TextField
                  label="Temporary password"
                  type="password"
                  required
                  minLength={8}
                  value={createPassword}
                  onChange={(e) => setCreatePassword(e.target.value)}
                  autoComplete="new-password"
                  helperText="At least 8 characters. Give this to the staff member securely."
                />
              </div>
            </fieldset>

            <fieldset style={{ border: '1px solid var(--md-sys-color-outline-variant)', borderRadius: 'var(--md-sys-shape-corner-medium)', padding: 'var(--md-space-4)', margin: 0 }}>
              <legend style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--md-sys-color-on-surface)', padding: '0 var(--md-space-2)' }}>Staff roles</legend>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-space-2)', marginTop: 'var(--md-space-2)' }}>
                {(Object.keys(ROLE_LABELS) as StaffRole[]).map((role) => (
                  <Checkbox
                    key={role}
                    checked={createRoles.includes(role)}
                    onChange={() => toggleCreateRole(role)}
                    label={ROLE_LABELS[role]}
                  />
                ))}
              </div>
              <p style={{ color: 'var(--md-sys-color-on-surface-variant)', fontSize: '0.8rem', margin: 'var(--md-space-2) 0 0 0' }}>
                Assign at least one role. Staff accounts cannot be created as runner-only accounts here.
              </p>
            </fieldset>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--md-space-2)', marginTop: 'var(--md-space-2)' }}>
              <Button variant="text" disabled={creating} onClick={closeCreateStaff}>
                Cancel
              </Button>
              <Button
                variant="filled"
                type="submit"
                loading={creating}
                disabled={creating || !createEmail.trim() || !createName.trim() || createPassword.length < 8 || createRoles.length === 0}
                leadingIcon={<UserPlus size={16} />}
              >
                Create staff account
              </Button>
            </div>
          </form>
        )}
      </Dialog>

      {/* Edit user modal */}
      <Dialog
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title="Edit user"
      >
        <p style={{ margin: '0 0 var(--md-space-4) 0', color: 'var(--md-sys-color-on-surface-variant)', fontSize: '0.875rem' }}>
          Update profile information, access, roles, and login credentials.
        </p>
        {loadingDetails ? (
          <LoadingState message="Loading complete user details…" />
        ) : selected ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void handleSave();
            }}
            style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-space-4)' }}
          >
            <Card variant="filled" style={{ padding: 'var(--md-space-3)', display: 'grid', gridTemplateColumns: '120px 1fr', gap: 'var(--md-space-1)', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Account ID</span>
              <strong style={{ fontFamily: 'monospace' }}>{selected.id}</strong>
              <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Created</span>
              <strong>{new Date(selected.created_at).toLocaleString('en-PH')}</strong>
            </Card>

            <fieldset style={{ border: '1px solid var(--md-sys-color-outline-variant)', borderRadius: 'var(--md-sys-shape-corner-medium)', padding: 'var(--md-space-4)', margin: 0 }}>
              <legend style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--md-sys-color-on-surface)', padding: '0 var(--md-space-2)' }}>Account details</legend>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-space-3)', marginTop: 'var(--md-space-2)' }}>
                <TextField
                  label="Email address"
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  autoComplete="off"
                />
                <TextField
                  label="Full name"
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
                <TextField
                  label="Mobile number"
                  type="tel"
                  value={editMobile}
                  onChange={(e) => setEditMobile(e.target.value)}
                />
                <TextArea
                  label="Full address"
                  rows={2}
                  value={editLocality}
                  onChange={(e) => setEditLocality(e.target.value)}
                />
              </div>
            </fieldset>

            <fieldset style={{ border: '1px solid var(--md-sys-color-outline-variant)', borderRadius: 'var(--md-sys-shape-corner-medium)', padding: 'var(--md-space-4)', margin: 0 }}>
              <legend style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--md-sys-color-on-surface)', padding: '0 var(--md-space-2)' }}>Access and staff roles</legend>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-space-2)', marginTop: 'var(--md-space-2)' }}>
                {(Object.keys(ROLE_LABELS) as StaffRole[]).map((role) => (
                  <Checkbox
                    key={role}
                    checked={editRoles.includes(role)}
                    onChange={() => toggleRole(role)}
                    label={ROLE_LABELS[role]}
                  />
                ))}
              </div>
              <div style={{ marginTop: 'var(--md-space-3)', paddingTop: 'var(--md-space-3)', borderTop: '1px solid var(--md-sys-color-outline-variant)' }}>
                <Checkbox
                  checked={editSuspended}
                  disabled={selected.id === user?.id}
                  onChange={(e) => setEditSuspended(e.target.checked)}
                  label="Suspend this account (prevents login and participation)"
                />
              </div>
              <p style={{ color: 'var(--md-sys-color-on-surface-variant)', fontSize: '0.8rem', margin: 'var(--md-space-2) 0 0 0' }}>
                Runner access is always retained. Clearing all staff roles leaves this as a runner-only account.
              </p>
            </fieldset>

            <fieldset style={{ border: '1px solid var(--md-sys-color-outline-variant)', borderRadius: 'var(--md-sys-shape-corner-medium)', padding: 'var(--md-space-4)', margin: 0 }}>
              <legend style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--md-sys-color-on-surface)', padding: '0 var(--md-space-2)' }}>Password reset</legend>
              <TextField
                label="New password"
                type="password"
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                placeholder="Leave blank to keep current password"
                helperText="If entered, the new password takes effect immediately. Give it securely."
              />
            </fieldset>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--md-space-2)', marginTop: 'var(--md-space-2)' }}>
              <Button variant="text" disabled={saving} onClick={() => setSelected(null)}>
                Cancel
              </Button>
              <Button
                variant="filled"
                type="submit"
                loading={saving}
                disabled={saving || !editEmail.trim() || !editName.trim()}
                leadingIcon={<Save size={16} />}
              >
                Save changes
              </Button>
            </div>
          </form>
        ) : null}
      </Dialog>
    </div>
  );
}
