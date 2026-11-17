/**
 * ASCII Architecture Flowchart: learningEngine
 *
 *   ┌──────────────────────────────────┐
 *   │    Initialize learningEngine     │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │         sanitizedContent         │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │            memoryName            │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │              parts               │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │  Return State / Result Payload   │
 *   └──────────────────────────────────┘
 */

// ══════════════════════════════════════════════════════════════════════════════════
// ════ LEARNING & MEMORY PROMOTION ENGINE ══════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════════

import { MemoryStore } from '../../storage/memoryStore.js';
import { LearningStore } from '../../storage/learningStore.js';
import {
  LearningCandidate,
  ExecutionEventPayload,
  LearningScope
} from '../../types/memoryAndLearning.js';
import { sanitizeText } from './sanitizer.js';

export class LearningEngine {
  constructor(
    private readonly memoryStore: MemoryStore,
    private readonly learningStore: LearningStore
  ) {}

  async processCandidate(
    workspace: string,
    candidate: LearningCandidate,
    eventPayload?: ExecutionEventPayload
  ): Promise<{ promoted: boolean; reason?: string }> {
    const sanitizedContent = sanitizeText(candidate.content);
    if (!sanitizedContent) {
      return { promoted: false, reason: 'Empty or invalid content after sanitization' };
    }

    if (eventPayload?.type === 'FAILURE' && eventPayload.attempts === 1 && !eventPayload.userCorrection) {
      return { promoted: false, reason: 'Transient failure does not trigger automatic permanent learning' };
    }

    if (candidate.scope === 'AIKO') {
      const memoryName = candidate.target || 'aiko-learnings';
      await this.memoryStore.addEntry(workspace, memoryName, {
        content: sanitizedContent
      });
      return { promoted: true };
    }

    if (candidate.scope === 'TOOL') {
      await this.learningStore.addToolLearning(workspace, candidate.target, {
        content: sanitizedContent
      });
      return { promoted: true };
    }

    if (candidate.scope === 'FEATURE') {
      const parts = candidate.target.split('/');
      if (parts.length < 2) {
        return { promoted: false, reason: 'Feature target must be formatted as toolName/featureName' };
      }
      const [toolName, featureName] = parts;
      await this.learningStore.addFeatureLearning(workspace, toolName, featureName, {
        content: sanitizedContent
      });
      return { promoted: true };
    }

    return { promoted: false, reason: 'Unknown scope' };
  }

  async recordResolvedError(
    workspace: string,
    params: {
      scope: LearningScope;
      target: string;
      error: any;
      correction: any;
      details?: string;
    }
  ): Promise<{ recorded: boolean; content?: string }> {
    const errMsg = typeof params.error === 'string' ? params.error : params.error?.message || JSON.stringify(params.error);
    const corrMsg = typeof params.correction === 'string' ? params.correction : params.correction?.summary || JSON.stringify(params.correction);
    const text = `Resolved error [${errMsg}]: applied correction -> ${corrMsg}${params.details ? ` (${params.details})` : ''}`;

    const candidate: LearningCandidate = {
      scope: params.scope,
      target: params.target,
      content: text
    };

    try {
      const res = await this.processCandidate(workspace, candidate, { type: 'RETRY_SUCCESS' });
      return { recorded: res.promoted, content: candidate.content };
    } catch {
      return { recorded: false, content: candidate.content };
    }
  }

  async reScopeLearning(
    workspace: string,
    params: {
      currentScope: LearningScope;
      currentTarget: string;
      newScope: LearningScope;
      newTarget: string;
      content: string;
    }
  ): Promise<boolean> {
    const sanitized = sanitizeText(params.content);
    if (!sanitized) return false;

    // Remove from current scope
    if (params.currentScope === 'AIKO') {
      const entries = await this.memoryStore.getEntries(workspace, params.currentTarget || 'aiko-learnings');
      const targetEntry = entries.find(e => e.content.includes(sanitized) || sanitized.includes(e.content));
      if (targetEntry) {
        await this.memoryStore.deleteEntry(workspace, params.currentTarget || 'aiko-learnings', targetEntry.id);
      }
    } else if (params.currentScope === 'TOOL') {
      const learnings = await this.learningStore.getToolLearnings(workspace, params.currentTarget);
      const match = learnings.find(l => l.content.includes(sanitized) || sanitized.includes(l.content));
      if (match) {
        await this.learningStore.deleteToolLearning(workspace, params.currentTarget, match.id);
      }
    }

    // Add to new scope
    const addRes = await this.processCandidate(workspace, {
      scope: params.newScope,
      target: params.newTarget,
      content: sanitized
    });

    return addRes.promoted;
  }

  async processExecutionEvent(
    workspace: string,
    payload: ExecutionEventPayload,
    candidates: LearningCandidate[] = []
  ): Promise<string[]> {
    const promotedSummary: string[] = [];

    if (payload.userCorrection && payload.toolName) {
      const candidate: LearningCandidate = {
        scope: payload.featureName ? 'FEATURE' : 'TOOL',
        target: payload.featureName ? `${payload.toolName}/${payload.featureName}` : payload.toolName,
        content: `Correction applied: ${payload.userCorrection}`
      };
      const res = await this.processCandidate(workspace, candidate, payload);
      if (res.promoted) promotedSummary.push(candidate.content);
    }

    if (payload.type === 'RETRY_SUCCESS' && payload.toolName && payload.featureName) {
      const candidate: LearningCandidate = {
        scope: 'FEATURE',
        target: `${payload.toolName}/${payload.featureName}`,
        content: `Successful retry strategy after temporary error`
      };
      const res = await this.processCandidate(workspace, candidate, payload);
      if (res.promoted) promotedSummary.push(candidate.content);
    }

    for (const c of candidates) {
      const res = await this.processCandidate(workspace, c, payload);
      if (res.promoted) promotedSummary.push(c.content);
    }

    return promotedSummary;
  }
}