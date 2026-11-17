/**
 * ASCII Architecture Flowchart: relevanceFilter
 *
 *   ┌──────────────────────────────────┐
 *   │    Initialize relevanceFilter    │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │     calculateRelevanceScore      │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │            normQuery             │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │             normText             │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │  Return State / Result Payload   │
 *   └──────────────────────────────────┘
 */

// ══════════════════════════════════════════════════════════════════════════════════
// ════ RELEVANCE RANKING & SCOPE ISOLATION FILTER ══════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════════

import { MemoryEntry } from '../../types/memoryAndLearning.js';
import { Learning } from '../../types/tools.js';

export function calculateRelevanceScore(query: string, text: string): number {
  if (!query || !text) return 0;
  const normQuery = query.toLowerCase();
  const normText = text.toLowerCase();

  const words = normQuery.split(/\W+/).filter(w => w.length > 2);
  if (words.length === 0) return 1;

  let matches = 0;
  for (const word of words) {
    if (normText.includes(word)) matches++;
  }

  return matches / words.length;
}

export function filterRelevantMemories(
  query: string,
  memories: MemoryEntry[],
  maxTokens: number = 1000
): MemoryEntry[] {
  const scored = memories.map(entry => ({
    entry,
    score: calculateRelevanceScore(query, entry.content)
  }));

  scored.sort((a, b) => b.score - a.score);

  const selected: MemoryEntry[] = [];
  let currentTokenCount = 0;

  for (const { entry } of scored) {
    const entryTokens = estimateTokenCount(entry.content);
    if (currentTokenCount + entryTokens > maxTokens && selected.length > 0) {
      break;
    }
    selected.push(entry);
    currentTokenCount += entryTokens;
  }

  return selected;
}

export function filterRelevantLearnings(
  query: string,
  learnings: Learning[],
  maxTokens: number = 1000
): Learning[] {
  const scored = learnings.map(l => ({
    learning: l,
    score: calculateRelevanceScore(query, l.content)
  }));

  scored.sort((a, b) => b.score - a.score);

  const selected: Learning[] = [];
  let currentTokenCount = 0;

  for (const { learning } of scored) {
    const tokens = estimateTokenCount(learning.content);
    if (currentTokenCount + tokens > maxTokens && selected.length > 0) {
      break;
    }
    selected.push(learning);
    currentTokenCount += tokens;
  }

  return selected;
}

export function estimateTokenCount(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.trim().split(/\s+/).length * 1.3);
}