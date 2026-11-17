// ══════════════════════════════════════════════════════════════════════════════
// FLOKS CANONICAL TOP BAR (frnlTopBar)
// Compliant with Skipo Standards: Breadcrumbs on left, icon-only tabs in middle,
// icon-only actions/settings/profile dropdown on right.
// ══════════════════════════════════════════════════════════════════════════════
import React, { useState, useRef, useEffect } from 'react';
import { useBottomStrip } from '../components/bottom-strip/index.js';

export interface FrnlBreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
}

export interface FrnlTopBarTab {
  id: string;
  label: string;
  icon: React.ReactNode;
  description?: string;
  disabled?: boolean;
}

export interface FrnlUserProfile {
  name?: string;
  username?: string;
  email?: string;
  role?: string;
  avatarGlyph?: string;
}

export interface FrnlTopBarProps {
  id?: string;
  breadcrumbs?: FrnlBreadcrumbItem[];
  appLogo?: React.ReactNode;
  appName?: string;
  tabs?: FrnlTopBarTab[];
  activeTabId?: string;
  onTabChange?: (tabId: string) => void;
  user?: FrnlUserProfile | null;
  onLogout?: () => void;
  onOpenSettings?: () => void;
  actions?: React.ReactNode;
  className?: string;
}

export const frnlTopBar: React.FC<FrnlTopBarProps> = ({
  id = 'frnl-top-bar',
  breadcrumbs = [],
  appLogo,
  appName,
  tabs = [],
  activeTabId,
  onTabChange,
  user,
  onLogout,
  onOpenSettings,
  actions,
  className = '',
}) => {
  const { setInspectionText } = useBottomStrip();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    if (profileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [profileOpen]);

  return (
    <header
      id={id}
      data-frnl-component="frnlTopBar"
      className={`h-11 border-b border-[var(--skipo-border-color,#334155)] bg-[var(--skipo-surface,#14171f)] px-3 flex items-center justify-between select-none shrink-0 font-mono text-xs z-40 relative ${className}`}
    >
      {/* ── Left: App Logo / Name & Hierarchical Breadcrumbs ── */}
      <div className="flex items-center gap-2 min-w-0">
        {appLogo ? (
          <div className="shrink-0 flex items-center justify-center">{appLogo}</div>
        ) : appName ? (
          <div
            className="w-6 h-6 rounded bg-[var(--skipo-accent,#38bdf8)] text-black font-black flex items-center justify-center text-xs shrink-0 cursor-default"
            onMouseEnter={() => setInspectionText(`APPLICATION: ${appName.toUpperCase()}`)}
            onMouseLeave={() => setInspectionText(null)}
          >
            {appName.slice(0, 2).toUpperCase()}
          </div>
        ) : null}

        {breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-[var(--skipo-text-muted,#94a3b8)]">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                {crumb.onClick ? (
                  <button
                    type="button"
                    onClick={crumb.onClick}
                    onMouseEnter={() => setInspectionText(`NAVIGATE: ${crumb.label.toUpperCase()}`)}
                    onMouseLeave={() => setInspectionText(null)}
                    className="hover:text-white transition-colors cursor-pointer truncate max-w-[140px]"
                  >
                    {crumb.label}
                  </button>
                ) : crumb.href ? (
                  <a
                    href={crumb.href}
                    onMouseEnter={() => setInspectionText(`NAVIGATE: ${crumb.label.toUpperCase()}`)}
                    onMouseLeave={() => setInspectionText(null)}
                    className="hover:text-white transition-colors truncate max-w-[140px]"
                  >
                    {crumb.label}
                  </a>
                ) : (
                  <span className="text-[var(--skipo-text-primary,#f8fafc)] font-semibold truncate max-w-[140px]">
                    {crumb.label}
                  </span>
                )}
                {idx < breadcrumbs.length - 1 && <span className="opacity-40">/</span>}
              </React.Fragment>
            ))}
          </nav>
        )}
      </div>

      {/* ── Center: Strictly Icon-Only Tab Buttons ── */}
      {tabs.length > 0 && (
        <nav
          role="tablist"
          className="flex items-center gap-1 bg-[var(--skipo-bg-panel,#0f172a)] p-0.5 rounded border border-[var(--skipo-border-subtle,#334155)]"
        >
          {tabs.map((tab) => {
            const isActive = tab.id === activeTabId;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                disabled={tab.disabled}
                onClick={() => onTabChange?.(tab.id)}
                onMouseEnter={() =>
                  setInspectionText(
                    `TAB: ${tab.label.toUpperCase()}`,
                    tab.description || `Switch view to ${tab.label}`
                  )
                }
                onMouseLeave={() => setInspectionText(null)}
                className={`p-1.5 rounded transition-all flex items-center justify-center cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                  isActive
                    ? 'bg-[var(--skipo-accent,#38bdf8)] text-black shadow-xs'
                    : 'text-[var(--skipo-text-muted,#94a3b8)] hover:text-white hover:bg-[var(--skipo-surface,#14171f)]'
                }`}
                aria-label={tab.label}
              >
                <span className="w-4 h-4 flex items-center justify-center">{tab.icon}</span>
              </button>
            );
          })}
        </nav>
      )}

      {/* ── Right: Custom Actions, Settings & Profile (Icon-Only Always) ── */}
      <div className="flex items-center gap-1.5 shrink-0">
        {actions}

        {/* Settings Button (Icons Only) */}
        {onOpenSettings && (
          <button
            type="button"
            onClick={onOpenSettings}
            onMouseEnter={() => setInspectionText('SETTINGS', 'Open system preferences, theme and configurations')}
            onMouseLeave={() => setInspectionText(null)}
            className="p-1.5 rounded border border-[var(--skipo-border-subtle,#334155)] bg-[var(--skipo-bg-panel,#0f172a)] text-[var(--skipo-text-muted,#94a3b8)] hover:text-white hover:border-[var(--skipo-accent,#38bdf8)] cursor-pointer transition-colors"
            aria-label="Settings"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        )}

        {/* Profile Button & Dropdown (Icons Only Trigger) */}
        {user && (
          <div className="relative" ref={profileMenuRef}>
            <button
              type="button"
              onClick={() => setProfileOpen((prev) => !prev)}
              onMouseEnter={() =>
                setInspectionText(
                  `USER: ${user.name || user.username || 'PROFILE'}`,
                  `Active session as ${user.email || user.username || 'user'}`
                )
              }
              onMouseLeave={() => setInspectionText(null)}
              className="w-7 h-7 rounded border border-[var(--skipo-border-subtle,#334155)] bg-[var(--skipo-bg-panel,#0f172a)] text-[var(--skipo-text-primary,#f8fafc)] hover:border-[var(--skipo-accent,#38bdf8)] flex items-center justify-center cursor-pointer transition-colors"
              aria-label="User Profile"
              aria-expanded={profileOpen}
            >
              <span>{user.avatarGlyph || '👤'}</span>
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-56 rounded border border-[var(--skipo-border-color,#334155)] bg-[var(--skipo-surface,#14171f)] p-3 shadow-xl z-50 flex flex-col gap-2.5 font-mono animate-fade-in">
                <div className="flex items-center gap-2 pb-2 border-b border-[var(--skipo-border-subtle,#334155)]">
                  <div className="w-8 h-8 rounded bg-[var(--skipo-bg-panel,#0f172a)] border border-[var(--skipo-border-subtle,#334155)] flex items-center justify-center text-sm">
                    {user.avatarGlyph || '👤'}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-[var(--skipo-text-primary,#f8fafc)] truncate text-xs">
                      {user.name || user.username || 'User'}
                    </span>
                    <span className="text-[10px] text-[var(--skipo-text-muted,#94a3b8)] truncate">
                      {user.email || `@${user.username || 'active'}`}
                    </span>
                  </div>
                </div>

                {user.role && (
                  <div className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--skipo-bg-panel,#0f172a)] border border-[var(--skipo-border-subtle,#334155)] text-[var(--skipo-accent,#38bdf8)] uppercase font-bold self-start">
                    ROLE: {user.role}
                  </div>
                )}

                {onLogout && (
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    <span>Sign Out</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

frnlTopBar.displayName = 'frnlTopBar';
