// ══════════════════════════════════════════════════════════════════════════════
// FLOKS CANONICAL TAB WINDOW (frnlTabWindow)
// Strictly flat tab navigation and content pane manager
// ══════════════════════════════════════════════════════════════════════════════
import React, { useMemo, useState } from 'react';
import { defineFrnlComponent } from '@ultrst-armada/frnlts';
import { useFrnlComponent } from '@ultrst-armada/frnlts/react';
import { useFloksFrnlStore } from './store.js';
import { frnlButton } from './frnlButton.js';
import { useBottomStrip } from '../components/bottom-strip/index.js';

export interface FrnlTabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  description?: string;
  disabled?: boolean;
  content?: React.ReactNode;
}

export const frnlTabWindowDefinition = defineFrnlComponent({
  name: 'frnlTabWindow',
  states: {
    active: {
      name: 'active',
      events: { selectTab: { functionId: 'frnlTabWindow.selectTab' } },
      visualParameters: {},
      phases: { sustainPhase: { visualDefinition: { parameters: {} } } },
    },
  },
});

export interface FrnlTabWindowProps {
  id?: string;
  tabs: FrnlTabItem[];
  activeTabId?: string;
  onTabChange?: (tabId: string) => void;
  className?: string;
  children?: React.ReactNode;
}

export const frnlTabWindow: React.FC<FrnlTabWindowProps> = ({
  id = 'frnl-tab-window',
  tabs,
  activeTabId,
  onTabChange,
  className = '',
  children,
}) => {
  const store = useFloksFrnlStore();
  const [internalActiveTab, setInternalActiveTab] = useState(tabs[0]?.id);
  const resolvedId = id;
  const activeId = activeTabId ?? internalActiveTab;
  const handlers = useMemo(() => ({
    'frnlTabWindow.selectTab': (payload: unknown) => {
      if (typeof payload !== 'string') throw new TypeError('selectTab expects a tab id');
      const tab = tabs.find((item) => item.id === payload);
      if (!tab || tab.disabled) throw new Error('Unknown or disabled tab: ' + payload);
      handleSelect(tab);
    },
  }), [tabs, onTabChange]);
  const semanticProperties = useMemo(
    () => ({
      activeTabId: activeId,
      tabs: tabs.map((tab) => ({ id: tab.id, label: tab.label, disabled: Boolean(tab.disabled) })),
    }),
    [activeId, tabs],
  );

  useFrnlComponent({
    id: resolvedId,
    definition: frnlTabWindowDefinition,
    store,
    state: 'active',
    properties: semanticProperties,
    handlers,
  });
  const { setInspectionText } = useBottomStrip();

  function handleSelect(tab: FrnlTabItem) {
    if (tab.disabled) return;
    if (onTabChange) onTabChange(tab.id);
    else setInternalActiveTab(tab.id);
  }

  const currentTab = tabs.find((t) => t.id === activeId);

  return (
    <div
      id={id}
      data-frnl-component="frnlTabWindow"
      className={`flex flex-col w-full h-full min-h-0 bg-[var(--skipo-bg,#0a0c10)] text-[var(--skipo-text-primary,#f8fafc)] font-mono ${className}`}
    >
      {/* Flat Tab Bar (Zero Nested Tabs) */}
      <div className="h-10 border-b border-[var(--skipo-border-color,#334155)] bg-[var(--skipo-surface,#14171f)] px-3 flex items-center gap-1 shrink-0 select-none overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = tab.id === activeId;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              disabled={tab.disabled}
              onClick={() => handleSelect(tab)}
              onMouseEnter={() => {
                if (tab.label || tab.description) {
                  setInspectionText(
                    `TAB: ${tab.label.toUpperCase()}`,
                    tab.description || `Switch to ${tab.label} tab view`
                  );
                }
              }}
              onMouseLeave={() => setInspectionText(null)}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                isActive
                  ? 'bg-[var(--skipo-bg-panel,#0f172a)] text-[var(--skipo-accent,#38bdf8)] border border-[var(--skipo-border-subtle,#334155)]'
                  : 'text-[var(--skipo-text-muted,#94a3b8)] hover:text-white hover:bg-[var(--skipo-bg-subtle,#1e293b)] border border-transparent'
              }`}
            >
              {tab.icon && <span className="w-3.5 h-3.5 shrink-0 flex items-center">{tab.icon}</span>}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content Viewport */}
      <div className="flex-1 overflow-auto p-4 min-h-0 relative">
        {currentTab?.content ?? children}
      </div>
    </div>
  );
};

frnlTabWindow.displayName = 'frnlTabWindow';
