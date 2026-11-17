'use client';

// ══════════════════════════════════════════════════════════════════════════════
// IMPORTS & DEPENDENCIES
// ══════════════════════════════════════════════════════════════════════════════
import React from 'react';
import {
  Sparkles,
  HardDrive,
  Code,
  AppWindow,
  Layers,
  Folder,
  Box,
  Shield,
  Server,
  Database,
  Cloud,
  Activity,
} from 'lucide-react';
import {
  GroupVisualConfig,
  ColorOption,
  GROUP_COLOR_PRESETS,
  GROUP_COLOR_MAP,
} from '../palette';

export type { GroupVisualConfig, ColorOption };
export { GROUP_COLOR_PRESETS, GROUP_COLOR_MAP };

// ══════════════════════════════════════════════════════════════════════════════
// ICON OPTIONS
// ══════════════════════════════════════════════════════════════════════════════
export const GROUP_ICON_OPTIONS = [
  { id: 'Sparkles', name: 'AI / Sparkles', icon: Sparkles },
  { id: 'HardDrive', name: 'Storage / Drive', icon: HardDrive },
  { id: 'Code', name: 'Code / Dev', icon: Code },
  { id: 'AppWindow', name: 'Applets / Apps', icon: AppWindow },
  { id: 'Layers', name: 'Layers / General', icon: Layers },
  { id: 'Folder', name: 'Folder', icon: Folder },
  { id: 'Box', name: 'Box', icon: Box },
  { id: 'Shield', name: 'Shield', icon: Shield },
  { id: 'Server', name: 'Server', icon: Server },
  { id: 'Database', name: 'Database', icon: Database },
  { id: 'Cloud', name: 'Cloud', icon: Cloud },
  { id: 'Activity', name: 'Activity', icon: Activity },
];

// ══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ══════════════════════════════════════════════════════════════════════════════
export function getGroupVisual(color?: string, iconName?: string): GroupVisualConfig {
  let base: GroupVisualConfig;
  const c = (color || 'neutral').toLowerCase();

  if (GROUP_COLOR_MAP[c]) {
    base = GROUP_COLOR_MAP[c];
  } else if (c.startsWith('#') || c.startsWith('rgb')) {
    base = {
      icon: Layers,
      border: 'border-custom',
      bg: 'bg-custom',
      text: 'text-custom',
      badgeBg: 'bg-custom-badge',
      badgeText: 'text-custom-badge',
      accentHex: color || '#f59e0b',
      glowColor: `${color}40`,
    };
  } else {
    base = GROUP_COLOR_MAP.neutral;
  }

  if (iconName) {
    const found = GROUP_ICON_OPTIONS.find((i) => i.id === iconName);
    if (found) return { ...base, icon: found.icon };
  }
  return base;
}
