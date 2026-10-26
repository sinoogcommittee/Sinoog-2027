import { useEffect, useState, useMemo, useCallback, type FormEvent } from 'react';
import { Plus, Search, Calendar, Edit2, Trash2, Globe, Clock, MapPin, User, AlertCircle, X, Check } from 'lucide-react';
import {
  getAllActivitiesForAdmin,
  createActivity,
  updateActivity,
  deleteActivity,
  formatActivityDateTime,
  getActivityDateKey,
  sortActivitiesByDateAndOrder,
  type ActivityInput,
} from '../../features/activities/activityQueries';
import { getCurrentEdition } from '../../features/editions/editionQueries';
import { StatusBadge } from '../../components/StatusBadge';
import { LoadingState, EmptyState, ConfirmDialog } from '../../features/ui/FeedbackStates';
import { useToast } from '../../features/ui/useToast';
import type { DbActivity, ActivityType, ContentStatus } from '../../types';

export function ActivitiesManagerPage() {
  const { toast } = useToast();
  const [activities, setActivities] = useState<DbActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [editionId, setEditionId] = useState<string>('');

  // Filters
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Dialog & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<DbActivity | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [type, setType] = useState<ActivityType>('mass');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [venue, setVenue] = useState('');
  const [celebrant, setCelebrant] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ContentStatus>('published');
  const [sortOrder, setSortOrder] = useState<number>(1);

  // Delete Confirm State
  const [deleteTarget, setDeleteTarget] = useState<DbActivity | null>(null);

  const activitiesOnSelectedDate = useMemo(() => {
    const dateKey = getActivityDateKey(startsAt);
    if (!dateKey) return [];
    return sortActivitiesByDateAndOrder(
      activities.filter((activity) =>
        activity.id !== editingActivity?.id && getActivityDateKey(activity.starts_at) === dateKey
      )
    );
  }, [activities, startsAt, editingActivity]);

  const nextOrderForDate = useCallback((dateValue: string, excludedId?: string) => {
    const dateKey = getActivityDateKey(dateValue);
    if (!dateKey) return 1;
    const orders = activities
      .filter((activity) => activity.id !== excludedId && getActivityDateKey(activity.starts_at) === dateKey)
      .map((activity) => activity.sort_order || 0);
    return Math.max(0, ...orders) + 1;
  }, [activities]);

  const fetchActivities = useCallback(async () => {
    try {
      const [currentEd, list] = await Promise.all([
        getCurrentEdition(),
        getAllActivitiesForAdmin(),
      ]);
      setEditionId(currentEd.id);
      setActivities(list);
    } catch (err: unknown) {
      console.error('Failed to load activities:', err);
      toast('Could not fetch activities from database.', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const [currentEd, list] = await Promise.all([
          getCurrentEdition(),
          getAllActivitiesForAdmin(),
        ]);
        if (!mounted) return;
        setEditionId(currentEd.id);
        setActivities(list);
      } catch (err: unknown) {
        if (!mounted) return;
        console.error('Failed to load activities:', err);
        toast('Could not fetch activities from database.', 'error');
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

  const openCreateModal = () => {
    const defaultStart = '2027-01-06T17:00';
    setEditingActivity(null);
    setTitle('');
    setType('mass');
    setStartsAt(defaultStart);
    setEndsAt('');
    setVenue('Sto. Niño Parish Church, Guinacot');
    setCelebrant('');
    setDescription('');
    setStatus('published');
    setSortOrder(nextOrderForDate(defaultStart));
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (act: DbActivity) => {
    setEditingActivity(act);
    setTitle(act.title);
    setType(act.type);
    setStartsAt(act.starts_at ? act.starts_at.slice(0, 16) : '');
    setEndsAt(act.ends_at ? act.ends_at.slice(0, 16) : '');
    setVenue(act.venue || '');
    setCelebrant(act.celebrant || '');
    setDescription(act.description || '');
    setStatus(act.status);
    setSortOrder(act.sort_order);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError('Please enter an activity title.');
      return;
    }

    if (startsAt && endsAt && new Date(startsAt) > new Date(endsAt)) {
      setFormError('The start time cannot be later than the end time.');
      return;
    }

    try {
      setFormSubmitting(true);
      setFormError(null);

      const payload: ActivityInput = {
        edition_id: editionId || 'current-2027',
        title: title.trim(),
        type,
        starts_at: startsAt ? new Date(startsAt).toISOString() : null,
        ends_at: endsAt ? new Date(endsAt).toISOString() : null,
        venue: venue.trim() || null,
        celebrant: celebrant.trim() || null,
        description: description.trim() || null,
        status,
        sort_order: Number(sortOrder) || 1,
      };

      const previousDateKey = getActivityDateKey(editingActivity?.starts_at);
      const savedActivity = editingActivity
        ? await updateActivity(editingActivity.id, payload)
        : await createActivity(payload);

      const targetDateKey = getActivityDateKey(savedActivity.starts_at);
      if (targetDateKey) {
        const targetGroup = sortActivitiesByDateAndOrder([
          ...activities.filter((activity) =>
            activity.id !== savedActivity.id && getActivityDateKey(activity.starts_at) === targetDateKey
          ),
          savedActivity,
        ]);
        const withoutSaved = targetGroup.filter((activity) => activity.id !== savedActivity.id);
        const requestedIndex = Math.max(0, Math.min(Number(sortOrder || 1) - 1, withoutSaved.length));
        withoutSaved.splice(requestedIndex, 0, savedActivity);
        await Promise.all(withoutSaved.map((activity, index) =>
          activity.sort_order === index + 1
            ? Promise.resolve(activity)
            : updateActivity(activity.id, { sort_order: index + 1 })
        ));
      }

      if (previousDateKey && previousDateKey !== targetDateKey) {
        const previousGroup = sortActivitiesByDateAndOrder(
          activities.filter((activity) =>
            activity.id !== savedActivity.id && getActivityDateKey(activity.starts_at) === previousDateKey
          )
        );
        await Promise.all(previousGroup.map((activity, index) =>
          activity.sort_order === index + 1
            ? Promise.resolve(activity)
            : updateActivity(activity.id, { sort_order: index + 1 })
        ));
      }

      if (editingActivity) {
        toast(`Updated "${payload.title}" successfully.`, 'success');
      } else {
        toast(`Created "${payload.title}" successfully.`, 'success');
      }

      setIsModalOpen(false);
      await fetchActivities();
    } catch (err: unknown) {
      console.error('Error saving activity:', err);
      setFormError(err instanceof Error ? err.message : 'Failed to save activity.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleToggleStatus = async (act: DbActivity) => {
    const nextStatus: ContentStatus = act.status === 'published' ? 'draft' : 'published';
    try {
      await updateActivity(act.id, { status: nextStatus });
      toast(`Marked "${act.title}" as ${nextStatus}.`, 'success');
      await fetchActivities();
    } catch (err: unknown) {
      console.error('Failed to change activity status:', err);
      toast('Failed to change status.', 'error');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteActivity(deleteTarget.id);
      toast(`Deleted "${deleteTarget.title}".`, 'info');
      setDeleteTarget(null);
      await fetchActivities();
    } catch (err: unknown) {
      console.error('Failed to delete activity:', err);
      toast('Failed to delete activity.', 'error');
    }
  };

  const filteredActivities = useMemo(() => {
    return sortActivitiesByDateAndOrder(activities.filter((act) => {
      const matchType = typeFilter === 'all' || act.type === typeFilter;
      const matchStatus = statusFilter === 'all' || act.status === statusFilter;
      const matchQuery =
        !searchQuery ||
        act.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (act.venue && act.venue.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (act.celebrant && act.celebrant.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchType && matchStatus && matchQuery;
    }));
  }, [activities, typeFilter, statusFilter, searchQuery]);

  return (
    <div className="admin-page">
      <div className="admin-heading">
        <div>
          <p className="eyebrow">Sto. Niño Parish Guinacot</p>
          <h1>Activities & Schedule</h1>
          <p>Manage Holy Masses, novena dates, Sinoog Run, and nightly cultural programs.</p>
        </div>
        <button type="button" className="button button--primary" onClick={openCreateModal}>
          <Plus size={18} /> Add activity
        </button>
      </div>

      <section className="admin-panel">
        <div className="table-tools" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
          <label style={{ flex: '1 1 240px' }}>
            <Search size={16} />
            <input
              type="text"
              placeholder="Search by title, venue, or celebrant…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </label>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              aria-label="Filter by activity type"
              style={{ padding: '0.45rem 0.75rem', borderRadius: '6px', border: '1px solid #d4c5b9' }}
            >
              <option value="all">All Types</option>
              <option value="mass">Masses</option>
              <option value="run">Sinoog Run</option>
              <option value="festival">Festival</option>
              <option value="nightly">Nightly Activities</option>
              <option value="other">Other Events</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by publication status"
              style={{ padding: '0.45rem 0.75rem', borderRadius: '6px', border: '1px solid #d4c5b9' }}
            >
              <option value="all">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '3rem' }}>
            <LoadingState message="Loading schedule records…" />
          </div>
        ) : filteredActivities.length === 0 ? (
          <EmptyState
            title="No activities match your criteria"
            message={
              searchQuery || typeFilter !== 'all' || statusFilter !== 'all'
                ? 'Try resetting your search or filter options.'
                : 'Get started by creating the first event on the schedule.'
            }
            action={
              <button type="button" className="button button--secondary" onClick={openCreateModal}>
                <Plus size={16} /> Add new event
              </button>
            }
          />
        ) : (
          <div className="admin-table activity-admin-table">
            <div className="admin-table__head activity-table__grid activity-table__head">
              <span>Activity & Details</span>
              <span>Type</span>
              <span>Schedule</span>
              <span>Venue / Celebrant</span>
              <span>Status</span>
              <span className="activity-table__actions-label">Actions</span>
            </div>

            {filteredActivities.map((act) => {
              const dt = formatActivityDateTime(act.starts_at);
              return (
                <div
                  key={act.id}
                  className="activity-table__grid activity-table__row"
                >
                  <div className="activity-table__cell activity-table__activity">
                    <strong style={{ display: 'block', fontSize: '1.05rem', color: '#3d1214' }}>
                      {act.title}
                    </strong>
                    {act.description && (
                      <small style={{ color: '#6d6158', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {act.description}
                      </small>
                    )}
                  </div>

                  <div className="activity-table__cell activity-table__type">
                    <span
                      style={{
                        display: 'inline-block',
                        textTransform: 'capitalize',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        backgroundColor: '#f5efe6',
                        color: '#634b35',
                      }}
                    >
                      {act.type}
                    </span>
                  </div>

                  <div className="activity-table__cell activity-table__schedule" style={{ fontSize: '0.9rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#2c221e' }}>
                      <Calendar size={14} color="#781d22" />
                      <span>{dt.date}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#6d6158', fontSize: '0.82rem' }}>
                      <Clock size={13} />
                      <span>{dt.time}</span>
                    </div>
                  </div>

                  <div className="activity-table__cell activity-table__venue" style={{ fontSize: '0.85rem', color: '#55483f' }}>
                    {act.venue && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <MapPin size={13} color="#a1403d" />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{act.venue}</span>
                      </div>
                    )}
                    {act.celebrant && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#781d22' }}>
                        <User size={13} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{act.celebrant}</span>
                      </div>
                    )}
                  </div>

                  <div className="activity-table__cell activity-table__status">
                    <StatusBadge tone={act.status === 'published' ? 'success' : act.status === 'draft' ? 'warning' : 'neutral'}>
                      {act.status}
                    </StatusBadge>
                  </div>

                  <div className="activity-table__cell activity-table__actions">
                    <button
                      type="button"
                      className="button button--ghost"
                      style={{ padding: '0.35rem' }}
                      title={act.status === 'published' ? 'Unpublish (set to draft)' : 'Publish to live site'}
                      onClick={() => void handleToggleStatus(act)}
                    >
                      <Globe size={16} color={act.status === 'published' ? '#1b7340' : '#888'} />
                    </button>
                    <button
                      type="button"
                      className="button button--ghost"
                      style={{ padding: '0.35rem' }}
                      title="Edit activity"
                      onClick={() => openEditModal(act)}
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      type="button"
                      className="button button--ghost"
                      style={{ padding: '0.35rem', color: '#c53030' }}
                      title="Delete activity"
                      onClick={() => setDeleteTarget(act)}
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

      {/* Activity Edit / Add Modal */}
      {isModalOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="activity-modal-title">
          <div className="modal-card activity-modal" style={{ maxWidth: '640px', width: '95%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 id="activity-modal-title" style={{ fontSize: '1.35rem', margin: 0 }}>
                {editingActivity ? 'Edit Activity' : 'Create New Activity'}
              </h2>
              <button
                type="button"
                className="button button--ghost"
                onClick={() => setIsModalOpen(false)}
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '6px',
                  color: '#991b1b',
                  marginBottom: '1rem',
                  fontSize: '0.9rem',
                }}
              >
                <AlertCircle size={18} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={(e) => void handleFormSubmit(e)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.25rem', fontSize: '0.9rem' }}>
                  Activity Title <span style={{ color: '#c53030' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Opening Novena Mass (Day 1)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '6px', border: '1px solid #d4c5b9' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.25rem', fontSize: '0.9rem' }}>
                    Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as ActivityType)}
                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '6px', border: '1px solid #d4c5b9' }}
                  >
                    <option value="mass">Holy Mass / Novena</option>
                    <option value="run">Sinoog Run</option>
                    <option value="festival">Festival & Street Dance</option>
                    <option value="nightly">Nightly Activity / Program</option>
                    <option value="other">Other Event</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.25rem', fontSize: '0.9rem' }}>
                    Publication Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ContentStatus)}
                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '6px', border: '1px solid #d4c5b9' }}
                  >
                    <option value="published">Published (Visible to public)</option>
                    <option value="draft">Draft (Private to committee)</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.25rem', fontSize: '0.9rem' }}>
                    Start Date & Time (Asia/Manila)
                  </label>
                  <input
                    type="datetime-local"
                    value={startsAt}
                    onChange={(e) => {
                      const nextStart = e.target.value;
                      const oldDate = getActivityDateKey(startsAt);
                      const nextDate = getActivityDateKey(nextStart);
                      setStartsAt(nextStart);
                      if (oldDate !== nextDate) {
                        setSortOrder(nextOrderForDate(nextStart, editingActivity?.id));
                      }
                    }}
                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '6px', border: '1px solid #d4c5b9' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.25rem', fontSize: '0.9rem' }}>
                    End Date & Time (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={endsAt}
                    onChange={(e) => setEndsAt(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '6px', border: '1px solid #d4c5b9' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.25rem', fontSize: '0.9rem' }}>
                    Venue / Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sto. Niño Parish Church, Guinacot"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '6px', border: '1px solid #d4c5b9' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.25rem', fontSize: '0.9rem' }}>
                    Celebrant / Host (if applicable)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Rev. Fr. Parish Priest"
                    value={celebrant}
                    onChange={(e) => setCelebrant(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '6px', border: '1px solid #d4c5b9' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.25rem', fontSize: '0.9rem' }}>
                  Description & Details
                </label>
                <textarea
                  rows={3}
                  placeholder="Additional context, intentions, sponsors, or guidelines for this activity…"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '6px', border: '1px solid #d4c5b9' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.25rem', fontSize: '0.9rem' }}>
                  Order for {startsAt ? new Date(`${startsAt.slice(0, 10)}T00:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'this date'}
                </label>
                <input
                  type="number"
                  min={1}
                  max={activitiesOnSelectedDate.length + 1}
                  value={sortOrder}
                  onChange={(e) => setSortOrder(Math.max(1, Number(e.target.value)))}
                  disabled={!startsAt}
                  style={{ width: '100px', padding: '0.6rem 0.75rem', borderRadius: '6px', border: '1px solid #d4c5b9' }}
                />
                <small style={{ display: 'block', color: '#6d6158', marginTop: '0.25rem' }}>
                  New activities receive the next number automatically. Changing this number only reorders the {activitiesOnSelectedDate.length + 1} {activitiesOnSelectedDate.length === 0 ? 'activity' : 'activities'} on this date; activities on other dates are unchanged.
                </small>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  className="button button--ghost"
                  onClick={() => setIsModalOpen(false)}
                  disabled={formSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="button button--primary"
                  disabled={formSubmitting}
                >
                  <Check size={16} /> {formSubmitting ? 'Saving…' : editingActivity ? 'Save changes' : 'Create activity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Delete Activity"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This action removes it from both the public schedule and the database.`}
        confirmLabel="Yes, delete activity"
        tone="danger"
        onConfirm={() => void handleDeleteConfirm()}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
