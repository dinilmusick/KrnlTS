import { luthFetch } from '../../auth/luthAuthClient';
/**
 * @file AdminAuditTab.tsx
 * @description Security Audit Logs viewer with search, category filtering, and JSON export.
 * Strictly adheres to Skipo file line limits (<200 lines).
 */

import React, { useState, useEffect } from 'react';
import { Terminal, Download, RefreshCw, Search } from 'lucide-react';
import { BaseButton, BaseCard } from '@skipo/ui';
import { IconOnlyButton } from '../common/IconOnlyButton';
import { BrutalistInput } from '../common/BrutalistUi';
import { AdminAuditLog } from '@/libraries/types/auth';

export default function AdminAuditTab(): React.ReactElement {
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filterAction, setFilterAction] = useState<'ALL' | 'AUTH' | 'CLUSTER'>('ALL');

  const loadLogs = () => {
    luthFetch('/api/admin/audit-logs')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load audit logs.');
        return res.json();
      })
      .then((data) => setLogs(data))
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const handleCopyEntry = (log: AdminAuditLog) => {
    const text = `[${new Date(log.timestamp).toISOString()}] [${log.action}] [Actor: ${log.actor_user_id}] - ${log.details || ''}`;
    navigator.clipboard.writeText(text);
    setCopiedId(log.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `srkl_audit_logs_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.details && log.details.toLowerCase().includes(searchQuery.toLowerCase())) ||
      log.actor_user_id.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (filterAction === 'AUTH') return log.action.includes('LOGIN') || log.action.includes('REGISTER');
    if (filterAction === 'CLUSTER') return log.action.includes('DB') || log.action.includes('CLUSTER') || log.action.includes('SYNC');
    return true;
  });

  return (
    <div className="space-y-3 font-mono select-none">
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 border-2"
        style={{ backgroundColor: 'var(--skipo-matte-bg)', borderColor: 'var(--skipo-border-color)', borderRadius: 'var(--skipo-radius-sm)' }}>
        <div className="flex items-center gap-2">
          <Terminal size={16} style={{ color: 'var(--skipo-accent)' }} />
          <h2 className="text-xs font-black uppercase tracking-wider" style={{ color: 'var(--skipo-text)' }}>
            SECURITY AUDIT LOGS
          </h2>
        </div>
        <div className="flex items-center gap-1.5">
          <IconOnlyButton tooltip="Export JSON Logs" icon={<Download size={14} />} variant="surface" position="bottom" onClick={handleDownload} disabled={logs.length === 0} className="h-8 w-8" />
          <IconOnlyButton tooltip="Reload Logs" icon={<RefreshCw size={14} />} variant="surface" position="bottom" onClick={loadLogs} className="h-8 w-8" />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-2 p-2 border"
        style={{ backgroundColor: 'var(--skipo-matte-bg)', borderColor: 'var(--skipo-border-color)', borderRadius: 'var(--skipo-radius-sm)' }}>
        <div className="relative flex-1 w-full">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--skipo-text-muted)' }} />
          <BrutalistInput type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search action, details, actor ID..." inspectionLabel="Filter security logs" className="w-full pl-8" />
        </div>
        <div className="flex items-center gap-1 shrink-0 overflow-x-auto">
          {(['ALL', 'AUTH', 'CLUSTER'] as const).map((cat) => (
            <BaseButton key={cat} type="button" size="sm" variant={filterAction === cat ? 'accent' : 'secondary'} onClick={() => setFilterAction(cat)} className="text-[9px] px-2.5 py-1 uppercase font-black">
              {cat}
            </BaseButton>
          ))}
        </div>
      </div>

      <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
        {filteredLogs.length === 0 ? (
          <div className="p-4 text-center text-xs border"
            style={{ backgroundColor: 'var(--skipo-matte-bg)', borderColor: 'var(--skipo-border-color)', color: 'var(--skipo-text-muted)', borderRadius: 'var(--skipo-radius-sm)' }}>
            No audit records found.
          </div>
        ) : (
          filteredLogs.map((log) => (
            <BaseCard key={log.id} interactive onClick={() => handleCopyEntry(log)}
              className="p-2 border text-[10px] space-y-1 flex items-start justify-between gap-2"
              style={{ backgroundColor: 'var(--skipo-matte-bg)', borderColor: 'var(--skipo-border-color)', borderRadius: 'var(--skipo-radius-sm)' }}>
              <div className="space-y-0.5 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold font-mono" style={{ color: 'var(--skipo-accent)' }}>{log.action}</span>
                  <span className="text-[9px] px-1 font-bold border" style={{ backgroundColor: 'var(--skipo-surface)', color: 'var(--skipo-text-muted)', borderColor: 'var(--skipo-border-color)', borderRadius: 'var(--skipo-radius-sm)' }}>
                    {log.actor_user_id}
                  </span>
                  <span className="text-[9px]" style={{ color: 'var(--skipo-text-muted)' }}>
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                {log.details && (
                  <p className="text-[10px] font-mono truncate" style={{ color: 'var(--skipo-text-muted)' }}>{log.details}</p>
                )}
              </div>
              <span className="text-[9px] shrink-0 font-mono" style={{ color: 'var(--skipo-text-muted)' }}>
                {copiedId === log.id ? 'COPIED' : 'LOG'}
              </span>
            </BaseCard>
          ))
        )}
      </div>
    </div>
  );
}
