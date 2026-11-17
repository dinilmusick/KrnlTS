/**
 * ASCII Architecture Flowchart: contextBuilder
 *
 *   ┌──────────────────────────────────┐
 *   │    Initialize contextBuilder     │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │           maxMemTokens           │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │          maxLearnTokens          │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │           allMemories            │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │  Return State / Result Payload   │
 *   └──────────────────────────────────┘
 */

// ══════════════════════════════════════════════════════════════════════════════════
// ════ AGENT CONTEXT BUILDER & SCOPED LEARNING RETRIEVAL ═══════════════════════════
// ══════════════════════════════════════════════════════════════════════════════════

import { MemoryStore } from '../../storage/memoryStore.js';
import { LearningStore } from '../../storage/learningStore.js';
import { ContextOptions, RelevantContext } from '../../types/memoryAndLearning.js';
import { filterRelevantMemories, filterRelevantLearnings } from './relevanceFilter.js';
import { sanitizeText, formatAsNumberedList } from './sanitizer.js';

export class AgentContextBuilder {
  constructor(
    private readonly memoryStore: MemoryStore,
    private readonly learningStore: LearningStore
  ) {}

  async buildAikoContext(
    workspace: string,
    query: string,
    options?: ContextOptions
  ): Promise<RelevantContext> {
    const maxMemTokens = options?.maxMemoryTokens ?? 1000;
    const maxLearnTokens = options?.maxLearningTokens ?? 1000;

    const allMemories = await this.memoryStore.list(workspace);
    const flatEntries = allMemories.flatMap(m => m.entries || []);
    const relevantMemories = filterRelevantMemories(query, flatEntries, maxMemTokens);

    const formattedMems = relevantMemories.map(m => sanitizeText(m.content));
    const formattedText = formattedMems.length > 0
      ? `[WORKSPACE MEMORIES]\n${formatAsNumberedList(formattedMems)}`
      : '';

    return {
      memories: relevantMemories,
      toolLearnings: [],
      featureLearnings: [],
      formattedText
    };
  }

  async buildToolContext(
    workspace: string,
    toolName: string,
    query: string,
    options?: ContextOptions
  ): Promise<RelevantContext> {
    const maxMemTokens = options?.maxMemoryTokens ?? 1000;
    const maxLearnTokens = options?.maxLearningTokens ?? 1000;

    const toolLearnings = await this.learningStore.getToolLearnings(workspace, toolName);
    const relToolLearnings = filterRelevantLearnings(query, toolLearnings, maxLearnTokens);

    const allMemories = await this.memoryStore.list(workspace);
    const flatEntries = allMemories.flatMap(m => m.entries || []);
    const relMemories = filterRelevantMemories(query, flatEntries, maxMemTokens);

    const lines: string[] = [];
    if (relToolLearnings.length > 0) {
      lines.push(`[TOOL LEARNINGS: @${toolName}]\n${formatAsNumberedList(relToolLearnings.map(l => l.content))}`);
    }
    if (relMemories.length > 0) {
      lines.push(`[WORKSPACE MEMORIES]\n${formatAsNumberedList(relMemories.map(m => m.content))}`);
    }

    return {
      memories: relMemories,
      toolLearnings: relToolLearnings,
      featureLearnings: [],
      formattedText: lines.join('\n\n')
    };
  }

  async buildEndpointContext(
    workspace: string,
    toolName: string,
    featureName: string,
    task: string,
    options?: ContextOptions
  ): Promise<RelevantContext> {
    const maxMemTokens = options?.maxMemoryTokens ?? 500;
    const maxLearnTokens = options?.maxLearningTokens ?? 1000;

    const featLearnings = await this.learningStore.getFeatureLearnings(workspace, toolName, featureName);
    const relFeatLearnings = filterRelevantLearnings(task, featLearnings, maxLearnTokens);

    const toolLearnings = await this.learningStore.getToolLearnings(workspace, toolName);
    const relToolLearnings = filterRelevantLearnings(task, toolLearnings, maxLearnTokens / 2);

    const allMemories = await this.memoryStore.list(workspace);
    const flatEntries = allMemories.flatMap(m => m.entries || []);
    const relMemories = filterRelevantMemories(task, flatEntries, maxMemTokens);

    const lines: string[] = [];
    if (relFeatLearnings.length > 0) {
      lines.push(`[FEATURE LEARNINGS: ${featureName}]\n${formatAsNumberedList(relFeatLearnings.map(l => l.content))}`);
    }
    if (relToolLearnings.length > 0) {
      lines.push(`[TOOL LEARNINGS: @${toolName}]\n${formatAsNumberedList(relToolLearnings.map(l => l.content))}`);
    }
    if (relMemories.length > 0) {
      lines.push(`[WORKSPACE MEMORIES]\n${formatAsNumberedList(relMemories.map(m => m.content))}`);
    }

    return {
      memories: relMemories,
      toolLearnings: relToolLearnings,
      featureLearnings: relFeatLearnings,
      formattedText: lines.join('\n\n')
    };
  }
}