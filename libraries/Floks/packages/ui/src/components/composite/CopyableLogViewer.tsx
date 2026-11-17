'use client';
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { BaseCard } from '../base/BaseCard.js';
import { BaseButton } from '../base/BaseButton.js';
import { BaseBadge } from '../base/BaseBadge.js';

export interface LogEntry {
  id?: string;
  level?: 'info' | 'warn' | 'error';
  message: string;
  timestamp?: string;
}

export interface CopyableLogViewerProps {
  logs: Array<string | LogEntry>;
  title?: string;
  maxHeight?: string | number;
  autoScroll?: boolean;
  className?: string;
  onClear?: () => void;
}

export const CopyableLogViewer: React.FC<CopyableLogViewerProps> = ({
  logs,
  title = 'System Logs',
  maxHeight = '280px',
  autoScroll = true,
  className = '',
  onClear,
}) => {
  const [copied, setCopied] = useState(false);
  const [filter, setFilter] = useState<'all' | 'error' | 'warn'>('all');
  const scrollRef = useRef<HTMLDivElement>(null);

  const normalizedLogs: LogEntry[] = useMemo(() => {
    return logs.map((log, idx) => {
      if (typeof log === 'string') {
        const isErr = /error|fatal|fail/i.test(log);
        const isWarn = /warn/i.test(log);
        return {
          id: `log-${idx}`,
          level: isErr ? 'error' : isWarn ? 'warn' : 'info',
          message: log,
          timestamp: new Date().toLocaleTimeString()
        };
      }
      return {
        id: log.id || `log-${idx}`,
        level: log.level || 'info',
        message: log.message,
        timestamp: log.timestamp || new Date().toLocaleTimeString()
      };
    });
  }, [logs]);

  const filteredLogs = useMemo(() => {
    if (filter === 'all') return normalizedLogs;
    return normalizedLogs.filter(l => l.level === filter);
  }, [normalizedLogs, filter]);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [filteredLogs, autoScroll]);

  const handleCopyAll = async () => {
    const text = filteredLogs.map(l => `[${l.timestamp}] [${l.level?.toUpperCase()}] ${l.message}`).join('\n');
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {}
  };

  const getLevelColor = (level?: string) => {
    if (level === 'error') return 'var(--skipo-danger, #ef4444)';
    if (level === 'warn') return 'var(--skipo-warning, #f59e0b)';
    return 'var(--skipo-accent, #61afef)';
  };

  return (
    <BaseCard
      variant="surface"
      depth="sm"
      className={`skipo-log-viewer ${className}`}
      style={{
        border: '1px solid var(--skipo-border-color, #333)',
        backgroundColor: 'var(--skipo-surface, #1e1e24)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* Top Header with Copy Button */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 12px',
          borderBottom: '1px solid var(--skipo-border-color, #333)',
          backgroundColor: 'rgba(0, 0, 0, 0.25)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--skipo-text)' }}>
            {title}
          </span>
          <BaseBadge variant="neutral" style={{ fontSize: '10px', padding: '1px 6px' }}>
            {filteredLogs.length}
          </BaseBadge>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            onClick={() => setFilter(f => f === 'all' ? 'error' : f === 'error' ? 'warn' : 'all')}
            style={{
              background: 'none',
              border: '1px solid var(--skipo-border-color, #444)',
              borderRadius: '4px',
              color: 'var(--skipo-text-muted, #888)',
              fontSize: '10px',
              padding: '2px 6px',
              cursor: 'pointer'
            }}
          >
            Filter: {filter.toUpperCase()}
          </button>

          <BaseButton
            size="sm"
            variant={copied ? 'success' : 'secondary'}
            onClick={handleCopyAll}
            type="button"
            title="Copy Logs"
            aria-label="Copy Logs"
            style={{ fontSize: '10px', height: '22px', padding: '0 8px' }}
          >
            {copied ? 'Copied' : 'Copy'}
          </BaseButton>

          {onClear && (
            <BaseButton
              size="sm"
              variant="ghost"
              onClick={onClear}
              type="button"
              title="Clear"
              aria-label="Clear"
              style={{ fontSize: '10px', height: '22px', padding: '0 6px' }}
            >
              ✕
            </BaseButton>
          )}
        </div>
      </div>

      {/* Terminal Scroll Body */}
      <div
        ref={scrollRef}
        style={{
          maxHeight,
          overflowY: 'auto',
          padding: '8px 12px',
          fontFamily: 'var(--skipo-font-mono, monospace)',
          fontSize: '11px',
          lineHeight: '1.5',
          backgroundColor: 'var(--skipo-bg, #121214)',
          color: 'var(--skipo-text, #f1f5f9)'
        }}
      >
        {filteredLogs.length === 0 ? (
          <div style={{ color: 'var(--skipo-text-muted, #666)', fontStyle: 'italic', padding: '8px 0' }}>
            No log entries recorded.
          </div>
        ) : (
          filteredLogs.map(log => (
            <div key={log.id} style={{ display: 'flex', gap: '8px', wordBreak: 'break-all' }}>
              <span style={{ color: 'var(--skipo-text-muted, #555)', flexShrink: 0, fontSize: '10px' }}>
                {log.timestamp}
              </span>
              <span style={{ color: getLevelColor(log.level), fontWeight: 700, width: '42px', flexShrink: 0, fontSize: '10px' }}>
                [{log.level?.toUpperCase()}]
              </span>
              <span style={{ flex: 1 }}>{log.message}</span>
            </div>
          ))
        )}
      </div>
    </BaseCard>
  );
};
CopyableLogViewer.displayName = 'CopyableLogViewer';
