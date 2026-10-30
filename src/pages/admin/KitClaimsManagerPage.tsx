import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BrowserQRCodeReader, type IScannerControls } from '@zxing/browser';
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  Clock,
  Download,
  Package,
  PackageCheck,
  Printer,
  RefreshCw,
  Shirt,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { Button } from '../../components/Button';
import { Card } from '../../components/m3/Card';
import { Dialog } from '../../components/m3/Dialog';
import { TextField } from '../../components/m3/TextField';
import { SearchBar } from '../../components/m3/SearchBar';
import { getCurrentEdition } from '../../features/editions/editionQueries';
import {
  cancelRaceKitClaim,
  claimRaceKit,
  getKitClaimsDashboard,
  getRunEventAndCategories,
  type KitClaimRow,
  type RunCategory,
  type RunEvent,
} from '../../features/run/runQueries';
import { ConfirmDialog, EmptyState, LoadingState } from '../../features/ui/FeedbackStates';
import { useToast } from '../../features/ui/useToast';
import { useAuth } from '../../features/auth/useAuth';

export function KitClaimsManagerPage() {
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerControls = useRef<IScannerControls | null>(null);
  const scanBusy = useRef(false);

  const [runEvent, setRunEvent] = useState<RunEvent | null>(null);
  const [categories, setCategories] = useState<RunCategory[]>([]);
  const [rows, setRows] = useState<KitClaimRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [claiming, setClaiming] = useState(false);

  // Scanner & Search states
  const [scannerActive, setScannerActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unclaimed' | 'claimed'>('unclaimed');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sizeFilter, setSizeFilter] = useState('all');

  // Modal / Active runner detail
  const [activeRunner, setActiveRunner] = useState<KitClaimRow | null>(null);
  const [claimNotes, setClaimNotes] = useState('');
  const [undoTarget, setUndoTarget] = useState<KitClaimRow | null>(null);
  const [rosterGeneratedAt] = useState(() =>
    new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' })
  );

  // Offline PWA & Network Resilience states
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [offlineCachedAt, setOfflineCachedAt] = useState<string | null>(null);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(() => {
    try {
      const q = localStorage.getItem('sinoog_offline_kit_claims_queue');
      return q ? JSON.parse(q).length : 0;
    } catch {
      return 0;
    }
  });

  const syncOfflineQueue = useCallback(async () => {
    try {
      const rawQueue = localStorage.getItem('sinoog_offline_kit_claims_queue');
      if (!rawQueue) return;
      const queue: Array<{ registrationId: string; bibNumber?: string | null; notes?: string }> = JSON.parse(rawQueue);
      if (!queue.length) return;

      let syncedCount = 0;
      const remaining: typeof queue = [];
      for (const item of queue) {
        try {
          await claimRaceKit({
            registrationId: item.registrationId,
            bibNumber: item.bibNumber,
            notes: item.notes,
          });
          syncedCount++;
        } catch {
          remaining.push(item);
        }
      }

      if (remaining.length > 0) {
        localStorage.setItem('sinoog_offline_kit_claims_queue', JSON.stringify(remaining));
      } else {
        localStorage.removeItem('sinoog_offline_kit_claims_queue');
      }
      setPendingSyncCount(remaining.length);

      if (syncedCount > 0) {
        toast(`Synced ${syncedCount} offline kit claim(s) to the server.`, 'success');
      }
    } catch {
      // Ignore parse errors
    }
  }, [toast]);

  const refresh = useCallback(async () => {
    try {
      const edition = await getCurrentEdition();
      const { event, categories: categoryList } = await getRunEventAndCategories(edition.id);
      setRunEvent(event);
      setCategories(categoryList);
      const data = await getKitClaimsDashboard(event.id);
      setRows(data);
      setIsOffline(false);
      setOfflineCachedAt(null);

      // Save offline snapshot to local storage
      try {
        localStorage.setItem(
          'sinoog_offline_kit_claims_cache',
          JSON.stringify({
            savedAt: new Date().toISOString(),
            event,
            categories: categoryList,
            rows: data,
          })
        );
      } catch {
        // Storage quota limit fallback
      }

      // Auto-drain pending queue if we have internet
      await syncOfflineQueue();
    } catch (netErr: unknown) {
      // Offline fallback: load from cached local snapshot
      const rawCache = localStorage.getItem('sinoog_offline_kit_claims_cache');
      if (rawCache) {
        try {
          const cache = JSON.parse(rawCache);
          if (cache.rows) setRows(cache.rows);
          if (cache.event) setRunEvent(cache.event);
          if (cache.categories) setCategories(cache.categories);
          setIsOffline(true);
          setOfflineCachedAt(cache.savedAt || new Date().toISOString());
          return;
        } catch {
          // Fall through
        }
      }
      throw netErr;
    }
  }, [syncOfflineQueue]);

  // Online / offline event listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      void syncOfflineQueue();
      void refresh();
    };
    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [refresh, syncOfflineQueue]);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        await refresh();
      } catch (err: unknown) {
        if (mounted) {
          toast(err instanceof Error ? err.message : 'Unable to load kit claim records.', 'error');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [refresh, toast]);

  useEffect(() => () => scannerControls.current?.stop(), []);

  // Stats
  const stats = useMemo(() => {
    const total = rows.length;
    const claimed = rows.filter((r) => r.kit_claim !== null).length;
    const unclaimed = total - claimed;
    const rate = total > 0 ? Math.round((claimed / total) * 100) : 0;
    return { total, claimed, unclaimed, rate };
  }, [rows]);

  // Distinct shirt sizes
  const shirtSizes = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => {
      if (r.shirt_size) set.add(r.shirt_size);
    });
    return Array.from(set).sort();
  }, [rows]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return rows.filter((row) => {
      // Status filter
      if (statusFilter === 'unclaimed' && row.kit_claim !== null) return false;
      if (statusFilter === 'claimed' && row.kit_claim === null) return false;

      // Category filter
      if (categoryFilter !== 'all' && row.category_id !== categoryFilter) return false;

      // Size filter
      if (sizeFilter !== 'all' && row.shirt_size !== sizeFilter) return false;

      // Text search: Bib, name, mobile, QR token
      if (q) {
        const name = (row.participant_name || '').toLowerCase();
        const bib = (row.bib_number || '').toLowerCase();
        const mobile = (row.mobile || '').toLowerCase();
        const qr = (row.qr_token || '').toLowerCase();
        if (
          !name.includes(q) &&
          !bib.includes(q) &&
          !mobile.includes(q) &&
          !qr.includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [rows, searchQuery, statusFilter, categoryFilter, sizeFilter]);

  // Handle Scan input
  const processScannedValue = useCallback(
    (scannedText: string) => {
      if (scanBusy.current) return;
      scanBusy.current = true;

      const raw = scannedText.trim();
      const token = raw.includes('|') ? raw.split('|').pop()?.trim() : raw;

      // Look up runner by qr_token or bib_number or id
      const matched = rows.find(
        (r) =>
          (token && r.qr_token === token) ||
          (raw && r.bib_number === raw) ||
          (token && r.id === token)
      );

      if (matched) {
        setActiveRunner(matched);
        setClaimNotes('');
        toast(`Identified runner: ${matched.participant_name} (#${matched.bib_number || 'No Bib'})`, 'info');
      } else {
        toast(`No approved runner found matching scanned code: ${scannedText.slice(0, 24)}`, 'error');
      }

      window.setTimeout(() => {
        scanBusy.current = false;
      }, 1500);
    },
    [rows, toast]
  );

  const startScanner = async () => {
    if (!videoRef.current) return;
    try {
      scannerControls.current?.stop();
      const reader = new BrowserQRCodeReader(undefined, { delayBetweenScanAttempts: 250 });
      scannerControls.current = await reader.decodeFromVideoDevice(undefined, videoRef.current, (result) => {
        if (result) processScannedValue(result.getText());
      });
      setScannerActive(true);
    } catch (error: unknown) {
      toast(error instanceof Error ? error.message : 'Camera access is unavailable.', 'error');
    }
  };

  const stopScanner = () => {
    scannerControls.current?.stop();
    scannerControls.current = null;
    setScannerActive(false);
  };

  const handleClaim = async (runner: KitClaimRow) => {
    setClaiming(true);
    try {
      if (isOffline || !navigator.onLine) {
        // Enqueue claim locally for offline sync
        const rawQueue = localStorage.getItem('sinoog_offline_kit_claims_queue') || '[]';
        const queue: Array<{ registrationId: string; bibNumber?: string | null; notes?: string }> = JSON.parse(rawQueue);
        queue.push({
          registrationId: runner.id,
          bibNumber: runner.bib_number,
          notes: claimNotes.trim() || undefined,
        });
        localStorage.setItem('sinoog_offline_kit_claims_queue', JSON.stringify(queue));
        setPendingSyncCount(queue.length);

        // Optimistically mark row as claimed in memory
        setRows((prev) =>
          prev.map((r) =>
            r.id === runner.id
              ? {
                  ...r,
                  kit_claim: {
                    registration_id: runner.id,
                    bib_number: runner.bib_number,
                    claimed_at: new Date().toISOString(),
                    claimed_by: null,
                    claimed_by_name: 'Local Desk (Pending Sync)',
                    notes: claimNotes.trim() || null,
                  },
                }
              : r
          )
        );

        toast(`Recorded kit claim offline for #${runner.bib_number || '---'}. Will sync when reconnected.`, 'info');
        setActiveRunner(null);
        setClaimNotes('');
        return;
      }

      await claimRaceKit({
        registrationId: runner.id,
        bibNumber: runner.bib_number,
        notes: claimNotes.trim() || undefined,
      });
      toast(`Race kit handed over to ${runner.participant_name} (#${runner.bib_number || '---'})!`, 'success');
      setActiveRunner(null);
      setClaimNotes('');
      await refresh();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Unable to record kit claim.', 'error');
    } finally {
      setClaiming(false);
    }
  };

  const handleUndoClaim = async () => {
    if (!undoTarget) return;
    setClaiming(true);
    try {
      await cancelRaceKitClaim(undoTarget.id);
      toast(`Kit claim for #${undoTarget.bib_number} was undone. Marked as unclaimed.`, 'info');
      setUndoTarget(null);
      if (activeRunner?.id === undoTarget.id) setActiveRunner(null);
      await refresh();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Unable to undo kit claim.', 'error');
    } finally {
      setClaiming(false);
    }
  };

  // CSV Export
  const exportOfflineCsv = () => {
    if (rows.length === 0) {
      toast('No registration records to export.', 'info');
      return;
    }
    const headers = [
      'Bib Number',
      'Participant Name',
      'Category',
      'Division',
      'Shirt Size',
      'Mobile Number',
      'Kit Status',
      'Claimed At (Manila)',
      'Handed Out By',
      'Emergency Contact Name',
      'Emergency Contact Mobile',
      'Notes',
    ];

    const csvRows = rows.map((r) => [
      `"${r.bib_number || ''}"`,
      `"${r.participant_name || ''}"`,
      `"${r.category_name || ''}"`,
      `"${r.division || ''}"`,
      `"${r.shirt_size || ''}"`,
      `"${r.mobile || ''}"`,
      `"${r.kit_claim ? 'CLAIMED' : 'UNCLAIMED'}"`,
      `"${r.kit_claim ? new Date(r.kit_claim.claimed_at).toLocaleString('en-PH', { timeZone: 'Asia/Manila' }) : ''}"`,
      `"${r.kit_claim?.claimed_by_name || ''}"`,
      `"${r.emergency_name || ''}"`,
      `"${r.emergency_mobile || ''}"`,
      `"${r.kit_claim?.notes || ''}"`,
    ]);

    const csvContent = [headers.join(','), ...csvRows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sinoog-2027-kit-claims-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast('Offline kit claims CSV downloaded.', 'success');
  };

  // Print Roster
  const handlePrintRoster = () => {
    window.print();
  };

  return (
    <div className="admin-page kit-claims-page">
      {/* Non-print Header & Toolbar */}
      <div className="admin-heading no-print">
        <div>
          <p className="eyebrow">Sinoog Run 2027</p>
          <h1>Race kit claiming & check-in</h1>
          <p>Scan runner QR code or search by bib number to verify identity, check shirt size, and record kit distribution.</p>
        </div>
        <div className="kit-claims-actions" style={{ display: 'flex', gap: 'var(--md-space-2)', flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            size="small"
            leadingIcon={<Printer size={15} />}
            onClick={handlePrintRoster}
            title="Print paper roster for offline kit claiming"
          >
            Print paper roster
          </Button>
          <Button
            variant="outlined"
            size="small"
            leadingIcon={<Download size={15} />}
            onClick={exportOfflineCsv}
            title="Download CSV roster for offline venue use"
          >
            Export CSV
          </Button>
          <Button
            variant="tonal"
            size="small"
            leadingIcon={<RefreshCw size={15} className={refreshing ? 'spin' : ''} />}
            onClick={async () => {
              setRefreshing(true);
              try {
                await refresh();
                toast('Kit claims refreshed.', 'success');
              } catch (e: unknown) {
                toast(e instanceof Error ? e.message : 'Refresh failed.', 'error');
              } finally {
                setRefreshing(false);
              }
            }}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Offline Status & Pending Sync Alert Banner */}
      {(isOffline || pendingSyncCount > 0) && (
        <div
          className="no-print"
          style={{
            padding: '12px 16px',
            background: isOffline ? '#fff9db' : '#e7f5ff',
            border: `1.5px solid ${isOffline ? '#f59f00' : '#339af0'}`,
            borderRadius: '12px',
            marginBottom: 'var(--md-space-4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {isOffline ? <WifiOff size={20} color="#e67700" /> : <Wifi size={20} color="#1c7ed6" />}
            <div>
              <strong style={{ fontSize: '0.92rem', color: isOffline ? '#c92a2a' : '#1864ab', display: 'block' }}>
                {isOffline ? 'Offline Mode Active' : 'Online & Syncing'}
              </strong>
              <span style={{ fontSize: '0.82rem', color: isOffline ? '#7f4f00' : '#1971c2' }}>
                {isOffline
                  ? `Operating from local cached roster${offlineCachedAt ? ` (Cached: ${new Date(offlineCachedAt).toLocaleTimeString()})` : ''}. All kit claims are stored safely on this device.`
                  : 'Reconnected! You can now sync locally recorded claims to the database.'}
                {pendingSyncCount > 0 && ` · ${pendingSyncCount} claims waiting to sync.`}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              variant="outlined"
              size="small"
              onClick={async () => {
                setRefreshing(true);
                try {
                  await syncOfflineQueue();
                  await refresh();
                } catch {
                  toast('Still offline. Offline claims are preserved.', 'info');
                } finally {
                  setRefreshing(false);
                }
              }}
            >
              {pendingSyncCount > 0 ? `Sync ${pendingSyncCount} Claims Now` : 'Check Connection'}
            </Button>
          </div>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="kit-claims-metrics no-print" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--md-space-3)', marginBottom: 'var(--md-space-4)' }}>
        <Card variant="outlined" style={{ padding: 'var(--md-space-4)', display: 'flex', alignItems: 'center', gap: 'var(--md-space-3)' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--md-sys-color-surface-container-high)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--md-sys-color-primary)' }}>
            <Package size={22} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-on-surface-variant)', display: 'block' }}>Approved Runners</span>
            <strong style={{ fontSize: '1.4rem', fontWeight: 700 }}>{stats.total}</strong>
          </div>
        </Card>

        <Card variant="outlined" style={{ padding: 'var(--md-space-4)', display: 'flex', alignItems: 'center', gap: 'var(--md-space-3)', borderColor: 'rgba(32, 201, 151, 0.4)' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(32, 201, 151, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#099268' }}>
            <PackageCheck size={22} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-on-surface-variant)', display: 'block' }}>Kits Handed Out</span>
            <strong style={{ fontSize: '1.4rem', fontWeight: 700, color: '#099268' }}>{stats.claimed} <small style={{ fontSize: '0.85rem', fontWeight: 600 }}>({stats.rate}%)</small></strong>
          </div>
        </Card>

        <Card variant="outlined" style={{ padding: 'var(--md-space-4)', display: 'flex', alignItems: 'center', gap: 'var(--md-space-3)', borderColor: 'rgba(245, 159, 0, 0.4)' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(255, 243, 191, 0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e67700' }}>
            <Clock size={22} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-on-surface-variant)', display: 'block' }}>Pending Pick-up</span>
            <strong style={{ fontSize: '1.4rem', fontWeight: 700, color: '#d9480f' }}>{stats.unclaimed}</strong>
          </div>
        </Card>
      </div>

      {/* Camera QR Scanner Box */}
      <Card variant="outlined" className="no-print" style={{ padding: 'var(--md-space-4)', marginBottom: 'var(--md-space-4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--md-space-3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--md-space-3)' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: scannerActive ? 'rgba(32, 201, 151, 0.15)' : 'var(--md-sys-color-surface-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: scannerActive ? '#099268' : 'var(--md-sys-color-on-surface)' }}>
              <Camera size={20} />
            </div>
            <div>
              <strong style={{ fontSize: '0.95rem', display: 'block' }}>Camera QR Code Scanner</strong>
              <small style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                {scannerActive ? 'Scanning active. Point camera at runner confirmation QR.' : 'Tap Start Scanner to use your phone or laptop camera for instant check-in.'}
              </small>
            </div>
          </div>
          <Button
            variant={scannerActive ? 'filled' : 'tonal'}
            size="small"
            leadingIcon={<Camera size={15} />}
            onClick={() => {
              if (scannerActive) stopScanner();
              else void startScanner();
            }}
          >
            {scannerActive ? 'Stop scanner' : 'Start scanner'}
          </Button>
        </div>

        {/* Video stream container */}
        <div
          style={{
            display: scannerActive ? 'block' : 'none',
            marginTop: 'var(--md-space-4)',
            maxWidth: '420px',
            marginInline: 'auto',
            borderRadius: '12px',
            overflow: 'hidden',
            background: '#000',
            position: 'relative',
          }}
        >
          <video ref={videoRef} style={{ width: '100%', height: 'auto', display: 'block' }} muted playsInline />
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '60%',
              aspectRatio: '1',
              border: '2px dashed rgba(255, 255, 255, 0.75)',
              borderRadius: '12px',
              pointerEvents: 'none',
            }}
          />
        </div>
      </Card>

      {/* Search & Filters Toolbar */}
      <div className="kit-claims-toolbar-card no-print">
        <div className="kit-claims-toolbar">
          <SearchBar
            label="Search kit claims"
            placeholder="Search by Bib #, Name, Mobile, or QR…"
            value={searchQuery}
            onValueChange={setSearchQuery}
            fieldClassName="registrations-search"
          />

          <div className="kit-claims-filters">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'unclaimed' | 'claimed')}
              aria-label="Filter by kit claim status"
              className="kit-claims-filter--status"
            >
              <option value="unclaimed">Unclaimed ({stats.unclaimed})</option>
              <option value="claimed">Claimed ({stats.claimed})</option>
              <option value="all">All runners ({stats.total})</option>
            </select>

            <select
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

            <select
              value={sizeFilter}
              onChange={(e) => setSizeFilter(e.target.value)}
              aria-label="Filter by shirt size"
            >
              <option value="all">All Shirt Sizes</option>
              {shirtSizes.map((s) => (
                <option key={s} value={s}>
                  Size {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Printable Paper Header (visible only when printing) */}
      <div className="print-only" style={{ display: 'none', marginBottom: '16px' }}>
        <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '8px' }}>
          <h2 style={{ margin: 0, fontSize: '18pt' }}>
            {runEvent?.title ? `${runEvent.title.toUpperCase()} — OFFICIAL RACE KIT CHECK-IN ROSTER` : 'SINOOG RUN 2027 — OFFICIAL RACE KIT CHECK-IN ROSTER'}
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '10pt' }}>
            Sto. Niño Parish — Guinacot, Guindulman, Bohol · Generated on {rosterGeneratedAt}
          </p>
          <p style={{ margin: '2px 0 0', fontSize: '9pt', fontWeight: 'bold' }}>
            Total Approved: {stats.total} | Claimed: {stats.claimed} | Unclaimed: {stats.unclaimed}
          </p>
        </div>
      </div>

      {/* Participants Roster Display */}
      {loading ? (
        <Card variant="outlined" style={{ padding: '3rem' }}>
          <LoadingState message="Loading approved participants and kit records…" />
        </Card>
      ) : filteredRows.length === 0 ? (
        <Card variant="outlined" style={{ padding: '3rem' }}>
          <EmptyState
            title="No participants found"
            message={
              searchQuery || statusFilter !== 'all' || categoryFilter !== 'all' || sizeFilter !== 'all'
                ? 'No runners matched the current search or filter criteria.'
                : 'No approved runners in this event yet.'
            }
          />
        </Card>
      ) : (
        <>
          {/* 1. Desktop View: Sleek single-line table inside its own panel card */}
          <div className="kit-claims-desktop-view no-print">
            <Card as="section" variant="outlined" className="kit-claims-panel">
              <table className="kit-claims-table">
                <thead>
                  <tr>
                    <th style={{ width: '85px' }}>Bib #</th>
                    <th>Participant Name</th>
                    <th>Category</th>
                    <th style={{ width: '100px', textAlign: 'center' }}>Shirt Size</th>
                    <th style={{ width: '125px' }}>Mobile</th>
                    <th style={{ width: '135px' }}>Kit Status</th>
                    <th style={{ width: '130px', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((runner) => {
                    const isClaimed = runner.kit_claim !== null;
                    return (
                      <tr key={runner.id} className={isClaimed ? 'is-claimed' : ''}>
                        {/* Bib # */}
                        <td>
                          <span className="kit-bib-tag">#{runner.bib_number || '---'}</span>
                        </td>

                        {/* Participant Name (single line with compact division meta) */}
                        <td>
                          <div className="kit-runner-cell">
                            <strong className="kit-runner-name">{runner.participant_name}</strong>
                            {runner.division && (
                              <span className="kit-runner-meta">({runner.division})</span>
                            )}
                          </div>
                        </td>

                        {/* Category */}
                        <td>
                          <span className="kit-category-badge">{runner.category_name}</span>
                        </td>

                        {/* Shirt Size */}
                        <td style={{ textAlign: 'center' }}>
                          <span className="kit-size-badge">
                            <Shirt size={13} /> {runner.shirt_size || 'N/A'}
                          </span>
                        </td>

                        {/* Mobile Number */}
                        <td>
                          {runner.mobile ? (
                            <a
                              href={`tel:${runner.mobile}`}
                              title="Tap to call or SMS runner"
                              style={{ color: "var(--wine, #741724)", fontWeight: 600, textDecoration: "none" }}
                            >
                              📞 {runner.mobile}
                            </a>
                          ) : (
                            <span className="kit-mobile-text">—</span>
                          )}
                        </td>

                        {/* Kit Status */}
                        <td>
                          {isClaimed ? (
                            <span
                              className="kit-status-pill kit-status-pill--claimed"
                              title={`Claimed by ${runner.kit_claim!.claimed_by_name || 'Staff'}`}
                            >
                              <CheckCircle2 size={13} /> Claimed
                            </span>
                          ) : (
                            <span className="kit-status-pill kit-status-pill--pending">
                              <Clock size={12} /> Pending
                            </span>
                          )}
                        </td>

                        {/* Action */}
                        <td style={{ textAlign: 'right' }}>
                          <Button
                            variant={isClaimed ? 'outlined' : 'filled'}
                            size="small"
                            onClick={() => {
                              setActiveRunner(runner);
                              setClaimNotes(runner.kit_claim?.notes || '');
                            }}
                          >
                            {isClaimed ? 'View claim' : 'Hand over kit'}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          </div>

          {/* 2. Mobile View: Clean individual cards directly on page (no dirty rectangle box) */}
          <div className="kit-claims-mobile-view no-print">
            {filteredRows.map((runner) => {
              const isClaimed = runner.kit_claim !== null;
              return (
                <div key={runner.id} className={`kit-claim-card ${isClaimed ? 'is-claimed' : ''}`}>
                  {/* Card Header: Bib & Status */}
                  <div className="kit-claim-card__header">
                    <div className="kit-claim-card__bib-wrap">
                      <span className="kit-bib-tag">#{runner.bib_number || '---'}</span>
                      {runner.division && (
                        <span className="kit-claim-card__division">{runner.division}</span>
                      )}
                    </div>
                    <div>
                      {isClaimed ? (
                        <span className="kit-status-pill kit-status-pill--claimed">
                          <CheckCircle2 size={13} /> CLAIMED
                        </span>
                      ) : (
                        <span className="kit-status-pill kit-status-pill--pending">
                          <Clock size={12} /> Pending
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Body: Runner Name & Demographics */}
                  <div>
                    <h3 className="kit-claim-card__name">{runner.participant_name}</h3>
                    {runner.birth_date && (
                      <p className="kit-claim-card__demographics">
                        Birthdate: {runner.birth_date}
                      </p>
                    )}
                  </div>

                  {/* 2-Column Key Specs: Category & Shirt Size (Clean white background) */}
                  <div className="kit-claim-card__specs">
                    <div className="kit-spec-box">
                      <span className="kit-spec-label">Category</span>
                      <strong className="kit-spec-value" title={runner.category_name}>
                        {runner.category_name}
                      </strong>
                    </div>
                    <div className="kit-spec-box">
                      <span className="kit-spec-label">Shirt Size</span>
                      <strong className="kit-spec-value kit-spec-value--shirt">
                        <Shirt size={14} /> Size {runner.shirt_size || 'N/A'}
                      </strong>
                    </div>
                  </div>

                  {/* Contact Information (Clean typography, no dirty beige background) */}
                  <div className="kit-claim-card__contact">
                    <div className="kit-contact-row">
                      <strong>Mobile:</strong>
                      {runner.mobile ? (
                        <a
                          href={`tel:${runner.mobile}`}
                          style={{ color: "var(--wine, #741724)", fontWeight: 600, textDecoration: "none" }}
                        >
                          📞 {runner.mobile}
                        </a>
                      ) : (
                        <span>No phone</span>
                      )}
                    </div>
                    {runner.emergency_name && (
                      <div className="kit-contact-row">
                        <strong>Emergency:</strong>
                        <span>
                          {runner.emergency_name}
                          {runner.emergency_mobile ? (
                            <>
                              {" · "}
                              <a
                                href={`tel:${runner.emergency_mobile}`}
                                style={{ color: "var(--wine, #741724)", textDecoration: "none", fontWeight: 600 }}
                              >
                                📞 {runner.emergency_mobile}
                              </a>
                            </>
                          ) : (
                            ""
                          )}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Audit Details (if claimed) */}
                  {isClaimed && runner.kit_claim && (
                    <div className="kit-claim-card__audit">
                      <p>
                        <strong>Claimed:</strong>{' '}
                        {new Date(runner.kit_claim.claimed_at).toLocaleString('en-PH', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                          timeZone: 'Asia/Manila',
                        })}
                      </p>
                      {runner.kit_claim.claimed_by_name && (
                        <p>
                          <strong>Staff:</strong> {runner.kit_claim.claimed_by_name}
                        </p>
                      )}
                      {runner.kit_claim.notes && (
                        <p style={{ fontStyle: 'italic' }}>
                          <strong>Note:</strong> "{runner.kit_claim.notes}"
                        </p>
                      )}
                    </div>
                  )}

                  {/* Card Action */}
                  <div className="kit-claim-card__actions">
                    <Button
                      variant={isClaimed ? 'outlined' : 'filled'}
                      size="small"
                      leadingIcon={isClaimed ? <CheckCircle2 size={16} /> : <PackageCheck size={16} />}
                      onClick={() => {
                        setActiveRunner(runner);
                        setClaimNotes(runner.kit_claim?.notes || '');
                      }}
                    >
                      {isClaimed ? 'View claim details' : 'Hand over race kit'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 3. Printable Roster Table (Only visible when printing with Ctrl+P) */}
          <div className="print-only" style={{ display: 'none' }}>
            <table className="kit-roster-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>Bib #</th>
                  <th>Participant Name</th>
                  <th>Category</th>
                  <th style={{ width: '80px', textAlign: 'center' }}>Shirt Size</th>
                  <th style={{ width: '100px' }}>Mobile</th>
                  <th style={{ width: '100px' }}>Status</th>
                  <th style={{ width: '120px' }}>Signature</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((runner) => (
                  <tr key={runner.id}>
                    <td>#{runner.bib_number || '---'}</td>
                    <td>
                      <strong>{runner.participant_name}</strong>
                    </td>
                    <td>{runner.category_name}</td>
                    <td style={{ textAlign: 'center' }}>{runner.shirt_size || 'N/A'}</td>
                    <td>{runner.mobile || '—'}</td>
                    <td>{runner.kit_claim ? 'CLAIMED' : 'UNCLAIMED'}</td>
                    <td>
                      <div style={{ height: '20px', borderBottom: '1px solid #777' }} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Runner Claim Verification Dialog */}
      <Dialog
        open={Boolean(activeRunner)}
        onClose={() => !claiming && setActiveRunner(null)}
        title={activeRunner?.kit_claim ? 'Race Kit Claim Details' : 'Verify & Hand Over Race Kit'}
      >
        {activeRunner && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-space-4)' }}>
            {/* Prominent Header Banner */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 'var(--md-space-4)',
                borderRadius: '12px',
                background: activeRunner.kit_claim
                  ? 'rgba(32, 201, 151, 0.12)'
                  : 'var(--md-sys-color-primary-container)',
                border: activeRunner.kit_claim
                  ? '1px solid rgba(32, 201, 151, 0.35)'
                  : '1px solid var(--md-sys-color-primary)',
              }}
            >
              <div>
                <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--md-sys-color-on-surface-variant)', display: 'block' }}>
                  Assigned Bib Number
                </span>
                <strong style={{ fontSize: '1.8rem', fontWeight: 800 }}>
                  #{activeRunner.bib_number || '---'}
                </strong>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-on-surface-variant)', display: 'block' }}>
                  Shirt / Singlet Size
                </span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 14px',
                    borderRadius: '20px',
                    background: 'var(--gold, #ffd43b)',
                    color: '#492600',
                    fontWeight: 800,
                    fontSize: '1.1rem',
                  }}
                >
                  <Shirt size={16} /> {activeRunner.shirt_size || 'N/A'}
                </span>
              </div>
            </div>

            {/* Runner Identity Info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--md-space-3)', background: 'var(--md-sys-color-surface-container-low)', padding: 'var(--md-space-3)', borderRadius: '8px' }}>
              <div>
                <small style={{ color: 'var(--md-sys-color-on-surface-variant)', display: 'block' }}>Participant Name</small>
                <strong>{activeRunner.participant_name}</strong>
              </div>
              <div>
                <small style={{ color: 'var(--md-sys-color-on-surface-variant)', display: 'block' }}>Category</small>
                <strong>{activeRunner.category_name}</strong>
              </div>
              <div>
                <small style={{ color: 'var(--md-sys-color-on-surface-variant)', display: 'block' }}>Mobile</small>
                {activeRunner.mobile ? (
                  <a
                    href={`tel:${activeRunner.mobile}`}
                    style={{ color: "var(--wine, #741724)", fontWeight: 700, textDecoration: "none" }}
                  >
                    📞 {activeRunner.mobile}
                  </a>
                ) : (
                  <span>Not provided</span>
                )}
              </div>
              <div>
                <small style={{ color: 'var(--md-sys-color-on-surface-variant)', display: 'block' }}>Emergency Contact</small>
                <span>
                  {activeRunner.emergency_name || 'N/A'}{' '}
                  {activeRunner.emergency_mobile ? (
                    <a
                      href={`tel:${activeRunner.emergency_mobile}`}
                      style={{ color: "var(--wine, #741724)", textDecoration: "underline", fontWeight: 600 }}
                    >
                      (📞 {activeRunner.emergency_mobile})
                    </a>
                  ) : (
                    ''
                  )}
                </span>
              </div>
            </div>

            {/* Already Claimed Warning Banner */}
            {activeRunner.kit_claim ? (
              <div
                style={{
                  padding: 'var(--md-space-3) var(--md-space-4)',
                  borderRadius: '8px',
                  background: '#fff9db',
                  border: '1.5px solid #f59f00',
                  color: '#7f4f00',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <AlertCircle size={20} color="#e67700" />
                  <strong style={{ fontSize: '1rem', color: '#c92a2a' }}>ALREADY CLAIMED</strong>
                </div>
                <p style={{ margin: '4px 0 2px', fontSize: '0.85rem' }}>
                  Claimed on{' '}
                  <strong>
                    {new Date(activeRunner.kit_claim.claimed_at).toLocaleString('en-PH', {
                      timeZone: 'Asia/Manila',
                    })}
                  </strong>{' '}
                  by staff member: <strong>{activeRunner.kit_claim.claimed_by_name}</strong>.
                </p>
                {activeRunner.kit_claim.notes && (
                  <p style={{ margin: '2px 0 0', fontSize: '0.82rem', fontStyle: 'italic' }}>
                    Note: "{activeRunner.kit_claim.notes}"
                  </p>
                )}

                {isAdmin && (
                  <div style={{ marginTop: 'var(--md-space-3)', borderTop: '1px solid rgba(0,0,0,0.1)', paddingTop: 'var(--md-space-2)' }}>
                    <Button
                      variant="ghost"
                      size="small"
                      onClick={() => setUndoTarget(activeRunner)}
                      style={{ color: '#c92a2a' }}
                    >
                      Undo this claim (Reset to unclaimed)
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              /* Unclaimed Form Controls */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-space-3)' }}>
                <TextField
                  label="Handover Notes (Optional)"
                  placeholder="e.g. Picked up by sister with authorization letter, size exchanged..."
                  value={claimNotes}
                  onChange={(e) => setClaimNotes(e.target.value)}
                />

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--md-space-2)', marginTop: 'var(--md-space-2)' }}>
                  <Button variant="ghost" onClick={() => setActiveRunner(null)} disabled={claiming}>
                    Cancel
                  </Button>
                  <Button
                    variant="filled"
                    leadingIcon={<PackageCheck size={18} />}
                    onClick={() => void handleClaim(activeRunner)}
                    disabled={claiming}
                    style={{ background: '#099268', borderColor: '#099268' }}
                  >
                    {claiming ? 'Confirming…' : 'Confirm & Hand Over Kit'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Dialog>

      {/* Undo Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(undoTarget)}
        title="Undo kit claim?"
        message={`Are you sure you want to mark kit for #${undoTarget?.bib_number} (${undoTarget?.participant_name}) as unclaimed? This will allow another kit claim to be recorded.`}
        confirmLabel={claiming ? 'Undoing…' : 'Yes, mark unclaimed'}
        tone="danger"
        onConfirm={() => void handleUndoClaim()}
        onCancel={() => !claiming && setUndoTarget(null)}
      />
    </div>
  );
}
