'use client';
import type { GhostNodeRecord } from '@floks/contracts';

export interface GhostNodeCardProps {
  ghostNode: GhostNodeRecord;
  isHovered?: boolean;
  onHover?: (id: string | null) => void;
  onSolidify?: (id: string) => void;
}

export function GhostNodeCard({
  ghostNode,
  isHovered = false,
  onHover,
  onSolidify
}: GhostNodeCardProps) {
  const width = ghostNode.size.width;
  const height = ghostNode.size.height;
  const ghostColor = 'var(--skipo-ghost, #00d9ff)';

  return (
    <div
      style={{
        position: 'absolute',
        left: ghostNode.position.x,
        top: ghostNode.position.y,
        width,
        height,
        pointerEvents: 'auto',
        zIndex: 4,
        userSelect: 'none'
      }}
      onMouseEnter={() => onHover?.(ghostNode.id)}
      onMouseLeave={() => onHover?.(null)}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          boxSizing: 'border-box',
          backgroundColor: 'rgba(20, 25, 30, 0.75)',
          border: `2px dashed ${ghostColor}`,
          borderRadius: '8px',
          opacity: isHovered ? 0.95 : 0.65,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          transition: 'opacity 0.15s ease, box-shadow 0.15s ease',
          boxShadow: isHovered ? '0 0 14px rgba(0, 217, 255, 0.4)' : 'none'
        }}
      >
        {/* Emblem Area */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0.8
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={ghostColor} strokeWidth="1.8">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        </div>

        {/* Label Footer */}
        <div
          style={{
            height: '32px',
            borderTop: '1px dashed rgba(0, 217, 255, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 8px',
            backgroundColor: 'rgba(0, 0, 0, 0.3)'
          }}
        >
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: ghostColor,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {ghostNode.label}
          </span>

          {onSolidify && (
            <button
              type="button"
              title="Solidify Node"
              aria-label="Solidify Node"
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                backgroundColor: ghostColor,
                border: 'none',
                color: '#0b1318',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                pointerEvents: 'auto'
              }}
              onClick={(e) => {
                e.stopPropagation();
                onSolidify(ghostNode.id);
              }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Input Sockets */}
      {ghostNode.inputs?.map((s, idx) => (
        <div
          key={s.id}
          style={{
            position: 'absolute',
            left: 0,
            top: `${((idx + 1) * height) / ((ghostNode.inputs?.length ?? 1) + 1)}px`,
            transform: 'translate(-50%, -50%)',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: ghostColor,
            border: '1px solid #14191e'
          }}
        />
      ))}

      {/* Output Sockets */}
      {ghostNode.outputs?.map((s, idx) => (
        <div
          key={s.id}
          style={{
            position: 'absolute',
            left: '100%',
            top: `${((idx + 1) * height) / ((ghostNode.outputs?.length ?? 1) + 1)}px`,
            transform: 'translate(-50%, -50%)',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: ghostColor,
            border: '1px solid #14191e'
          }}
        />
      ))}
    </div>
  );
}
