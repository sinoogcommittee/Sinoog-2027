import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BrowserQRCodeReader, type IScannerControls } from '@zxing/browser';
import { AlertTriangle, CalendarDays, Camera, Clock3, Flag, Medal, PersonStanding, Play, RefreshCw, RotateCcw, ScanLine, Timer, Users, X } from 'lucide-react';
import { getCurrentEdition } from '../../features/editions/editionQueries';
import {
  formatElapsed,
  getRunEventAndCategories,
  getTimingDashboard,
  recordRunnerFinish,
  resetOfficialRun,
  startOfficialRun,
  type RunCategory,
  type RunEvent,
  type TimingDashboardRow,
} from '../../features/run/runQueries';
import { LoadingState, EmptyState } from '../../features/ui/FeedbackStates';
import { useToast } from '../../features/ui/useToast';
import { useAuth } from '../../features/auth/useAuth';
import { supabase } from '../../lib/supabase';

type AgeGroup = 'all' | 'under18' | '18-29' | '30-39' | '40-49' | '50plus';

function ageOnRaceDay(birthDate: string | null): number | null {
  if (!birthDate) return null;
  const birth = new Date(`${birthDate}T00:00:00+08:00`);
  const race = new Date('2027-01-09T00:00:00+08:00');
  let age = race.getFullYear() - birth.getFullYear();
  if (race.getMonth() < birth.getMonth() || (race.getMonth() === birth.getMonth() && race.getDate() < birth.getDate())) age -= 1;
  return age;
}

function matchesAgeGroup(age: number | null, group: AgeGroup): boolean {
  if (group === 'all') return true;
  if (age === null) return false;
  if (group === 'under18') return age < 18;
  if (group === '18-29') return age >= 18 && age <= 29;
  if (group === '30-39') return age >= 30 && age <= 39;
  if (group === '40-49') return age >= 40 && age <= 49;
  return age >= 50;
}

export function RunTimingPage() {
  const { toast } = useToast();
  const { user, isAdmin } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerControls = useRef<IScannerControls | null>(null);
  const scanBusy = useRef(false);
  const [runEvent, setRunEvent] = useState<RunEvent | null>(null);
  const [categories, setCategories] = useState<RunCategory[]>([]);
  const [rows, setRows] = useState<TimingDashboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [now, setNow] = useState(0);
  const [scannerActive, setScannerActive] = useState(false);
  const [manualQr, setManualQr] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [divisionFilter, setDivisionFilter] = useState('all');
  const [ageFilter, setAgeFilter] = useState<AgeGroup>('all');

  const refresh = useCallback(async () => {
    const edition = await getCurrentEdition();
    const { event, categories: categoryList } = await getRunEventAndCategories(edition.id);
    setRunEvent(event);
    setCategories(categoryList);
    setRows(await getTimingDashboard(event.id));
  }, []);

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- initial remote dashboard load
    void refresh().catch((error: unknown) => toast(error instanceof Error ? error.message : 'Unable to load timing records.', 'error')).finally(() => setLoading(false));
  }, [refresh, toast]);

  useEffect(() => () => scannerControls.current?.stop(), []);

  useEffect(() => {
    if (!runEvent?.official_started_at) return;
    const initialTick = window.setTimeout(() => setNow(Date.now()), 0);
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => {
      window.clearTimeout(initialTick);
      window.clearInterval(timer);
    };
  }, [runEvent?.official_started_at]);

  const submitFinish = useCallback(async (value: string) => {
    if (scanBusy.current) return;
    scanBusy.current = true;
    try {
      await recordRunnerFinish(value);
      toast('Official finish recorded.', 'success');
      setManualQr('');
      await refresh();
    } catch (error: unknown) {
      toast(error instanceof Error ? error.message : 'Unable to record finish.', 'error');
    } finally {
      window.setTimeout(() => { scanBusy.current = false; }, 1200);
    }
  }, [refresh, toast]);

  const startScanner = async () => {
    if (!videoRef.current) return;
    try {
      scannerControls.current?.stop();
      const reader = new BrowserQRCodeReader(undefined, { delayBetweenScanAttempts: 250 });
      scannerControls.current = await reader.decodeFromVideoDevice(undefined, videoRef.current, (result) => {
        if (result) void submitFinish(result.getText());
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

  const handleOfficialStart = async () => {
    if (!runEvent || !window.confirm('Start the official race clock now? The timer begins immediately for all runners.')) return;
    setStarting(true);
    try {
      const startedAt = await startOfficialRun(runEvent.id);
      setRunEvent({ ...runEvent, official_started_at: startedAt });
      setNow(Date.now());
      toast('Official race clock started.', 'success');
    } catch (error: unknown) {
      toast(error instanceof Error ? error.message : 'Unable to start the race clock.', 'error');
    } finally {
      setStarting(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await refresh();
      toast('Race timing data refreshed.', 'success');
    } catch (error: unknown) {
      toast(error instanceof Error ? error.message : 'Unable to refresh race timing.', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  const openResetConfirm = () => {
    setResetEmail(user?.email ?? '');
    setResetPassword('');
    setResetError('');
    setShowResetConfirm(true);
  };

  const closeResetConfirm = () => {
    if (resetting) return;
    setShowResetConfirm(false);
    setResetPassword('');
    setResetError('');
  };

  const handleReset = async () => {
    if (!runEvent || !supabase || !user?.email || !isAdmin) {
      setResetError('An active administrator account is required to reset official timing.');
      return;
    }

    if (resetEmail.trim().toLowerCase() !== user.email.toLowerCase()) {
      setResetError('Enter the email address of the administrator currently signed in.');
      return;
    }

    if (!resetPassword) {
      setResetError('Enter your administrator password.');
      return;
    }

    try {
      setResetting(true);
      setResetError('');
      const { data, error } = await supabase.auth.signInWithPassword({
        email: resetEmail.trim(),
        password: resetPassword,
      });
      if (error || data.user?.id !== user.id) {
        throw new Error('Administrator credentials could not be verified.');
      }

      stopScanner();
      const deletedFinishCount = await resetOfficialRun(runEvent.id);
      setShowResetConfirm(false);
      setResetPassword('');
      await refresh();
      setNow(Date.now());
      toast(`Race time reset. ${deletedFinishCount} finish record${deletedFinishCount === 1 ? '' : 's'} cleared.`, 'success');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unable to reset race timing.';
      setResetError(message);
      toast(message, 'error');
    } finally {
      setResetting(false);
    }
  };

  const liveElapsed = runEvent?.official_started_at
    ? formatElapsed(Math.max(0, (now || new Date(runEvent.official_started_at).getTime()) - new Date(runEvent.official_started_at).getTime()))
    : '00:00:00';

  const rankedRows = useMemo(() => {
    const rankById = new Map<string, number>();
    const groups = new Map<string, TimingDashboardRow[]>();
    rows.filter((row) => row.finish).forEach((row) => {
      const key = `${row.category_id}:${row.division}`;
      groups.set(key, [...(groups.get(key) ?? []), row]);
    });
    groups.forEach((group) => group.sort((a, b) => a.finish!.elapsed_milliseconds - b.finish!.elapsed_milliseconds)
      .forEach((row, index) => rankById.set(row.id, index + 1)));
    return rows.map((row) => ({ ...row, rank: rankById.get(row.id) ?? null }));
  }, [rows]);

  const filteredRows = rankedRows.filter((row) =>
    (categoryFilter === 'all' || row.category_id === categoryFilter)
    && (divisionFilter === 'all' || row.division === divisionFilter)
    && matchesAgeGroup(ageOnRaceDay(row.birth_date), ageFilter)
  ).sort((a, b) => {
    if (a.finish && b.finish) return a.finish.elapsed_milliseconds - b.finish.elapsed_milliseconds;
    return a.finish ? -1 : b.finish ? 1 : (a.bib_number || '').localeCompare(b.bib_number || '');
  });

  if (loading) return <div className="admin-page"><LoadingState message="Loading race timing…" /></div>;

  return <div className="admin-page">
    <div className="admin-heading">
      <div><p className="eyebrow">Race-day operations</p><h1>Official Timing & Finish Line</h1><p>Start the official clock, scan each approved QR once, and review category rankings.</p></div>
      <button type="button" className="button button--secondary" disabled={refreshing} onClick={() => void handleRefresh()} title="Reload the latest start time and finish records from the database"><RefreshCw size={16} className={refreshing ? 'spin' : undefined} /> {refreshing ? 'Reloading…' : 'Reload timing data'}</button>
    </div>

    <section className="timing-control-panel">
      <div className="timing-control-panel__start"><small>Official start</small><strong>{runEvent?.official_started_at ? new Date(runEvent.official_started_at).toLocaleString('en-PH', { dateStyle: 'long', timeStyle: 'medium', timeZone: 'Asia/Manila' }) : 'Not started'}</strong></div>
      <div className="timing-live-clock" aria-live="polite"><small>Live elapsed time</small><strong>{liveElapsed}</strong></div>
      <div className="timing-control-panel__actions">
        <button type="button" className="button button--primary" disabled={starting || Boolean(runEvent?.official_started_at)} onClick={() => void handleOfficialStart()}><Play size={17} /> {starting ? 'Starting…' : runEvent?.official_started_at ? 'Official clock running' : 'Start official race time'}</button>
        {runEvent?.official_started_at && isAdmin && <button type="button" className="button button--danger timing-reset-button" onClick={openResetConfirm}><RotateCcw size={17} /> Reset official start</button>}
      </div>
    </section>

    <section className="admin-panel finish-scanner-panel">
      <div className="panel-heading"><h2><ScanLine size={18} /> Finish-line QR scanner</h2><p>Camera scanning requires HTTPS. Manual token entry remains available as backup.</p></div>
      <div className="finish-scanner-grid">
        <div>
          <video ref={videoRef} className="finish-scanner-video" muted playsInline />
          <div className="button-row">
            {!scannerActive ? <button type="button" className="button button--secondary" onClick={() => void startScanner()}><Camera size={17} /> Start camera</button>
              : <button type="button" className="button button--secondary" onClick={stopScanner}>Stop camera</button>}
          </div>
        </div>
        <form onSubmit={(event) => { event.preventDefault(); void submitFinish(manualQr); }}>
          <label htmlFor="manual-runner-qr">Manual QR token or full QR value</label>
          <textarea id="manual-runner-qr" rows={4} value={manualQr} onChange={(event) => setManualQr(event.target.value)} placeholder="SINOOG-2027|…" />
          <button type="submit" className="button button--primary" disabled={!manualQr.trim() || !runEvent?.official_started_at}><Flag size={17} /> Record official finish</button>
        </form>
      </div>
    </section>

    <section className="admin-panel">
      <div className="table-tools timing-filters">
        <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} aria-label="Filter category"><option value="all">All categories</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select>
        <select value={divisionFilter} onChange={(event) => setDivisionFilter(event.target.value)} aria-label="Filter division"><option value="all">Male & Female</option><option value="male">Male</option><option value="female">Female</option></select>
        <select value={ageFilter} onChange={(event) => setAgeFilter(event.target.value as AgeGroup)} aria-label="Filter age group"><option value="all">All ages</option><option value="under18">Under 18</option><option value="18-29">18–29</option><option value="30-39">30–39</option><option value="40-49">40–49</option><option value="50plus">50+</option></select>
      </div>
      {filteredRows.length === 0 ? <EmptyState title="No approved runners" message="Approved runner entries and official results will appear here." /> : <div className="timing-results-table">
        <div className="timing-results-row timing-results-head"><span>Place</span><span>Bib / Runner</span><span>Category</span><span>Division</span><span>Age</span><span>Official Time</span></div>
        {filteredRows.map((row) => (
          <div className="timing-results-row timing-runner-card" key={row.id}>
            <strong className="timing-runner-card__place">
              <small>Place</small>
              <span className="timing-runner-card__place-value">
                <Medal className="timing-card-icon" size={24} aria-hidden="true" />
                <span>{row.rank ? row.rank : '—'}</span>
              </span>
            </strong>
            <span className="timing-runner-card__runner">
              <small>Runner</small>
              <b>#{row.bib_number}</b>
              <span>{row.participant_name}</span>
            </span>
            <span className="timing-runner-card__category">
              <span className="timing-card-stat__icon timing-card-stat__icon--category"><PersonStanding size={20} aria-hidden="true" /></span>
              <span className="timing-card-stat__content">
                <small>Category</small>
                <strong>{categories.find((category) => category.id === row.category_id)?.name || 'Run'}</strong>
              </span>
            </span>
            <span className="timing-runner-card__division">
              <span className="timing-card-stat__icon timing-card-stat__icon--division"><Users size={20} aria-hidden="true" /></span>
              <span className="timing-card-stat__content">
                <small>Division</small>
                <strong>{row.division === 'female' ? 'Female' : row.division === 'male' ? 'Male' : '—'}</strong>
              </span>
            </span>
            <span className="timing-runner-card__age">
              <span className="timing-card-stat__icon timing-card-stat__icon--age"><CalendarDays size={20} aria-hidden="true" /></span>
              <span className="timing-card-stat__content">
                <small>Age</small>
                <strong>{ageOnRaceDay(row.birth_date) ?? '—'}</strong>
              </span>
            </span>
            <span className={`timing-runner-card__time${row.finish ? ' is-finished' : ''}`}>
              <span className="timing-card-stat__icon timing-card-stat__icon--time"><Timer size={20} aria-hidden="true" /></span>
              <span className="timing-card-stat__content">
                <small>Official time</small>
                <strong>{row.finish ? <><Clock3 size={14} /> {formatElapsed(row.finish.elapsed_milliseconds)}</> : 'Not finished'}</strong>
              </span>
            </span>
          </div>
        ))}
      </div>}
    </section>

    {showResetConfirm && (
      <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="reset-race-title" aria-describedby="reset-race-description">
        <form className="modal-card timing-reset-modal" onSubmit={(event) => { event.preventDefault(); void handleReset(); }}>
          <button type="button" className="button button--ghost timing-reset-modal__close" disabled={resetting} onClick={closeResetConfirm} aria-label="Close reset confirmation"><X size={18} /></button>
          <AlertTriangle size={38} className="timing-reset-modal__warning" aria-hidden="true" />
          <h2 id="reset-race-title">Reset the official start?</h2>
          <p id="reset-race-description">This removes the official start time and every recorded finish. Runner registrations, bib numbers, and QR codes remain unchanged. Verify your administrator credentials to continue.</p>
          <div className="timing-reset-credentials">
            <label>
              Administrator email
              <input type="email" required value={resetEmail} onChange={(event) => setResetEmail(event.target.value)} autoComplete="username" disabled={resetting} />
            </label>
            <label>
              Administrator password
              <input type="password" required value={resetPassword} onChange={(event) => setResetPassword(event.target.value)} autoComplete="current-password" disabled={resetting} autoFocus />
            </label>
          </div>
          {resetError && <p className="form-message timing-reset-error" role="alert">{resetError}</p>}
          <div className="button-row timing-reset-modal__actions">
            <button type="button" className="button button--ghost" disabled={resetting} onClick={closeResetConfirm}>Cancel</button>
            <button type="submit" className="button button--danger" disabled={resetting}><RotateCcw size={17} /> {resetting ? 'Verifying and resetting…' : 'Verify and reset timing'}</button>
          </div>
        </form>
      </div>
    )}
  </div>;
}

