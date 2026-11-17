import type * as React from 'react';

export type DockPosition = 'top' | 'bottom' | 'left' | 'right';

export interface DockItemConfig {
  id: string;
  icon: string | React.ReactNode;
  label: string;
  badge?: number | string;
  onClick?: () => void;
}
