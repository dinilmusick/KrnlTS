'use client';

export function TileCreateButton({ onClick }: { onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        border: '2px dashed rgba(255, 255, 255, 0.2)',
        borderRadius: '12px',
        padding: '16px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        cursor: 'pointer',
        minHeight: '100px',
        color: 'rgba(255, 255, 255, 0.5)',
        transition: 'all 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
        e.currentTarget.style.color = '#fff';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
        e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)';
      }}
    >
      <span style={{ fontSize: '32px' }}>+</span>
    </div>
  );
}
