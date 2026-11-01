import React, { useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, Upload, X, Search, Filter } from 'lucide-react';
import type { DbRunRegistration } from '../../types/database';
import { getBibCategoryLabel, type RunCategory } from '../../features/run/runQueries';
import { supabase } from '../../lib/supabase';
import './RaceBibPrintSheet.css';

export interface RaceBibPrintSheetProps {
  open: boolean;
  onClose: () => void;
  registrations: DbRunRegistration[];
  categories: RunCategory[];
  currentLogoUrl?: string | null;
  onLogoUpdated?: (newUrl: string) => void;
}

export function RaceBibPrintSheet({
  open,
  onClose,
  registrations,
  categories,
  currentLogoUrl,
  onLogoUpdated,
}: RaceBibPrintSheetProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [logoUrl, setLogoUrl] = useState<string>(() => {
    return (
      currentLogoUrl ||
      localStorage.getItem('sinoog_bib_logo_url') ||
      '/images/sinoog_run_logo.png'
    );
  });
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const fileInputId = useId();

  // Filter approved runners with a bib number
  const approvedRunners = useMemo(() => {
    return registrations
      .filter((r) => r.status === 'approved' && r.bib_number)
      .sort((a, b) => parseInt(a.bib_number || '0', 10) - parseInt(b.bib_number || '0', 10));
  }, [registrations]);

  // Apply Category & Search filters
  const filteredRunners = useMemo(() => {
    return approvedRunners.filter((runner) => {
      if (categoryFilter !== 'all' && runner.category_id !== categoryFilter) {
        return false;
      }
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matchesName = runner.participant_name.toLowerCase().includes(query);
        const matchesBib = runner.bib_number?.toLowerCase().includes(query);
        const matchesRef = runner.reference?.toLowerCase().includes(query);
        if (!matchesName && !matchesBib && !matchesRef) return false;
      }
      return true;
    });
  }, [approvedRunners, categoryFilter, searchTerm]);

  // Pair runners into 2-per-sheet (8.5x13 inches portrait, stacked vertically)
  const sheets = useMemo(() => {
    const pairs: DbRunRegistration[][] = [];
    for (let i = 0; i < filteredRunners.length; i += 2) {
      pairs.push(filteredRunners.slice(i, i + 2));
    }
    return pairs;
  }, [filteredRunners]);

  const handlePrint = () => {
    window.print();
  };

  const handleLogoUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingLogo(true);
      if (supabase) {
        const fileExt = file.name.split('.').pop() || 'png';
        const fileName = `branding/sinoog_run_bib_logo_${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('public-media')
          .upload(fileName, file, { upsert: true });

        if (!uploadError) {
          const {
            data: { publicUrl },
          } = supabase.storage.from('public-media').getPublicUrl(fileName);
          setLogoUrl(publicUrl);
          localStorage.setItem('sinoog_bib_logo_url', publicUrl);
          onLogoUpdated?.(publicUrl);
          return;
        }
      }

      // Local fallback
      const reader = new FileReader();
      reader.onload = (event) => {
        const resultUrl = event.target?.result as string;
        if (resultUrl) {
          setLogoUrl(resultUrl);
          localStorage.setItem('sinoog_bib_logo_url', resultUrl);
          onLogoUpdated?.(resultUrl);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Logo upload error:', err);
    } finally {
      setUploadingLogo(false);
    }
  };

  if (!open) return null;

  const modalContent = (
    <div className="race-bib-modal-backdrop" role="dialog" aria-modal="true" aria-label="Race Bib Print Preview">
      {/* Top Action Toolbar (Hidden during print) */}
      <div className="race-bib-modal-header">
        <div className="race-bib-modal-title">
          <Printer size={20} />
          <h2>Print Approved Race Bibs</h2>
          <span>
            {filteredRunners.length} {filteredRunners.length === 1 ? 'Runner' : 'Runners'} ({sheets.length}{' '}
            {sheets.length === 1 ? 'Sheet' : 'Sheets'} of 8.5×13″)
          </span>
        </div>

        <div className="race-bib-modal-controls">
          {/* Category Filter */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={15} style={{ color: '#94a3b8' }} />
            <select
              className="race-bib-filter-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              aria-label="Filter by distance category"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Search Runner */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Search size={15} style={{ color: '#94a3b8' }} />
            <input
              type="text"
              className="race-bib-search-input"
              placeholder="Search name or bib…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Upload Final Logo Button */}
          <button
            type="button"
            className="race-bib-action-btn race-bib-action-btn--logo"
            onClick={handleLogoUploadClick}
            disabled={uploadingLogo}
            title="Upload official Sinoog Run logo to apply across all bibs"
          >
            <Upload size={14} />
            <span>{uploadingLogo ? 'Uploading…' : 'Change Logo'}</span>
          </button>
          <input
            id={fileInputId}
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            style={{ display: 'none' }}
            onChange={handleLogoFileChange}
            aria-label="Upload official Sinoog Run logo"
          />

          {/* Print Button */}
          <button
            type="button"
            className="race-bib-action-btn race-bib-action-btn--print"
            onClick={handlePrint}
            title="Print 8.5×13″ portrait sheets (Ctrl+P)"
          >
            <Printer size={15} />
            <span>Print Bibs (8.5×13″)</span>
          </button>

          {/* Close Modal */}
          <button
            type="button"
            className="race-bib-action-btn race-bib-action-btn--close"
            onClick={onClose}
            aria-label="Close print preview"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Printable Sheet Viewport */}
      <div className="race-bib-modal-body">
        {sheets.length === 0 ? (
          <div style={{ color: '#94a3b8', padding: '60px 20px', textAlign: 'center' }}>
            <p style={{ fontSize: '1.1rem', margin: 0 }}>No approved runners match your filter.</p>
            <small style={{ color: '#64748b' }}>Approve registrations first to allocate their official bib numbers.</small>
          </div>
        ) : (
          sheets.map((pair, sheetIdx) => (
            <div key={`sheet-${sheetIdx}`} className="race-bib-sheet">
              {/* Bib Top (Slot 1) */}
              <BibCard runner={pair[0]} categories={categories} logoUrl={logoUrl} />

              {/* Horizontal Cut line between Top and Bottom */}
              <div className="race-bib-sheet__cut-line">
                <span className="race-bib-sheet__cut-icon">✂ Cut line</span>
              </div>

              {/* Bib Bottom (Slot 2) */}
              {pair[1] ? (
                <BibCard runner={pair[1]} categories={categories} logoUrl={logoUrl} />
              ) : (
                <div className="race-bib-card race-bib-card--empty">
                  <span>Single bib sheet (Cut line empty slot)</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}

function BibCard({
  runner,
  categories,
  logoUrl,
}: {
  runner: DbRunRegistration;
  categories: RunCategory[];
  logoUrl: string;
}) {
  const category = categories.find((c) => c.id === runner.category_id);
  const { title, subtitle } = getBibCategoryLabel(category?.name);
  const qrValue = runner.qr_token
    ? `SINOOG-2027|${runner.qr_token}`
    : `SINOOG-2027|${runner.reference}`;

  return (
    <article className="race-bib-card">
      {/* Top Gradient Stripe */}
      <div className="race-bib-card__gradient-bar" />

      {/* Main Bib Body */}
      <div className="race-bib-card__body">
        {/* Upper Header Row: Logo (Left), Category (Center), QR (Right) */}
        <div className="race-bib-card__header">
          <div className="race-bib-card__logo-wrap">
            <img src={logoUrl} alt="Sinoog Run Logo" className="race-bib-card__logo" />
          </div>

          <div className="race-bib-card__category">
            <h3 className="race-bib-card__category-name">{title}</h3>
            <div className="race-bib-card__category-sub">{subtitle}</div>
          </div>

          <div className="race-bib-card__qr-wrap">
            <div className="race-bib-card__qr" title={`Pass verification QR for ${runner.participant_name}`}>
              <QRCodeSVG value={qrValue} size={90} level="H" marginSize={1} />
            </div>
          </div>
        </div>

        {/* Center Big Number */}
        <div className="race-bib-card__number-wrap">
          <div className="race-bib-card__number">{runner.bib_number}</div>
        </div>

        {/* Runner Full Name */}
        <div className="race-bib-card__name-wrap">
          <h2 className="race-bib-card__fullname">{runner.participant_name}</h2>
        </div>
      </div>

      {/* Bottom Gradient Stripe */}
      <div className="race-bib-card__gradient-bar" />
    </article>
  );
}
