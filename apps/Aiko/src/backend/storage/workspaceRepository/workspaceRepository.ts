import { MemoryEntry } from './types.js';
import type { ToolDefinition, FeatureDefinition } from '../../types/tools.js';
import { WorkspaceStorage, normalizeName } from '../workspaceStorage.js';

export class WorkspaceRepository {
  constructor(private readonly storage: WorkspaceStorage) {}

  async listMemories(workspace: string): Promise<string[]> {
    const files = await this.storage.list(workspace + '/memories');
    return files.filter(f => f.endsWith('.json')).map(f => f.replace(/\.json$/, ''));
  }

  async getMemory(workspace: string, memoryName: string): Promise<MemoryEntry> {
    const norm = normalizeName(memoryName);
    const file = workspace + '/memories/' + norm + '.json';
    if (!(await this.storage.exists(file))) throw new Error('Memory "' + memoryName + '" not found in workspace "' + workspace + '"');
    return JSON.parse(await this.storage.read(file));
  }

  async saveMemory(workspace: string, memory: MemoryEntry): Promise<void> {
    if (!memory.name || !memory.name.trim()) throw new Error('Memory name is required');
    const norm = normalizeName(memory.name);
    const file = workspace + '/memories/' + norm + '.json';
    await this.storage.write(file, JSON.stringify({
      schemaVersion: memory.schemaVersion || '1.0.0',
      name: memory.name,
      content: memory.content,
      updatedAt: memory.updatedAt || new Date().toISOString()
    }, null, 2));
  }

  async deleteMemory(workspace: string, memoryName: string): Promise<void> {
    await this.storage.delete(workspace + '/memories/' + normalizeName(memoryName) + '.json');
  }

  async loadMemories(workspace: string): Promise<MemoryEntry[]> {
    const names = await this.listMemories(workspace);
    const results: MemoryEntry[] = [];
    for (const name of names) {
      try {
        const memory = await this.getMemory(workspace, name);
        if (memory) results.push(memory);
      } catch {
        // Ignore unreadable entries so one malformed memory cannot break chat.
      }
    }
    return results;
  }
  async getTool(workspace: string, toolName: string): Promise<ToolDefinition> {
    const file = workspace + '/tools/' + normalizeName(toolName) + '.json';
    if (!(await this.storage.exists(file))) throw new Error('Tool "' + toolName + '" not found in workspace "' + workspace + '"');
    return JSON.parse(await this.storage.read(file));
  }
  async saveTool(workspace: string, tool: ToolDefinition): Promise<void> {
    if (!tool.name?.trim()) throw new Error('Tool name is required');
    const file = workspace + '/tools/' + normalizeName(tool.name) + '.json';
    await this.storage.write(file, JSON.stringify(tool, null, 2));
  }
  async getFeature(workspace: string, toolName: string, featureName: string): Promise<FeatureDefinition> {
    const tool = await this.getTool(workspace, toolName);
    const feature = (tool.features || []).find(item => item.name === featureName || item.id === featureName);
    if (!feature) throw new Error('Feature "' + featureName + '" not found in tool "' + toolName + '"');
    return feature;
  }
  async updateFeature(workspace: string, toolName: string, feature: FeatureDefinition): Promise<void> {
    const tool = await this.getTool(workspace, toolName);
    const features = [...(tool.features || [])];
    const index = features.findIndex(item => item.id === feature.id || item.name === feature.name);
    if (index < 0) throw new Error('Feature "' + feature.name + '" not found in tool "' + toolName + '"');
    features[index] = feature;
    await this.saveTool(workspace, { ...tool, features });
  }
}

export default WorkspaceRepository;
