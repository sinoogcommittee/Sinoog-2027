import { useEffect, useState, useCallback } from 'react';
import { Search, Download, Check, XCircle, FileText, X, AlertCircle } from 'lucide-react';
import {
  getAllRegistrationsForAdmin,
  updateRegistrationReview,
  getRunEventAndCategories,
  type RunCategory,
} from '../../features/run/runQueries';
import { getCurrentEdition } from '../../features/editions/editionQueries';
import { StatusBadge } from '../../components/StatusBadge';
import { LoadingState, EmptyState } from '../../features/ui/FeedbackStates';
import { useToast } from '../../features/ui/useToast';
import type { DbRunRegistration } from '../../types';

export function RegistrationsManagerPage() {
  const { toast } = useToast();
  const [registrations, setRegistrations] = useState<DbRunRegistration[]>([]);
  const [categories, setCategories] = useState<RunCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Review Modal State
  const [selectedReg, setSelectedReg] = useState<DbRunRegistration | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewing, setReviewing] = useState(false);

  const fetchRegistrations = useCallback(async () => {
    try {
      const ed = await getCurrentEdition();
      const [{ categories: cats }, list] = await Promise.all([
        getRunEventAndCategories(ed.id),
        getAllRegistrationsForAdmin(),
      ]);
      setCategories(cats);
      setRegistrations(list);
    } catch (err: unknown) {
      console.error('Failed to load registrations:', err);
      toast('Failed to load registrations from database.', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const ed = await getCurrentEdition();
        const [{ categories: cats }, list] = await Promise.all([
          getRunEventAndCategories(ed.id),
          getAllRegistrationsForAdmin(),
        ]);
        if (!mounted) return;
        setCategories(cats);
        setRegistrations(list);
      } catch (err: unknown) {
        if (!mounted) return;
        console.error('Failed to load registrations:', err);
        toast('Failed to load registrations from database.', 'error');
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

  const handleUpdateStatus = async (status: 'approved' | 'needs_changes' | 'rejected') => {
    if (!selectedReg) return;
    try {
      setReviewing(true);
      await updateRegistrationReview(selectedReg.id, status, reviewNotes);
      toast(`Registration marked as ${status}.`, 'success');
      setSelectedReg(null);
      setReviewNotes('');
      await fetchRegistrations();
    } catch (err: unknown) {
      console.error('Error updating registration:', err);
      toast('Failed to update registration status.', 'error');
    } finally {
      setReviewing(false);
    }
  };

  const filteredRegistrations = registrations.filter((r) => {
    const matchSearch =
      !searchQuery ||
      r.participant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.mobile.includes(searchQuery);
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchCategory = categoryFilter === 'all' || r.category_id === categoryFilter;
    return matchSearch && matchStatus && matchCategory;
  });

  const handleExportCSV = () => {
    if (registrations.length === 0) {
      toast('No registration records to export.', 'info');
      return;
    }

    const headers = ['Reference', 'Participant', 'Category', 'Shirt Size', 'Mobile', 'Locality', 'Emergency Name', 'Emergency Mobile', 'Status', 'Submitted At'];
    const rows = filteredRegistrations.map((r) => {
      const cat = categories.find((c) => c.id === r.category_id)?.name || 'Run';
      return [
        r.reference,
        `"${r.participant_name.replace(/"/g, '""')}"`,
        `"${cat}"`,
        r.shirt_size || '',
        `"${r.mobile}"`,
        `"${(r.locality || '').replace(/"/g, '""')}"`,
        `"${r.emergency_name.replace(/"/g, '""')}"`,
        `"${r.emergency_mobile}"`,
        r.status,
        r.submitted_at || '',
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'sinoog-2027-runners.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast('Exported runner records to CSV.', 'success');
  };

  // Shirt Size Totals
  const shirtCounts: Record<string, number> = { XS: 0, S: 0, M: 0, L: 0, XL: 0, '2XL': 0 };
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
          <p>Review participant entries, payments, shirt sizes, and allocate official bib numbers.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button type="button" className="button button--secondary" onClick={handleExportCSV}>
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {/* Shirt Sizing Summary Strip */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem', background: '#fff', border: '1px solid var(--line)', padding: '1rem 1.25rem', borderRadius: '8px' }}>
        <strong style={{ fontSize: '0.88rem', alignSelf: 'center', color: 'var(--wine)' }}>Shirt Kit Counts:</strong>
        {Object.entries(shirtCounts).map(([size, count]) => (
          <div key={size} style={{ fontSize: '0.88rem', background: '#faf8f4', padding: '0.25rem 0.6rem', borderRadius: '4px', border: '1px solid var(--line)' }}>
            <strong>{size}:</strong> {count}
          </div>
        ))}
        <div style={{ marginLeft: 'auto', fontSize: '0.88rem', color: 'var(--muted)', alignSelf: 'center' }}>
          Total registered: <strong>{registrations.length}</strong>
        </div>
      </div>

      <section className="admin-panel">
        <div className="table-tools" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
          <label style={{ flex: '1 1 240px' }}>
            <Search size={16} />
            <input
              type="text"
              placeholder="Search by participant name or reference…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </label>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              aria-label="Filter by category"
              style={{ padding: '0.45rem 0.75rem', borderRadius: '6px', border: '1px solid #d4c5b9' }}
            >
              <option value="all">All Distances</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by status"
              style={{ padding: '0.45rem 0.75rem', borderRadius: '6px', border: '1px solid #d4c5b9' }}
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
          <div style={{ padding: '3rem' }}>
            <LoadingState message="Loading runner registrations…" />
          </div>
        ) : filteredRegistrations.length === 0 ? (
          <EmptyState
            title="No registrations found"
            message={
              searchQuery || statusFilter !== 'all' || categoryFilter !== 'all'
                ? 'No participants matched the current filter criteria.'
                : 'Runner submissions will appear here once public registration opens.'
            }
          />
        ) : (
          <div className="admin-table">
            <div className="admin-table__head" style={{ gridTemplateColumns: '1.2fr 1.8fr 1fr 100px 100px 100px' }}>
              <span>Reference</span>
              <span>Participant & Locality</span>
              <span>Category / Shirt</span>
              <span>Fee</span>
              <span>Status</span>
              <span style={{ textAlign: 'right' }}>Actions</span>
            </div>

            {filteredRegistrations.map((r) => {
              const cat = categories.find((c) => c.id === r.category_id);
              const feeFormatted = (r.fee_centavos / 100).toLocaleString('en-PH', {
                style: 'currency',
                currency: 'PHP',
              });

              return (
                <div
                  key={r.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1.2fr 1.8fr 1fr 100px 100px 100px',
                    padding: '1rem',
                    borderBottom: '1px solid #ede4dc',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <div>
                    <strong style={{ fontFamily: 'monospace', color: 'var(--wine)' }}>{r.reference}</strong>
                    <small style={{ display: 'block', color: 'var(--muted)', fontSize: '0.78rem' }}>
                      {r.submitted_at ? new Date(r.submitted_at).toLocaleDateString('en-US') : ''}
                    </small>
                  </div>

                  <div>
                    <strong style={{ display: 'block', fontSize: '1rem' }}>{r.participant_name}</strong>
                    <small style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>
                      {r.locality || 'Bohol'} · {r.mobile}
                    </small>
                  </div>

                  <div>
                    <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>{cat?.name || 'Run'}</span>
                    <small style={{ display: 'block', color: 'var(--muted)' }}>
                      Shirt: <strong>{r.shirt_size || 'N/A'}</strong>
                    </small>
                  </div>

                  <div>
                    <span style={{ fontWeight: 600, color: 'var(--wine)', fontSize: '0.9rem' }}>{feeFormatted}</span>
                  </div>

                  <div>
                    <StatusBadge tone={r.status === 'approved' ? 'success' : r.status === 'rejected' ? 'danger' : 'warning'}>
                      {r.status}
                    </StatusBadge>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      className="button button--ghost button--sm"
                      onClick={() => {
                        setSelectedReg(r);
                        setReviewNotes(r.review_notes || '');
                      }}
                    >
                      <FileText size={16} /> Review
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Review Modal */}
      {selectedReg && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="review-modal-title">
          <div className="modal-card" style={{ maxWidth: '640px', width: '95%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h2 id="review-modal-title" style={{ fontSize: '1.35rem', margin: 0 }}>
                  Review Registration
                </h2>
                <small style={{ fontFamily: 'monospace', color: 'var(--wine)' }}>
                  {selectedReg.reference}
                </small>
              </div>
              <button
                type="button"
                className="button button--ghost"
                onClick={() => setSelectedReg(null)}
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', background: '#faf8f4', padding: '1rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.9rem' }}>
              <div><strong>Name:</strong> {selectedReg.participant_name}</div>
              <div><strong>Category:</strong> {categories.find((c) => c.id === selectedReg.category_id)?.name}</div>
              <div><strong>Mobile:</strong> {selectedReg.mobile}</div>
              <div><strong>Locality:</strong> {selectedReg.locality}</div>
              <div><strong>Shirt Size:</strong> {selectedReg.shirt_size}</div>
              <div><strong>Birth Date:</strong> {selectedReg.birth_date || 'N/A'}</div>
              <div><strong>Emergency Contact:</strong> {selectedReg.emergency_name} ({selectedReg.emergency_relationship})</div>
              <div><strong>Emergency Mobile:</strong> {selectedReg.emergency_mobile}</div>
            </div>

            {selectedReg.accessibility_notes && (
              <div style={{ background: '#fef3c7', padding: '0.75rem', borderRadius: '6px', fontSize: '0.88rem', color: '#92400e', marginBottom: '1rem' }}>
                <AlertCircle size={16} style={{ display: 'inline', marginRight: '0.35rem', verticalAlign: '-2px' }} />
                <strong>Medical / Assistance Notes:</strong> {selectedReg.accessibility_notes}
              </div>
            )}

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem', marginBottom: '0.25rem' }}>
                Review Notes / Instructions to Runner
              </label>
              <textarea
                rows={3}
                placeholder="Notes visible to runner in case of changes or rejection…"
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '6px', border: '1px solid #d4c5b9' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #eee', paddingTop: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="button button--danger button--sm"
                  disabled={reviewing}
                  onClick={() => void handleUpdateStatus('rejected')}
                >
                  <XCircle size={14} /> Reject
                </button>
                <button
                  type="button"
                  className="button button--secondary button--sm"
                  disabled={reviewing}
                  onClick={() => void handleUpdateStatus('needs_changes')}
                >
                  Request Changes
                </button>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="button button--ghost button--sm"
                  onClick={() => setSelectedReg(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="button button--primary button--sm"
                  disabled={reviewing}
                  onClick={() => void handleUpdateStatus('approved')}
                >
                  <Check size={14} /> Approve Entry
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

