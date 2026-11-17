/**
 * @file groupTabDefaults.ts
 * @description Default seed groups and tabs for organizing service accounts.
 * File size < 200 lines strictly.
 */

import { ServiceGroup, ServiceTab } from '../types/srkl';

export const DEFAULT_SERVICE_GROUPS: ServiceGroup[] = [
  {
    id: 'grp-ai',
    name: 'AI & Language Models',
    description: 'Gemini, Foundation Models & AI Workspaces',
    color: 'sky',
    icon: 'Sparkles',
    isDefault: true,
  },
  {
    id: 'grp-storage',
    name: 'Cloud Storage & Buckets',
    description: 'Backblaze B2, S3 & Object Repositories',
    color: 'amber',
    icon: 'HardDrive',
    isDefault: true,
  },
  {
    id: 'grp-code',
    name: 'Code Repositories & CI/CD',
    description: 'GitHub, Code Workspaces & Repos',
    color: 'emerald',
    icon: 'Code',
    isDefault: true,
  },
  {
    id: 'grp-applets',
    name: 'Custom & Web Applets',
    description: 'Google AI Studio, Applet Containers & Cloud Run',
    color: 'purple',
    icon: 'AppWindow',
    isDefault: true,
  },
  {
    id: 'grp-general',
    name: 'General Infrastructure',
    description: 'Uncategorized & Custom Service Interfaces',
    color: 'neutral',
    icon: 'Layers',
    isDefault: true,
  },
];

export const DEFAULT_SERVICE_TABS: ServiceTab[] = [
  {
    id: 'tab-all',
    name: 'All Services',
    description: 'Complete view of active service groups and service tiles',
    groupIds: ['grp-ai', 'grp-storage', 'grp-code', 'grp-applets', 'grp-general'],
    isDefault: true,
  },
  {
    id: 'tab-ai-applets',
    name: 'AI & Applets',
    description: 'Generative AI services and Google AI Studio applets',
    groupIds: ['grp-ai', 'grp-applets'],
  },
  {
    id: 'tab-cloud-dev',
    name: 'Cloud & Dev Stack',
    description: 'Object storage buckets and GitHub repositories',
    groupIds: ['grp-storage', 'grp-code', 'grp-general'],
  },
];

/**
 * Infer default group ID based on service ID if not explicitly assigned.
 */
export function inferDefaultGroupId(serviceId: string): string {
  const id = serviceId.toLowerCase();
  if (id.includes('gemini') || id.includes('openai') || id.includes('claude') || id.includes('ai')) {
    return 'grp-ai';
  }
  if (id.includes('backblaze') || id.includes('b2') || id.includes('s3') || id.includes('storage')) {
    return 'grp-storage';
  }
  if (id.includes('github') || id.includes('gitlab') || id.includes('git') || id.includes('repo') || id.includes('vercel') || id.includes('cloudflare') || id.includes('worker') || id.includes('pages')) {
    return 'grp-code';
  }
  if (id.includes('google-ai-studio') || id.includes('aistudio') || id.includes('applet')) {
    return 'grp-applets';
  }
  return 'grp-general';
}
