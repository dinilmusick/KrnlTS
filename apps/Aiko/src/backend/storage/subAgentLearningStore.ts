/**
 * ASCII Architecture Flowchart: subAgentLearningStore
 *
 *   ┌──────────────────────────────────────────────┐
 *   │      Initialize SubAgentLearningStore        │
 *   └──────────────────────────────────────────────┘
 *                          │
 *                          ▼
 *   ┌──────────────────────────────────────────────┐
 *   │  Find Target Tool or Feature Sub-Agent       │
 *   └──────────────────────────────────────────────┘
 *                          │
 *                          ▼
 *   ┌──────────────────────────────────────────────┐
 *   │  Sanitize & Merge / Deduplicate Learnings     │
 *   └──────────────────────────────────────────────┘
 *                          │
 *                          ▼
 *   ┌──────────────────────────────────────────────┐
 *   │   Persist Updated Sub-Agent to Workspace     │
 *   └──────────────────────────────────────────────┘
 */

import { WorkspaceRepository } from './workspaceRepository.js';
import { Learning } from '../types/tools.js';
import { sanitizeText } from '../agentic/learning/sanitizer.js';
import { mergeAndDeduplicateLearnings } from '../agentic/learning/deduplication.js';
import { SubAgentDefinition } from '../types/agentTypes.js';

export class SubAgentLearningStore {
  constructor(private readonly repo: WorkspaceRepository) {}

  private findSubAgent(subAgents: Record<string, SubAgentDefinition | undefined>, roleOrId: string): SubAgentDefinition | undefined {
    const key = Object.keys(subAgents).find(
      k => k.toLowerCase() === roleOrId.toLowerCase() || subAgents[k]?.id === roleOrId || subAgents[k]?.role === roleOrId
    );
    return key ? subAgents[key] : undefined;
  }

  async getToolSubAgentLearnings(workspace: string, toolName: string, roleOrId: string): Promise<Learning[]> {
    const tool = await this.repo.getTool(workspace, toolName);
    const sub = this.findSubAgent(tool.agent?.subAgents || {}, roleOrId);
    if (!sub) return [];
    return (sub.learnings || []) as Learning[];
  }

  async addToolSubAgentLearning(
    workspace: string,
    toolName: string,
    roleOrId: string,
    learningInput: { id?: string; content: string }
  ): Promise<Learning> {
    const cleanContent = sanitizeText(learningInput.content);
    const tool = await this.repo.getTool(workspace, toolName);
    const sub = this.findSubAgent(tool.agent?.subAgents || {}, roleOrId);
    if (!sub) throw new Error(`SubAgent '${roleOrId}' not found in tool '${toolName}'`);

    const existing = (sub.learnings || []) as Learning[];
    const updated = mergeAndDeduplicateLearnings(existing, cleanContent, learningInput.id);
    const saved = updated.find(l => l.content === cleanContent) || {
      id: learningInput.id || `sub-learn-${Date.now()}`,
      content: cleanContent
    };

    sub.learnings = updated;
    await this.repo.saveTool(workspace, tool);
    return saved;
  }

  async updateToolSubAgentLearning(
    workspace: string,
    toolName: string,
    roleOrId: string,
    id: string,
    content: string
  ): Promise<void> {
    const cleanContent = sanitizeText(content);
    const tool = await this.repo.getTool(workspace, toolName);
    const sub = this.findSubAgent(tool.agent?.subAgents || {}, roleOrId);
    if (!sub) throw new Error(`SubAgent '${roleOrId}' not found in tool '${toolName}'`);

    const list = (sub.learnings || []) as Learning[];
    const item = list.find(l => l.id === id);
    if (!item) throw new Error(`Learning '${id}' not found in subagent '${roleOrId}'`);
    item.content = cleanContent;
    await this.repo.saveTool(workspace, tool);
  }

  async deleteToolSubAgentLearning(workspace: string, toolName: string, roleOrId: string, id: string): Promise<void> {
    const tool = await this.repo.getTool(workspace, toolName);
    const sub = this.findSubAgent(tool.agent?.subAgents || {}, roleOrId);
    if (!sub) return;
    sub.learnings = (sub.learnings || []).filter(l => l.id !== id);
    await this.repo.saveTool(workspace, tool);
  }

  async getFeatureSubAgentLearnings(workspace: string, toolName: string, featureName: string, roleOrId: string): Promise<Learning[]> {
    const feature = await this.repo.getFeature(workspace, toolName, featureName);
    const sub = this.findSubAgent(feature.agent?.subAgents || {}, roleOrId);
    if (!sub) return [];
    return (sub.learnings || []) as Learning[];
  }

  async addFeatureSubAgentLearning(
    workspace: string,
    toolName: string,
    featureName: string,
    roleOrId: string,
    learningInput: { id?: string; content: string }
  ): Promise<Learning> {
    const cleanContent = sanitizeText(learningInput.content);
    const feature = await this.repo.getFeature(workspace, toolName, featureName);
    const sub = this.findSubAgent(feature.agent?.subAgents || {}, roleOrId);
    if (!sub) throw new Error(`SubAgent '${roleOrId}' not found in feature '${featureName}'`);

    const existing = (sub.learnings || []) as Learning[];
    const updated = mergeAndDeduplicateLearnings(existing, cleanContent, learningInput.id);
    const saved = updated.find(l => l.content === cleanContent) || {
      id: learningInput.id || `feat-sub-learn-${Date.now()}`,
      content: cleanContent
    };

    sub.learnings = updated;
    await this.repo.updateFeature(workspace, toolName, feature);
    return saved;
  }

  async updateFeatureSubAgentLearning(
    workspace: string,
    toolName: string,
    featureName: string,
    roleOrId: string,
    id: string,
    content: string
  ): Promise<void> {
    const cleanContent = sanitizeText(content);
    const feature = await this.repo.getFeature(workspace, toolName, featureName);
    const sub = this.findSubAgent(feature.agent?.subAgents || {}, roleOrId);
    if (!sub) throw new Error(`SubAgent '${roleOrId}' not found in feature '${featureName}'`);

    const list = (sub.learnings || []) as Learning[];
    const item = list.find(l => l.id === id);
    if (!item) throw new Error(`Learning '${id}' not found in subagent '${roleOrId}'`);
    item.content = cleanContent;
    await this.repo.updateFeature(workspace, toolName, feature);
  }

  async deleteFeatureSubAgentLearning(
    workspace: string,
    toolName: string,
    featureName: string,
    roleOrId: string,
    id: string
  ): Promise<void> {
    const feature = await this.repo.getFeature(workspace, toolName, featureName);
    const sub = this.findSubAgent(feature.agent?.subAgents || {}, roleOrId);
    if (!sub) return;
    sub.learnings = (sub.learnings || []).filter(l => l.id !== id);
    await this.repo.updateFeature(workspace, toolName, feature);
  }
}
