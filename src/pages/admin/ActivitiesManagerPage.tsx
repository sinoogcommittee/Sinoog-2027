import { useEffect, useState, useMemo, useCallback, type FormEvent } from 'react';
import { Plus, Calendar, Edit2, Trash2, Globe, Clock, MapPin, User, Check } from 'lucide-react';
import { Button } from '../../components/Button';
import { Card } from '../../components/m3/Card';
import { Dialog } from '../../components/m3/Dialog';
import { TextField } from '../../components/m3/TextField';
import { SelectField } from '../../components/m3/SelectField';
import { TextArea } from '../../components/m3/TextArea';
import { SearchBar } from '../../components/m3/SearchBar';
import {
  getAllActivitiesForAdmin,
  createActivity,
  updateActivity,
  reorderActivityForDate,
  deleteActivity,
  formatActivityDateTime,
  getActivityDateKey,
  sortActivitiesByDateAndOrder,
  type ActivityInput,
} from '../../features/activities/activityQueries';
import { getCurrentEdition } from '../../features/editions/editionQueries';
import { StatusBadge } from '../../components/StatusBadge';
import { LoadingState, EmptyState, ConfirmDialog, InlineMessage } from '../../features/ui/FeedbackStates';
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

    if (startsAt && endsAt && new Date(startsAt) >= new Date(endsAt)) {
      setFormError('The end time must be after the start time.');
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
        await reorderActivityForDate(savedActivity.id, Number(sortOrder || 1), previousDateKey || null);
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
    <div className="m3-activities-manager admin-page">
      <div className="admin-heading">
        <div>
          <p className="eyebrow">Sto. Niño Parish Guinacot</p>
          <h1>Activities & Schedule</h1>
          <p>Manage Holy Masses, novena dates, Sinoog Run, and nightly cultural programs.</p>
        </div>
        <Button type="button" variant="filled" leadingIcon={<Plus size={18} aria-hidden />} onClick={openCreateModal}>
          Add activity
        </Button>
      </div>

      <Card as="section" variant="outlined" className="admin-panel">
        <div className="table-tools admin-toolbar">
          <SearchBar
            label="Search activities"
            placeholder="Search by title, venue, or celebrant…"
            value={searchQuery}
            onValueChange={setSearchQuery}
            fieldClassName="table-tools-search"
          />

          <div className="table-tools-filters">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              aria-label="Filter by activity type"
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
              <Button type="button" variant="outlined" leadingIcon={<Plus size={16} aria-hidden />} onClick={openCreateModal}>
                Add new event
              </Button>
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
                      <span>{dt.weekday}, {dt.date}</span>
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
      </Card>

      {/* Activity Edit / Add Modal */}
      <Dialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingActivity ? 'Edit Activity' : 'Create New Activity'}
      >
        {formError && (
          <div style={{ marginBottom: '1rem' }}>
            <InlineMessage tone="error">
              {formError}
            </InlineMessage>
          </div>
        )}

        <form onSubmit={(e) => void handleFormSubmit(e)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <TextField
            label="Activity Title *"
            required
            placeholder="e.g. Opening Novena Mass (Day 1)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <div className="responsive-two-column" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <SelectField
              label="Type"
              value={type}
              onChange={(e) => setType(e.target.value as ActivityType)}
            >
              <option value="mass">Holy Mass / Novena</option>
              <option value="run">Sinoog Run</option>
              <option value="festival">Festival & Street Dance</option>
              <option value="nightly">Nightly Activity / Program</option>
              <option value="other">Other Event</option>
            </SelectField>

            <SelectField
              label="Publication Status"
              value={status}
              onChange={(e) => setStatus(e.target.value as ContentStatus)}
            >
              <option value="published">Published (Visible to public)</option>
              <option value="draft">Draft (Private to committee)</option>
              <option value="archived">Archived</option>
            </SelectField>
          </div>

          <div className="responsive-two-column" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <TextField
              label="Start Date & Time (Asia/Manila)"
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
            />

            <TextField
              label="End Date & Time (Optional)"
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
            />
          </div>

          <div className="responsive-two-column" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <TextField
              label="Venue / Location"
              type="text"
              placeholder="e.g. Sto. Niño Parish Church, Guinacot"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
            />

            <TextField
              label="Celebrant / Host (if applicable)"
              type="text"
              placeholder="e.g. Rev. Fr. Parish Priest"
              value={celebrant}
              onChange={(e) => setCelebrant(e.target.value)}
            />
          </div>

          <TextArea
            label="Description & Details"
            rows={3}
            placeholder="Additional context, intentions, sponsors, or guidelines for this activity…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div>
            <TextField
              label={`Order for ${startsAt ? new Date(`${startsAt.slice(0, 10)}T00:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'this date'}`}
              type="number"
              min={1}
              max={activitiesOnSelectedDate.length + 1}
              value={String(sortOrder)}
              onChange={(e) => setSortOrder(Math.max(1, Number(e.target.value)))}
              disabled={!startsAt}
              helperText={`New activities receive the next number automatically. Changing this number only reorders the ${activitiesOnSelectedDate.length + 1} ${activitiesOnSelectedDate.length === 0 ? 'activity' : 'activities'} on this date.`}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <Button
              type="button"
              variant="text"
              onClick={() => setIsModalOpen(false)}
              disabled={formSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="filled"
              disabled={formSubmitting}
              loading={formSubmitting}
              leadingIcon={<Check size={16} aria-hidden />}
            >
              {editingActivity ? 'Save changes' : 'Create activity'}
            </Button>
          </div>
        </form>
      </Dialog>

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
