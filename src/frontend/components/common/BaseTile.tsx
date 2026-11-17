/**
 * @file BaseTile.tsx
 * @description Master parent component for tiled menu items adhering to Skipo protocols.
 * Displays monochromatic center icon, custom wrapped and auto-resized user titles,
 * and authentic service brand badges with sleek, thin-bezel borders and reduced padding.
 * File size < 200 lines strictly.
 */

import React, { useState } from 'react';
import { Tooltip } from './Tooltip';

export interface BaseTileProps {
  id: string;
  tooltip: string;
  icon: React.ReactNode;
  statusColor?: string;
  statusTooltip?: string;
  glowColor?: string;
  accentHex?: string;
  isSelected?: boolean;
  isDragging?: boolean;
  onDoubleClick?: () => void;
  onClick?: () => void;
  dragHandle?: React.ReactNode;
  hoverActions?: React.ReactNode;
  className?: string;
  title?: string;
  brandIcon?: React.ReactNode;
  bgColorClass?: string; // Custom background color depending on service type
}

export function BaseTile({
  id,
  tooltip,
  icon,
  statusColor = 'var(--skipo-success)',
  statusTooltip = 'Operational',
  glowColor = 'var(--skipo-accent-glow)',
  accentHex,
  isSelected = false,
  isDragging = false,
  onDoubleClick,
  onClick,
  dragHandle,
  hoverActions,
  className = '',
  title,
  brandIcon,
  bgColorClass = 'skipo-theme-surface',
}: BaseTileProps): React.ReactElement {
  const [isHovered, setIsHovered] = useState(false);

  // Dynamically calculate responsive font size based on title length for optimal wrapping
  const getFontSizeClass = (text?: string) => {
    if (!text) return 'text-[11px]';
    const len = text.length;
    if (len > 18) return 'text-[8px]';
    if (len > 12) return 'text-[9px]';
    return 'text-[10px]';
  };

  const borderColor = isSelected
    ? (accentHex || 'var(--skipo-accent)')
    : isHovered
    ? (accentHex || 'var(--skipo-accent)')
    : accentHex
    ? `${accentHex}60`
    : 'var(--skipo-border-color)';

  const boxShadow = isSelected
    ? `0 0 14px ${glowColor}, var(--skipo-shadow-hover)`
    : isHovered
    ? `0 0 10px ${glowColor}, var(--skipo-shadow-hover)`
    : glowColor
    ? `0 0 5px ${glowColor}, var(--skipo-shadow)`
    : 'var(--skipo-shadow)';

  return (
    <Tooltip content={tooltip} position="top">
      <div
        id={`tile-${id}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        className={`relative group w-36 h-36 flex flex-col items-center justify-between p-2 select-none cursor-pointer border transition-all duration-150 ${bgColorClass} ${
          isDragging ? 'opacity-40 scale-95' : 'opacity-100'
        } ${className}`}
        style={{
          backgroundColor: 'var(--skipo-surface)',
          borderColor,
          boxShadow,
          borderRadius: 'var(--skipo-radius)',
        }}
      >
        {/* Top bar: Status dot & (Brand Badge / Drag Handle) */}
        <div className="absolute top-2 inset-x-2 flex items-center justify-between z-10">
          <div className="flex items-center">
            <span
              className="w-2 h-2 rounded-full border shadow-sm"
              style={{
                backgroundColor: statusColor,
                borderColor: 'var(--skipo-border-color)',
                boxShadow: `0 0 6px ${statusColor}`,
              }}
              title={statusTooltip}
            />
          </div>

          <div className="flex items-center gap-1">
            {/* Authentic Brand Icon Badge */}
            {brandIcon && (
              <div 
                className="p-0.5 border rounded-xs shadow-sm flex items-center justify-center scale-90"
                style={{
                  backgroundColor: 'var(--skipo-matte-bg)',
                  borderColor: 'var(--skipo-border-color)',
                  color: 'var(--skipo-text)',
                }}
                title="Service Brand Identity"
              >
                {brandIcon}
              </div>
            )}

            {dragHandle && (
              <div
                className="transition-colors scale-90"
                style={{ color: 'var(--skipo-text-muted)' }}
              >
                {dragHandle}
              </div>
            )}
          </div>
        </div>

        {/* Center Content Group (Icon & Custom Title) */}
        <div className="flex-1 w-full flex flex-col items-center justify-center pt-4 pb-2">
          <div
            className="transition-all duration-200 group-hover:scale-105"
            style={{
              color: isHovered ? 'var(--skipo-accent)' : 'var(--skipo-text)',
            }}
          >
            {icon}
          </div>

          {title && (
            <div 
              className={`text-center font-mono font-bold mt-2 leading-tight w-full px-1 overflow-hidden select-none break-all text-ellipsis line-clamp-2 uppercase ${getFontSizeClass(title)}`}
              style={{ color: isHovered ? 'var(--skipo-accent)' : 'var(--skipo-text)' }}
            >
              {title}
            </div>
          )}
        </div>

        {/* Hover Action Dock */}
        {hoverActions && (
          <div
            className={`absolute bottom-2 inset-x-1.5 flex items-center justify-center gap-1 transition-all duration-150 ${
              isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1 pointer-events-none'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {hoverActions}
          </div>
        )}
      </div>
    </Tooltip>
  );
}
