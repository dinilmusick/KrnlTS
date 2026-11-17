'use client';
import React, { forwardRef } from 'react';
import { useBottomStrip } from './BottomStripContext.js';
import { StatusLight } from './StatusLight.js';
import { AutoSaveToggle } from './AutoSaveToggle.js';
import { ApiCallIndicator } from './ApiCallIndicator.js';
import { SystemMessageDisplay } from './SystemMessageDisplay.js';

export interface BottomStripProps extends React.HTMLAttributes<HTMLElement> {
  leftSlot?: React.ReactNode;
  centerSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
  hideDefaultLeft?: boolean;
  hideDefaultRight?: boolean;
}

export const BottomStrip = forwardRef<HTMLElement, BottomStripProps>(({
  leftSlot,
  centerSlot,
  rightSlot,
  hideDefaultLeft = false,
  hideDefaultRight = false,
  className = '',
  ...props
}, ref) => {
  const { inspectionText, inspectionDescription, isDKeyPressed } = useBottomStrip();
  const showDescription = Boolean(isDKeyPressed && inspectionDescription);
  const activeText = showDescription ? inspectionDescription : inspectionText;

  return (
    <footer
      ref={ref}
      className={`skipo-bottom-strip ${className}`}
      style={{
        height: 'var(--skipo-bottom-strip-height, 30px)',
        minHeight: 'var(--skipo-bottom-strip-height, 30px)',
        background: 'var(--skipo-bottom-strip-bg, rgba(15, 17, 21, 0.95))',
        borderTop: 'var(--skipo-border, 2px solid rgba(255, 255, 255, 0.85))',
        backdropFilter: 'var(--skipo-matte-blur, blur(20px))',
        WebkitBackdropFilter: 'var(--skipo-matte-blur, blur(20px))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 0.75rem',
        fontSize: '11px',
        fontFamily: 'var(--skipo-font-mono)',
        zIndex: 40,
        position: 'relative',
        userSelect: 'none',
      }}
      {...props}
    >
      {/* Left Slot: Status light, auto-save toggle, etc. */}
      <div
        className="skipo-bottom-strip__left"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          flexShrink: 0,
          minWidth: '120px',
        }}
      >
        {!hideDefaultLeft && (
          <>
            <StatusLight />
            <AutoSaveToggle />
          </>
        )}
        {leftSlot}
      </div>

      {/* Center Slot: Exclusively reserved for dynamic hover inspection labels with full visibility */}
      <div
        className="skipo-bottom-strip__center"
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          padding: '0 0.5rem',
          pointerEvents: 'none',
          textAlign: 'center',
        }}
      >
        {centerSlot || (
          <span
            className="skipo-inspection-text"
            data-mode={showDescription ? 'description' : 'label'}
            style={{
              color: 'var(--skipo-inspection-text-color, rgba(241, 245, 249, 0.85))',
              fontSize: showDescription ? '10px' : 'clamp(8px, 1.1vw, 11px)',
              lineHeight: 1.15,
              fontWeight: showDescription ? 300 : 700,
              textTransform: showDescription ? 'none' : 'uppercase',
              letterSpacing: showDescription ? '0.01em' : '0.04em',
              whiteSpace: 'normal',
              wordBreak: 'break-word',
              overflowWrap: 'anywhere',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              maxHeight: '100%',
              opacity: activeText ? 0.9 : 0,
              transform: activeText ? 'translateY(0)' : 'translateY(1px)',
              transition: 'opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1), transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {activeText || ''}
          </span>
        )}
      </div>

      {/* Right Slot: API activity & system messages */}
      <div
        className="skipo-bottom-strip__right"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: '12px',
          flexShrink: 0,
          minWidth: '140px',
        }}
      >
        {rightSlot}
        {!hideDefaultRight && (
          <>
            <ApiCallIndicator />
            <SystemMessageDisplay />
          </>
        )}
      </div>
    </footer>
  );
});

BottomStrip.displayName = 'BottomStrip';
