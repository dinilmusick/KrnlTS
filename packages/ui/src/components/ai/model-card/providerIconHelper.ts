/**
 * @file providerIconHelper.ts
 * @description Provider icon mapping for AI badges
 */

import { Cpu, Zap, CloudLightning, Gauge, Globe, Workflow, FolderHeart, HelpCircle, type LucideIcon } from 'lucide-react';

export const getProviderIcon = (provider: string): LucideIcon => {
  switch (provider.toLowerCase()) {
    case 'google': return CloudLightning;
    case 'groq': return Gauge;
    case 'cerebras': return Cpu;
    case 'openrouter': return Globe;
    case 'together': return Workflow;
    case 'nvidia': return Zap;
    case 'huggingface': return FolderHeart;
    default: return HelpCircle;
  }
};
