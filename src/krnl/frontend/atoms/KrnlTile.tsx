import React from 'react';

export interface KrnlTileProps {
  title: string;
  value: React.ReactNode;
  subtitle?: string;
  badge?: string;
}

export const KrnlTile: React.FC<KrnlTileProps> = ({
  title,
  value,
  subtitle,
  badge
}) => {
  return (
    <div className="krnl-tile">
      <div className="krnl-tile-header">
        <span className="krnl-tile-title">{title}</span>
        {badge && <span className="krnl-tile-badge">{badge}</span>}
      </div>
      <div className="krnl-tile-value">{value}</div>
      {subtitle && <div className="krnl-tile-subtitle">{subtitle}</div>}
    </div>
  );
};
