import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Award,
  Clock,
  Copy,
  DollarSign,
  Download,
  Eye,
  Key,
  RefreshCw,
  Shield,
  User,
} from 'lucide-react';
import { Button } from '../../components/Button';
import { Card } from '../../components/m3/Card';
import { Dialog } from '../../components/m3/Dialog';
import { SearchBar } from '../../components/m3/SearchBar';
import { SelectField } from '../../components/m3/SelectField';
import { useAuth } from '../../features/auth/useAuth';
import { useToast } from '../../features/ui/useToast';
import { EmptyState, LoadingState } from '../../features/ui/FeedbackStates';
import {
  computeAuditSummaryStats,
  exportAuditLogsToCsv,
  formatActionLabel,
  getActionBadgeStyle,
  listAuditLogs,
  type AuditLogItem,
} from '../../features/audit/auditQueries';

export function AuditLogsManagerPage() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();

  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [entityFilter, setEntityFilter] = useState('all');
  const [limit, setLimit] = useState(150);

  // Detail Modal
  const [inspectingLog, setInspectingLog] = useState<AuditLogItem | null>(null);

  const loadData = useCallback(async () => {
    try {
      const data = await listAuditLogs({
        limit,
        action: actionFilter !== 'all' ? actionFilter : undefined,
        entityTable: entityFilter !== 'all' ? entityFilter : undefined,
      });
      setLogs(data);
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to load audit logs.', 'error');
    } finally {
      setLoading(false);
    }
  }, [limit, actionFilter, entityFilter, toast]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadData(), 0);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await loadData();
      toast('Audit logs refreshed.', 'success');
    } finally {
      setRefreshing(false);
    }
  }

  // Filter in-memory by search query
  const filteredLogs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return logs;

    return logs.filter((log) => {
      const actionText = formatActionLabel(log.action).toLowerCase();
      const rawAction = log.action.toLowerCase();
      const actor = log.actorName.toLowerCase();
      const table = log.entityTable.toLowerCase();
      const entityId = (log.entityId || '').toLowerCase();
      const detailStr = JSON.stringify(log.detail).toLowerCase();

      return (
        actionText.includes(q) ||
        rawAction.includes(q) ||
        actor.includes(q) ||
        table.includes(q) ||
        entityId.includes(q) ||
        detailStr.includes(q)
      );
    });
  }, [logs, searchQuery]);

  // Overall stats
  const stats = useMemo(() => computeAuditSummaryStats(logs), [logs]);

  // Unique actions and tables in current logs for filters
  const uniqueActions = useMemo(() => {
    const set = new Set(logs.map((l) => l.action));
    return Array.from(set).sort();
  }, [logs]);

  const uniqueTables = useMemo(() => {
    const set = new Set(logs.map((l) => l.entityTable));
    return Array.from(set).sort();
  }, [logs]);

  // Export to CSV
  function handleExportCsv() {
    if (filteredLogs.length === 0) {
      toast('No logs to export.', 'info');
      return;
    }
    try {
      const csvContent = exportAuditLogsToCsv(filteredLogs);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `sinoog_2027_audit_log_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast(`Exported ${filteredLogs.length} audit records to CSV.`, 'success');
    } catch {
      toast('Failed to generate CSV export.', 'error');
    }
  }

  // Copy JSON payload in dialog
  async function handleCopyJson(detail: Record<string, unknown>) {
    try {
      await navigator.clipboard.writeText(JSON.stringify(detail, null, 2));
      toast('Audit payload JSON copied to clipboard.', 'success');
    } catch {
      toast('Unable to copy JSON to clipboard.', 'error');
    }
  }

  if (!isAdmin) {
    return (
      <div className="admin-page">
        <EmptyState
          title="Administrators only"
          message="Security audit and operational logs can only be viewed by administrators."
        />
      </div>
    );
  }

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-heading">
        <div>
          <p className="eyebrow">Security & System Oversight</p>
          <h1>Audit History & Activity Log</h1>
          <p>
            Immutable event record of administrative overrides, registration approvals, role changes, and financial voids.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            leadingIcon={<RefreshCw size={16} className={refreshing ? 'spin' : ''} />}
            onClick={() => void handleRefresh()}
            disabled={refreshing}
          >
            Refresh
          </Button>
          <Button
            variant="filled"
            leadingIcon={<Download size={16} />}
            onClick={handleExportCsv}
            disabled={loading || filteredLogs.length === 0}
          >
            Export CSV ({filteredLogs.length})
          </Button>
        </div>
      </div>

      {/* Metric Summary Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 'var(--md-space-3)',
          marginBottom: 'var(--md-space-4)',
        }}
      >
        <Card variant="outlined" style={{ padding: 'var(--md-space-4)', display: 'flex', alignItems: 'center', gap: 'var(--md-space-3)' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--md-sys-color-surface-container-high)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--md-sys-color-primary)' }}>
            <Shield size={22} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-on-surface-variant)', display: 'block' }}>Total Logged Events</span>
            <strong style={{ fontSize: '1.4rem', fontWeight: 700 }}>{stats.total}</strong>
          </div>
        </Card>

        <Card variant="outlined" style={{ padding: 'var(--md-space-4)', display: 'flex', alignItems: 'center', gap: 'var(--md-space-3)', borderColor: 'rgba(255, 107, 107, 0.4)' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(255, 107, 107, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c92a2a' }}>
            <Key size={22} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-on-surface-variant)', display: 'block' }}>Security & Roles</span>
            <strong style={{ fontSize: '1.4rem', fontWeight: 700, color: '#c92a2a' }}>{stats.securityCount}</strong>
          </div>
        </Card>

        <Card variant="outlined" style={{ padding: 'var(--md-space-4)', display: 'flex', alignItems: 'center', gap: 'var(--md-space-3)', borderColor: 'rgba(32, 201, 151, 0.4)' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(32, 201, 151, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#099268' }}>
            <Award size={22} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-on-surface-variant)', display: 'block' }}>Run & Kit Actions</span>
            <strong style={{ fontSize: '1.4rem', fontWeight: 700, color: '#099268' }}>{stats.registrationCount}</strong>
          </div>
        </Card>

        <Card variant="outlined" style={{ padding: 'var(--md-space-4)', display: 'flex', alignItems: 'center', gap: 'var(--md-space-3)', borderColor: 'rgba(245, 159, 0, 0.4)' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(255, 243, 191, 0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e67700' }}>
            <DollarSign size={22} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-on-surface-variant)', display: 'block' }}>Finance & Voids</span>
            <strong style={{ fontSize: '1.4rem', fontWeight: 700, color: '#e67700' }}>{stats.financeCount}</strong>
          </div>
        </Card>
      </div>

      {/* Main Filter & Table Card */}
      <Card variant="outlined" style={{ padding: 'var(--md-space-4)' }}>
        {/* Toolbar */}
        <div
          className="table-tools admin-toolbar"
          style={{
            display: 'flex',
            gap: 'var(--md-space-3)',
            flexWrap: 'wrap',
            alignItems: 'center',
            marginBottom: 'var(--md-space-4)',
          }}
        >
          <div style={{ flex: '1 1 260px', minWidth: '220px' }}>
            <SearchBar
              label="Search logs"
              placeholder="Search by action, actor, ID, or JSON value…"
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
          </div>

          <div style={{ minWidth: '160px' }}>
            <SelectField
              label="Filter action"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
            >
              <option value="all">All actions ({logs.length})</option>
              {uniqueActions.map((act) => (
                <option key={act} value={act}>
                  {formatActionLabel(act)}
                </option>
              ))}
            </SelectField>
          </div>

          <div style={{ minWidth: '150px' }}>
            <SelectField
              label="Filter table"
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
            >
              <option value="all">All tables</option>
              {uniqueTables.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </SelectField>
          </div>

          <div style={{ minWidth: '120px' }}>
            <SelectField
              label="Fetch limit"
              value={String(limit)}
              onChange={(e) => setLimit(Number(e.target.value))}
            >
              <option value="50">Latest 50</option>
              <option value="150">Latest 150</option>
              <option value="300">Latest 300</option>
              <option value="500">Latest 500</option>
            </SelectField>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ padding: '3rem' }}>
            <LoadingState message="Loading audit and security log records…" />
          </div>
        ) : filteredLogs.length === 0 ? (
          <EmptyState
            title="No audit logs found"
            message={
              searchQuery || actionFilter !== 'all' || entityFilter !== 'all'
                ? 'No log entries matched your filter and search criteria.'
                : 'No audit records have been generated yet.'
            }
          />
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="desktop-only" style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '0.88rem',
                }}
              >
                <thead>
                  <tr
                    style={{
                      borderBottom: '2px solid var(--md-sys-color-outline-variant)',
                      textAlign: 'left',
                      color: 'var(--md-sys-color-on-surface-variant)',
                    }}
                  >
                    <th style={{ padding: '10px 12px', width: '155px' }}>Timestamp</th>
                    <th style={{ padding: '10px 12px', width: '180px' }}>Action</th>
                    <th style={{ padding: '10px 12px', width: '160px' }}>Actor</th>
                    <th style={{ padding: '10px 12px', width: '160px' }}>Target Entity</th>
                    <th style={{ padding: '10px 12px' }}>Event Summary</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right', width: '90px' }}>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => {
                    const badge = getActionBadgeStyle(log.action);
                    const formattedDate = new Date(log.createdAt).toLocaleString('en-PH', {
                      timeZone: 'Asia/Manila',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    });

                    // Format key facts from detail
                    const detailSummary = Object.entries(log.detail)
                      .slice(0, 3)
                      .map(([k, v]) => `${k}: ${typeof v === 'object' ? '…' : String(v)}`)
                      .join(' · ');

                    return (
                      <tr
                        key={log.id}
                        style={{
                          borderBottom: '1px solid var(--md-sys-color-outline-variant)',
                          transition: 'background 0.15s ease',
                        }}
                      >
                        {/* Timestamp */}
                        <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--md-sys-color-on-surface-variant)', fontSize: '0.82rem' }}>
                            <Clock size={13} />
                            {formattedDate}
                          </span>
                        </td>

                        {/* Action Badge */}
                        <td style={{ padding: '10px 12px' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              background: badge.bg,
                              color: badge.color,
                              border: `1px solid ${badge.border}`,
                              fontWeight: 600,
                              fontSize: '0.78rem',
                            }}
                          >
                            {formatActionLabel(log.action)}
                          </span>
                        </td>

                        {/* Actor */}
                        <td style={{ padding: '10px 12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <User size={14} color="var(--md-sys-color-primary)" />
                            <strong style={{ fontSize: '0.85rem' }}>{log.actorName}</strong>
                          </div>
                        </td>

                        {/* Target Entity */}
                        <td style={{ padding: '10px 12px' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              fontSize: '0.75rem',
                              fontFamily: 'monospace',
                              background: 'var(--md-sys-color-surface-container)',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              marginBottom: '2px',
                            }}
                          >
                            {log.entityTable}
                          </span>
                          {log.entityId && (
                            <div
                              style={{
                                fontSize: '0.72rem',
                                color: 'var(--md-sys-color-on-surface-variant)',
                                fontFamily: 'monospace',
                                maxWidth: '140px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                              title={log.entityId}
                            >
                              id: {log.entityId}
                            </div>
                          )}
                        </td>

                        {/* Detail Summary */}
                        <td style={{ padding: '10px 12px' }}>
                          <span
                            style={{
                              fontSize: '0.8rem',
                              color: 'var(--md-sys-color-on-surface-variant)',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {detailSummary || 'No extra metadata payload.'}
                          </span>
                        </td>

                        {/* Action Button */}
                        <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                          <Button
                            variant="outlined"
                            size="small"
                            leadingIcon={<Eye size={13} />}
                            onClick={() => setInspectingLog(log)}
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="mobile-only" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredLogs.map((log) => {
                const badge = getActionBadgeStyle(log.action);
                const formattedDate = new Date(log.createdAt).toLocaleString('en-PH', {
                  timeZone: 'Asia/Manila',
                  dateStyle: 'short',
                  timeStyle: 'short',
                });

                return (
                  <div
                    key={log.id}
                    style={{
                      padding: '12px',
                      borderRadius: '10px',
                      border: '1px solid var(--md-sys-color-outline-variant)',
                      background: 'var(--md-sys-color-surface-container-low)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '6px',
                          background: badge.bg,
                          color: badge.color,
                          border: `1px solid ${badge.border}`,
                          fontWeight: 600,
                          fontSize: '0.78rem',
                        }}
                      >
                        {formatActionLabel(log.action)}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
                        {formattedDate}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.85rem', marginBottom: '4px' }}>
                      <strong>Actor:</strong> {log.actorName}
                    </div>

                    <div style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-on-surface-variant)', marginBottom: '8px' }}>
                      <strong>Target:</strong> <code>{log.entityTable}</code> {log.entityId ? `(#${log.entityId.slice(0, 8)}…)` : ''}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                      <Button
                        variant="outlined"
                        size="small"
                        leadingIcon={<Eye size={14} />}
                        onClick={() => setInspectingLog(log)}
                      >
                        Inspect Payload
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </Card>

      {/* Inspect Log Dialog */}
      <Dialog
        open={Boolean(inspectingLog)}
        onClose={() => setInspectingLog(null)}
        title={`Audit Event #${inspectingLog?.id || ''}`}
      >
        {inspectingLog && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-space-3)' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '10px',
                background: 'var(--md-sys-color-surface-container)',
                padding: '12px',
                borderRadius: '8px',
              }}
            >
              <div>
                <small style={{ color: 'var(--md-sys-color-on-surface-variant)', display: 'block' }}>Action</small>
                <strong>{formatActionLabel(inspectingLog.action)}</strong>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted)', fontFamily: 'monospace' }}>
                  {inspectingLog.action}
                </div>
              </div>
              <div>
                <small style={{ color: 'var(--md-sys-color-on-surface-variant)', display: 'block' }}>Responsible Actor</small>
                <strong>{inspectingLog.actorName}</strong>
                {inspectingLog.actorId && (
                  <div style={{ fontSize: '0.72rem', color: 'var(--muted)', fontFamily: 'monospace' }}>
                    {inspectingLog.actorId}
                  </div>
                )}
              </div>
              <div>
                <small style={{ color: 'var(--md-sys-color-on-surface-variant)', display: 'block' }}>Target Table</small>
                <code>{inspectingLog.entityTable}</code>
              </div>
              <div>
                <small style={{ color: 'var(--md-sys-color-on-surface-variant)', display: 'block' }}>Target Entity ID</small>
                <code style={{ wordBreak: 'break-all' }}>{inspectingLog.entityId || 'None'}</code>
              </div>
              <div>
                <small style={{ color: 'var(--md-sys-color-on-surface-variant)', display: 'block' }}>Exact Timestamp</small>
                <span>{new Date(inspectingLog.createdAt).toLocaleString('en-PH', { timeZone: 'Asia/Manila' })}</span>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Event Payload Detail (JSON):</span>
                <Button
                  variant="outlined"
                  size="small"
                  leadingIcon={<Copy size={13} />}
                  onClick={() => void handleCopyJson(inspectingLog.detail)}
                >
                  Copy JSON
                </Button>
              </div>
              <pre
                style={{
                  background: '#1a1a1a',
                  color: '#98c379',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  lineHeight: '1.45',
                  overflowX: 'auto',
                  maxHeight: '260px',
                  fontFamily: 'SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
                }}
              >
                {JSON.stringify(inspectingLog.detail, null, 2)}
              </pre>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--md-space-2)' }}>
              <Button variant="filled" onClick={() => setInspectingLog(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
