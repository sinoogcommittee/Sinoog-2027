import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { ExternalLink, HeartHandshake, Pencil, Plus, Trash2, Upload, X } from 'lucide-react';
import { LoadingState, EmptyState } from '../../features/ui/FeedbackStates';
import { useToast } from '../../features/ui/useToast';
import { getCurrentEdition } from '../../features/editions/editionQueries';
import {
  SPONSOR_TIERS,
  createEditionSponsor,
  deleteEditionSponsor,
  getSponsorLogoUrl,
  listEditionSponsorsForAdmin,
  setEditionSponsorPublished,
  updateEditionSponsor,
  uploadSponsorLogo,
  type EditionSponsorRow,
} from '../../features/sponsors/sponsorQueries';

const emptyForm = {
  name: '',
  website_url: '',
  logo_path: '',
  tier: 'Bronze Sponsor',
  sort_order: 0,
  published: false,
};

export function SponsorsManagerPage() {
  const { toast } = useToast();
  const [editionId, setEditionId] = useState('');
  const [rows, setRows] = useState<EditionSponsorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [filter, setFilter] = useState('');

  const load = useCallback(async () => {
    try {
      const ed = await getCurrentEdition();
      setEditionId(ed.id);
      const list = await listEditionSponsorsForAdmin(ed.id);
      setRows(list);
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Unable to load sponsors.', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const ed = await getCurrentEdition();
        if (!mounted) return;
        setEditionId(ed.id);
        const list = await listEditionSponsorsForAdmin(ed.id);
        if (!mounted) return;
        setRows(list);
      } catch (err: unknown) {
        if (!mounted) return;
        toast(err instanceof Error ? err.message : 'Unable to load sponsors.', 'error');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [toast]);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.sponsor.name.toLowerCase().includes(q) ||
        r.tier.toLowerCase().includes(q) ||
        (r.sponsor.website_url || '').toLowerCase().includes(q)
    );
  }, [rows, filter]);

  function openCreate() {
    const nextOrder = rows.reduce((max, r) => Math.max(max, r.sort_order), 0) + 10;
    setEditingId(null);
    setForm({ ...emptyForm, sort_order: nextOrder });
    setModalOpen(true);
  }

  function openEdit(row: EditionSponsorRow) {
    setEditingId(row.sponsor_id);
    setForm({
      name: row.sponsor.name,
      website_url: row.sponsor.website_url || '',
      logo_path: row.sponsor.logo_path || '',
      tier: row.tier || 'Bronze Sponsor',
      sort_order: row.sort_order,
      published: row.published,
    });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleLogoUpload(file: File | null) {
    if (!file || !editionId) return;
    setUploading(true);
    try {
      const path = await uploadSponsorLogo(file, editionId);
      setForm((current) => ({ ...current, logo_path: path }));
      toast('Logo uploaded.', 'success');
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Logo upload failed.', 'error');
    } finally {
      setUploading(false);
    }
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        website_url: form.website_url || null,
        logo_path: form.logo_path || null,
        tier: form.tier,
        sort_order: Number(form.sort_order) || 0,
        published: form.published,
      };
      if (editingId) {
        await updateEditionSponsor(editingId, payload, editionId);
        toast('Sponsor updated.', 'success');
      } else {
        await createEditionSponsor(payload, editionId);
        toast('Sponsor added.', 'success');
      }
      closeModal();
      await load();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Unable to save sponsor.', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleTogglePublished(row: EditionSponsorRow) {
    try {
      await setEditionSponsorPublished(row.sponsor_id, !row.published, editionId);
      toast(row.published ? 'Sponsor unpublished.' : 'Sponsor published.', 'success');
      await load();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Unable to update publication state.', 'error');
    }
  }

  async function handleDelete(row: EditionSponsorRow) {
    if (
      !window.confirm(
        `Remove “${row.sponsor.name}” from Sinoog 2027? This does not delete historical records linked to other editions.`
      )
    ) {
      return;
    }
    try {
      await deleteEditionSponsor(row.sponsor_id, editionId);
      toast('Sponsor removed.', 'success');
      await load();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Unable to remove sponsor.', 'error');
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-heading">
        <div>
          <p className="eyebrow">Edition recognition</p>
          <h1>Sponsors</h1>
          <p>Manage partner names, tiers, logos, and what appears on the public sponsors page.</p>
        </div>
        <button type="button" className="button button--primary" onClick={openCreate}>
          <Plus size={16} /> Add sponsor
        </button>
      </div>

      <section className="admin-panel">
        <div className="table-tools" style={{ gap: '0.75rem', flexWrap: 'wrap' }}>
          <label className="search-field" style={{ flex: '1 1 240px', maxWidth: '100%' }}>
            <input
              type="search"
              placeholder="Search name, tier, or website…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              aria-label="Search sponsors"
            />
          </label>
          <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
            {rows.filter((r) => r.published).length} published · {rows.length} total
          </span>
        </div>

        {loading ? (
          <div style={{ padding: '3rem' }}>
            <LoadingState message="Loading sponsors…" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title={filter ? 'No matches' : 'No sponsors yet'}
            message={
              filter
                ? 'Try a different search term.'
                : 'Add the first partner for Sinoog 2027. Only published sponsors appear on the public site.'
            }
          />
        ) : (
          <div className="admin-table sponsors-admin-table">
            <div className="admin-table__head sponsors-admin-table__grid">
              <span>Sponsor</span>
              <span>Tier</span>
              <span>Order</span>
              <span>Status</span>
              <span style={{ textAlign: 'right' }}>Actions</span>
            </div>
            {filtered.map((row) => {
              const logo = getSponsorLogoUrl(row.sponsor.logo_path);
              return (
                <div key={row.sponsor_id} className="admin-table__row sponsors-admin-table__grid">
                  <div className="sponsors-admin-identity">
                    <div className="sponsors-admin-logo">
                      {logo ? (
                        <img src={logo} alt="" />
                      ) : (
                        <HeartHandshake size={20} aria-hidden />
                      )}
                    </div>
                    <div>
                      <strong>{row.sponsor.name}</strong>
                      {row.sponsor.website_url ? (
                        <small>
                          <a href={row.sponsor.website_url} target="_blank" rel="noreferrer">
                            {row.sponsor.website_url.replace(/^https?:\/\//, '')}
                          </a>
                        </small>
                      ) : (
                        <small style={{ color: 'var(--muted)' }}>No website</small>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="status">{row.tier}</span>
                  </div>
                  <div>{row.sort_order}</div>
                  <div>
                    <button
                      type="button"
                      className={`status ${row.published ? 'status--success' : 'status--warning'}`}
                      onClick={() => void handleTogglePublished(row)}
                      title={row.published ? 'Click to unpublish' : 'Click to publish'}
                    >
                      {row.published ? 'Published' : 'Draft'}
                    </button>
                  </div>
                  <div className="sponsors-admin-actions">
                    <button type="button" className="button button--ghost button--sm" onClick={() => openEdit(row)}>
                      <Pencil size={15} /> Edit
                    </button>
                    {row.sponsor.website_url && (
                      <a
                        className="button button--ghost button--sm"
                        href={row.sponsor.website_url}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Open website for ${row.sponsor.name}`}
                      >
                        <ExternalLink size={15} />
                      </a>
                    )}
                    <button
                      type="button"
                      className="button button--ghost button--sm"
                      onClick={() => void handleDelete(row)}
                      aria-label={`Remove ${row.sponsor.name}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {modalOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="sponsor-modal-title">
          <div className="modal-card sponsor-modal">
            <div className="sponsor-modal__header">
              <div>
                <p className="eyebrow">Sinoog 2027</p>
                <h2 id="sponsor-modal-title">{editingId ? 'Edit sponsor' : 'Add sponsor'}</h2>
                <p className="sponsor-modal__lede">
                  {editingId
                    ? 'Update recognition details for this partner.'
                    : 'Add a partner name, optional logo, and publish when ready.'}
                </p>
              </div>
              <button type="button" className="sponsor-modal__close" onClick={closeModal} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <form className="sponsor-form" onSubmit={(e) => void handleSave(e)}>
              <div className="sponsor-form__field">
                <label htmlFor="sponsor-name">Organization name</label>
                <input
                  id="sponsor-name"
                  type="text"
                  required
                  placeholder="e.g. Sto. Niño Parish Pastoral Council"
                  value={form.name}
                  onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))}
                  autoComplete="organization"
                />
              </div>

              <div className="sponsor-form__field">
                <label htmlFor="sponsor-url">Website URL</label>
                <input
                  id="sponsor-url"
                  type="url"
                  placeholder="https://example.com"
                  value={form.website_url}
                  onChange={(e) => setForm((c) => ({ ...c, website_url: e.target.value }))}
                />
              </div>

              <div className="sponsor-form__row">
                <div className="sponsor-form__field">
                  <label htmlFor="sponsor-tier">Tier</label>
                  <select
                    id="sponsor-tier"
                    value={form.tier}
                    onChange={(e) => setForm((c) => ({ ...c, tier: e.target.value }))}
                  >
                    {SPONSOR_TIERS.map((tier) => (
                      <option key={tier} value={tier}>
                        {tier}
                      </option>
                    ))}
                    {!(SPONSOR_TIERS as readonly string[]).includes(form.tier) && form.tier ? (
                      <option value={form.tier}>{form.tier} (current)</option>
                    ) : null}
                  </select>
                </div>
                <div className="sponsor-form__field">
                  <label htmlFor="sponsor-order">Sort order</label>
                  <input
                    id="sponsor-order"
                    type="number"
                    inputMode="numeric"
                    value={form.sort_order}
                    onChange={(e) => setForm((c) => ({ ...c, sort_order: Number(e.target.value) }))}
                  />
                </div>
              </div>

              <div className="sponsor-form__field">
                <span className="sponsor-form__label" id="sponsor-logo-label">
                  Logo
                </span>
                <div className="sponsor-form__logo" aria-labelledby="sponsor-logo-label">
                  <div className={`sponsor-form__logo-preview${form.logo_path ? ' has-image' : ''}`}>
                    {form.logo_path ? (
                      <img src={getSponsorLogoUrl(form.logo_path)} alt="" />
                    ) : (
                      <HeartHandshake size={26} aria-hidden />
                    )}
                  </div>
                  <div className="sponsor-form__logo-actions">
                    <label className="button button--secondary button--sm sponsor-form__upload">
                      <Upload size={14} /> {uploading ? 'Uploading…' : 'Upload logo'}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        hidden
                        disabled={uploading}
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          e.target.value = '';
                          void handleLogoUpload(file);
                        }}
                      />
                    </label>
                    {form.logo_path && (
                      <button
                        type="button"
                        className="button button--ghost button--sm"
                        onClick={() => setForm((c) => ({ ...c, logo_path: '' }))}
                      >
                        Remove
                      </button>
                    )}
                    <p className="sponsor-form__hint">JPEG, PNG, or WebP · up to 10 MB</p>
                  </div>
                </div>
              </div>

              <label className="sponsor-form__switch">
                <input
                  type="checkbox"
                  checked={form.published}
                  onChange={(e) => setForm((c) => ({ ...c, published: e.target.checked }))}
                />
                <span>
                  <strong>Publish on the public sponsors page</strong>
                  <small>Unpublished partners stay visible only in this workspace.</small>
                </span>
              </label>

              <div className="sponsor-form__actions">
                <button type="button" className="button button--ghost" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="button button--primary" disabled={saving || uploading}>
                  {saving ? 'Saving…' : editingId ? 'Save changes' : 'Add sponsor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
