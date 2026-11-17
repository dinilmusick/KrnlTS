/**
 * ASCII Architecture Flowchart: memoryStore
 *
 *   ┌──────────────────────────────────┐
 *   │      Initialize memoryStore      │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │              files               │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │             results              │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │                f                 │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │  Return State / Result Payload   │
 *   └──────────────────────────────────┘
 */

// ══════════════════════════════════════════════════════════════════════════════════
// ════ WORKSPACE MEMORY PERSISTENCE STORE ══════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════════

import { WorkspaceStorage, normalizeName } from './workspaceStorage.js';
import { Memory, MemoryEntry } from '../types/memoryAndLearning.js';
import { sanitizeText } from '../agentic/learning/sanitizer.js';

export class MemoryStore {
  constructor(private readonly storage: WorkspaceStorage) {}

  async list(workspace: string): Promise<Memory[]> {
    const files = await this.storage.list(`${workspace}/memories`);
    const results: Memory[] = [];
    for (const f of files) {
      if (f.endsWith('.json')) {
        const name = f.replace(/\.json$/, '');
        const mem = await this.get(workspace, name);
        if (mem) results.push(mem);
      }
    }
    return results;
  }

  async get(workspace: string, name: string): Promise<Memory | null> {
    const norm = normalizeName(name);
    const file = `${workspace}/memories/${norm}.json`;
    if (!(await this.storage.exists(file))) return null;
    const raw = await this.storage.read(file);
    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed === 'object' && parsed.entries) {
        return parsed as Memory;
      }
      // Migration fallback for legacy simple MemoryEntry
      return {
        schemaVersion: parsed.schemaVersion || '1.0.0',
        name: parsed.name || norm,
        entries: [{
          id: 'legacy-entry-1',
          content: sanitizeText(parsed.content || ''),
          createdAt: Date.now()
        }]
      };
    } catch {
      return null;
    }
  }

  async save(workspace: string, memory: Memory): Promise<void> {
    if (!memory.name || !memory.name.trim()) throw new Error('Memory name is required');
    const norm = normalizeName(memory.name);
    const file = `${workspace}/memories/${norm}.json`;

    const sanitizedMemory: Memory = {
      schemaVersion: memory.schemaVersion || '1.0.0',
      name: memory.name,
      description: memory.description,
      entries: (memory.entries || []).map(e => ({
        id: e.id || `entry-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        content: sanitizeText(e.content),
        createdAt: e.createdAt || Date.now(),
        updatedAt: e.updatedAt,
        tags: e.tags
      }))
    };

    await this.storage.write(file, JSON.stringify(sanitizedMemory, null, 2));
  }

  async delete(workspace: string, name: string): Promise<void> {
    const norm = normalizeName(name);
    await this.storage.delete(`${workspace}/memories/${norm}.json`);
  }

  async addEntry(
    workspace: string,
    memoryName: string,
    entryInput: { id?: string; content: string; tags?: string[] }
  ): Promise<MemoryEntry> {
    let memory = await this.get(workspace, memoryName);
    if (!memory) {
      memory = {
        schemaVersion: '1.0.0',
        name: memoryName,
        entries: []
      };
    }

    const newEntry: MemoryEntry = {
      id: entryInput.id || `entry-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      content: sanitizeText(entryInput.content),
      createdAt: Date.now(),
      tags: entryInput.tags
    };

    memory.entries.push(newEntry);
    await this.save(workspace, memory);
    return newEntry;
  }

  async updateEntry(workspace: string, memoryName: string, entryId: string, content: string): Promise<void> {
    const memory = await this.get(workspace, memoryName);
    if (!memory) throw new Error(`Memory '${memoryName}' not found in workspace '${workspace}'`);

    const entry = memory.entries.find(e => e.id === entryId);
    if (!entry) throw new Error(`Memory entry '${entryId}' not found in memory '${memoryName}'`);

    entry.content = sanitizeText(content);
    entry.updatedAt = Date.now();
    await this.save(workspace, memory);
  }

  async getEntries(workspace: string, memoryName: string): Promise<MemoryEntry[]> {
    const memory = await this.get(workspace, memoryName);
    return memory?.entries || [];
  }

  async deleteEntry(workspace: string, memoryName: string, entryId: string): Promise<void> {
    const memory = await this.get(workspace, memoryName);
    if (!memory) return;
    memory.entries = memory.entries.filter(e => e.id !== entryId);
    await this.save(workspace, memory);
  }
}