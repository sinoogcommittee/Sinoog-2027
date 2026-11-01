import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BrowserQRCodeReader, type IScannerControls } from '@zxing/browser';
import {
  AlertTriangle,
  CalendarDays,
  Camera,
  Clock3,
  Flag,
  Medal,
  PersonStanding,
  Play,
  RefreshCw,
  RotateCcw,
  ScanLine,
  Timer,
  Users,
} from 'lucide-react';
import { Button } from '../../components/Button';
import { Card } from '../../components/m3/Card';
import { Dialog } from '../../components/m3/Dialog';
import { TextField } from '../../components/m3/TextField';
import { TextArea } from '../../components/m3/TextArea';
import { SelectField } from '../../components/m3/SelectField';
import { getCurrentEdition } from '../../features/editions/editionQueries';
import {
  formatElapsed,
  getRunEventAndCategories,
  getTimingDashboard,
  recordRunnerFinish,
  resetOfficialRun,
  startCategoryTiming,
  resetCategoryTiming,
  getCategoryPlannedStart,
  getCategoryBadgeStyle,
  type RunCategory,
  type RunEvent,
  type TimingDashboardRow,
} from '../../features/run/runQueries';
import { LoadingState, EmptyState, InlineMessage } from '../../features/ui/FeedbackStates';
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
  const [startingCategoryId, setStartingCategoryId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetTargetId, setResetTargetId] = useState<string | 'all'>('all');
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

  // Sort categories descending by distance (10K -> 5K -> 3K) matching the gun start schedule
  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => b.distance_meters - a.distance_meters);
  }, [categories]);

  // Keep live timers running whenever any category clock or event clock is active
  const hasAnyCategoryRunning = useMemo(() => {
    return categories.some((c) => Boolean(c.official_started_at)) || Boolean(runEvent?.official_started_at);
  }, [categories, runEvent?.official_started_at]);

  useEffect(() => {
    if (!hasAnyCategoryRunning) return;
    const initialTick = window.setTimeout(() => setNow(Date.now()), 0);
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => {
      window.clearTimeout(initialTick);
      window.clearInterval(timer);
    };
  }, [hasAnyCategoryRunning]);

  const submitFinish = useCallback(async (value: string) => {
    if (scanBusy.current) return;
    scanBusy.current = true;
    try {
      const runner = rows.find(
        (r) => r.qr_token && (value.includes(r.qr_token) || r.qr_token === value.trim())
      );
      if (runner) {
        const category = categories.find((c) => c.id === runner.category_id);
        if (category && !category.official_started_at && !runEvent?.official_started_at) {
          const planned = getCategoryPlannedStart(category);
          throw new Error(
            `Cannot record finish: The official clock for ${category.name} has not been started yet (Planned gun start: ${planned}).`
          );
        }
      }

      await recordRunnerFinish(value);
      toast(
        runner
          ? `Official finish recorded for #${runner.bib_number} ${runner.participant_name}!`
          : 'Official finish recorded.',
        'success'
      );
      setManualQr('');
      await refresh();
    } catch (error: unknown) {
      toast(error instanceof Error ? error.message : 'Unable to record finish.', 'error');
    } finally {
      window.setTimeout(() => { scanBusy.current = false; }, 1200);
    }
  }, [categories, rows, runEvent, refresh, toast]);

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

  const handleCategoryStart = useCallback(async (category: RunCategory) => {
    if (!runEvent) return;
    const planned = getCategoryPlannedStart(category);
    const confirmMessage = `Start the official gun clock for ${category.name} now?\n\n` +
      `Planned gun start was ${planned}.\n` +
      `The official elapsed clock for this category will begin immediately.`;
    if (!window.confirm(confirmMessage)) return;

    setStartingCategoryId(category.id);
    try {
      const startedAt = await startCategoryTiming(category.id, runEvent.id);
      setCategories((prev) =>
        prev.map((c) => (c.id === category.id ? { ...c, official_started_at: startedAt } : c))
      );
      setNow(Date.now());
      toast(`Official gun start recorded for ${category.name}!`, 'success');
      await refresh();
    } catch (error: unknown) {
      toast(error instanceof Error ? error.message : `Unable to start race clock for ${category.name}.`, 'error');
    } finally {
      setStartingCategoryId(null);
    }
  }, [runEvent, refresh, toast]);

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

  const openResetConfirm = (targetId: string | 'all' = 'all') => {
    setResetTargetId(targetId);
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
      if (resetTargetId === 'all') {
        const deletedFinishCount = await resetOfficialRun(runEvent.id);
        toast(`All category race times reset. ${deletedFinishCount} finish record${deletedFinishCount === 1 ? '' : 's'} cleared.`, 'success');
      } else {
        const targetCategory = categories.find((c) => c.id === resetTargetId);
        const deletedFinishCount = await resetCategoryTiming(resetTargetId, runEvent.id);
        toast(`${targetCategory?.name || 'Category'} race time reset. ${deletedFinishCount} finish record${deletedFinishCount === 1 ? '' : 's'} cleared.`, 'success');
      }

      setShowResetConfirm(false);
      setResetPassword('');
      await refresh();
      setNow(Date.now());
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unable to reset race timing.';
      setResetError(message);
      toast(message, 'error');
    } finally {
      setResetting(false);
    }
  };

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

  const totalFinished = useMemo(() => rows.filter((r) => r.finish).length, [rows]);
  const targetCategoryForReset = useMemo(
    () => categories.find((c) => c.id === resetTargetId),
    [categories, resetTargetId]
  );

  if (loading) return <div className="admin-page"><LoadingState message="Loading race timing…" /></div>;

  return (
    <div className="m3-run-timing admin-page">
      <div className="admin-heading">
        <div>
          <p className="eyebrow">Race-day operations</p>
          <h1>Official Timing & Finish Line</h1>
          <p>Staggered gun starts for 10K (4:00 AM), 5K (4:30 AM), and 3K (5:00 AM). The official clock tracks from each category's actual start button.</p>
        </div>
        <Button
          type="button"
          variant="outlined"
          disabled={refreshing}
          onClick={() => void handleRefresh()}
          title="Reload the latest start time and finish records from the database"
          leadingIcon={<RefreshCw size={16} className={refreshing ? 'spin' : undefined} />}
        >
          {refreshing ? 'Reloading…' : 'Reload timing data'}
        </Button>
      </div>

      {/* Staggered Category Gun Start Cards */}
      <div className="timing-category-grid" role="region" aria-label="Category Gun Start Clocks">
        {sortedCategories.map((cat) => {
          const badge = getCategoryBadgeStyle(cat.name);
          const planned = getCategoryPlannedStart(cat);
          const isStarted = Boolean(cat.official_started_at);
          const isStarting = startingCategoryId === cat.id;

          const elapsedMs = isStarted
            ? Math.max(0, (now || new Date(cat.official_started_at!).getTime()) - new Date(cat.official_started_at!).getTime())
            : 0;
          const formattedClock = isStarted ? formatElapsed(elapsedMs) : '00:00:00';

          return (
            <Card
              as="section"
              key={cat.id}
              variant="outlined"
              className={`timing-category-card ${isStarted ? 'is-running' : ''}`}
            >
              <div className="timing-category-card__header">
                <span
                  className="timing-category-card__badge"
                  style={{ backgroundColor: badge.bg, color: badge.color, borderColor: badge.border }}
                >
                  {badge.label}
                </span>
                <div>
                  <h3 className="timing-category-card__title">{cat.name}</h3>
                  <p className="timing-category-card__planned">
                    <Clock3 size={13} aria-hidden /> Planned Gun Start: <strong>{planned}</strong>
                  </p>
                </div>
              </div>

              <div className="timing-category-card__body">
                <div className="timing-category-card__start-time">
                  <small>Actual Gun Start</small>
                  <strong>
                    {isStarted
                      ? new Date(cat.official_started_at!).toLocaleTimeString('en-PH', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                          timeZone: 'Asia/Manila',
                        })
                      : 'Pending Gun Start'}
                  </strong>
                </div>

                <div className="timing-category-card__clock" aria-live="polite">
                  <small>Live Elapsed Clock</small>
                  <strong className={isStarted ? 'clock-active' : 'clock-idle'}>
                    {formattedClock}
                  </strong>
                </div>
              </div>

              <div className="timing-category-card__actions">
                {!isStarted ? (
                  <Button
                    type="button"
                    variant="filled"
                    disabled={isStarting}
                    onClick={() => void handleCategoryStart(cat)}
                    leadingIcon={<Play size={16} />}
                    className="timing-category-start-btn"
                  >
                    {isStarting ? 'Starting…' : `Start ${badge.label} Gun Clock (${planned})`}
                  </Button>
                ) : (
                  <div className="timing-category-card__running-controls">
                    <span className="timing-running-badge">
                      <span className="pulse-dot" /> Clock Running
                    </span>
                    {isAdmin && (
                      <Button
                        type="button"
                        variant="outlined"
                        className="timing-category-reset-btn"
                        onClick={() => openResetConfirm(cat.id)}
                        title={`Reset ${cat.name} clock and finisher records`}
                        leadingIcon={<RotateCcw size={14} />}
                      >
                        Reset {badge.label}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Global Status Bar with Full Event Reset */}
      <div className="timing-overview-summary">
        <div className="timing-overview-stats">
          <span>Total Approved: <strong>{rows.length}</strong></span>
          <span>Official Finishers: <strong>{totalFinished}</strong></span>
          <span>Pending Finish: <strong>{Math.max(0, rows.length - totalFinished)}</strong></span>
        </div>
        {isAdmin && hasAnyCategoryRunning && (
          <Button
            type="button"
            variant="danger"
            onClick={() => openResetConfirm('all')}
            leadingIcon={<RotateCcw size={16} />}
            title="Reset timing and recorded finishes for all categories"
          >
            Reset All Categories
          </Button>
        )}
      </div>

      <Card as="section" variant="outlined" className="admin-panel finish-scanner-panel">
        <div className="panel-heading">
          <h2><ScanLine size={18} /> Finish-line QR scanner</h2>
          <p>Camera scanning requires HTTPS. Manual token entry remains available as backup. Elapsed times calculate from each runner's specific category start.</p>
        </div>
        <div className="finish-scanner-grid">
          <div>
            <video ref={videoRef} className="finish-scanner-video" muted playsInline />
            <div className="button-row">
              {!scannerActive ? (
                <Button type="button" variant="outlined" onClick={() => void startScanner()} leadingIcon={<Camera size={17} />}>
                  Start camera
                </Button>
              ) : (
                <Button type="button" variant="outlined" onClick={stopScanner}>
                  Stop camera
                </Button>
              )}
            </div>
          </div>
          <form onSubmit={(event) => { event.preventDefault(); void submitFinish(manualQr); }} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <TextArea
              id="manual-runner-qr"
              label="Manual QR token or full QR value"
              rows={4}
              value={manualQr}
              onChange={(event) => setManualQr(event.target.value)}
              placeholder="SINOOG-2027|…"
            />
            <Button
              type="submit"
              variant="filled"
              disabled={!manualQr.trim() || !hasAnyCategoryRunning}
              leadingIcon={<Flag size={17} />}
            >
              Record official finish
            </Button>
          </form>
        </div>
      </Card>

      <Card as="section" variant="outlined" className="admin-panel">
        <div className="table-tools timing-filters">
          <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} aria-label="Filter category">
            <option value="all">All categories</option>
            {sortedCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
          <select value={divisionFilter} onChange={(event) => setDivisionFilter(event.target.value)} aria-label="Filter division">
            <option value="all">Male & Female</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
          <select value={ageFilter} onChange={(event) => setAgeFilter(event.target.value as AgeGroup)} aria-label="Filter age group">
            <option value="all">All ages</option>
            <option value="under18">Under 18</option>
            <option value="18-29">18–29</option>
            <option value="30-39">30–39</option>
            <option value="40-49">40–49</option>
            <option value="50plus">50+</option>
          </select>
        </div>
        {filteredRows.length === 0 ? (
          <EmptyState title="No approved runners" message="Approved runner entries and official results will appear here." />
        ) : (
          <div className="timing-results-table">
            <div className="timing-results-row timing-results-head">
              <span>Place</span>
              <span>Bib / Runner</span>
              <span>Category</span>
              <span>Division</span>
              <span>Age</span>
              <span>Official Time</span>
            </div>
            {filteredRows.map((row) => {
              const rowCategory = categories.find((c) => c.id === row.category_id);
              const isCategoryStarted = Boolean(rowCategory?.official_started_at || runEvent?.official_started_at);
              const planned = rowCategory ? getCategoryPlannedStart(rowCategory) : '4:00 AM';

              return (
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
                      <strong>{rowCategory?.name || 'Run'}</strong>
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
                      {row.finish ? (
                        <strong><Clock3 size={14} /> {formatElapsed(row.finish.elapsed_milliseconds)}</strong>
                      ) : isCategoryStarted ? (
                        <span className="timing-status-running">On Course (Running)</span>
                      ) : (
                        <span className="timing-status-pending" title={`Planned gun start: ${planned}`}>
                          Awaiting Start ({planned})
                        </span>
                      )}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Dialog
        open={showResetConfirm}
        onClose={closeResetConfirm}
        title={
          resetTargetId === 'all'
            ? 'Reset all official starts?'
            : `Reset ${targetCategoryForReset?.name || 'Category'} start?`
        }
      >
        <form onSubmit={(event) => { event.preventDefault(); void handleReset(); }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--md-sys-color-error)' }}>
            <AlertTriangle size={32} aria-hidden="true" />
            <p style={{ margin: 0, fontSize: '0.92rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
              {resetTargetId === 'all'
                ? 'This removes the official start time for all categories (10K, 5K, 3K) and every recorded finish across the event. Runner registrations, bib numbers, and QR codes remain unchanged. Verify your administrator credentials to continue.'
                : `This removes the official start time and recorded finish records for ${targetCategoryForReset?.name || 'this category'} only. Other categories will not be affected.`}
            </p>
          </div>

          <SelectField
            label="Category to reset"
            value={resetTargetId}
            onChange={(event) => setResetTargetId(event.target.value as string | 'all')}
            disabled={resetting}
          >
            <option value="all">All Categories (Full Event Reset)</option>
            {sortedCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({getCategoryBadgeStyle(c.name).label})
              </option>
            ))}
          </SelectField>

          <TextField
            label="Administrator email"
            type="email"
            required
            value={resetEmail}
            onChange={(event) => setResetEmail(event.target.value)}
            autoComplete="username"
            disabled={resetting}
          />

          <TextField
            label="Administrator password"
            type="password"
            required
            value={resetPassword}
            onChange={(event) => setResetPassword(event.target.value)}
            autoComplete="current-password"
            disabled={resetting}
          />

          {resetError && (
            <InlineMessage tone="error">
              {resetError}
            </InlineMessage>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <Button type="button" variant="text" disabled={resetting} onClick={closeResetConfirm}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              disabled={resetting}
              loading={resetting}
              leadingIcon={<RotateCcw size={17} />}
            >
              Verify and reset timing
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
