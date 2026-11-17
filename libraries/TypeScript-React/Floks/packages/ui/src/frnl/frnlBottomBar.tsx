// ══════════════════════════════════════════════════════════════════════════════
// FLOKS CANONICAL BOTTOM BAR (frnlBottomBar)
// Auto-save toggle & manual save on left, dynamic hover inspection in center,
// and API request history indicator on right.
// ══════════════════════════════════════════════════════════════════════════════
import React, { useState, useRef, useEffect } from 'react';
import { useBottomStrip } from '../components/bottom-strip/index.js';

export interface FrnlApiRequestLog {
  id: string;
  method: string;
  endpoint: string;
  status?: number;
  timestamp: number;
  durationMs?: number;
}

export interface FrnlBottomBarProps {
  id?: string;
  onManualSave?: () => Promise<void> | void;
  isSaving?: boolean;
  recentApiRequests?: FrnlApiRequestLog[];
  className?: string;
}

export const frnlBottomBar: React.FC<FrnlBottomBarProps> = ({
  id = 'frnl-bottom-bar',
  onManualSave,
  isSaving = false,
  recentApiRequests = [],
  className = '',
}) => {
  const {
    inspectionText,
    inspectionDescription,
    isDKeyPressed,
    autoSave,
    apiActivity,
    setInspectionText,
  } = useBottomStrip();

  const [apiPanelOpen, setApiPanelOpen] = useState(false);
  const apiPanelRef = useRef<HTMLDivElement>(null);

  // Close api drawer when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (apiPanelRef.current && !apiPanelRef.current.contains(e.target as Node)) {
        setApiPanelOpen(false);
      }
    };
    if (apiPanelOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [apiPanelOpen]);

  const showDescription = isDKeyPressed && Boolean(inspectionDescription);
  const displayText = showDescription
    ? inspectionDescription
    : inspectionText || 'HOVER UI ELEMENT // HOLD "D" TO INSPECT';

  return (
    <footer
      id={id}
      data-frnl-component="frnlBottomBar"
      className={`h-[30px] min-h-[30px] border-t border-[var(--skipo-border-color,#334155)] bg-[var(--skipo-surface,#14171f)] px-3 flex items-center justify-between select-none shrink-0 font-mono text-[11px] z-40 relative text-[var(--skipo-text-muted,#94a3b8)] ${className}`}
    >
      {/* ── Left: Auto-Save Toggle & Manual Save Button ── */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Auto Save Toggle Button */}
        <button
          type="button"
          onClick={() => autoSave.toggle()}
          onMouseEnter={() =>
            setInspectionText(
              autoSave.enabled ? 'AUTO-SAVE: ACTIVE' : 'AUTO-SAVE: PAUSED',
              autoSave.enabled
                ? 'Automatic background persistence active'
                : 'Changes require manual save'
            )
          }
          onMouseLeave={() => setInspectionText(null)}
          className={`flex items-center gap-1.5 px-2 py-0.5 rounded border transition-colors cursor-pointer ${
            autoSave.enabled
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
              : 'border-[var(--skipo-border-subtle,#334155)] bg-[var(--skipo-bg-panel,#0f172a)] text-[var(--skipo-text-muted,#64748b)]'
          }`}
          aria-label="Toggle Auto Save"
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              autoSave.enabled ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
            }`}
          />
          <span className="text-[10px] font-bold uppercase tracking-wider">
            {autoSave.enabled ? 'AUTO' : 'MANUAL'}
          </span>
        </button>

        {/* Manual Save Button */}
        {onManualSave && (
          <button
            type="button"
            disabled={isSaving}
            onClick={() => onManualSave()}
            onMouseEnter={() => setInspectionText('MANUAL SAVE', 'Trigger immediate persistence to disk / database')}
            onMouseLeave={() => setInspectionText(null)}
            className="flex items-center gap-1 px-2 py-0.5 rounded border border-[var(--skipo-border-subtle,#334155)] bg-[var(--skipo-bg-panel,#0f172a)] text-[var(--skipo-text-primary,#f8fafc)] hover:border-[var(--skipo-accent,#38bdf8)] hover:text-[var(--skipo-accent,#38bdf8)] transition-colors cursor-pointer disabled:opacity-40"
            aria-label="Save Now"
          >
            {isSaving ? (
              <span className="w-2.5 h-2.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
            )}
            <span className="text-[10px] font-bold uppercase tracking-wider">Save</span>
          </button>
        )}
      </div>

      {/* ── Center: Dynamic Hover Inspection (Laws L9, L18, L19 Exclusivity) ── */}
      <div className="flex-1 flex items-center justify-center px-4 overflow-hidden">
        <div
          data-testid="frnl-bottom-strip-center"
          className="flex items-center gap-1.5 truncate transition-all duration-150 max-w-2xl"
        >
          {showDescription && (
            <span className="px-1 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider bg-amber-400 text-black shrink-0">
              D-INSPECT
            </span>
          )}
          <span
            className={`truncate ${
              showDescription
                ? 'text-[11px] font-light italic text-[var(--skipo-text-primary,#f8fafc)]'
                : inspectionText
                ? 'text-xs font-bold text-[var(--skipo-accent,#38bdf8)]'
                : 'text-xs font-medium text-[var(--skipo-text-muted,#64748b)]'
            }`}
          >
            {displayText}
          </span>
        </div>
      </div>

      {/* ── Right: API Show/Hide Button with Recent Requests Log ── */}
      <div className="flex items-center gap-2 shrink-0 relative" ref={apiPanelRef}>
        <button
          type="button"
          onClick={() => setApiPanelOpen((prev) => !prev)}
          onMouseEnter={() =>
            setInspectionText(
              `API: ${apiActivity.activeCount} IN-FLIGHT`,
              'Toggle recent API requests inspector log'
            )
          }
          onMouseLeave={() => setInspectionText(null)}
          className={`flex items-center gap-1.5 px-2 py-0.5 rounded border transition-colors cursor-pointer ${
            apiActivity.activeCount > 0
              ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-400'
              : 'border-[var(--skipo-border-subtle,#334155)] bg-[var(--skipo-bg-panel,#0f172a)] text-[var(--skipo-text-muted,#94a3b8)] hover:text-white'
          }`}
          aria-label="API Requests"
          aria-expanded={apiPanelOpen}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={apiActivity.activeCount > 0 ? 'animate-pulse' : ''}
          >
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          <span className="text-[10px] font-bold uppercase tracking-wider">
            API {apiActivity.activeCount > 0 ? `(${apiActivity.activeCount})` : 'LOG'}
          </span>
        </button>

        {/* API Requests Drawer / Popover */}
        {apiPanelOpen && (
          <div className="absolute right-0 bottom-full mb-1.5 w-80 rounded border border-[var(--skipo-border-color,#334155)] bg-[var(--skipo-surface,#14171f)] p-3 shadow-2xl z-50 flex flex-col gap-2 font-mono text-xs animate-fade-in max-h-72 overflow-hidden">
            <div className="flex items-center justify-between pb-1.5 border-b border-[var(--skipo-border-subtle,#334155)]">
              <span className="font-bold text-[var(--skipo-text-primary,#f8fafc)] uppercase text-[10px] tracking-wider">
                Recent API Requests
              </span>
              <span className="text-[10px] text-[var(--skipo-accent,#38bdf8)] font-bold">
                {apiActivity.activeCount} In-Flight
              </span>
            </div>

            <div className="overflow-y-auto max-h-52 flex flex-col gap-1.5 pr-1">
              {recentApiRequests.length > 0 ? (
                recentApiRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-1.5 rounded bg-[var(--skipo-bg-panel,#0f172a)] border border-[var(--skipo-border-subtle,#334155)] flex items-center justify-between text-[10px]"
                  >
                    <div className="flex items-center gap-1.5 truncate mr-2">
                      <span className="font-bold text-[var(--skipo-accent,#38bdf8)]">{req.method}</span>
                      <span className="truncate text-[var(--skipo-text-primary,#f8fafc)]">{req.endpoint}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {req.status && (
                        <span
                          className={`font-bold ${
                            req.status < 400 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {req.status}
                        </span>
                      )}
                      {req.durationMs !== undefined && (
                        <span className="text-[var(--skipo-text-muted,#64748b)]">
                          {req.durationMs}ms
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-4 text-center text-[var(--skipo-text-muted,#64748b)] text-[10px]">
                  No recent backend requests recorded.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </footer>
  );
};

frnlBottomBar.displayName = 'frnlBottomBar';
