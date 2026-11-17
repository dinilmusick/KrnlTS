/**
 * @file DashboardRecentActivity.tsx
 * @description Recent activity stream for the main Dashboard view.
 * Fully wired to Skipo theme tokens.
 * Adheres to Skipo code limits (<200 lines).
 */

import React from 'react';
import { Activity, ArrowUpRight, CheckCircle2, XCircle } from 'lucide-react';
import { useHub } from '../../context/HubContext';
import { BaseButton } from '@skipo/ui';

export function DashboardRecentActivity(): React.ReactElement {
  const { activityLogs, setActiveTab } = useHub();
  const recentLogs = activityLogs.slice(0, 5);

  return (
    <div className="space-y-3 font-mono select-none">
      <div
        className="flex items-center justify-between pb-2 border-b"
        style={{ borderColor: 'var(--skipo-border-color)' }}
      >
        <h2
          className="text-xs font-black tracking-wider flex items-center gap-2 uppercase"
          style={{ color: 'var(--skipo-text)' }}
        >
          <Activity className="w-3.5 h-3.5" style={{ color: 'var(--skipo-info)' }} />
          RECENT SURVEILLANCE & ACTION LOGS
        </h2>
        <BaseButton
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setActiveTab('ACTIVITY')}
          className="text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors border-0"
          style={{ color: 'var(--skipo-accent)' }}
        >
          Full Stream <ArrowUpRight className="w-3 h-3" />
        </BaseButton>
      </div>

      {recentLogs.length === 0 ? (
        <div
          className="p-6 text-center text-xs border"
          style={{
            backgroundColor: 'var(--skipo-matte-bg)',
            borderColor: 'var(--skipo-border-color)',
            color: 'var(--skipo-text-muted)',
            borderRadius: 'var(--skipo-radius)',
          }}
        >
          No operations executed yet. Use Services or Resources to trigger actions.
        </div>
      ) : (
        <div className="space-y-2">
          {recentLogs.map((log) => (
            <div
              key={log.id}
              className="p-2.5 border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              style={{
                backgroundColor: 'var(--skipo-surface)',
                borderColor: 'var(--skipo-border-color)',
                borderRadius: 'var(--skipo-radius-sm)',
                boxShadow: 'var(--skipo-shadow)',
              }}
            >
              <div className="flex items-center gap-2.5">
                {log.status === 'SUCCESS' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: 'var(--skipo-success)' }} />
                ) : (
                  <XCircle className="w-4 h-4 shrink-0" style={{ color: 'var(--skipo-danger)' }} />
                )}
                <div>
                  <span className="font-bold mr-2 uppercase" style={{ color: 'var(--skipo-text)' }}>
                    {log.actionId}
                  </span>
                  <span className="text-[11px]" style={{ color: 'var(--skipo-text-muted)' }}>
                    {log.serviceName}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-[11px]" style={{ color: 'var(--skipo-text-muted)' }}>
                <span>{log.durationMs}ms</span>
                <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
