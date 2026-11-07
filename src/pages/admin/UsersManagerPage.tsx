import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ClipboardCopy,
  MapPin,
  Pencil,
  Phone,
  Trash2,
  UserPlus,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  Copy,
  ExternalLink,
  Ban,
  Mail,
  Users,
} from 'lucide-react';
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
import {
  listStaffRequests,
  approveStaffRequest,
  rejectStaffRequest,
  listTrackedStaffInvites,
  generateStaffInviteCode,
  revokeStaffInviteCode,
  deleteStaffInviteCode,
  type PendingStaffRequest,
  type TrackedStaffInvite,
  type StaffInviteClaimant,
} from '../../features/staff/staffInviteQueries';
import type { DbStaffInvite, AppRole } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { LoadingState, EmptyState } from '../../features/ui/FeedbackStates';
import { useToast } from '../../features/ui/useToast';
import { useAuth } from '../../features/auth/useAuth';
import { Button } from '../../components/Button';
import { Card } from '../../components/m3/Card';
import { Dialog } from '../../components/m3/Dialog';
import { TextField } from '../../components/m3/TextField';
import { SelectField } from '../../components/m3/SelectField';
import { SearchBar } from '../../components/m3/SearchBar';
import { getStaffInviteLink } from '../../lib/siteUrl';

const ROLE_LABELS: Record<StaffRole, string> = {
  super_admin: 'Super Administrator',
  admin: 'Administrator',
  activities_coordinator: 'Activities Coordinator',
  news_in_charge: 'News in charge',
  registrations_manager: 'Registrations Manager',
  kit_claims_officer: 'Kit Claims Desk',
  timing_official: 'Race Timing Official',
  delegations_manager: 'Delegations Coordinator',
  delegation_head: 'Delegation Head (Scoped)',
  finance_officer: 'Finance Officer',
  sponsors_manager: 'Sponsors Manager',
  gallery_manager: 'Gallery & Media Manager',
  audit_viewer: 'Audit Inspector',
  settings_manager: 'Settings Manager',
  users_manager: 'User & Staff Manager',
};

const ROLE_GROUPS = [
  {
    category: 'Run Operations',
    roles: [
      { id: 'registrations_manager' as StaffRole, label: 'Registrations Manager', desc: 'Review run signups, verify payments, assign bibs & QR tokens' },
      { id: 'kit_claims_officer' as StaffRole, label: 'Kit Claims Desk', desc: 'Scan runner QR passes, record singlet kits, sync offline claims' },
      { id: 'timing_official' as StaffRole, label: 'Race Timing Official', desc: 'Trigger category race guns, record finish line scans & live leaderboard' },
    ],
  },
  {
    category: 'Festival & Liturgy',
    roles: [
      { id: 'activities_coordinator' as StaffRole, label: 'Activities Coordinator', desc: 'Manage novena masses, nightly presentations & liturgical timeline' },
      { id: 'delegations_manager' as StaffRole, label: 'Delegations Coordinator', desc: 'Oversee festival contingents, review rosters & rehearsal audio' },
      { id: 'delegation_head' as StaffRole, label: 'Delegation Head (Scoped)', desc: 'Restricted strictly to assigned contingent music & roster' },
    ],
  },
  {
    category: 'Communications & Media',
    roles: [
      { id: 'news_in_charge' as StaffRole, label: 'News In-Charge', desc: 'Write, publish, and edit parish news articles & bulletins' },
      { id: 'sponsors_manager' as StaffRole, label: 'Sponsors Manager', desc: 'Manage corporate partners, sponsorship tiers & official logos' },
      { id: 'gallery_manager' as StaffRole, label: 'Gallery & Media Manager', desc: 'Curate official photo albums and YouTube video highlights' },
    ],
  },
  {
    category: 'Finance & Records',
    roles: [
      { id: 'finance_officer' as StaffRole, label: 'Finance Officer', desc: 'Record cash ledger transactions, audited voids & CSV exports' },
      { id: 'audit_viewer' as StaffRole, label: 'Audit Inspector', desc: 'Inspect immutable security audit logs & RFC-4180 export' },
      { id: 'settings_manager' as StaffRole, label: 'Website Settings', desc: 'Manage edition parameters, registration toggle & GCash accounts' },
      { id: 'users_manager' as StaffRole, label: 'Users & Staff Manager', desc: 'Manage committee staff accounts and approval requests' },
    ],
  },
  {
    category: 'Full System Authority',
    roles: [
      { id: 'admin' as StaffRole, label: 'Administrator', desc: 'Full operational access across all committee pages and desks' },
      { id: 'super_admin' as StaffRole, label: 'Super Administrator', desc: 'Creator account: generate invite codes, full system control' },
    ],
  },
] as const;

type ActiveTab = 'users' | 'requests' | 'invites';

export function UsersManagerPage() {
  const { user, isSuperAdmin, isAdmin, isDemoAdmin } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<ActiveTab>('users');
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [requests, setRequests] = useState<PendingStaffRequest[]>([]);
  const [invites, setInvites] = useState<TrackedStaffInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | StaffRole | 'runner'>('all');

  // Edit User Dialog state
  const [selected, setSelected] = useState<ManagedUser | null>(null);
  const [editEmail, setEditEmail] = useState('');
  const [editName, setEditName] = useState('');
  const [editMobile, setEditMobile] = useState('');
  const [editLocality, setEditLocality] = useState('');
  const [editRoles, setEditRoles] = useState<StaffRole[]>([]);
  const [editSuspended, setEditSuspended] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Create Staff Dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createName, setCreateName] = useState('');
  const [createMobile, setCreateMobile] = useState('');
  const [createLocality, setCreateLocality] = useState('');
  const [createRoles, setCreateRoles] = useState<StaffRole[]>([]);
  const [createdCredentials, setCreatedCredentials] = useState<{ name: string; email: string; password: string } | null>(null);

  // Approval Dialog state
  const [approvingReq, setApprovingReq] = useState<PendingStaffRequest | null>(null);
  const [approveRoles, setApproveRoles] = useState<StaffRole[]>([]);
  const [approving, setApproving] = useState(false);

  // Generate Invite Dialog state
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteNote, setInviteNote] = useState('');
  const [inviteMaxUses, setInviteMaxUses] = useState<number>(25);
  const [inviteExpiresDays, setInviteExpiresDays] = useState<number>(30);
  const [inviteCustomCode, setInviteCustomCode] = useState('');
  const [generatingInvite, setGeneratingInvite] = useState(false);
  const [lastGeneratedInvite, setLastGeneratedInvite] = useState<DbStaffInvite | null>(null);

  const canManage = isSuperAdmin || isAdmin || isDemoAdmin;

  const loadData = useCallback(async () => {
    if (isDemoAdmin && !user) {
      setUsers([]);
      setRequests([]);
      setInvites([]);
      setLoading(false);
      return;
    }
    try {
      const [uList, rList, iList] = await Promise.all([
        listUsersForAdmin(),
        listStaffRequests().catch((e) => {
          console.error('Failed to load staff requests:', e);
          return [];
        }),
        listTrackedStaffInvites().catch((e) => {
          console.error('Failed to load staff invites:', e);
          return [];
        }),
      ]);
      setUsers(uList);
      setRequests(rList);
      setInvites(iList);
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to load user directory.', 'error');
    } finally {
      setLoading(false);
    }
  }, [isDemoAdmin, user, toast]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadData(), 0);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  const pendingCount = useMemo(
    () => requests.filter((r) => r.status === 'pending').length,
    [requests]
  );

  const [nowTimestamp] = useState(() => Date.now());

  const filtered = useMemo(() => {
    const rolePriority = (u: ManagedUser) => {
      if (u.roles.includes('super_admin')) return 0;
      if (u.roles.includes('admin')) return 1;
      if (u.roles.some((r) => r !== 'public_user')) return 2;
      return 3;
    };

    return users
      .filter((u) => {
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
      })
      .sort((a, b) => {
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
    setEditRoles(u.roles.filter((r): r is StaffRole => r !== 'public_user'));
    setEditSuspended(Boolean(u.suspended_at));
    setNewPassword('');

    try {
      const details = await getManagedUserDetails(u.id);
      setSelected(details);
      setEditEmail(details.email || '');
      setEditName(details.full_name || '');
      setEditMobile(details.mobile || '');
      setEditLocality(details.locality || '');
      setEditRoles(details.roles.filter((r): r is StaffRole => r !== 'public_user'));
      setEditSuspended(Boolean(details.suspended_at));
    } catch {
      // Keep optimistic values if server fetch fails
    }
  }

  function toggleRole(role: StaffRole, list: StaffRole[], setList: (r: StaffRole[]) => void) {
    // If not super admin, cannot toggle super_admin or admin
    if (!isSuperAdmin && (role === 'super_admin' || role === 'admin')) {
      toast('Only the Super Administrator can assign Administrator or Super Administrator roles.', 'error');
      return;
    }
    if (list.includes(role)) {
      setList(list.filter((r) => r !== role));
    } else {
      setList([...list, role]);
    }
  }

  async function handleSaveUser() {
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
      toast(newPassword ? 'User details, roles, and password updated.' : 'User details and roles updated.', 'success');
      setSelected(null);
      setNewPassword('');
      await loadData();
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
        throw new Error('This account still has an active registration. Reject or suspend before deleting.');
      }
      const confirmed = window.confirm(`Permanently delete account ${u.full_name || u.id}? This action cannot be undone.`);
      if (!confirmed) return;
      await deleteManagedUserAsAdmin(u.id);
      toast('User account permanently deleted.', 'success');
      await loadData();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Unable to delete user account.', 'error');
    } finally {
      setDeletingId(null);
    }
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
      toast('Staff account created.', 'success');
      await loadData();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Unable to create staff account.', 'error');
    } finally {
      setCreating(false);
    }
  }

  function openApproveModal(req: PendingStaffRequest) {
    setApprovingReq(req);
    // Default recommended roles: Run operations or common operational roles
    setApproveRoles(['registrations_manager', 'kit_claims_officer']);
  }

  async function handleApproveRequest() {
    if (!approvingReq || approveRoles.length === 0) {
      toast('Please select at least one role to grant to this staff member.', 'error');
      return;
    }
    setApproving(true);
    try {
      await approveStaffRequest(approvingReq.id, approveRoles as AppRole[]);
      toast(`Approved ${approvingReq.applicantName}! Their assigned roles are now active.`, 'success');
      setApprovingReq(null);
      await loadData();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Unable to approve staff request.', 'error');
    } finally {
      setApproving(false);
    }
  }

  async function handleRejectRequest(req: PendingStaffRequest) {
    const reason = window.prompt(`Reject committee onboarding request for ${req.applicantName}? Enter optional reason:`);
    if (reason === null) return;
    try {
      await rejectStaffRequest(req.id, reason);
      toast(`Request for ${req.applicantName} was rejected.`, 'info');
      await loadData();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Unable to reject request.', 'error');
    }
  }

  function openApproveModalForClaimant(claimant: StaffInviteClaimant, inviteCode: string) {
    const existing = requests.find((r) => r.id === claimant.requestId);
    if (existing) {
      openApproveModal(existing);
      return;
    }
    openApproveModal({
      id: claimant.requestId,
      user_id: claimant.userId,
      invite_code: inviteCode,
      invite_id: null,
      status: claimant.status,
      notes: null,
      requested_at: claimant.requestedAt,
      reviewed_by: null,
      reviewed_at: null,
      assigned_roles: claimant.assignedRoles,
      applicant_email: claimant.email,
      applicant_name: claimant.name,
      applicantName: claimant.name,
      applicantEmail: claimant.email,
      applicantMobile: claimant.mobile,
      applicantLocality: null,
    });
  }

  async function handleGenerateInvite() {
    setGeneratingInvite(true);
    try {
      const invite = await generateStaffInviteCode({
        note: inviteNote,
        maxUses: inviteMaxUses || 1,
        expiresInDays: inviteExpiresDays || 30,
        customCode: inviteCustomCode,
      });
      setLastGeneratedInvite(invite);
      toast(`Staff invite code ${invite.code} created!`, 'success');
      setActiveTab('invites');
      await loadData();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Unable to generate invite code.', 'error');
    } finally {
      setGeneratingInvite(false);
    }
  }

  async function handleRevokeInvite(inviteId: string) {
    if (!window.confirm('Are you sure you want to deactivate this invite code? Nobody else will be able to claim it.')) return;
    try {
      await revokeStaffInviteCode(inviteId);
      toast('Invite code deactivated.', 'info');
      await loadData();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Unable to deactivate code.', 'error');
    }
  }

  async function handleDeleteInvite(inv: TrackedStaffInvite) {
    const claimantNotice =
      inv.claimants.length > 0
        ? ` (${inv.claimants.length} staff member${inv.claimants.length > 1 ? 's' : ''} who already joined with this code will keep their accounts and will NOT be affected)`
        : '';
    const confirmed = window.confirm(
      `Permanently delete invite code ${inv.code}? It will be completely removed from this page${claimantNotice}.`
    );
    if (!confirmed) return;
    try {
      await deleteStaffInviteCode(inv.id);
      toast(`Invite code ${inv.code} deleted.`, 'info');
      await loadData();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Unable to delete invite code.', 'error');
    }
  }

  async function copyText(text: string, msg = 'Copied to clipboard!') {
    try {
      await navigator.clipboard.writeText(text);
      toast(msg, 'success');
    } catch {
      toast('Could not copy automatically.', 'error');
    }
  }

  if (!canManage) {
    return (
      <div className="admin-page">
        <EmptyState
          title="Administrators only"
          message="Only administrators can manage users, generate invite codes, and approve staff requests."
        />
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-heading">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <p className="eyebrow" style={{ margin: 0 }}>Committee Administration</p>
            {isSuperAdmin && (
              <StatusBadge tone="success">
                <ShieldCheck size={13} style={{ display: 'inline', marginRight: '3px' }} />
                Super Admin
              </StatusBadge>
            )}
          </div>
          <h1 style={{ marginTop: '4px' }}>Users & Staff</h1>
          <p>
            Generate committee invite codes for Google sign-in, review pending staff approvals, and assign granular page access roles.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {isSuperAdmin && (
            <Button
              variant="outlined"
              leadingIcon={<KeyRound size={17} />}
              onClick={() => {
                setLastGeneratedInvite(null);
                setInviteNote('');
                setInviteCustomCode('');
                setInviteModalOpen(true);
              }}
            >
              Generate invite code
            </Button>
          )}
          <Button variant="filled" leadingIcon={<UserPlus size={17} />} onClick={openCreateStaff}>
            Create staff account
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--md-sys-color-outline-variant)', marginBottom: '16px' }}>
        <button
          type="button"
          className={`button ${activeTab === 'users' ? 'button--filled' : 'button--ghost'}`}
          onClick={() => setActiveTab('users')}
          style={{ borderRadius: '8px 8px 0 0' }}
        >
          Staff & Registered Users ({users.length})
        </button>
        <button
          type="button"
          className={`button ${activeTab === 'requests' ? 'button--filled' : 'button--ghost'}`}
          onClick={() => setActiveTab('requests')}
          style={{ borderRadius: '8px 8px 0 0', position: 'relative' }}
        >
          Pending Approvals
          {pendingCount > 0 && (
            <span
              style={{
                marginLeft: '8px',
                padding: '2px 7px',
                borderRadius: '12px',
                background: activeTab === 'requests' ? '#fff' : 'var(--md-sys-color-primary)',
                color: activeTab === 'requests' ? 'var(--md-sys-color-primary)' : '#fff',
                fontSize: '0.75rem',
                fontWeight: 700,
              }}
            >
              {pendingCount}
            </span>
          )}
        </button>
        <button
          type="button"
          className={`button ${activeTab === 'invites' ? 'button--filled' : 'button--ghost'}`}
          onClick={() => setActiveTab('invites')}
          style={{ borderRadius: '8px 8px 0 0' }}
        >
          Invite Codes ({invites.length})
        </button>
      </div>

      {/* TAB 1: USERS DIRECTORY */}
      {activeTab === 'users' && (
        <Card variant="outlined" className="users-admin-panel" style={{ padding: 'var(--md-space-4)' }}>
          <div className="table-tools admin-toolbar users-toolbar">
            <div className="users-toolbar__search-wrap">
              <SearchBar
                label="Search accounts"
                placeholder="Search by name, mobile, address, or ID…"
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
                <option value="super_admin">Super Administrators</option>
                <option value="admin">Administrators</option>
                <option value="registrations_manager">Registrations Managers</option>
                <option value="kit_claims_officer">Kit Claims Desk</option>
                <option value="timing_official">Timing Officials</option>
                <option value="activities_coordinator">Activities Coordinators</option>
                <option value="news_in_charge">News in Charge</option>
                <option value="delegations_manager">Delegations Coordinators</option>
                <option value="finance_officer">Finance Officers</option>
                <option value="sponsors_manager">Sponsors Managers</option>
                <option value="gallery_manager">Gallery Managers</option>
                <option value="audit_viewer">Audit Inspectors</option>
                <option value="settings_manager">Settings Managers</option>
                <option value="users_manager">User Managers</option>
                <option value="runner">Runners only (no staff role)</option>
              </SelectField>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: '3rem' }}>
              <LoadingState message="Loading accounts…" />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              title="No users found"
              message="No profiles matched this search or filter."
            />
          ) : (
            <div className="admin-table users-table">
              <div className="admin-table__head users-table__grid">
                <span>Name</span>
                <span>Contact</span>
                <span>Roles & Page Permissions</span>
                <span>Status</span>
                <span style={{ textAlign: 'right' }}>Actions</span>
              </div>

              {filtered.map((u) => {
                const staffRoles = u.roles.filter((r) => r !== 'public_user') as StaffRole[];
                return (
                  <div key={u.id} className="admin-table__row users-table__grid users-table__row">
                    <div className="users-table__identity">
                      <strong>{u.full_name || 'Unnamed account'}</strong>
                      {u.email && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-primary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '1px' }}>
                          <Mail size={12} />
                          <span>{u.email}</span>
                        </div>
                      )}
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
                        <StatusBadge tone="warning">Runner</StatusBadge>
                      ) : (
                        staffRoles.map((r) => (
                          <StatusBadge key={r} tone={r === 'super_admin' ? 'success' : r === 'admin' ? 'success' : 'neutral'}>
                            {ROLE_LABELS[r] || r}
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
        </Card>
      )}

      {/* TAB 2: PENDING APPROVALS */}
      {activeTab === 'requests' && (
        <Card variant="outlined" style={{ padding: 'var(--md-space-4)' }}>
          <div style={{ marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '4px' }}>Staff Onboarding Queue</h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--md-sys-color-on-surface-variant)', margin: 0 }}>
              Staff members who signed in with Google and claimed an invite code appear here. Review the applicant and check the exact roles they can access.
            </p>
          </div>

          {loading ? (
            <div style={{ padding: '3rem' }}>
              <LoadingState message="Loading onboarding requests…" />
            </div>
          ) : requests.length === 0 ? (
            <EmptyState
              title="No onboarding requests"
              message="When committee members use their invite code to register via Google, their requests will appear here for review."
            />
          ) : (
            <div className="admin-table">
              <div className="admin-table__head" style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 2fr', gap: '12px', alignItems: 'center' }}>
                <span>Applicant</span>
                <span>Contact / Address</span>
                <span>Invite Code</span>
                <span>Requested At</span>
                <span>Status</span>
                <span style={{ textAlign: 'right' }}>Action</span>
              </div>

              {requests.map((req) => (
                <div
                  key={req.id}
                  className="admin-table__row"
                  style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 2fr', gap: '12px', alignItems: 'center' }}
                >
                  <div>
                    <strong>{req.applicantName}</strong>
                    {req.applicantEmail && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-primary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                        <Mail size={12} />
                        <span>{req.applicantEmail}</span>
                      </div>
                    )}
                    <small style={{ display: 'block', color: 'var(--md-sys-color-on-surface-variant)', fontSize: '0.75rem' }}>
                      ID: {req.user_id.slice(0, 8)}…
                    </small>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem' }}>{req.applicantMobile || '—'}</div>
                    <small style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{req.applicantLocality || '—'}</small>
                  </div>
                  <div>
                    <code style={{ padding: '2px 6px', background: 'var(--md-sys-color-surface-container-high)', borderRadius: '4px', fontWeight: 600 }}>
                      {req.invite_code}
                    </code>
                  </div>
                  <div style={{ fontSize: '0.85rem' }}>
                    {new Date(req.requested_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  <div>
                    <StatusBadge tone={req.status === 'approved' ? 'success' : req.status === 'rejected' ? 'danger' : 'warning'}>
                      {req.status === 'approved' ? 'Approved' : req.status === 'rejected' ? 'Rejected' : 'Pending'}
                    </StatusBadge>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                    {req.status === 'pending' ? (
                      <>
                        <Button variant="filled" onClick={() => openApproveModal(req)}>
                          Approve & Assign Roles
                        </Button>
                        <Button variant="outlined" onClick={() => void handleRejectRequest(req)}>
                          Reject
                        </Button>
                      </>
                    ) : (
                      <span style={{ fontSize: '0.85rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
                        {req.status === 'approved' ? `Granted: ${(req.assigned_roles || []).join(', ') || 'Staff'}` : 'Declined'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* TAB 3: INVITE CODES */}
      {activeTab === 'invites' && (
        <Card variant="outlined" style={{ padding: 'var(--md-space-4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <KeyRound size={20} style={{ color: 'var(--md-sys-color-primary)' }} />
                <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Committee Staff Invite Codes</h2>
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--md-sys-color-on-surface-variant)', margin: '4px 0 0 0' }}>
                Generate codes and direct onboarding links for committee members to sign up with their Google accounts. Track usage and member sign-ups in real time.
              </p>
            </div>
            {isSuperAdmin && (
              <Button
                variant="filled"
                leadingIcon={<KeyRound size={17} />}
                onClick={() => {
                  setLastGeneratedInvite(null);
                  setInviteNote('');
                  setInviteCustomCode('');
                  setInviteMaxUses(25);
                  setInviteExpiresDays(30);
                  setInviteModalOpen(true);
                }}
              >
                Generate New Code
              </Button>
            )}
          </div>

          {loading ? (
            <div style={{ padding: '3rem' }}>
              <LoadingState message="Loading invite codes and tracking data…" />
            </div>
          ) : invites.length === 0 ? (
            <EmptyState
              title="No invite codes generated yet"
              message="Click 'Generate New Code' above to create your first committee staff invite link."
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {invites.map((inv) => {
                const joinUrl = getStaffInviteLink(inv.code);
                const isExpired = Boolean(inv.expires_at && new Date(inv.expires_at).getTime() < nowTimestamp);
                const isExhausted = inv.max_uses > 0 && inv.uses_count >= inv.max_uses;
                const active = inv.is_active && !isExpired && !isExhausted;
                const usagePercent = inv.max_uses > 0 ? Math.min(100, Math.round((inv.uses_count / inv.max_uses) * 100)) : 0;
                const pendingClaimantsCount = inv.claimants.filter((c) => c.status === 'pending').length;

                return (
                  <Card
                    key={inv.id}
                    variant="outlined"
                    style={{
                      padding: '20px',
                      borderRadius: '16px',
                      borderColor: active ? 'var(--md-sys-color-outline-variant)' : 'var(--md-sys-color-outline)',
                      background: active ? 'var(--md-sys-color-surface)' : 'var(--md-sys-color-surface-container-low)',
                    }}
                  >
                    {/* Top Header Row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                          <code
                            style={{
                              fontSize: '1.25rem',
                              fontWeight: 800,
                              letterSpacing: '1px',
                              padding: '4px 10px',
                              background: 'var(--md-sys-color-surface-container-high)',
                              border: '1px solid var(--md-sys-color-outline-variant)',
                              borderRadius: '8px',
                              color: 'var(--md-sys-color-primary)',
                            }}
                          >
                            {inv.code}
                          </code>
                          <StatusBadge tone={!inv.is_active ? 'danger' : isExpired ? 'danger' : isExhausted ? 'neutral' : 'success'}>
                            {!inv.is_active ? 'Revoked' : isExpired ? 'Expired' : isExhausted ? 'Fully Claimed' : 'Active — Ready to Claim'}
                          </StatusBadge>
                          {pendingClaimantsCount > 0 && (
                            <StatusBadge tone="warning">
                              {pendingClaimantsCount} Pending Approval
                            </StatusBadge>
                          )}
                        </div>
                        <div style={{ marginTop: '8px', fontSize: '0.92rem' }}>
                          <strong>Assignment / Purpose:</strong>{' '}
                          <span style={{ color: inv.note ? 'inherit' : 'var(--md-sys-color-on-surface-variant)' }}>
                            {inv.note || 'General Committee Invitation'}
                          </span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <Button
                          variant="outlined"
                          size="small"
                          leadingIcon={<Copy size={15} />}
                          onClick={() => void copyText(joinUrl, 'Direct invite link copied!')}
                          title="Copy direct onboarding link"
                        >
                          Copy Onboarding Link
                        </Button>
                        <Button
                          variant="ghost"
                          size="small"
                          leadingIcon={<Copy size={15} />}
                          onClick={() => void copyText(inv.code, 'Invite code copied!')}
                          title="Copy code only"
                        >
                          Copy Code
                        </Button>
                        {isSuperAdmin && inv.is_active && (
                          <Button
                            variant="ghost"
                            size="small"
                            leadingIcon={<Ban size={15} />}
                            onClick={() => void handleRevokeInvite(inv.id)}
                            style={{ color: 'var(--md-sys-color-error)' }}
                            title="Deactivate this invite code so no more staff can claim it"
                          >
                            Deactivate
                          </Button>
                        )}
                        {isSuperAdmin && (
                          <Button
                            variant="ghost"
                            size="small"
                            leadingIcon={<Trash2 size={15} />}
                            onClick={() => void handleDeleteInvite(inv)}
                            style={{ color: 'var(--md-sys-color-error)' }}
                            title="Permanently delete invite code so it is not seen on this page"
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Real-Time Tracking Grid */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                        gap: '12px',
                        padding: '12px 16px',
                        background: 'var(--md-sys-color-surface-container)',
                        borderRadius: '12px',
                        marginBottom: '16px',
                      }}
                    >
                      <div>
                        <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--md-sys-color-on-surface-variant)' }}>
                          Usage Tracking
                        </span>
                        <div style={{ fontSize: '1.05rem', fontWeight: 700, marginTop: '2px' }}>
                          {inv.uses_count === 0 ? (
                            <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>0 used (Not claimed)</span>
                          ) : (
                            <span style={{ color: 'var(--md-sys-color-primary)' }}>
                              {inv.uses_count} {inv.uses_count === 1 ? 'staff joined' : 'staff joined'}
                            </span>
                          )}
                        </div>
                      </div>

                      <div>
                        <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--md-sys-color-on-surface-variant)' }}>
                          Slots Remaining
                        </span>
                        <div style={{ fontSize: '1.05rem', fontWeight: 700, marginTop: '2px' }}>
                          {inv.remainingUses === 'unlimited' ? (
                            <span>Unlimited slots</span>
                          ) : inv.remainingUses === 0 ? (
                            <span style={{ color: 'var(--md-sys-color-error)' }}>0 left (Full)</span>
                          ) : (
                            <span style={{ color: '#2e7d32' }}>
                              {inv.remainingUses} left <span style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--md-sys-color-on-surface-variant)' }}>(of {inv.max_uses})</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <div>
                        <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--md-sys-color-on-surface-variant)' }}>
                          Expiration Date
                        </span>
                        <div style={{ fontSize: '0.92rem', fontWeight: 600, marginTop: '4px' }}>
                          {inv.expires_at ? (
                            new Date(inv.expires_at).toLocaleDateString('en-PH', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          ) : (
                            'Never expires'
                          )}
                        </div>
                      </div>

                      <div>
                        <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--md-sys-color-on-surface-variant)' }}>
                          Created Date
                        </span>
                        <div style={{ fontSize: '0.92rem', fontWeight: 600, marginTop: '4px' }}>
                          {new Date(inv.created_at).toLocaleDateString('en-PH', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Capacity Progress Bar */}
                    {inv.max_uses > 0 && (
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--md-sys-color-on-surface-variant)', marginBottom: '4px' }}>
                          <span>Capacity utilization ({usagePercent}%)</span>
                          <span>{inv.uses_count} of {inv.max_uses} slots claimed</span>
                        </div>
                        <div style={{ width: '100%', height: '6px', background: 'var(--md-sys-color-surface-container-highest)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div
                            style={{
                              height: '100%',
                              width: `${usagePercent}%`,
                              background: isExhausted ? 'var(--md-sys-color-outline)' : 'var(--md-sys-color-primary)',
                              transition: 'width 0.3s ease',
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Google Accounts Signed Up Section */}
                    <div style={{ borderTop: '1px solid var(--md-sys-color-outline-variant)', paddingTop: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Users size={16} style={{ color: 'var(--md-sys-color-primary)' }} />
                          <strong style={{ fontSize: '0.92rem' }}>
                            Google Accounts Signed Up with this Code ({inv.claimants.length})
                          </strong>
                        </div>
                      </div>

                      {inv.claimants.length === 0 ? (
                        <p style={{ margin: '6px 0 0 0', fontSize: '0.84rem', color: 'var(--md-sys-color-on-surface-variant)', fontStyle: 'italic' }}>
                          No Google accounts have signed up with this code yet. Share the onboarding link or code with committee members to track them here.
                        </p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                          {inv.claimants.map((c) => (
                            <div
                              key={c.requestId}
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '10px 14px',
                                background: 'var(--md-sys-color-surface-container-low)',
                                border: '1px solid var(--md-sys-color-outline-variant)',
                                borderRadius: '10px',
                                flexWrap: 'wrap',
                                gap: '10px',
                              }}
                            >
                              <div>
                                {/* Google Email Display */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <Mail size={15} style={{ color: 'var(--md-sys-color-primary)', flexShrink: 0 }} />
                                  <strong style={{ fontSize: '0.92rem', color: 'var(--md-sys-color-on-surface)' }}>
                                    {c.email || 'Google email not recorded'}
                                  </strong>
                                  {c.email && (
                                    <button
                                      type="button"
                                      className="button button--ghost button--sm"
                                      style={{ padding: '2px 5px', height: 'auto' }}
                                      onClick={() => void copyText(c.email!, 'Email copied!')}
                                      title="Copy Google email"
                                    >
                                      <Copy size={12} />
                                    </button>
                                  )}
                                </div>
                                {/* Name & Mobile & Timestamp */}
                                <div style={{ fontSize: '0.82rem', color: 'var(--md-sys-color-on-surface-variant)', marginTop: '2px' }}>
                                  <span>{c.name}</span>
                                  {c.mobile && <span> · {c.mobile}</span>}
                                  <span> · Signed up {new Date(c.requestedAt).toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                                </div>
                              </div>

                              {/* Status & Review Action */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                {c.status === 'pending' && (
                                  <>
                                    <StatusBadge tone="warning">Pending Approval</StatusBadge>
                                    <Button
                                      variant="filled"
                                      size="small"
                                      onClick={() => openApproveModalForClaimant(c, inv.code)}
                                    >
                                      Review & Approve
                                    </Button>
                                  </>
                                )}
                                {c.status === 'approved' && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                    <StatusBadge tone="success">Approved</StatusBadge>
                                    {c.assignedRoles.length > 0 ? (
                                      c.assignedRoles.map((r) => (
                                        <span
                                          key={r}
                                          className="badge badge--neutral"
                                          style={{ fontSize: '0.72rem', padding: '2px 6px', background: 'var(--md-sys-color-surface-container-high)', borderRadius: '4px' }}
                                        >
                                          {ROLE_LABELS[r as StaffRole] || r}
                                        </span>
                                      ))
                                    ) : (
                                      <span style={{ fontSize: '0.78rem', color: 'var(--md-sys-color-on-surface-variant)' }}>Staff</span>
                                    )}
                                  </div>
                                )}
                                {c.status === 'rejected' && (
                                  <StatusBadge tone="danger">Rejected</StatusBadge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* DIALOG 1: GENERATE INVITE CODE (SUPER ADMIN) */}
      <Dialog
        open={inviteModalOpen}
        onClose={() => {
          setInviteModalOpen(false);
          setLastGeneratedInvite(null);
        }}
        title="Generate Staff Invite Code"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {lastGeneratedInvite ? (
            <div style={{ padding: '16px', background: 'rgba(52, 168, 83, 0.08)', borderRadius: '12px', border: '1px solid rgba(52, 168, 83, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <CheckCircle2 size={20} style={{ color: '#2e7d32' }} />
                <strong style={{ color: '#1b5e20' }}>Invite Code Ready!</strong>
              </div>
              <p style={{ margin: '0 0 12px 0', fontSize: '0.88rem' }}>
                Give this code or direct link to your committee staff so they can sign up with their Google account:
              </p>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
                <input
                  type="text"
                  readOnly
                  value={lastGeneratedInvite.code}
                  style={{
                    fontSize: '1.2rem',
                    fontWeight: 700,
                    letterSpacing: '1px',
                    padding: '8px 12px',
                    background: 'var(--md-sys-color-surface)',
                    border: '1px solid var(--md-sys-color-outline)',
                    borderRadius: '8px',
                    width: '100%',
                  }}
                />
                <Button
                  variant="filled"
                  leadingIcon={<Copy size={16} />}
                  onClick={() => void copyText(lastGeneratedInvite.code, 'Code copied!')}
                >
                  Copy
                </Button>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--md-sys-color-on-surface-variant)', display: 'block', marginBottom: '4px' }}>
                  Live Onboarding URL (works on any phone or device):
                </span>
                <input
                  type="text"
                  readOnly
                  value={getStaffInviteLink(lastGeneratedInvite.code)}
                  style={{
                    fontSize: '0.82rem',
                    padding: '8px 10px',
                    background: 'var(--md-sys-color-surface-container)',
                    border: '1px solid var(--md-sys-color-outline-variant)',
                    borderRadius: '8px',
                    width: '100%',
                    marginBottom: '8px',
                    fontFamily: 'monospace',
                  }}
                />
                <Button
                  variant="outlined"
                  leadingIcon={<ExternalLink size={16} />}
                  onClick={() => void copyText(getStaffInviteLink(lastGeneratedInvite.code), 'Live onboarding link copied!')}
                  style={{ width: '100%' }}
                >
                  Copy Live Onboarding Link
                </Button>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                <Button
                  variant="filled"
                  onClick={() => {
                    setInviteModalOpen(false);
                    setLastGeneratedInvite(null);
                    setInviteNote('');
                    setInviteCustomCode('');
                    setActiveTab('invites');
                  }}
                  style={{ flex: 1 }}
                >
                  Done & View in List
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setLastGeneratedInvite(null);
                    setInviteNote('');
                    setInviteCustomCode('');
                  }}
                  style={{ flex: 1 }}
                >
                  Generate Another Code
                </Button>
              </div>
            </div>
          ) : (
            <>
              <TextField
                label="Note / Committee Assignment"
                placeholder="e.g. Race Marshals, Liturgical Desk, Finance Team"
                value={inviteNote}
                onChange={(e) => setInviteNote(e.target.value)}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <SelectField
                  label="Maximum Uses"
                  value={String(inviteMaxUses)}
                  onChange={(e) => setInviteMaxUses(Number(e.target.value))}
                >
                  <option value="1">1 use (Single person)</option>
                  <option value="5">5 uses</option>
                  <option value="10">10 uses</option>
                  <option value="25">25 uses</option>
                  <option value="50">50 uses</option>
                  <option value="100">100 uses</option>
                  <option value="0">Unlimited uses</option>
                </SelectField>

                <SelectField
                  label="Expires In"
                  value={String(inviteExpiresDays)}
                  onChange={(e) => setInviteExpiresDays(Number(e.target.value))}
                >
                  <option value="7">7 days</option>
                  <option value="30">30 days</option>
                  <option value="90">90 days</option>
                  <option value="0">Never expires</option>
                </SelectField>
              </div>

              <TextField
                label="Custom Code (Optional)"
                placeholder="e.g. SINOOG-TIMING (leave blank for random)"
                value={inviteCustomCode}
                onChange={(e) => setInviteCustomCode(e.target.value.toUpperCase())}
              />
            </>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
            <Button
              variant="ghost"
              onClick={() => {
                setInviteModalOpen(false);
                setLastGeneratedInvite(null);
              }}
            >
              {lastGeneratedInvite ? 'Close' : 'Cancel'}
            </Button>
            {!lastGeneratedInvite && (
              <Button variant="filled" disabled={generatingInvite} onClick={() => void handleGenerateInvite()}>
                {generatingInvite ? 'Generating…' : 'Generate Code'}
              </Button>
            )}
          </div>
        </div>
      </Dialog>

      {/* DIALOG 2: APPROVE ONBOARDING REQUEST & ASSIGN ROLES */}
      <Dialog
        open={Boolean(approvingReq)}
        onClose={() => setApprovingReq(null)}
        title="Approve Staff Member & Assign Roles"
      >
        {approvingReq && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '70vh', overflowY: 'auto' }}>
            <div style={{ padding: '12px', background: 'var(--md-sys-color-surface-container-low)', borderRadius: '8px' }}>
              <strong>{approvingReq.applicantName}</strong>
              <div style={{ fontSize: '0.85rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
                Claimed Code: <code>{approvingReq.invite_code}</code> · Mobile: {approvingReq.applicantMobile || '—'}
              </div>
            </div>

            <p style={{ fontSize: '0.88rem', margin: 0 }}>
              Select which admin pages and desks this staff member can access. Only the checked roles will be accessible.
            </p>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="button button--ghost button--sm"
                onClick={() => setApproveRoles(['registrations_manager', 'kit_claims_officer', 'timing_official'])}
              >
                Select Run Ops
              </button>
              <button
                type="button"
                className="button button--ghost button--sm"
                onClick={() => setApproveRoles(['activities_coordinator', 'news_in_charge', 'gallery_manager'])}
              >
                Select Festival & Media
              </button>
              <button
                type="button"
                className="button button--ghost button--sm"
                onClick={() => setApproveRoles([])}
              >
                Clear Selection
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {ROLE_GROUPS.map((group) => {
                // If not super admin, hide full authority group
                if (!isSuperAdmin && group.category === 'Full System Authority') return null;

                return (
                  <div key={group.category} style={{ border: '1px solid var(--md-sys-color-outline-variant)', borderRadius: '8px', padding: '12px' }}>
                    <strong style={{ display: 'block', fontSize: '0.9rem', marginBottom: '8px', color: 'var(--md-sys-color-primary)' }}>
                      {group.category}
                    </strong>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {group.roles.map((r) => {
                        if (!isSuperAdmin && (r.id === 'super_admin' || r.id === 'admin')) return null;
                        const checked = approveRoles.includes(r.id);
                        return (
                          <label
                            key={r.id}
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '8px',
                              cursor: 'pointer',
                              padding: '6px',
                              borderRadius: '6px',
                              background: checked ? 'rgba(var(--md-sys-color-primary-rgb), 0.05)' : 'transparent',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleRole(r.id, approveRoles, setApproveRoles)}
                              style={{ marginTop: '3px' }}
                            />
                            <div>
                              <strong style={{ fontSize: '0.88rem', display: 'block' }}>{r.label}</strong>
                              <small style={{ color: 'var(--md-sys-color-on-surface-variant)', fontSize: '0.78rem' }}>{r.desc}</small>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
              <Button variant="ghost" onClick={() => setApprovingReq(null)}>
                Cancel
              </Button>
              <Button variant="filled" disabled={approving || approveRoles.length === 0} onClick={() => void handleApproveRequest()}>
                {approving ? 'Approving…' : 'Approve & Grant Roles'}
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      {/* DIALOG 3: EDIT EXISTING USER & ROLES */}
      <Dialog
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={`Edit User: ${selected?.full_name || 'Account'}`}
      >
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '70vh', overflowY: 'auto' }}>
            <TextField
              label="Full Name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              required
            />
            <TextField
              label="Email Address"
              type="email"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              required
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <TextField
                label="Mobile Number"
                value={editMobile}
                onChange={(e) => setEditMobile(e.target.value)}
              />
              <TextField
                label="Locality / Address"
                value={editLocality}
                onChange={(e) => setEditLocality(e.target.value)}
              />
            </div>

            <TextField
              label="New Password (optional)"
              type="password"
              placeholder="Leave blank to keep current password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />

            <div>
              <strong style={{ display: 'block', fontSize: '0.92rem', marginBottom: '8px' }}>
                Assigned Roles & Page Access
              </strong>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {ROLE_GROUPS.map((group) => {
                  if (!isSuperAdmin && group.category === 'Full System Authority') return null;

                  return (
                    <div key={group.category} style={{ border: '1px solid var(--md-sys-color-outline-variant)', borderRadius: '8px', padding: '10px' }}>
                      <strong style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', color: 'var(--md-sys-color-primary)' }}>
                        {group.category}
                      </strong>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {group.roles.map((r) => {
                          if (!isSuperAdmin && (r.id === 'super_admin' || r.id === 'admin')) return null;
                          const checked = editRoles.includes(r.id);
                          return (
                            <label key={r.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleRole(r.id, editRoles, setEditRoles)}
                                style={{ marginTop: '2px' }}
                              />
                              <div>
                                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{r.label}</span>
                                <small style={{ display: 'block', color: 'var(--md-sys-color-on-surface-variant)', fontSize: '0.75rem' }}>
                                  {r.desc}
                                </small>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={editSuspended}
                onChange={(e) => setEditSuspended(e.target.checked)}
              />
              <span style={{ color: editSuspended ? 'var(--md-sys-color-error)' : 'inherit', fontWeight: 600 }}>
                Suspend account (blocks login and run access)
              </span>
            </label>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
              <Button variant="ghost" onClick={() => setSelected(null)}>
                Cancel
              </Button>
              <Button variant="filled" disabled={saving} onClick={() => void handleSaveUser()}>
                {saving ? 'Saving…' : 'Save Changes'}
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      {/* DIALOG 4: CREATE STAFF ACCOUNT MANUALLY */}
      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create Staff Account"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '70vh', overflowY: 'auto' }}>
          {createdCredentials ? (
            <div style={{ padding: '16px', background: 'rgba(52, 168, 83, 0.08)', borderRadius: '12px' }}>
              <strong style={{ color: '#1b5e20', display: 'block', marginBottom: '8px' }}>
                Account Created Successfully!
              </strong>
              <p style={{ margin: '0 0 12px 0', fontSize: '0.88rem' }}>
                Securely give these credentials to the staff member:
              </p>
              <pre style={{ background: '#fff', padding: '12px', borderRadius: '8px', fontSize: '0.85rem', border: '1px solid #ccc' }}>
{`Name: ${createdCredentials.name}
Email: ${createdCredentials.email}
Temporary password: ${createdCredentials.password}`}
              </pre>
              <Button
                variant="filled"
                leadingIcon={<ClipboardCopy size={16} />}
                onClick={() => void copyText(`Email: ${createdCredentials.email}\nPassword: ${createdCredentials.password}`)}
              >
                Copy Credentials
              </Button>
            </div>
          ) : (
            <>
              <TextField
                label="Full Name"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                required
              />
              <TextField
                label="Email Address"
                type="email"
                value={createEmail}
                onChange={(e) => setCreateEmail(e.target.value)}
                required
              />
              <TextField
                label="Temporary Password"
                type="password"
                value={createPassword}
                onChange={(e) => setCreatePassword(e.target.value)}
                required
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <TextField
                  label="Mobile Number"
                  value={createMobile}
                  onChange={(e) => setCreateMobile(e.target.value)}
                />
                <TextField
                  label="Locality"
                  value={createLocality}
                  onChange={(e) => setCreateLocality(e.target.value)}
                />
              </div>

              <div>
                <strong style={{ display: 'block', fontSize: '0.9rem', marginBottom: '6px' }}>Select Staff Roles</strong>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {ROLE_GROUPS.map((group) => {
                    if (!isSuperAdmin && group.category === 'Full System Authority') return null;

                    return (
                      <div key={group.category} style={{ border: '1px solid var(--md-sys-color-outline-variant)', borderRadius: '8px', padding: '10px' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--md-sys-color-primary)' }}>
                          {group.category}
                        </span>
                        {group.roles.map((r) => {
                          if (!isSuperAdmin && (r.id === 'super_admin' || r.id === 'admin')) return null;
                          const checked = createRoles.includes(r.id);
                          return (
                            <label key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleRole(r.id, createRoles, setCreateRoles)}
                              />
                              <span style={{ fontSize: '0.85rem' }}>{r.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>
              {createdCredentials ? 'Done' : 'Cancel'}
            </Button>
            {!createdCredentials && (
              <Button variant="filled" disabled={creating || createRoles.length === 0} onClick={() => void handleCreateStaff()}>
                {creating ? 'Creating…' : 'Create Staff Member'}
              </Button>
            )}
          </div>
        </div>
      </Dialog>
    </div>
  );
}
