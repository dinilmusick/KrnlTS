import type * as React from 'react';

export interface Transform {
  x: number;
  y: number;
  scale: number;
}

export interface CanvasItem {
  id: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  content: React.ReactNode;
}
