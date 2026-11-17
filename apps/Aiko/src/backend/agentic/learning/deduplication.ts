/**
 * ASCII Architecture Flowchart: deduplication
 *
 *   ┌──────────────────────────────────┐
 *   │     Initialize deduplication     │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │         normalizeContent         │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │         isExactDuplicate         │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │             normNew              │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │  Return State / Result Payload   │
 *   └──────────────────────────────────┘
 */

// ══════════════════════════════════════════════════════════════════════════════════
// ════ DEDUPLICATION & CONTRADICTION RESOLUTION ENGINE ══════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════════

import { Learning } from '../../types/tools.js';

export function normalizeContent(content: string): string {
  return content
    .toLowerCase()
    .replace(/^(?:\d+[\.\)]|\*|-|\+)\s*/, '')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isExactDuplicate(newContent: string, existingLearnings: Learning[]): boolean {
  const normNew = normalizeContent(newContent);
  return existingLearnings.some(l => normalizeContent(l.content) === normNew);
}

export function findContradictionIndex(newContent: string, existingLearnings: Learning[]): number {
  const normNew = normalizeContent(newContent);
  // Key topic matching e.g. "auth header", "timeout", "endpoint URL"
  const topicKeywords = extractKeywords(normNew);
  if (topicKeywords.length === 0) return -1;

  for (let i = 0; i < existingLearnings.length; i++) {
    const normExisting = normalizeContent(existingLearnings[i].content);
    const existingKeywords = extractKeywords(normExisting);

    const overlap = topicKeywords.filter(k => existingKeywords.includes(k));
    if (overlap.length >= 2 && normExisting !== normNew) {
      // Direct topic conflict detected -> newer confirmed observation supersedes
      return i;
    }
  }
  return -1;
}

function extractKeywords(normStr: string): string[] {
  const stopwords = new Set(['use', 'the', 'for', 'with', 'and', 'when', 'a', 'an', 'in', 'on', 'to', 'must', 'should', 'is', 'are', 'not', 'no']);
  return normStr.split(' ').filter(w => w.length > 3 && !stopwords.has(w));
}

export function mergeAndDeduplicateLearnings(
  existingLearnings: Learning[],
  newContent: string,
  newId?: string
): Learning[] {
  if (isExactDuplicate(newContent, existingLearnings)) {
    return existingLearnings;
  }

  const contradictionIdx = findContradictionIndex(newContent, existingLearnings);
  const targetId = newId || `learn-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  if (contradictionIdx !== -1) {
    // Supersede contradicted learning, retaining stable ID if replacing
    const updated = [...existingLearnings];
    const oldId = updated[contradictionIdx].id;
    updated[contradictionIdx] = { id: oldId, content: newContent };
    return updated;
  }

  return [...existingLearnings, { id: targetId, content: newContent }];
}