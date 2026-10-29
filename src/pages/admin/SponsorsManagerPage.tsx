import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { ExternalLink, HeartHandshake, Pencil, Plus, Trash2, Upload } from 'lucide-react';
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
import { Button } from '../../components/Button';
import { Card } from '../../components/m3/Card';
import { Dialog } from '../../components/m3/Dialog';
import { TextField } from '../../components/m3/TextField';
import { SelectField } from '../../components/m3/SelectField';
import { Checkbox } from '../../components/m3/Checkbox';
import { SearchBar } from '../../components/m3/SearchBar';

const emptyForm = {
  name: '',
  website_url: '',
  facebook_url: '',
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
      facebook_url: row.sponsor.facebook_url || '',
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
        facebook_url: form.facebook_url || null,
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
        <Button variant="filled" leadingIcon={<Plus size={16} />} onClick={openCreate}>
          Add sponsor
        </Button>
      </div>

      <Card variant="outlined" style={{ padding: 'var(--md-space-4)' }}>
        <div className="table-tools admin-toolbar" style={{ display: 'flex', gap: 'var(--md-space-3)', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', marginBottom: 'var(--md-space-4)' }}>
          <div className="admin-toolbar__search-wrap">
            <SearchBar
              label="Search sponsors"
              placeholder="Search name, tier, or website…"
              value={filter}
              onValueChange={setFilter}
            />
          </div>
          <span className="admin-toolbar__count" style={{ color: 'var(--md-sys-color-on-surface-variant)', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
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
              <span style={{ textAlign: 'center' }}>Order</span>
              <span style={{ textAlign: 'center' }}>Status</span>
              <span style={{ textAlign: 'right' }}>Actions</span>
            </div>
            {filtered.map((row) => {
              const logo = getSponsorLogoUrl(row.sponsor.logo_path);
              return (
                <div key={row.sponsor_id} className="admin-table__row sponsors-admin-table__grid">
                  <div className="sponsors-admin-identity">
                    <div className="sponsors-admin-logo">
                      {logo ? (
                        <img src={logo} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                      ) : (
                        <HeartHandshake size={20} aria-hidden style={{ color: 'var(--md-sys-color-on-surface-variant)' }} />
                      )}
                    </div>
                    <div className="sponsors-admin-info">
                      <strong>{row.sponsor.name}</strong>
                      {row.sponsor.website_url ? (
                        <small style={{ display: 'block' }}>
                          <a href={row.sponsor.website_url} target="_blank" rel="noreferrer" style={{ color: 'var(--md-sys-color-primary)' }}>
                            {row.sponsor.website_url.replace(/^https?:\/\//, '')}
                          </a>
                        </small>
                      ) : (
                        <small style={{ display: 'block', color: 'var(--md-sys-color-on-surface-variant)' }}>No website</small>
                      )}
                    </div>
                  </div>
                  <div className="sponsors-admin-tier">
                    <span className="sponsor-tier-badge">
                      {row.tier}
                    </span>
                  </div>
                  <div className="sponsors-admin-order">
                    <span className="sponsors-admin-order-label">Order </span>
                    <span>{row.sort_order}</span>
                  </div>
                  <div className="sponsors-admin-status">
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
                    <button
                      type="button"
                      className="button button--ghost button--sm"
                      onClick={() => openEdit(row)}
                      aria-label={`Edit ${row.sponsor.name}`}
                      title="Edit"
                    >
                      <Pencil size={15} />
                    </button>
                    {row.sponsor.website_url && (
                      <a
                        className="button button--ghost button--sm"
                        href={row.sponsor.website_url}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Open website for ${row.sponsor.name}`}
                        title="Open website"
                      >
                        <ExternalLink size={15} />
                      </a>
                    )}
                    <button
                      type="button"
                      className="button button--ghost button--sm"
                      onClick={() => void handleDelete(row)}
                      aria-label={`Remove ${row.sponsor.name}`}
                      title="Remove sponsor"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Dialog
        open={modalOpen}
        onClose={closeModal}
        title={editingId ? 'Edit sponsor' : 'Add sponsor'}
      >
        <p style={{ margin: '0 0 var(--md-space-4) 0', color: 'var(--md-sys-color-on-surface-variant)', fontSize: '0.875rem' }}>
          {editingId ? 'Update recognition details for this partner.' : 'Add a partner name, optional logo, and publish when ready.'}
        </p>
        <form onSubmit={(e) => void handleSave(e)} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-space-4)' }}>
          <TextField
            label="Organization name"
            required
            placeholder="e.g. Sto. Niño Parish Pastoral Council"
            value={form.name}
            onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))}
            autoComplete="organization"
          />

          <TextField
            label="Website URL"
            type="url"
            placeholder="https://example.com"
            value={form.website_url}
            onChange={(e) => setForm((c) => ({ ...c, website_url: e.target.value }))}
          />

          <TextField
            label="Facebook page"
            type="url"
            placeholder="https://facebook.com/yourpage"
            value={form.facebook_url}
            onChange={(e) => setForm((c) => ({ ...c, facebook_url: e.target.value }))}
            helperText="Optional. Shown next to website link when set."
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--md-space-3)' }}>
            <SelectField
              label="Tier"
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
            </SelectField>

            <TextField
              label="Sort order"
              type="number"
              inputMode="numeric"
              value={String(form.sort_order)}
              onChange={(e) => setForm((c) => ({ ...c, sort_order: Number(e.target.value) }))}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-space-2)' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--md-sys-color-on-surface)' }}>
              Partner Logo
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--md-space-4)' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: 'var(--md-sys-shape-corner-medium)',
                  border: '1px solid var(--md-sys-color-outline-variant)',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--md-sys-color-surface-container-highest)',
                  flexShrink: 0,
                }}
              >
                {form.logo_path ? (
                  <img src={getSponsorLogoUrl(form.logo_path)} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                ) : (
                  <HeartHandshake size={28} aria-hidden style={{ color: 'var(--md-sys-color-on-surface-variant)' }} />
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-space-1)' }}>
                <div style={{ display: 'flex', gap: 'var(--md-space-2)' }}>
                  <label
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 'var(--md-space-1)',
                      padding: '8px 16px',
                      borderRadius: 'var(--md-sys-shape-corner-full)',
                      border: '1px solid var(--md-sys-color-outline)',
                      background: 'transparent',
                      color: 'var(--md-sys-color-primary)',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                    }}
                  >
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
                    <Button
                      variant="text"
                      size="small"
                      onClick={() => setForm((c) => ({ ...c, logo_path: '' }))}
                    >
                      Remove
                    </Button>
                  )}
                </div>
                <small style={{ color: 'var(--md-sys-color-on-surface-variant)', fontSize: '0.75rem' }}>
                  JPEG, PNG, or WebP · up to 10 MB
                </small>
              </div>
            </div>
          </div>

          <div style={{ paddingTop: 'var(--md-space-2)' }}>
            <Checkbox
              checked={form.published}
              onChange={(e) => setForm((c) => ({ ...c, published: e.target.checked }))}
              label="Publish on the public sponsors page"
            />
            <small style={{ display: 'block', color: 'var(--md-sys-color-on-surface-variant)', marginLeft: '32px', fontSize: '0.8rem' }}>
              Unpublished partners stay visible only in this workspace.
            </small>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--md-space-2)', marginTop: 'var(--md-space-2)' }}>
            <Button variant="text" onClick={closeModal}>
              Cancel
            </Button>
            <Button variant="filled" type="submit" loading={saving || uploading} disabled={saving || uploading}>
              {editingId ? 'Save changes' : 'Add sponsor'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
