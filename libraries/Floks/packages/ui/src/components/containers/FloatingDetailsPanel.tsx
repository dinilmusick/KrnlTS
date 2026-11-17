'use client';
import type React from 'react';
import { IconOnlyButton } from '../composite/IconOnlyButton.js';
import { usePanelGeometry, type PanelGeometry, DEFAULT_PANEL_GEOMETRY } from './usePanelGeometry.js';
import { ResizeHandles } from './ResizeHandles.js';
import { usePanelInteraction } from './usePanelInteraction.js';
import '../../styles/details-panel.css';

export interface FloatingDetailsPanelProps {
  title: React.ReactNode;
  subtitle?: string;
  isOpen: boolean;
  onClose: () => void;
  isPinned?: boolean;
  onTogglePin?: () => void;
  storageKey?: string;
  defaultGeometry?: PanelGeometry;
  minWidth?: number;
  minHeight?: number;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const PIN_ICON = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="17" x2="12" y2="22" />
    <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a1 1 0 0 0 0-2H8a1 1 0 0 0 0 2h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
  </svg>
);

const CLOSE_ICON = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

function renderHeader(
  title: React.ReactNode,
  subtitle: string | undefined,
  isPinned: boolean,
  onTogglePin: (() => void) | undefined,
  onClose: () => void,
  headerActions: React.ReactNode,
  handleMouseDownHeader: (e: React.MouseEvent) => void
) {
  return (
    <div className="skipo-details-panel-header" onMouseDown={handleMouseDownHeader}>
      <div className="skipo-details-panel-title-group">
        <div className="skipo-details-panel-title">{title}</div>
        {subtitle && <div className="skipo-details-panel-subtitle">{subtitle}</div>}
      </div>
      <div className="skipo-details-panel-actions">
        {headerActions}
        {onTogglePin && (
          <IconOnlyButton
            icon={PIN_ICON}
            label={isPinned ? 'Unpin details panel' : 'Pin details panel'}
            active={isPinned}
            onClick={onTogglePin}
          />
        )}
        <IconOnlyButton icon={CLOSE_ICON} label="Close panel" onClick={onClose} />
      </div>
    </div>
  );
}

export function FloatingDetailsPanel({
  title,
  subtitle,
  isOpen,
  onClose,
  isPinned = false,
  onTogglePin,
  storageKey = 'skipo:details-panel:geometry',
  defaultGeometry = DEFAULT_PANEL_GEOMETRY,
  minWidth = 260,
  minHeight = 180,
  headerActions,
  children,
  className = ''
}: FloatingDetailsPanelProps) {
  const { geometry, updateGeometry } = usePanelGeometry(storageKey, defaultGeometry);
  const { isInteracting, handleMouseDownHeader, handleStartResize } = usePanelInteraction(geometry, updateGeometry, minWidth, minHeight);

  if (!isOpen) return null;

  return (
    <div
      className={`skipo-details-panel ${isInteracting ? 'is-dragging' : ''} ${className}`}
      style={{ left: `${geometry.x}px`, top: `${geometry.y}px`, width: `${geometry.width}px`, height: `${geometry.height}px` }}
    >
      <ResizeHandles onStartResize={handleStartResize} />
      {renderHeader(title, subtitle, isPinned, onTogglePin, onClose, headerActions, handleMouseDownHeader)}
      <div className="skipo-details-panel-body">{children}</div>
    </div>
  );
}
