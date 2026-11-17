/**
// ════ TYPES & DOMAIN CONTRACTS ════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

 * ASCII Architecture Flowchart: providerIconHelper
 *
 *   ┌─────────────────────────────────────┐
 *   │    Initialize providerIconHelper    │
 *   └─────────────────────────────────────┘
 */

import { Cpu, Zap, CloudLightning, Gauge, Globe, Workflow, FolderHeart, HelpCircle } from 'lucide-react';
import { ProviderId } from '../../../types/app.js';


// ════ PROVIDERICONHELPER IMPLEMENTATION ═══════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export const getProviderIcon = (provider: ProviderId) => {
  switch (provider) {
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