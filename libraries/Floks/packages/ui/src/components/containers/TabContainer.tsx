'use client';
import React, { forwardRef, useState } from 'react';
import { BaseButton } from '../base/BaseButton.js';
import { BaseTooltip } from '../base/BaseTooltip.js';
import '../../styles/containers.css';

export interface TabContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  tabs: { id: string; label: string; content: React.ReactNode }[];
}

export const TabContainer = forwardRef<HTMLDivElement, TabContainerProps>(({
  tabs,
  className = '',
  ...props
}, ref) => {
  const [activeTab, setActiveTab] = useState(tabs[0]?.id);
  return (
    <div ref={ref} className={`skipo-tab-container ${className}`} {...props}>
      <div className="skipo-tab-list">
        {tabs.map(tab => (
          <BaseTooltip key={tab.id} content={`SELECT TAB: ${tab.label.toUpperCase()}`}>
            <BaseButton
              size="sm"
              variant={tab.id === activeTab ? 'accent' : 'ghost'}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </BaseButton>
          </BaseTooltip>
        ))}
      </div>
      <div className="skipo-tab-panel">
        {tabs.find(t => t.id === activeTab)?.content}
      </div>
    </div>
  );
});

TabContainer.displayName = 'TabContainer';
