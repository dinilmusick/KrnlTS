// @generated - Static Palette & Color Presets
// ══════════════════════════════════════════════════════════════════════════════
// PALETTE DEFINITIONS & THEME TOKENS
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
  Cpu,
  Database,
  Cloud,
  Activity,
  GitBranch,
  LucideIcon,
} from 'lucide-react';

export interface ColorOption {
  id: string;
  name: string;
  hex: string;
}

export interface GroupVisualConfig {
  icon: React.ComponentType<{ className?: string }>;
  border: string;
  bg: string;
  text: string;
  badgeBg: string;
  badgeText: string;
  accentHex: string;
  glowColor: string;
}

export interface ServiceVisualConfig {
  icon: LucideIcon;
  badge: string;
  accentBorder: string;
  accentBg: string;
  accentText: string;
  glowColor: string;
  accentHex: string;
  brandIcon: React.ReactNode;
  tileBg: string;
}

export const GROUP_COLOR_PRESETS: ColorOption[] = [
  { id: 'sky', name: 'Sky Blue', hex: '#0ea5e9' },
  { id: 'cyan', name: 'Cyan', hex: '#06b6d4' },
  { id: 'blue', name: 'Blue', hex: '#3b82f6' },
  { id: 'indigo', name: 'Indigo', hex: '#6366f1' },
  { id: 'purple', name: 'Purple', hex: '#a855f7' },
  { id: 'fuchsia', name: 'Fuchsia', hex: '#d946ef' },
  { id: 'pink', name: 'Pink', hex: '#ec4899' },
  { id: 'rose', name: 'Rose', hex: '#f43f5e' },
  { id: 'red', name: 'Crimson', hex: '#ef4444' },
  { id: 'orange', name: 'Orange', hex: '#f97316' },
  { id: 'amber', name: 'Amber Gold', hex: '#f59e0b' },
  { id: 'yellow', name: 'Yellow', hex: '#eab308' },
  { id: 'lime', name: 'Lime', hex: '#84cc16' },
  { id: 'emerald', name: 'Emerald', hex: '#10b981' },
  { id: 'teal', name: 'Teal', hex: '#14b8a6' },
  { id: 'neutral', name: 'Slate Neutral', hex: '#94a3b8' },
];

export const TILE_COLOR_PRESETS: ColorOption[] = GROUP_COLOR_PRESETS;

export const GROUP_COLOR_MAP: Record<string, GroupVisualConfig> = {
  sky: {
    icon: Sparkles,
    border: 'border-sky-500/60',
    bg: 'bg-sky-950/30',
    text: 'text-sky-400',
    badgeBg: 'bg-sky-950',
    badgeText: 'text-sky-300 border-sky-800',
    accentHex: '#0ea5e9',
    glowColor: 'rgba(14, 165, 233, 0.25)',
  },
  cyan: {
    icon: Database,
    border: 'border-cyan-500/60',
    bg: 'bg-cyan-950/30',
    text: 'text-cyan-400',
    badgeBg: 'bg-cyan-950',
    badgeText: 'text-cyan-300 border-cyan-800',
    accentHex: '#06b6d4',
    glowColor: 'rgba(6, 182, 212, 0.25)',
  },
  blue: {
    icon: Cloud,
    border: 'border-blue-500/60',
    bg: 'bg-blue-950/30',
    text: 'text-blue-400',
    badgeBg: 'bg-blue-950',
    badgeText: 'text-blue-300 border-blue-800',
    accentHex: '#3b82f6',
    glowColor: 'rgba(59, 130, 246, 0.25)',
  },
  indigo: {
    icon: Activity,
    border: 'border-indigo-500/60',
    bg: 'bg-indigo-950/30',
    text: 'text-indigo-400',
    badgeBg: 'bg-indigo-950',
    badgeText: 'text-indigo-300 border-indigo-800',
    accentHex: '#6366f1',
    glowColor: 'rgba(99, 102, 241, 0.25)',
  },
  purple: {
    icon: AppWindow,
    border: 'border-purple-500/60',
    bg: 'bg-purple-950/30',
    text: 'text-purple-400',
    badgeBg: 'bg-purple-950',
    badgeText: 'text-purple-300 border-purple-800',
    accentHex: '#a855f7',
    glowColor: 'rgba(168, 85, 247, 0.25)',
  },
  fuchsia: {
    icon: Sparkles,
    border: 'border-fuchsia-500/60',
    bg: 'bg-fuchsia-950/30',
    text: 'text-fuchsia-400',
    badgeBg: 'bg-fuchsia-950',
    badgeText: 'text-fuchsia-300 border-fuchsia-800',
    accentHex: '#d946ef',
    glowColor: 'rgba(217, 70, 239, 0.25)',
  },
  pink: {
    icon: Box,
    border: 'border-pink-500/60',
    bg: 'bg-pink-950/30',
    text: 'text-pink-400',
    badgeBg: 'bg-pink-950',
    badgeText: 'text-pink-300 border-pink-800',
    accentHex: '#ec4899',
    glowColor: 'rgba(236, 72, 153, 0.25)',
  },
  rose: {
    icon: Shield,
    border: 'border-rose-500/60',
    bg: 'bg-rose-950/30',
    text: 'text-rose-400',
    badgeBg: 'bg-rose-950',
    badgeText: 'text-rose-300 border-rose-800',
    accentHex: '#f43f5e',
    glowColor: 'rgba(244, 63, 94, 0.25)',
  },
  red: {
    icon: Activity,
    border: 'border-red-500/60',
    bg: 'bg-red-950/30',
    text: 'text-red-400',
    badgeBg: 'bg-red-950',
    badgeText: 'text-red-300 border-red-800',
    accentHex: '#ef4444',
    glowColor: 'rgba(239, 68, 68, 0.25)',
  },
  orange: {
    icon: HardDrive,
    border: 'border-orange-500/60',
    bg: 'bg-orange-950/30',
    text: 'text-orange-400',
    badgeBg: 'bg-orange-950',
    badgeText: 'text-orange-300 border-orange-800',
    accentHex: '#f97316',
    glowColor: 'rgba(249, 115, 22, 0.25)',
  },
  amber: {
    icon: Sparkles,
    border: 'border-amber-500/60',
    bg: 'bg-amber-950/30',
    text: 'text-amber-400',
    badgeBg: 'bg-amber-950',
    badgeText: 'text-amber-300 border-amber-800',
    accentHex: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.25)',
  },
  yellow: {
    icon: Code,
    border: 'border-yellow-500/60',
    bg: 'bg-yellow-950/30',
    text: 'text-yellow-400',
    badgeBg: 'bg-yellow-950',
    badgeText: 'text-yellow-300 border-yellow-800',
    accentHex: '#eab308',
    glowColor: 'rgba(234, 179, 8, 0.25)',
  },
  lime: {
    icon: Cpu,
    border: 'border-lime-500/60',
    bg: 'bg-lime-950/30',
    text: 'text-lime-400',
    badgeBg: 'bg-lime-950',
    badgeText: 'text-lime-300 border-lime-800',
    accentHex: '#84cc16',
    glowColor: 'rgba(132, 204, 22, 0.25)',
  },
  emerald: {
    icon: GitBranch,
    border: 'border-emerald-500/60',
    bg: 'bg-emerald-950/30',
    text: 'text-emerald-400',
    badgeBg: 'bg-emerald-950',
    badgeText: 'text-emerald-300 border-emerald-800',
    accentHex: '#10b981',
    glowColor: 'rgba(16, 185, 129, 0.25)',
  },
  teal: {
    icon: Server,
    border: 'border-teal-500/60',
    bg: 'bg-teal-950/30',
    text: 'text-teal-400',
    badgeBg: 'bg-teal-950',
    badgeText: 'text-teal-300 border-teal-800',
    accentHex: '#14b8a6',
    glowColor: 'rgba(20, 184, 166, 0.25)',
  },
  neutral: {
    icon: Layers,
    border: 'border-neutral-700',
    bg: 'bg-neutral-900/40',
    text: 'text-neutral-300',
    badgeBg: 'bg-neutral-900',
    badgeText: 'text-neutral-400 border-neutral-800',
    accentHex: '#94a3b8',
    glowColor: 'rgba(148, 163, 184, 0.15)',
  },
};

export const GoogleAiStudioBrandSvg = React.createElement(
  'svg',
  { viewBox: '0 0 24 24', className: 'w-4 h-4 shrink-0 fill-sky-400' },
  React.createElement('path', {
    d: 'M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z',
  })
);

export const BackblazeBrandSvg = React.createElement(
  'svg',
  { viewBox: '0 0 24 24', className: 'w-4 h-4 shrink-0 fill-red-500' },
  React.createElement('path', {
    d: 'M17.6 13.5c-.5-1.5-1.4-2.9-2.5-4.1-1.3-1.4-2.8-2.6-3.8-4.2-.7-1.1-.9-2.5-1.3-3.7-.1-.3-.4-.5-.7-.4-.3.1-.4.4-.3.7.6 2.3 1.1 4.7 2.4 6.7 1 1.5 2.4 2.8 3.3 4.4 1 1.7.9 4-.2 5.6-1.1 1.6-3.1 2.3-5 1.9-1.9-.4-3.3-2.1-3.6-4-.3-2.1.5-4.2 1.6-5.9.2-.3.1-.7-.2-.9-.3-.2-.7-.1-.9.2-1.3 2-2.2 4.4-1.9 6.9.3 2.5 1.9 4.7 4.2 5.5 2.4.9 5.2.3 6.9-1.5 1.6-1.7 2-4.3 1.5-6.3z',
    fill: '#F25F22',
  }),
  React.createElement('path', {
    d: 'M13.8 15.5c-.3-.8-.8-1.5-1.4-2.1-.7-.7-1.5-1.3-2.1-2.1-.4-.6-.5-1.3-.7-1.9 0-.2-.2-.3-.4-.2s-.2.2-.2.4c.3 1.2.6 2.4 1.3 3.4.5.8 1.3 1.4 1.8 2.2.5.9.5 2-.1 2.8-.6.8-1.6 1.2-2.6 1-1-.2-1.7-1.1-1.9-2-.2-1.1.3-2.2.9-3.1.1-.1.1-.3-.1-.4s-.3-.1-.4.1c-.7 1-1.1 2.2-1 3.5.1 1.3 1 2.4 2.1 2.8 1.2.5 2.7.2 3.5-.8.9-.9 1-2.2.7-3.2z',
    fill: '#F52F57',
  })
);

export const GitHubBrandSvg = React.createElement(
  'svg',
  { viewBox: '0 0 24 24', className: 'w-4 h-4 shrink-0 fill-current text-neutral-100' },
  React.createElement('path', {
    d: 'M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.11.82-.26.82-.577v-2.234c-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.43.372.82 1.102.82 2.222v3.293c0 .319.22.694.825.576C20.565 21.795 24 17.3 24 12c0-6.63-5.37-12-12-12z',
  })
);

export const VercelBrandSvg = React.createElement(
  'svg',
  { viewBox: '0 0 24 24', className: 'w-4 h-4 shrink-0 fill-white' },
  React.createElement('path', { d: 'M12 1L24 22H0L12 1z' })
);

export const CloudflareBrandSvg = React.createElement(
  'svg',
  { viewBox: '0 0 24 24', className: 'w-4 h-4 shrink-0 fill-[#F38020]' },
  React.createElement('path', {
    d: 'M18.2 8.6A6 6 0 0 0 7.3 6.8 4.7 4.7 0 0 0 2 11.4a4.6 4.6 0 0 0 4.6 4.6h11.5a3.9 3.9 0 0 0 3.9-3.9 3.9 3.9 0 0 0-3.8-3.5z',
  })
);

export const DatabaseBrandSvg = React.createElement(
  'svg',
  { viewBox: '0 0 24 24', className: 'w-4 h-4 shrink-0 fill-cyan-400' },
  React.createElement('path', {
    d: 'M12 2C6.48 2 2 4.02 2 6.5s4.48 4.5 10 4.5 10-2.02 10-4.5S17.52 2 12 2zm0 15c-3.7 0-7.06-1.07-8.8-2.68V17c0 2.48 4.48 4.5 10 4.5s10-2.02 10-4.5v-2.68c-1.74 1.61-5.1 2.68-8.8 2.68zm0-5c-3.7 0-7.06-1.07-8.8-2.68V12c0 2.48 4.48 4.5 10 4.5s10-2.02 10-4.5v-2.68c-1.74 1.61-5.1 2.68-8.8 2.68z',
  })
);

export const CustomBrandSvg = React.createElement(
  'svg',
  { viewBox: '0 0 24 24', className: 'w-4 h-4 shrink-0 fill-amber-400' },
  React.createElement('path', {
    d: 'M12 2L2 22h20L12 2zm0 3.99L19.53 19H4.47L12 5.99zM11 11h2v4h-2zm0 5h2v2h-2z',
  })
);

export function getServiceVisualConfig(
  serviceId: string,
  providerType?: string,
  customColor?: string
): ServiceVisualConfig {
  const id = serviceId.toLowerCase();
  let base: ServiceVisualConfig;

  if (id.includes('google-ai-studio') || id.includes('aistudio')) {
    base = {
      icon: Sparkles,
      badge: 'Google AI Studio',
      accentBorder: 'border-sky-500/60',
      accentBg: 'bg-sky-950/40',
      accentText: 'text-sky-300',
      glowColor: 'rgba(14, 165, 233, 0.3)',
      accentHex: '#0ea5e9',
      brandIcon: GoogleAiStudioBrandSvg,
      tileBg: 'bg-[#0b162c]',
    };
  } else if (id.includes('gemini') || id.includes('ai') || providerType === 'AI_FOUNDATION') {
    base = {
      icon: Sparkles,
      badge: 'AI Foundation',
      accentBorder: 'border-purple-500/50',
      accentBg: 'bg-purple-950/40',
      accentText: 'text-purple-300',
      glowColor: 'rgba(168, 85, 247, 0.25)',
      accentHex: '#a855f7',
      brandIcon: GoogleAiStudioBrandSvg,
      tileBg: 'bg-[#1b122c]',
    };
  } else if (id.includes('backblaze') || id.includes('b2') || id.includes('storage') || providerType === 'STORAGE') {
    base = {
      icon: HardDrive,
      badge: 'Object Cloud',
      accentBorder: 'border-orange-500/50',
      accentBg: 'bg-orange-950/40',
      accentText: 'text-orange-300',
      glowColor: 'rgba(249, 115, 22, 0.25)',
      accentHex: '#f97316',
      brandIcon: BackblazeBrandSvg,
      tileBg: 'bg-[#29160f]',
    };
  } else if (id.includes('github') || id.includes('git') || id.includes('repo') || providerType === 'DEV_OPERATIONS') {
    base = {
      icon: GitBranch,
      badge: 'VCS & CI/CD',
      accentBorder: 'border-emerald-500/50',
      accentBg: 'bg-emerald-950/40',
      accentText: 'text-emerald-300',
      glowColor: 'rgba(16, 185, 129, 0.25)',
      accentHex: '#10b981',
      brandIcon: GitHubBrandSvg,
      tileBg: 'bg-[#101e16]',
    };
  } else if (id.includes('vercel') || id.includes('deploy')) {
    base = {
      icon: Server,
      badge: 'Vercel Cloud',
      accentBorder: 'border-neutral-400/50',
      accentBg: 'bg-neutral-900/60',
      accentText: 'text-neutral-100',
      glowColor: 'rgba(255, 255, 255, 0.2)',
      accentHex: '#f4f4f5',
      brandIcon: VercelBrandSvg,
      tileBg: 'bg-[#0f0f11]',
    };
  } else if (id.includes('cloudflare') || id.includes('worker') || id.includes('pages')) {
    base = {
      icon: Cloud,
      badge: 'Cloudflare',
      accentBorder: 'border-orange-500/60',
      accentBg: 'bg-orange-950/40',
      accentText: 'text-orange-400',
      glowColor: 'rgba(243, 128, 32, 0.3)',
      accentHex: '#F38020',
      brandIcon: CloudflareBrandSvg,
      tileBg: 'bg-[#1a120c]',
    };
  } else if (id.includes('database') || id.includes('sql') || id.includes('mongo') || id.includes('redis')) {
    base = {
      icon: Database,
      badge: 'Database',
      accentBorder: 'border-cyan-500/50',
      accentBg: 'bg-cyan-950/40',
      accentText: 'text-cyan-300',
      glowColor: 'rgba(6, 182, 212, 0.25)',
      accentHex: '#06b6d4',
      brandIcon: DatabaseBrandSvg,
      tileBg: 'bg-[#0b1c24]',
    };
  } else {
    base = {
      icon: Server,
      badge: 'Custom Service',
      accentBorder: 'border-amber-600/50',
      accentBg: 'bg-amber-950/30',
      accentText: 'text-amber-300',
      glowColor: 'rgba(245, 158, 11, 0.2)',
      accentHex: '#f59e0b',
      brandIcon: CustomBrandSvg,
      tileBg: 'bg-[#1c1917]',
    };
  }

  // Apply custom user-assigned color override if configured
  if (customColor) {
    const preset = TILE_COLOR_PRESETS.find((p) => p.id === customColor.toLowerCase() || p.hex.toLowerCase() === customColor.toLowerCase());
    const hex = preset ? preset.hex : (customColor.startsWith('#') ? customColor : base.accentHex);
    return {
      ...base,
      accentHex: hex,
      glowColor: `${hex}44`,
      accentText: `text-[${hex}]`,
      accentBorder: `border-[${hex}]/60`,
      accentBg: `bg-[${hex}]/20`,
    };
  }

  return base;
}
