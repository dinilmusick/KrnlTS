'use client';
import React, { forwardRef } from 'react';
import { BaseTooltip } from '../base/BaseTooltip.js';
import { BaseButton } from '../base/BaseButton.js';
import '../../styles/layout.css';

export interface TopToolbarTab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface TopToolbarProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  title?: React.ReactNode;
  logo?: React.ReactNode;
  tabs?: TopToolbarTab[];
  activeTabId?: string;
  onSelectTab?: (tabId: string) => void;
  actions?: React.ReactNode;
}

/**
 * TopToolbar — Universal single top toolbar for app title and flat tab navigation.
 * Nested tabs are strictly prohibited across all Skipo applications.
 */
export const TopToolbar = forwardRef<HTMLElement, TopToolbarProps>(({
  title,
  logo,
  tabs = [],
  activeTabId,
  onSelectTab,
  actions,
  className = '',
  ...props
}, ref) => {
  return (
    <header
      ref={ref}
      className={`skipo-top-toolbar ${className}`}
      style={{
        height: 'var(--skipo-top-toolbar-height, 44px)',
        minHeight: 'var(--skipo-top-toolbar-height, 44px)',
        background: 'var(--skipo-top-toolbar-bg, rgba(18, 20, 25, 0.95))',
        borderBottom: 'var(--skipo-border, 2px solid rgba(255, 255, 255, 0.85))',
        backdropFilter: 'var(--skipo-matte-blur, blur(20px))',
        WebkitBackdropFilter: 'var(--skipo-matte-blur, blur(20px))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 0.75rem',
        zIndex: 50,
        position: 'relative',
        userSelect: 'none',
      }}
      {...props}
    >
      {/* Brand & App Title */}
      <div
        className="skipo-top-toolbar__brand"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontFamily: 'var(--skipo-font)',
          fontWeight: 900,
          fontSize: '13px',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          flexShrink: 0,
        }}
      >
        {logo}
        {title && <span className="skipo-top-toolbar__title">{title}</span>}
      </div>

      {/* Flat Tabs Navigation (Strictly Flat — Zero Nested Tabs) */}
      {tabs.length > 0 && (
        <nav
          className="skipo-top-toolbar__tabs"
          role="tablist"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            overflowX: 'auto',
            height: '100%',
          }}
        >
          {tabs.map((tab) => {
            const isActive = tab.id === activeTabId;
            return (
              <BaseTooltip key={tab.id} content={`SWITCH VIEW: ${tab.label.toUpperCase()}`}>
                <BaseButton
                  role="tab"
                  size="sm"
                  aria-selected={isActive}
                  disabled={tab.disabled}
                  variant={isActive ? 'accent' : 'ghost'}
                  onClick={() => onSelectTab && onSelectTab(tab.id)}
                  className={`skipo-tab-item ${isActive ? 'skipo-tab-item--active' : ''}`}
                  style={{
                    height: '28px',
                    padding: '0 10px',
                    fontFamily: 'var(--skipo-font-mono)',
                    fontSize: '11px',
                    fontWeight: 800,
                    letterSpacing: '0.05em',
                  }}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </BaseButton>
              </BaseTooltip>
            );
          })}
        </nav>
      )}

      {/* Actions / Utilities on the right */}
      {actions && (
        <div
          className="skipo-top-toolbar__actions"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexShrink: 0,
          }}
        >
          {actions}
        </div>
      )}
    </header>
  );
});

TopToolbar.displayName = 'TopToolbar';
