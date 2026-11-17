/**
 * @file ActivityView.tsx
 * @description Activity stream audit view for SRKL.
 * Adheres strictly to Skipo BaseIconButton icon-only button protocol.
 * Conforms to Srkl-spec.md Section 21 & Skipo code limits (<200 lines).
 */

import React, { useState } from 'react';
import { Activity, Trash2, Download, Filter, CheckCircle2, XCircle, ListFilter } from 'lucide-react';
import { useHub } from '../../context/HubContext';
import { ActivityRow } from './ActivityRow';
import { BaseIconButton } from '../common/BaseIconButton';

export function ActivityView(): React.ReactElement {
  const { activityLogs, clearActivityLogs } = useHub();
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'SUCCESS' | 'FAILED'>('ALL');

  const filteredLogs = activityLogs.filter((log) => {
    if (filterStatus === 'ALL') return true;
    return log.status === filterStatus;
  });

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(activityLogs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `srkl-activity-audit-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div id="srkl-activity-view" className="space-y-6 max-w-7xl mx-auto w-full font-mono pb-16 animate-fade-in">
      <div
        className="flex items-center justify-between pb-3 border-b-2"
        style={{ borderColor: 'var(--skipo-border-color)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 border-2 flex items-center justify-center shadow-sm"
            style={{
              borderColor: 'var(--skipo-accent)',
              backgroundColor: 'var(--skipo-matte-bg)',
              color: 'var(--skipo-accent)',
              borderRadius: 'var(--skipo-radius-sm)',
            }}
          >
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h1
              className="text-sm font-black tracking-wider uppercase"
              style={{ color: 'var(--skipo-text)' }}
            >
              ACTIVITY STREAM
            </h1>
            <span
              className="text-[10px] uppercase tracking-wide"
              style={{ color: 'var(--skipo-text-muted)' }}
            >
              {activityLogs.length} AUDIT ENTRIES RECORDED
            </span>
          </div>
        </div>

        {/* Action Controls: Strictly BaseIconButton */}
        <div className="flex items-center gap-2">
          <BaseIconButton
            tooltip="Export Activity Audit JSON"
            icon={<Download className="w-4 h-4" />}
            variant="secondary"
            size="md"
            disabled={activityLogs.length === 0}
            onClick={handleExportJson}
          />
          <BaseIconButton
            tooltip="Clear All Audit Logs"
            icon={<Trash2 className="w-4 h-4" />}
            variant="danger"
            size="md"
            disabled={activityLogs.length === 0}
            onClick={clearActivityLogs}
          />
        </div>
      </div>

      {/* Filter Bar with BaseIconButton Switchers */}
      <div
        className="flex items-center gap-2 pb-2 border-b"
        style={{ borderColor: 'var(--skipo-border-color)' }}
      >
        <Filter className="w-3.5 h-3.5 mr-1" style={{ color: 'var(--skipo-text-muted)' }} />
        <BaseIconButton
          tooltip={`Show All Logs (${activityLogs.length})`}
          icon={<ListFilter className="w-4 h-4" />}
          variant={filterStatus === 'ALL' ? 'primary' : 'secondary'}
          active={filterStatus === 'ALL'}
          size="sm"
          onClick={() => setFilterStatus('ALL')}
        />
        <BaseIconButton
          tooltip={`Filter Successful Dispatches (${activityLogs.filter((l) => l.status === 'SUCCESS').length})`}
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          variant={filterStatus === 'SUCCESS' ? 'primary' : 'secondary'}
          active={filterStatus === 'SUCCESS'}
          size="sm"
          onClick={() => setFilterStatus('SUCCESS')}
        />
        <BaseIconButton
          tooltip={`Filter Failed Dispatches (${activityLogs.filter((l) => l.status === 'FAILED').length})`}
          icon={<XCircle className="w-4 h-4 text-rose-400" />}
          variant={filterStatus === 'FAILED' ? 'primary' : 'secondary'}
          active={filterStatus === 'FAILED'}
          size="sm"
          onClick={() => setFilterStatus('FAILED')}
        />
      </div>

      {filteredLogs.length === 0 ? (
        <div
          className="p-8 border-2 text-center text-xs uppercase tracking-wider"
          style={{
            backgroundColor: 'var(--skipo-surface)',
            borderColor: 'var(--skipo-border-color)',
            color: 'var(--skipo-text-muted)',
            borderRadius: 'var(--skipo-radius)',
          }}
        >
          No activity logs recorded matching current filter.
        </div>
      ) : (
        <div className="space-y-2">
          {filteredLogs.map((log) => (
            <ActivityRow key={log.id} log={log} />
          ))}
        </div>
      )}
    </div>
  );
}
