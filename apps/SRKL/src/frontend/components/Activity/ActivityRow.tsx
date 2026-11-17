/**
 * @file ActivityRow.tsx
 * @description Single log item row in the Activity audit stream.
 * Fully wired to Skipo theme tokens.
 * File size < 200 lines strictly.
 */

import React from 'react';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';
import { ActivityRecord } from '@/libraries/types/srkl';

interface ActivityRowProps {
  key?: React.Key;
  log: ActivityRecord;
}

export function ActivityRow({ log }: ActivityRowProps): React.ReactElement {
  const isSuccess = log.status === 'SUCCESS';

  return (
    <div
      className="p-3 border font-mono text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-colors select-none"
      style={{
        backgroundColor: 'var(--skipo-surface)',
        borderColor: 'var(--skipo-border-color)',
        borderRadius: 'var(--skipo-radius-sm)',
        boxShadow: 'var(--skipo-shadow)',
      }}
    >
      <div className="flex items-start sm:items-center gap-2.5">
        {isSuccess ? (
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 sm:mt-0" style={{ color: 'var(--skipo-success)' }} />
        ) : (
          <XCircle className="w-4 h-4 shrink-0 mt-0.5 sm:mt-0" style={{ color: 'var(--skipo-danger)' }} />
        )}
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold uppercase" style={{ color: 'var(--skipo-text)' }}>
              {log.actionId}
            </span>
            <span
              className="text-[10px] px-1.5 py-0.5 border rounded uppercase font-semibold"
              style={{
                backgroundColor: 'var(--skipo-matte-bg)',
                borderColor: 'var(--skipo-border-color)',
                color: 'var(--skipo-text-muted)',
              }}
            >
              {log.serviceName}
            </span>
          </div>
          {log.error ? (
            <p className="text-[11px] mt-1" style={{ color: 'var(--skipo-danger)' }}>
              {log.error}
            </p>
          ) : (
            <p className="text-[10px] mt-0.5" style={{ color: 'var(--skipo-text-muted)' }}>
              Execution returned 200 OK
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 text-[11px] shrink-0 self-end sm:self-auto" style={{ color: 'var(--skipo-text-muted)' }}>
        <span
          className="px-1.5 py-0.5 border rounded"
          style={{
            backgroundColor: 'var(--skipo-matte-bg)',
            borderColor: 'var(--skipo-border-color)',
            color: 'var(--skipo-text)',
          }}
        >
          {log.durationMs}ms
        </span>
        <span className="flex items-center gap-1" style={{ color: 'var(--skipo-text-muted)' }}>
          <Clock className="w-3 h-3" />
          {new Date(log.timestamp).toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}
