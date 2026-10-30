import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Award,
  CheckCircle2,
  Clock,
  Edit3,
  FileText,
  Music,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
  Users,
} from 'lucide-react';
import { Button } from '../../components/Button';
import { Card } from '../../components/m3/Card';
import { Dialog } from '../../components/m3/Dialog';
import { TextField } from '../../components/m3/TextField';
import { SearchBar } from '../../components/m3/SearchBar';
import { useAuth } from '../../features/auth/useAuth';
import { useToast } from '../../features/ui/useToast';
import { getCurrentEdition } from '../../features/editions/editionQueries';
import { ConfirmDialog, EmptyState, LoadingState } from '../../features/ui/FeedbackStates';
import {
  addParticipant,
  assignDelegationHead,
  bulkAddParticipants,
  createDelegation,
  deleteDelegation,
  deleteDelegationFile,
  deleteParticipant,
  getDelegationDetails,
  getDelegationForUser,
  listDelegationsWithDetails,
  listPotentialHeads,
  reviewDelegationEntry,
  submitEntryForReview,
  updateDelegation,
  updateEntryThemeAndDescription,
  uploadDelegationFile,
  type DelegationFileRecord,
  type DelegationParticipantRecord,
  type DelegationWithDetails,
  type PotentialHeadUser,
} from '../../features/delegations/delegationQueries';
import type { ReviewStatus } from '../../types';

export function DelegationsManagerPage() {
  const { user, isAdmin, isDelegationHead } = useAuth();
  const { toast } = useToast();

  const [editionId, setEditionId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Admin list state
  const [delegations, setDelegations] = useState<DelegationWithDetails[]>([]);
  const [potentialHeads, setPotentialHeads] = useState<PotentialHeadUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [localityFilter, setLocalityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Active / Selected contingent (for detail view / editing)
  const [selectedDelegation, setSelectedDelegation] = useState<DelegationWithDetails | null>(null);
  const [loadingSelected, setLoadingSelected] = useState(false);

  // Dialog states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newContingentName, setNewContingentName] = useState('');
  const [newContingentLocality, setNewContingentLocality] = useState('');
  const [newContingentHeadId, setNewContingentHeadId] = useState('');
  const [savingNewContingent, setSavingNewContingent] = useState(false);

  // Contingent Edit Modal (Name/Locality/Head)
  const [showEditInfoModal, setShowEditInfoModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editLocality, setEditLocality] = useState('');
  const [editHeadId, setEditHeadId] = useState('');
  const [savingEditInfo, setSavingEditInfo] = useState(false);

  // Delete Contingent Confirmation
  const [deleteTarget, setDeleteTarget] = useState<DelegationWithDetails | null>(null);
  const [deletingContingent, setDeletingContingent] = useState(false);

  // Concept / Theme edit state in detail view
  const [themeInput, setThemeInput] = useState('');
  const [descriptionInput, setDescriptionInput] = useState('');
  const [savingConcept, setSavingConcept] = useState(false);

  // Performer Roster single add state
  const [showAddPerformerModal, setShowAddPerformerModal] = useState(false);
  const [performerName, setPerformerName] = useState('');
  const [performerRole, setPerformerRole] = useState('Performer / Dancer');
  const [performerBirthDate, setPerformerBirthDate] = useState('');
  const [savingPerformer, setSavingPerformer] = useState(false);

  // Performer Roster bulk import state
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [importingBulk, setImportingBulk] = useState(false);

  // Performer delete confirmation
  const [deletePerformerTarget, setDeletePerformerTarget] = useState<DelegationParticipantRecord | null>(null);
  const [deletingPerformer, setDeletingPerformer] = useState(false);

  // Audio / File upload state
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [deleteFileTarget, setDeleteFileTarget] = useState<DelegationFileRecord | null>(null);
  const [deletingFile, setDeletingFile] = useState(false);

  // Review & Approval state (Admin action)
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewDecision, setReviewDecision] = useState<'approved' | 'needs_changes' | 'rejected' | 'under_review'>('approved');
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [savingReview, setSavingReview] = useState(false);

  // Submission state (Head action)
  const [submittingEntry, setSubmittingEntry] = useState(false);

  // Load Initial Data
  const loadInitialData = useCallback(async () => {
    try {
      const edition = await getCurrentEdition();
      setEditionId(edition.id);

      if (isAdmin) {
        // Admin: load all contingents and list of potential heads
        const [delList, heads] = await Promise.all([
          listDelegationsWithDetails(edition.id),
          listPotentialHeads(),
        ]);
        setDelegations(delList);
        setPotentialHeads(heads);
      } else if (isDelegationHead && user) {
        // Delegation Head: load their assigned contingent
        const headDel = await getDelegationForUser(user.id, edition.id);
        setSelectedDelegation(headDel);
        if (headDel?.entry) {
          setThemeInput(headDel.entry.theme || '');
          setDescriptionInput(headDel.entry.description || '');
        }
      }
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to load delegation workspace.', 'error');
    } finally {
      setLoading(false);
    }
  }, [isAdmin, isDelegationHead, user, toast]);

  useEffect(() => {
    const loadTimer = window.setTimeout(() => void loadInitialData(), 0);
    return () => window.clearTimeout(loadTimer);
  }, [loadInitialData]);

  // Refresh single delegation details
  const refreshActiveDelegation = useCallback(
    async (delId: string) => {
      if (!editionId) return;
      try {
        setLoadingSelected(true);
        const details = await getDelegationDetails(delId, editionId);
        setSelectedDelegation(details);
        if (details.entry) {
          setThemeInput(details.entry.theme || '');
          setDescriptionInput(details.entry.description || '');
        }
        // If in admin list mode, also update that row in the list
        if (isAdmin) {
          setDelegations((prev) =>
            prev.map((d) => (d.id === delId ? { ...d, ...details } : d))
          );
        }
      } catch (err: unknown) {
        toast(err instanceof Error ? err.message : 'Unable to refresh contingent details.', 'error');
      } finally {
        setLoadingSelected(false);
      }
    },
    [editionId, isAdmin, toast]
  );

  // Handle full refresh
  async function handleRefreshAll() {
    setRefreshing(true);
    try {
      if (isAdmin && !selectedDelegation) {
        const delList = await listDelegationsWithDetails(editionId);
        setDelegations(delList);
        toast('Delegation records refreshed.', 'success');
      } else if (selectedDelegation) {
        await refreshActiveDelegation(selectedDelegation.id);
        toast('Contingent updated.', 'success');
      }
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Refresh failed.', 'error');
    } finally {
      setRefreshing(false);
    }
  }

  // Admin: Open detailed contingent view
  function openContingentDetail(del: DelegationWithDetails) {
    setSelectedDelegation(del);
    setThemeInput(del.entry?.theme || '');
    setDescriptionInput(del.entry?.description || '');
    void refreshActiveDelegation(del.id);
  }

  // Create new contingent
  async function handleCreateContingent() {
    if (!newContingentName.trim()) {
      toast('Please enter a contingent name.', 'error');
      return;
    }
    setSavingNewContingent(true);
    try {
      const newId = await createDelegation({
        name: newContingentName,
        locality: newContingentLocality,
        headUserId: newContingentHeadId || undefined,
        editionId,
      });
      toast('Contingent registered successfully.', 'success');
      setShowCreateModal(false);
      setNewContingentName('');
      setNewContingentLocality('');
      setNewContingentHeadId('');
      // Reload list and jump into detail view
      const updatedList = await listDelegationsWithDetails(editionId);
      setDelegations(updatedList);
      const created = updatedList.find((d) => d.id === newId);
      if (created) openContingentDetail(created);
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to register contingent.', 'error');
    } finally {
      setSavingNewContingent(false);
    }
  }

  // Edit Contingent basic info
  async function handleSaveEditInfo() {
    if (!selectedDelegation) return;
    if (!editName.trim()) {
      toast('Contingent name is required.', 'error');
      return;
    }
    setSavingEditInfo(true);
    try {
      await updateDelegation(selectedDelegation.id, {
        name: editName,
        locality: editLocality,
      });

      if (editHeadId && editHeadId !== selectedDelegation.head?.userId) {
        await assignDelegationHead(selectedDelegation.id, editHeadId);
      }

      toast('Contingent profile updated.', 'success');
      setShowEditInfoModal(false);
      await refreshActiveDelegation(selectedDelegation.id);
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to update contingent info.', 'error');
    } finally {
      setSavingEditInfo(false);
    }
  }

  // Delete Contingent
  async function handleDeleteContingent() {
    if (!deleteTarget) return;
    setDeletingContingent(true);
    try {
      await deleteDelegation(deleteTarget.id);
      toast(`Deleted contingent "${deleteTarget.name}".`, 'success');
      setDeleteTarget(null);
      if (selectedDelegation?.id === deleteTarget.id) {
        setSelectedDelegation(null);
      }
      setDelegations((prev) => prev.filter((d) => d.id !== deleteTarget.id));
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to delete contingent.', 'error');
    } finally {
      setDeletingContingent(false);
    }
  }

  // Save Concept (Theme & Synopsis)
  async function handleSaveConcept() {
    if (!selectedDelegation?.entry) return;
    setSavingConcept(true);
    try {
      await updateEntryThemeAndDescription(selectedDelegation.entry.id, {
        theme: themeInput,
        description: descriptionInput,
      });
      toast('Choreography theme and synopsis saved.', 'success');
      await refreshActiveDelegation(selectedDelegation.id);
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to save concept.', 'error');
    } finally {
      setSavingConcept(false);
    }
  }

  // Add Performer
  async function handleAddPerformer() {
    if (!selectedDelegation?.entry) return;
    if (!performerName.trim()) {
      toast('Please enter the performer’s full name.', 'error');
      return;
    }
    setSavingPerformer(true);
    try {
      await addParticipant(selectedDelegation.entry.id, {
        fullName: performerName,
        roleOrPosition: performerRole,
        birthDate: performerBirthDate || undefined,
      });
      toast(`Added "${performerName}" to roster.`, 'success');
      setShowAddPerformerModal(false);
      setPerformerName('');
      setPerformerRole('Performer / Dancer');
      setPerformerBirthDate('');
      await refreshActiveDelegation(selectedDelegation.id);
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to add performer.', 'error');
    } finally {
      setSavingPerformer(false);
    }
  }

  // Bulk Import Performers
  async function handleBulkImport() {
    if (!selectedDelegation?.entry) return;
    if (!bulkText.trim()) {
      toast('Please paste participant lines to import.', 'error');
      return;
    }
    setImportingBulk(true);
    try {
      // Parse lines
      const lines = bulkText.split('\n');
      const parsed: Array<{ fullName: string; roleOrPosition?: string; birthDate?: string }> = [];

      for (const line of lines) {
        const clean = line.trim();
        if (!clean) continue;
        // Check if comma or dash separated (e.g. "Juan Dela Cruz, Lead Dancer")
        const parts = clean.split(/[,–—-]/).map((p) => p.trim());
        const fullName = parts[0];
        const role = parts.length > 1 ? parts[1] : 'Performer / Dancer';
        if (fullName) {
          parsed.push({ fullName, roleOrPosition: role });
        }
      }

      if (parsed.length === 0) {
        toast('No valid names detected in input.', 'error');
        setImportingBulk(false);
        return;
      }

      await bulkAddParticipants(selectedDelegation.entry.id, parsed);
      toast(`Successfully imported ${parsed.length} performers!`, 'success');
      setShowBulkModal(false);
      setBulkText('');
      await refreshActiveDelegation(selectedDelegation.id);
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Bulk import failed.', 'error');
    } finally {
      setImportingBulk(false);
    }
  }

  // Delete Performer
  async function handleDeletePerformer() {
    if (!deletePerformerTarget || !selectedDelegation) return;
    setDeletingPerformer(true);
    try {
      await deleteParticipant(deletePerformerTarget.id);
      toast('Removed performer from roster.', 'success');
      setDeletePerformerTarget(null);
      await refreshActiveDelegation(selectedDelegation.id);
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to remove performer.', 'error');
    } finally {
      setDeletingPerformer(false);
    }
  }

  // Audio Upload
  async function handleAudioUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!selectedDelegation?.entry) return;
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size (< 25MB)
    if (file.size > 26214400) {
      toast('Audio file exceeds the 25MB limit.', 'error');
      return;
    }

    setUploadingAudio(true);
    try {
      await uploadDelegationFile(selectedDelegation.id, selectedDelegation.entry.id, file, 'music');
      toast('Official performance track uploaded successfully.', 'success');
      await refreshActiveDelegation(selectedDelegation.id);
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Audio upload failed.', 'error');
    } finally {
      setUploadingAudio(false);
      // Reset input value
      e.target.value = '';
    }
  }

  // Delete File / Track
  async function handleDeleteFile() {
    if (!deleteFileTarget || !selectedDelegation) return;
    setDeletingFile(true);
    try {
      await deleteDelegationFile(deleteFileTarget.id, deleteFileTarget.objectPath);
      toast('Track removed.', 'success');
      setDeleteFileTarget(null);
      await refreshActiveDelegation(selectedDelegation.id);
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to delete file.', 'error');
    } finally {
      setDeletingFile(false);
    }
  }

  // Submit Entry for Committee Review
  async function handleSubmitForReview() {
    if (!selectedDelegation?.entry) return;

    // Validate readiness
    if (!themeInput.trim()) {
      toast('Please save a choreography theme before submitting.', 'error');
      return;
    }
    if ((selectedDelegation.participantCount || 0) === 0) {
      toast('Please add at least one dancer/performer to your roster before submitting.', 'error');
      return;
    }
    if (!selectedDelegation.primaryMusic) {
      toast('Please upload your official performance audio track before submitting.', 'error');
      return;
    }

    setSubmittingEntry(true);
    try {
      // First ensure concept is saved
      await updateEntryThemeAndDescription(selectedDelegation.entry.id, {
        theme: themeInput,
        description: descriptionInput,
      });

      await submitEntryForReview(selectedDelegation.entry.id);
      toast('Contingent submission sent to the festival committee!', 'success');
      await refreshActiveDelegation(selectedDelegation.id);
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to submit contingent entry.', 'error');
    } finally {
      setSubmittingEntry(false);
    }
  }

  // Admin Review Decision
  async function handleSaveReview() {
    if (!selectedDelegation?.entry) return;
    setSavingReview(true);
    try {
      await reviewDelegationEntry(selectedDelegation.entry.id, {
        status: reviewDecision,
        reviewerNotes,
        reviewerUserId: user?.id,
      });
      toast(`Contingent marked as ${reviewDecision.replace('_', ' ')}.`, 'success');
      setShowReviewModal(false);
      setReviewerNotes('');
      await refreshActiveDelegation(selectedDelegation.id);
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to save review decision.', 'error');
    } finally {
      setSavingReview(false);
    }
  }

  // Filtered delegations list for admin overview
  const filteredDelegations = useMemo(() => {
    return delegations.filter((d) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        d.name.toLowerCase().includes(q) ||
        (d.locality && d.locality.toLowerCase().includes(q)) ||
        (d.head?.fullName && d.head.fullName.toLowerCase().includes(q)) ||
        (d.entry?.theme && d.entry.theme.toLowerCase().includes(q));

      const matchesLocality = localityFilter === 'all' || d.locality === localityFilter;

      const currentStatus = d.entry?.status || 'draft';
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'approved' && currentStatus === 'approved') ||
        (statusFilter === 'submitted' && (currentStatus === 'submitted' || currentStatus === 'under_review')) ||
        (statusFilter === 'needs_changes' && currentStatus === 'needs_changes') ||
        (statusFilter === 'draft' && currentStatus === 'draft');

      return matchesSearch && matchesLocality && matchesStatus;
    });
  }, [delegations, searchQuery, localityFilter, statusFilter]);

  // Unique localities for filter select
  const uniqueLocalities = useMemo(() => {
    const set = new Set<string>();
    delegations.forEach((d) => {
      if (d.locality) set.add(d.locality);
    });
    return Array.from(set).sort();
  }, [delegations]);

  // Metrics stats for Admin Overview
  const stats = useMemo(() => {
    let approved = 0;
    let submitted = 0;
    let needsChanges = 0;
    let drafts = 0;

    delegations.forEach((d) => {
      const s = d.entry?.status || 'draft';
      if (s === 'approved') approved++;
      else if (s === 'submitted' || s === 'under_review') submitted++;
      else if (s === 'needs_changes') needsChanges++;
      else drafts++;
    });

    return {
      total: delegations.length,
      approved,
      submitted,
      needsChanges,
      drafts,
    };
  }, [delegations]);

  // Separate potential heads into designated delegation heads vs general accounts
  const designatedHeads = useMemo(
    () => potentialHeads.filter((h) => h.isDelegationHead),
    [potentialHeads]
  );
  const otherAccounts = useMemo(
    () => potentialHeads.filter((h) => !h.isDelegationHead),
    [potentialHeads]
  );

  // Helper for Status Badge styling
  const renderStatusBadge = (status: ReviewStatus | 'draft') => {
    switch (status) {
      case 'approved':
        return (
          <span className="badge badge--success" style={{ background: '#ebfbee', color: '#099268', border: '1px solid #b2f2bb', fontWeight: 700 }}>
            Approved
          </span>
        );
      case 'submitted':
        return (
          <span className="badge badge--info" style={{ background: '#e7f5ff', color: '#1971c2', border: '1px solid #a5d8ff', fontWeight: 600 }}>
            Submitted
          </span>
        );
      case 'under_review':
        return (
          <span className="badge badge--secondary" style={{ background: '#f3f0ff', color: '#7048e8', border: '1px solid #d0bfff', fontWeight: 600 }}>
            In Review
          </span>
        );
      case 'needs_changes':
        return (
          <span className="badge badge--warning" style={{ background: '#fff4e6', color: '#d9480f', border: '1px solid #ffd8a8', fontWeight: 700 }}>
            Needs Changes
          </span>
        );
      case 'rejected':
        return (
          <span className="badge badge--danger" style={{ background: '#ffe3e3', color: '#c92a2a', border: '1px solid #ffc9c9', fontWeight: 700 }}>
            Rejected
          </span>
        );
      case 'draft':
      default:
        return (
          <span className="badge" style={{ background: '#f1f3f5', color: '#495057', border: '1px solid #dee2e6', fontWeight: 500 }}>
            Draft
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="admin-page delegations-page">
        <LoadingState message="Loading festival delegations and contingent rosters…" />
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW A: If user is Delegation Head (not admin) but has no assigned contingent
  // -------------------------------------------------------------
  if (!isAdmin && isDelegationHead && !selectedDelegation) {
    return (
      <div className="admin-page delegations-page" style={{ maxWidth: '800px', margin: '0 auto', padding: 'var(--md-space-4)' }}>
        <Card variant="outlined" style={{ padding: 'var(--md-space-6)', textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(230, 119, 0, 0.12)', display: 'grid', placeItems: 'center', margin: '0 auto var(--md-space-4)', color: '#e67700' }}>
            <Users size={32} />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0 0 var(--md-space-2)' }}>
            Welcome, Delegation Head!
          </h2>
          <p style={{ color: 'var(--md-sys-color-on-surface-variant)', maxWidth: '500px', margin: '0 auto var(--md-space-4)', lineHeight: 1.5 }}>
            Your account is authorized as a Delegation Leader, but the festival committee has not yet assigned your contingent profile.
          </p>
          <div style={{ padding: 'var(--md-space-3)', background: '#faf6f0', borderRadius: '10px', display: 'inline-block', fontSize: '0.9rem' }}>
            Please coordinate with the <strong>Sinoog 2027 Committee Secretariat</strong> to link your barangay or school.
          </div>
        </Card>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW B: Detailed Contingent Workspace (for Delegation Head, or Admin drilling into a contingent)
  // -------------------------------------------------------------
  if (selectedDelegation) {
    const entry = selectedDelegation.entry;
    const currentStatus = entry?.status || 'draft';
    const isApproved = currentStatus === 'approved';
    const isNeedsChanges = currentStatus === 'needs_changes';
    const isSubmitted = currentStatus === 'submitted' || currentStatus === 'under_review';

    return (
      <div className="admin-page delegations-page" style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: 'var(--md-space-8)' }}>
        {/* Navigation Breadcrumb / Top Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--md-space-3)', marginBottom: 'var(--md-space-4)', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--md-space-2)' }}>
            {isAdmin && (
              <Button
                variant="outlined"
                size="small"
                leadingIcon={<ArrowLeft size={16} />}
                onClick={() => setSelectedDelegation(null)}
              >
                All Contingents
              </Button>
            )}
            <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700 }}>
              {selectedDelegation.name}
            </h1>
            {selectedDelegation.locality && (
              <span style={{ fontSize: '0.9rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
                · {selectedDelegation.locality}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--md-space-2)' }}>
            {renderStatusBadge(currentStatus)}
            {isAdmin && (
              <Button
                variant="outlined"
                size="small"
                leadingIcon={<Edit3 size={15} />}
                onClick={() => {
                  setEditName(selectedDelegation.name);
                  setEditLocality(selectedDelegation.locality || '');
                  setEditHeadId(selectedDelegation.head?.userId || '');
                  setShowEditInfoModal(true);
                }}
              >
                Edit Info
              </Button>
            )}
            <Button
              variant="tonal"
              size="small"
              leadingIcon={<RefreshCw size={15} className={refreshing || loadingSelected ? 'spin' : ''} />}
              onClick={() => void handleRefreshAll()}
            >
              Refresh
            </Button>
          </div>
        </div>

        {/* Committee Review Feedback Notice (if changes requested) */}
        {isNeedsChanges && entry?.reviewer_notes && (
          <div
            style={{
              padding: 'var(--md-space-4)',
              borderRadius: '12px',
              background: '#fff9db',
              border: '1.5px solid #f59f00',
              marginBottom: 'var(--md-space-4)',
              display: 'flex',
              gap: 'var(--md-space-3)',
              alignItems: 'flex-start',
            }}
          >
            <AlertTriangle size={24} color="#e67700" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ fontSize: '1rem', color: '#c92a2a', display: 'block', marginBottom: '4px' }}>
                Revisions Requested by the Festival Committee
              </strong>
              <p style={{ margin: 0, fontSize: '0.92rem', color: '#7f4f00' }}>
                {entry.reviewer_notes}
              </p>
              <small style={{ display: 'block', marginTop: '6px', color: '#857366' }}>
                Please update your theme, roster, or audio track as noted above, then click <strong>"Submit Contingent for Committee Review"</strong> below.
              </small>
            </div>
          </div>
        )}

        {/* Approved Celebration Banner */}
        {isApproved && (
          <div
            style={{
              padding: 'var(--md-space-4)',
              borderRadius: '12px',
              background: 'rgba(32, 201, 151, 0.1)',
              border: '1.5px solid #20c997',
              marginBottom: 'var(--md-space-4)',
              display: 'flex',
              gap: 'var(--md-space-3)',
              alignItems: 'center',
            }}
          >
            <Award size={28} color="#099268" style={{ flexShrink: 0 }} />
            <div>
              <strong style={{ fontSize: '1rem', color: '#099268', display: 'block' }}>
                Official Festival Contingent Approved
              </strong>
              <span style={{ fontSize: '0.88rem', color: '#2b8a3e' }}>
                This contingent is published on the public <strong>Sinoog 2027 Festival Showcase (/festival)</strong>.
              </span>
            </div>
          </div>
        )}

        {/* Admin Review Action Toolbar */}
        {isAdmin && (
          <Card
            variant="outlined"
            style={{
              padding: 'var(--md-space-4)',
              marginBottom: 'var(--md-space-4)',
              background: '#fcfbf9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 'var(--md-space-3)',
            }}
          >
            <div>
              <span style={{ fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, color: 'var(--md-sys-color-on-surface-variant)' }}>
                Committee Review Control
              </span>
              <p style={{ margin: '2px 0 0', fontSize: '0.9rem', color: 'var(--md-sys-color-on-surface)' }}>
                Current Status: <strong>{currentStatus.replace('_', ' ').toUpperCase()}</strong>
                {entry?.submitted_at && (
                  <span style={{ marginLeft: '8px', color: '#857366' }}>
                    (Submitted: {new Date(entry.submitted_at).toLocaleDateString('en-PH')})
                  </span>
                )}
              </p>
            </div>

            <div style={{ display: 'flex', gap: 'var(--md-space-2)', flexWrap: 'wrap' }}>
              <Button
                variant="filled"
                size="small"
                leadingIcon={<CheckCircle2 size={16} />}
                onClick={() => {
                  setReviewDecision('approved');
                  setReviewerNotes(entry?.reviewer_notes || '');
                  setShowReviewModal(true);
                }}
                style={{ background: '#099268', borderColor: '#099268' }}
              >
                Approve Contingent
              </Button>
              <Button
                variant="outlined"
                size="small"
                leadingIcon={<AlertCircle size={16} />}
                onClick={() => {
                  setReviewDecision('needs_changes');
                  setReviewerNotes(entry?.reviewer_notes || '');
                  setShowReviewModal(true);
                }}
                style={{ color: '#d9480f', borderColor: '#ffd8a8' }}
              >
                Request Revisions
              </Button>
              <Button
                variant="ghost"
                size="small"
                onClick={() => {
                  setReviewDecision('under_review');
                  setReviewerNotes('');
                  setShowReviewModal(true);
                }}
              >
                Set Under Review
              </Button>
            </div>
          </Card>
        )}

        {/* Main Grid: Left 2 columns = Concept & Roster, Right 1 column = Audio & Submission */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--md-space-4)' }}>
          {/* Column 1: Concept & Roster */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-space-4)' }}>
            {/* Section 1: Choreography Theme & Synopsis */}
            <Card variant="outlined" style={{ padding: 'var(--md-space-4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--md-space-3)' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Award size={18} color="var(--wine, #741724)" />
                  Choreography Theme & Synopsis
                </h3>
                <Button
                  variant="filled"
                  size="small"
                  onClick={() => void handleSaveConcept()}
                  disabled={savingConcept}
                >
                  {savingConcept ? 'Saving…' : 'Save Concept'}
                </Button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-space-3)' }}>
                <TextField
                  label="Official Choreography Theme"
                  placeholder="e.g. Halad sa Sto. Niño: Sayaw sa Kadaugan ug Paglaum"
                  value={themeInput}
                  onChange={(e) => setThemeInput(e.target.value)}
                />

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: 'var(--md-sys-color-on-surface-variant)' }}>
                    Performance Synopsis & Narrative
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Describe the cultural narrative, storyline, sacred ritual context, and visual symbolism of your contingent's presentation…"
                    value={descriptionInput}
                    onChange={(e) => setDescriptionInput(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #d4c5b9',
                      fontSize: '0.9rem',
                      fontFamily: 'inherit',
                      resize: 'vertical',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>
            </Card>

            {/* Section 2: Dancers & Performers Roster */}
            <Card variant="outlined" style={{ padding: 'var(--md-space-4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--md-space-3)', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Users size={18} color="var(--wine, #741724)" />
                    Performers Roster
                  </h3>
                  <span style={{ fontSize: '0.82rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
                    {selectedDelegation.participants?.length || 0} registered dancers & props personnel
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <Button
                    variant="tonal"
                    size="small"
                    leadingIcon={<FileText size={15} />}
                    onClick={() => setShowBulkModal(true)}
                  >
                    Bulk Paste
                  </Button>
                  <Button
                    variant="filled"
                    size="small"
                    leadingIcon={<Plus size={15} />}
                    onClick={() => setShowAddPerformerModal(true)}
                  >
                    + Add Performer
                  </Button>
                </div>
              </div>

              {/* Performers Table */}
              {(!selectedDelegation.participants || selectedDelegation.participants.length === 0) ? (
                <div style={{ padding: 'var(--md-space-4)', textAlign: 'center', background: '#faf8f5', borderRadius: '8px' }}>
                  <Users size={28} color="#9c8c82" style={{ margin: '0 auto 8px', display: 'block' }} />
                  <p style={{ margin: '0 0 4px', fontSize: '0.9rem', fontWeight: 600 }}>No performers added yet</p>
                  <span style={{ fontSize: '0.82rem', color: '#857366' }}>
                    Use "+ Add Performer" or "Bulk Paste" to register your dancers, drummers, and props team.
                  </span>
                </div>
              ) : (
                <div style={{ overflowX: 'auto', maxHeight: '380px', overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: '#fbf9f6', borderBottom: '1px solid #ede4dc', color: '#6f6259', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                        <th style={{ padding: '8px 10px', width: '36px' }}>#</th>
                        <th style={{ padding: '8px 10px' }}>Full Name</th>
                        <th style={{ padding: '8px 10px' }}>Role / Position</th>
                        <th style={{ padding: '8px 10px', width: '100px' }}>Birth Date</th>
                        <th style={{ padding: '8px 10px', width: '40px', textAlign: 'right' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedDelegation.participants.map((p, idx) => (
                        <tr key={p.id} style={{ borderBottom: '1px solid #f2ede8' }}>
                          <td style={{ padding: '8px 10px', color: '#857366' }}>{idx + 1}</td>
                          <td style={{ padding: '8px 10px', fontWeight: 600 }}>{p.fullName}</td>
                          <td style={{ padding: '8px 10px', color: '#5c4d43' }}>{p.roleOrPosition || 'Performer'}</td>
                          <td style={{ padding: '8px 10px', color: '#857366', fontSize: '0.82rem' }}>
                            {p.birthDate || '—'}
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                            <button
                              type="button"
                              onClick={() => setDeletePerformerTarget(p)}
                              title="Remove performer"
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#c92a2a',
                                cursor: 'pointer',
                                padding: '4px',
                                borderRadius: '4px',
                              }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>

          {/* Column 2: Official Performance Audio & Submission Checklist */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-space-4)' }}>
            {/* Section 3: Performance Audio Track */}
            <Card variant="outlined" style={{ padding: 'var(--md-space-4)' }}>
              <h3 style={{ margin: '0 0 var(--md-space-3)', fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Music size={18} color="var(--wine, #741724)" />
                Performance Music Track
              </h3>

              {selectedDelegation.primaryMusic ? (
                <div style={{ padding: 'var(--md-space-3)', background: '#f8f5f0', borderRadius: '10px', border: '1px solid #e8dfd8' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                      <strong style={{ fontSize: '0.9rem', display: 'block', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                        {selectedDelegation.primaryMusic.originalName}
                      </strong>
                      <span style={{ fontSize: '0.78rem', color: '#857366' }}>
                        {selectedDelegation.primaryMusic.bytes
                          ? `${(selectedDelegation.primaryMusic.bytes / (1024 * 1024)).toFixed(2)} MB`
                          : 'Audio track'}
                      </span>
                    </div>

                    <Button
                      variant="ghost"
                      size="small"
                      onClick={() => setDeleteFileTarget(selectedDelegation.primaryMusic)}
                      style={{ color: '#c92a2a', padding: '4px 8px' }}
                    >
                      Replace
                    </Button>
                  </div>

                  {/* Audio Player Preview */}
                  {selectedDelegation.primaryMusic.signedUrl ? (
                    <audio
                      controls
                      src={selectedDelegation.primaryMusic.signedUrl}
                      style={{ width: '100%', height: '40px', marginTop: '6px' }}
                      preload="none"
                    />
                  ) : (
                    <div style={{ fontSize: '0.82rem', color: '#857366', fontStyle: 'italic' }}>
                      Audio file verified in private committee bucket.
                    </div>
                  )}
                </div>
              ) : (
                <div
                  style={{
                    padding: 'var(--md-space-4)',
                    border: '2px dashed #d4c5b9',
                    borderRadius: '12px',
                    textAlign: 'center',
                    background: '#faf9f6',
                  }}
                >
                  <Music size={32} color="#a89b91" style={{ margin: '0 auto 8px', display: 'block' }} />
                  <strong style={{ fontSize: '0.92rem', display: 'block', marginBottom: '4px' }}>
                    Upload Official Music (MP3 / WAV)
                  </strong>
                  <p style={{ margin: '0 0 var(--md-space-3)', fontSize: '0.8rem', color: '#857366' }}>
                    Maximum file size: 25MB. This track will be played through the festival sound system.
                  </p>

                  <label
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 16px',
                      background: 'var(--wine, #741724)',
                      color: '#ffffff',
                      borderRadius: '8px',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      cursor: uploadingAudio ? 'not-allowed' : 'pointer',
                      opacity: uploadingAudio ? 0.7 : 1,
                    }}
                  >
                    <Upload size={16} />
                    {uploadingAudio ? 'Uploading track…' : 'Select Audio File'}
                    <input
                      type="file"
                      accept="audio/mpeg,audio/wav,audio/mp4,audio/x-m4a,audio/*"
                      onChange={(e) => void handleAudioUpload(e)}
                      disabled={uploadingAudio}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
              )}
            </Card>

            {/* Section 4: Submission Checklist & Submission Button */}
            <Card variant="outlined" style={{ padding: 'var(--md-space-4)' }}>
              <h3 style={{ margin: '0 0 var(--md-space-3)', fontSize: '1.1rem', fontWeight: 700 }}>
                Submission Readiness
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: 'var(--md-space-4)', fontSize: '0.88rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {themeInput.trim() ? (
                    <CheckCircle2 size={18} color="#099268" />
                  ) : (
                    <Clock size={18} color="#adb5bd" />
                  )}
                  <span style={{ color: themeInput.trim() ? '#1f1b13' : '#857366' }}>
                    Choreography Theme recorded
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {(selectedDelegation.participantCount || 0) > 0 ? (
                    <CheckCircle2 size={18} color="#099268" />
                  ) : (
                    <Clock size={18} color="#adb5bd" />
                  )}
                  <span style={{ color: (selectedDelegation.participantCount || 0) > 0 ? '#1f1b13' : '#857366' }}>
                    Dancers & performers roster registered ({selectedDelegation.participantCount || 0})
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {selectedDelegation.primaryMusic ? (
                    <CheckCircle2 size={18} color="#099268" />
                  ) : (
                    <Clock size={18} color="#adb5bd" />
                  )}
                  <span style={{ color: selectedDelegation.primaryMusic ? '#1f1b13' : '#857366' }}>
                    Performance audio track uploaded
                  </span>
                </div>
              </div>

              {/* Action Button for Delegation Head */}
              {(!isApproved && !isSubmitted) && (
                <Button
                  variant="filled"
                  leadingIcon={<CheckCircle2 size={18} />}
                  onClick={() => void handleSubmitForReview()}
                  disabled={submittingEntry}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  {submittingEntry ? 'Submitting to Committee…' : 'Submit Contingent for Review'}
                </Button>
              )}

              {isSubmitted && !isApproved && (
                <div style={{ textAlign: 'center', padding: '12px', background: '#e7f5ff', borderRadius: '8px', color: '#1971c2', fontSize: '0.88rem', fontWeight: 600 }}>
                  <Clock size={18} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '6px' }} />
                  Submitted & waiting for committee review
                </div>
              )}
            </Card>

            {/* Contingent Leadership Metadata */}
            <Card variant="outlined" style={{ padding: 'var(--md-space-4)', background: '#faf8f5' }}>
              <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, color: '#857366', display: 'block', marginBottom: '8px' }}>
                Delegation Leadership
              </span>
              <div style={{ fontSize: '0.9rem' }}>
                <strong style={{ display: 'block' }}>{selectedDelegation.head?.fullName || 'No Head Assigned'}</strong>
                <span style={{ color: '#857366', fontSize: '0.82rem' }}>
                  Locality: {selectedDelegation.locality || 'Not specified'}
                </span>
              </div>
            </Card>
          </div>
        </div>

        {/* Modal: Single Performer Add */}
        <Dialog
          open={showAddPerformerModal}
          onClose={() => !savingPerformer && setShowAddPerformerModal(false)}
          title="Add Dancer / Performer to Roster"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-space-3)' }}>
            <TextField
              label="Full Name *"
              placeholder="e.g. Maria Clara Santos"
              value={performerName}
              onChange={(e) => setPerformerName(e.target.value)}
            />

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                Role or Position
              </label>
              <select
                value={performerRole}
                onChange={(e) => setPerformerRole(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d4c5b9', fontSize: '0.9rem' }}
              >
                <option value="Lead Dancer">Lead Dancer</option>
                <option value="Performer / Dancer">Performer / Dancer</option>
                <option value="Festival Queen">Festival Queen</option>
                <option value="Lead Drummer">Lead Drummer</option>
                <option value="Percussionist">Percussionist</option>
                <option value="Props Master">Props Master / Stage Hand</option>
                <option value="Choreographer">Choreographer</option>
              </select>
            </div>

            <TextField
              label="Birth Date (Optional)"
              type="date"
              value={performerBirthDate}
              onChange={(e) => setPerformerBirthDate(e.target.value)}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: 'var(--md-space-2)' }}>
              <Button variant="ghost" onClick={() => setShowAddPerformerModal(false)} disabled={savingPerformer}>
                Cancel
              </Button>
              <Button variant="filled" onClick={() => void handleAddPerformer()} disabled={savingPerformer}>
                {savingPerformer ? 'Adding…' : 'Add Performer'}
              </Button>
            </div>
          </div>
        </Dialog>

        {/* Modal: Bulk Performers Import */}
        <Dialog
          open={showBulkModal}
          onClose={() => !importingBulk && setShowBulkModal(false)}
          title="Bulk Import Performers Roster"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-space-3)' }}>
            <p style={{ margin: 0, fontSize: '0.88rem', color: '#6f6259' }}>
              Paste your list of participants below, one person per line. You can optionally include their role separated by a comma (e.g. <code>Juan Dela Cruz, Drummer</code>).
            </p>

            <textarea
              rows={8}
              placeholder="Juan Dela Cruz, Lead Dancer&#10;Maria Santos, Performer&#10;Pedro Penduko, Drummer"
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #d4c5b9',
                fontSize: '0.88rem',
                fontFamily: 'monospace',
                boxSizing: 'border-box',
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: 'var(--md-space-2)' }}>
              <Button variant="ghost" onClick={() => setShowBulkModal(false)} disabled={importingBulk}>
                Cancel
              </Button>
              <Button variant="filled" onClick={() => void handleBulkImport()} disabled={importingBulk}>
                {importingBulk ? 'Importing…' : 'Import Roster'}
              </Button>
            </div>
          </div>
        </Dialog>

        {/* Modal: Admin Committee Review */}
        <Dialog
          open={showReviewModal}
          onClose={() => !savingReview && setShowReviewModal(false)}
          title="Committee Review Decision"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-space-3)' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                Review Decision
              </label>
              <select
                value={reviewDecision}
                onChange={(e) => setReviewDecision(e.target.value as any)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d4c5b9', fontSize: '0.95rem' }}
              >
                <option value="approved">Approved (Publish to Public Showcase)</option>
                <option value="needs_changes">Needs Changes (Request Revisions)</option>
                <option value="under_review">Mark Under Review</option>
                <option value="rejected">Reject Submission</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                Committee Notes & Revisions Feedback
              </label>
              <textarea
                rows={4}
                placeholder="Detail any corrections, music adjustment, or roster requirements needed from the contingent head…"
                value={reviewerNotes}
                onChange={(e) => setReviewerNotes(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #d4c5b9',
                  fontSize: '0.9rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: 'var(--md-space-2)' }}>
              <Button variant="ghost" onClick={() => setShowReviewModal(false)} disabled={savingReview}>
                Cancel
              </Button>
              <Button variant="filled" onClick={() => void handleSaveReview()} disabled={savingReview}>
                {savingReview ? 'Saving…' : 'Confirm Decision'}
              </Button>
            </div>
          </div>
        </Dialog>

        {/* Modal: Edit Contingent Name/Locality/Head */}
        <Dialog
          open={showEditInfoModal}
          onClose={() => !savingEditInfo && setShowEditInfoModal(false)}
          title="Edit Contingent Identity"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-space-3)' }}>
            <TextField
              label="Contingent Name *"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />

            <TextField
              label="Barangay / Locality / School"
              value={editLocality}
              onChange={(e) => setEditLocality(e.target.value)}
            />

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                Assigned Delegation Head
              </label>
              <select
                value={editHeadId}
                onChange={(e) => setEditHeadId(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d4c5b9', fontSize: '0.9rem' }}
              >
                <option value="">-- No Head Assigned --</option>
                {designatedHeads.length > 0 && (
                  <optgroup label="Designated Delegation Heads (Users & Staff)">
                    {designatedHeads.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.fullName} {h.assignedContingentName ? `(Assigned: ${h.assignedContingentName})` : '(Available)'}
                      </option>
                    ))}
                  </optgroup>
                )}
                {otherAccounts.length > 0 && (
                  <optgroup label="Other Accounts (Will be granted Delegation Head role)">
                    {otherAccounts.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.fullName}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
              <small style={{ display: 'block', marginTop: '6px', color: '#857366', fontSize: '0.78rem' }}>
                When assigned, this account can sign in to the portal and can strictly access, edit, and manage <strong>this contingent only</strong>.
              </small>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: 'var(--md-space-2)' }}>
              <Button variant="ghost" onClick={() => setShowEditInfoModal(false)} disabled={savingEditInfo}>
                Cancel
              </Button>
              <Button variant="filled" onClick={() => void handleSaveEditInfo()} disabled={savingEditInfo}>
                {savingEditInfo ? 'Saving…' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </Dialog>

        {/* Confirm Delete Performer */}
        <ConfirmDialog
          isOpen={Boolean(deletePerformerTarget)}
          title="Remove Performer from Roster?"
          message={`Are you sure you want to remove "${deletePerformerTarget?.fullName}" from the contingent's official roster?`}
          confirmLabel={deletingPerformer ? 'Removing…' : 'Yes, Remove'}
          tone="danger"
          onConfirm={() => void handleDeletePerformer()}
          onCancel={() => !deletingPerformer && setDeletePerformerTarget(null)}
        />

        {/* Confirm Replace/Delete Track */}
        <ConfirmDialog
          isOpen={Boolean(deleteFileTarget)}
          title="Remove Audio Track?"
          message={`Are you sure you want to remove "${deleteFileTarget?.originalName}"? You can then upload a new performance track.`}
          confirmLabel={deletingFile ? 'Removing…' : 'Yes, Remove Track'}
          tone="danger"
          onConfirm={() => void handleDeleteFile()}
          onCancel={() => !deletingFile && setDeleteFileTarget(null)}
        />
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW C: Admin Overview Dashboard & Contingents Table
  // -------------------------------------------------------------
  return (
    <div className="admin-page delegations-page" style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: 'var(--md-space-8)' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--md-space-3)', marginBottom: 'var(--md-space-4)', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 700 }}>
            Festival Contingents & Delegations
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
            Register barangays and schools, assign delegation heads, review performers and music, and publish approved contingents.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--md-space-2)' }}>
          <Button
            variant="filled"
            size="small"
            leadingIcon={<Plus size={16} />}
            onClick={() => setShowCreateModal(true)}
          >
            Add Contingent
          </Button>
          <Button
            variant="tonal"
            size="small"
            leadingIcon={<RefreshCw size={15} className={refreshing ? 'spin' : ''} />}
            onClick={() => void handleRefreshAll()}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--md-space-3)', marginBottom: 'var(--md-space-4)' }}>
        <Card variant="outlined" style={{ padding: 'var(--md-space-4)', display: 'flex', alignItems: 'center', gap: 'var(--md-space-3)' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--md-sys-color-surface-container-high)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--md-sys-color-primary)' }}>
            <Users size={22} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-on-surface-variant)', display: 'block' }}>Total Contingents</span>
            <strong style={{ fontSize: '1.4rem', fontWeight: 700 }}>{stats.total}</strong>
          </div>
        </Card>

        <Card variant="outlined" style={{ padding: 'var(--md-space-4)', display: 'flex', alignItems: 'center', gap: 'var(--md-space-3)', borderColor: 'rgba(32, 201, 151, 0.4)' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(32, 201, 151, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#099268' }}>
            <CheckCircle2 size={22} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-on-surface-variant)', display: 'block' }}>Approved & Published</span>
            <strong style={{ fontSize: '1.4rem', fontWeight: 700, color: '#099268' }}>{stats.approved}</strong>
          </div>
        </Card>

        <Card variant="outlined" style={{ padding: 'var(--md-space-4)', display: 'flex', alignItems: 'center', gap: 'var(--md-space-3)', borderColor: 'rgba(25, 113, 194, 0.4)' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(25, 113, 194, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1971c2' }}>
            <Clock size={22} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-on-surface-variant)', display: 'block' }}>Submitted / In Review</span>
            <strong style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1971c2' }}>{stats.submitted}</strong>
          </div>
        </Card>

        <Card variant="outlined" style={{ padding: 'var(--md-space-4)', display: 'flex', alignItems: 'center', gap: 'var(--md-space-3)', borderColor: 'rgba(245, 159, 0, 0.4)' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(255, 243, 191, 0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e67700' }}>
            <AlertCircle size={22} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-on-surface-variant)', display: 'block' }}>Needs Changes / Draft</span>
            <strong style={{ fontSize: '1.4rem', fontWeight: 700, color: '#d9480f' }}>{stats.needsChanges + stats.drafts}</strong>
          </div>
        </Card>
      </div>

      {/* Search & Filters Toolbar */}
      <div className="kit-claims-toolbar-card" style={{ marginBottom: 'var(--md-space-4)' }}>
        <div className="kit-claims-toolbar">
          <SearchBar
            label="Search contingents"
            placeholder="Search by contingent name, locality, theme, or head…"
            value={searchQuery}
            onValueChange={setSearchQuery}
            fieldClassName="registrations-search"
          />

          <div className="kit-claims-filters">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by review status"
              className="kit-claims-filter--status"
            >
              <option value="all">All statuses ({stats.total})</option>
              <option value="approved">Approved ({stats.approved})</option>
              <option value="submitted">Submitted / In Review ({stats.submitted})</option>
              <option value="needs_changes">Needs Changes ({stats.needsChanges})</option>
              <option value="draft">Drafts ({stats.drafts})</option>
            </select>

            <select
              value={localityFilter}
              onChange={(e) => setLocalityFilter(e.target.value)}
              aria-label="Filter by locality"
            >
              <option value="all">All Localities</option>
              {uniqueLocalities.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Contingents Display: Desktop Table + Mobile Cards */}
      {filteredDelegations.length === 0 ? (
        <Card variant="outlined" style={{ padding: '3rem' }}>
          <EmptyState
            title="No contingents found"
            message={
              searchQuery || localityFilter !== 'all' || statusFilter !== 'all'
                ? 'No contingents matched your search or filter settings.'
                : 'No contingents registered for this festival edition yet.'
            }
          />
        </Card>
      ) : (
        <>
          {/* Desktop Single-Line Table */}
          <div className="kit-claims-desktop-view">
            <Card as="section" variant="outlined" className="kit-claims-panel">
              <table className="kit-claims-table">
                <thead>
                  <tr>
                    <th style={{ width: '220px' }}>Contingent</th>
                    <th style={{ width: '160px' }}>Delegation Head</th>
                    <th>Choreography Theme</th>
                    <th style={{ width: '110px', textAlign: 'center' }}>Roster</th>
                    <th style={{ width: '110px', textAlign: 'center' }}>Music Track</th>
                    <th style={{ width: '130px' }}>Status</th>
                    <th style={{ width: '140px', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDelegations.map((del) => {
                    const status = del.entry?.status || 'draft';
                    return (
                      <tr key={del.id}>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <strong style={{ color: 'var(--ink, #1f1b13)', fontSize: '0.92rem' }}>
                              {del.name}
                            </strong>
                            <span style={{ fontSize: '0.8rem', color: '#857366' }}>
                              {del.locality || 'No locality'}
                            </span>
                          </div>
                        </td>
                        <td>
                          {del.head ? (
                            <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{del.head.fullName}</span>
                          ) : (
                            <span style={{ fontSize: '0.8rem', color: '#a89b91', fontStyle: 'italic' }}>Unassigned</span>
                          )}
                        </td>
                        <td>
                          {del.entry?.theme ? (
                            <span style={{ fontSize: '0.88rem', color: '#5c4d43' }}>{del.entry.theme}</span>
                          ) : (
                            <span style={{ fontSize: '0.8rem', color: '#a89b91', fontStyle: 'italic' }}>Theme not submitted</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                            {del.participantCount} {del.participantCount === 1 ? 'dancer' : 'dancers'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {del.primaryMusic ? (
                            <span title="Music track uploaded" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#099268', fontSize: '0.82rem', fontWeight: 600 }}>
                              <Music size={14} /> Ready
                            </span>
                          ) : (
                            <span style={{ color: '#a89b91', fontSize: '0.8rem' }}>None</span>
                          )}
                        </td>
                        <td>{renderStatusBadge(status)}</td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                            <Button
                              variant="filled"
                              size="small"
                              onClick={() => openContingentDetail(del)}
                            >
                              Manage & Review
                            </Button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(del)}
                              title="Delete contingent"
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#c92a2a',
                                cursor: 'pointer',
                                padding: '6px',
                                borderRadius: '4px',
                              }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          </div>

          {/* Mobile Cards View */}
          <div className="kit-claims-mobile-view">
            {filteredDelegations.map((del) => {
              const status = del.entry?.status || 'draft';
              return (
                <div key={del.id} className="kit-claim-card">
                  <div className="kit-claim-card__header">
                    <div>
                      <strong style={{ fontSize: '1.05rem', color: 'var(--wine, #741724)', display: 'block' }}>
                        {del.name}
                      </strong>
                      <span style={{ fontSize: '0.82rem', color: '#857366' }}>
                        {del.locality || 'No locality specified'}
                      </span>
                    </div>
                    {renderStatusBadge(status)}
                  </div>

                  <div className="kit-claim-card__meta-grid">
                    <div className="kit-meta-item">
                      <span className="kit-meta-label">Delegation Head</span>
                      <strong className="kit-meta-val">{del.head?.fullName || 'Unassigned'}</strong>
                    </div>
                    <div className="kit-meta-item">
                      <span className="kit-meta-label">Roster / Performers</span>
                      <strong className="kit-meta-val">{del.participantCount} registered</strong>
                    </div>
                  </div>

                  {del.entry?.theme && (
                    <div style={{ padding: '8px 10px', background: '#faf8f5', borderRadius: '8px', fontSize: '0.85rem' }}>
                      <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#857366', fontWeight: 600, display: 'block' }}>
                        Theme
                      </span>
                      <strong>{del.entry.theme}</strong>
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                    <span style={{ fontSize: '0.82rem', color: del.primaryMusic ? '#099268' : '#857366', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Music size={15} />
                      {del.primaryMusic ? 'Music uploaded' : 'No track'}
                    </span>

                    <Button
                      variant="filled"
                      size="small"
                      onClick={() => openContingentDetail(del)}
                    >
                      Manage & Review
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Modal: Create New Contingent */}
      <Dialog
        open={showCreateModal}
        onClose={() => !savingNewContingent && setShowCreateModal(false)}
        title="Add Festival Contingent"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-space-3)' }}>
          <TextField
            label="Contingent Name *"
            placeholder="e.g. Tribu Guinacotnon or Barangay Poblacion"
            value={newContingentName}
            onChange={(e) => setNewContingentName(e.target.value)}
          />

          <TextField
            label="Barangay / Locality / School"
            placeholder="e.g. Brgy. Guinacot, Guindulman"
            value={newContingentLocality}
            onChange={(e) => setNewContingentLocality(e.target.value)}
          />

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
              Assign Delegation Head Account (Optional)
            </label>
            <select
              value={newContingentHeadId}
              onChange={(e) => setNewContingentHeadId(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d4c5b9', fontSize: '0.9rem' }}
            >
              <option value="">-- Assign later / No Head Assigned --</option>
              {designatedHeads.length > 0 && (
                <optgroup label="Designated Delegation Heads (Users & Staff)">
                  {designatedHeads.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.fullName} {h.assignedContingentName ? `(Assigned: ${h.assignedContingentName})` : '(Available)'}
                    </option>
                  ))}
                </optgroup>
              )}
              {otherAccounts.length > 0 && (
                <optgroup label="Other Accounts (Will be granted Delegation Head role)">
                  {otherAccounts.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.fullName}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>

            {designatedHeads.length === 0 ? (
              <div style={{ marginTop: '8px', padding: '10px 12px', background: '#fff9db', border: '1px solid #f59f00', borderRadius: '8px', fontSize: '0.82rem', color: '#7f4f00' }}>
                <strong>Notice:</strong> No accounts with the <em>Delegation head</em> role have been created yet. You can create staff accounts in <a href="/admin/users" style={{ color: 'var(--wine, #741724)', fontWeight: 700, textDecoration: 'underline' }}>Users & Staff</a> with the "Delegation head" role, or select an existing account above to automatically grant them the role.
              </div>
            ) : (
              <small style={{ display: 'block', marginTop: '6px', color: '#857366', fontSize: '0.78rem' }}>
                When assigned, this account can sign in to the portal and can strictly access, edit, and manage <strong>this contingent only</strong>.
              </small>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: 'var(--md-space-2)' }}>
            <Button variant="ghost" onClick={() => setShowCreateModal(false)} disabled={savingNewContingent}>
              Cancel
            </Button>
            <Button variant="filled" onClick={() => void handleCreateContingent()} disabled={savingNewContingent}>
              {savingNewContingent ? 'Registering…' : 'Create Contingent'}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Confirm Delete Contingent */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Delete Contingent?"
        message={`Are you sure you want to permanently delete "${deleteTarget?.name}"? All registered dancer rosters, music tracks, and entry history for this contingent will be deleted.`}
        confirmLabel={deletingContingent ? 'Deleting…' : 'Yes, Delete Contingent'}
        tone="danger"
        onConfirm={() => void handleDeleteContingent()}
        onCancel={() => !deletingContingent && setDeleteTarget(null)}
      />
    </div>
  );
}
