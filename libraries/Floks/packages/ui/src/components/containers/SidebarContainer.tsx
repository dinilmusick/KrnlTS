'use client';
import React, { forwardRef, useState } from 'react';
import { IconOnlyButton } from '../composite/IconOnlyButton.js';
import '../../styles/containers.css';

export interface SidebarContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  minWidth?: number;
  maxWidth?: number;
}

export const SidebarContainer = forwardRef<HTMLDivElement, SidebarContainerProps>(({
  minWidth = 200,
  maxWidth = 400,
  children,
  className = '',
  ...props
}, ref) => {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <aside ref={ref} style={{ width: collapsed ? 60 : minWidth, maxWidth }} className={`skipo-sidebar-container ${className}`} {...props}>
      <IconOnlyButton
        icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>}
        label={collapsed ? 'EXPAND SIDEBAR' : 'COLLAPSE SIDEBAR'}
        onClick={() => setCollapsed(!collapsed)}
      />
      {!collapsed && children}
    </aside>
  );
});
SidebarContainer.displayName = 'SidebarContainer';
