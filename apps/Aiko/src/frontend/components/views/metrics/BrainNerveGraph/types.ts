/**
 * ASCII Architecture Flowchart: types
 *
 *   ┌──────────────────────────────────────┐
 *   │           Initialize types           │
 *   └──────────────────────────────────────┘
 *                      │
 *                      ▼
 *   ┌──────────────────────────────────────┐
 *   │  Execute Component / Pipeline Logic  │
 *   └──────────────────────────────────────┘
 *                      │
 *                      ▼
 *   ┌──────────────────────────────────────┐
 *   │    Return State / Result Payload     │
 *   └──────────────────────────────────────┘
 */

import { RequestLogEntry } from '../../../../types/app.js';

// ════ TYPES & DOMAIN CONTRACTS ════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export interface BrainNerveGraphProps {
  logs: RequestLogEntry[];
}

export interface GraphNode {
  id: string;
  label: string;
  type: 'client' | 'model' | 'tool';
  x: number;
  y: number;
}

export interface GraphEdge {
  id: string;
  fromId: string;
  toId: string;
  type: 'request' | 'response' | 'tool-call' | 'tool-provider';
  label?: string;
  active: boolean;
  opacity: number;
}