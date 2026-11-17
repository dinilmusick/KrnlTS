/**
 * ASCII Architecture Flowchart: learningStore
 *
 *   ┌──────────────────────────────────┐
 *   │     Initialize learningStore     │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │               tool               │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │               feat               │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │           cleanContent           │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │  Return State / Result Payload   │
 *   └──────────────────────────────────┘
 */

// ══════════════════════════════════════════════════════════════════════════════════
// ════ WORKSPACE TOOL & FEATURE LEARNING STORE ══════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════════

import { WorkspaceRepository } from './workspaceRepository.js';
import { Learning } from '../types/tools.js';
import { sanitizeText } from '../agentic/learning/sanitizer.js';
import { mergeAndDeduplicateLearnings } from '../agentic/learning/deduplication.js';

export class LearningStore {
  constructor(private readonly repo: WorkspaceRepository) {}

  async getToolLearnings(workspace: string, toolName: string): Promise<Learning[]> {
    try {
      const tool = await this.repo.getTool(workspace, toolName);
      return tool.learnings || [];
    } catch {
      return [];
    }
  }

  async getFeatureLearnings(workspace: string, toolName: string, featureName: string): Promise<Learning[]> {
    try {
      const feat = await this.repo.getFeature(workspace, toolName, featureName);
      return feat.learnings || [];
    } catch {
      return [];
    }
  }

  async addToolLearning(
    workspace: string,
    toolName: string,
    learningInput: { id?: string; content: string }
  ): Promise<Learning> {
    const cleanContent = sanitizeText(learningInput.content);
    const tool = await this.repo.getTool(workspace, toolName);
    const existing = tool.learnings || [];

    const updatedLearnings = mergeAndDeduplicateLearnings(existing, cleanContent, learningInput.id);
    const saved = updatedLearnings.find(l => l.content === cleanContent) || {
      id: learningInput.id || `learn-${Date.now()}`,
      content: cleanContent
    };

    tool.learnings = updatedLearnings;
    await this.repo.saveTool(workspace, tool);
    return saved;
  }

  async updateToolLearning(workspace: string, toolName: string, id: string, content: string): Promise<void> {
    const cleanContent = sanitizeText(content);
    const tool = await this.repo.getTool(workspace, toolName);
    const learnings = tool.learnings || [];
    const item = learnings.find(l => l.id === id);
    if (!item) throw new Error(`Learning '${id}' not found in tool '${toolName}'`);

    item.content = cleanContent;
    await this.repo.saveTool(workspace, tool);
  }

  async deleteToolLearning(workspace: string, toolName: string, id: string): Promise<void> {
    try {
      const tool = await this.repo.getTool(workspace, toolName);
      tool.learnings = (tool.learnings || []).filter(l => l.id !== id);
      await this.repo.saveTool(workspace, tool);
    } catch {
      // safe fallback
    }
  }

  async addFeatureLearning(
    workspace: string,
    toolName: string,
    featureName: string,
    learningInput: { id?: string; content: string }
  ): Promise<Learning> {
    const cleanContent = sanitizeText(learningInput.content);
    const feature = await this.repo.getFeature(workspace, toolName, featureName);
    const existing = feature.learnings || [];

    const updatedLearnings = mergeAndDeduplicateLearnings(existing, cleanContent, learningInput.id);
    const saved = updatedLearnings.find(l => l.content === cleanContent) || {
      id: learningInput.id || `feat-learn-${Date.now()}`,
      content: cleanContent
    };

    feature.learnings = updatedLearnings;
    await this.repo.updateFeature(workspace, toolName, feature);
    return saved;
  }

  async updateFeatureLearning(
    workspace: string,
    toolName: string,
    featureName: string,
    id: string,
    content: string
  ): Promise<void> {
    const cleanContent = sanitizeText(content);
    const feature = await this.repo.getFeature(workspace, toolName, featureName);
    const learnings = feature.learnings || [];
    const item = learnings.find(l => l.id === id);
    if (!item) throw new Error(`Learning '${id}' not found in feature '${featureName}'`);

    item.content = cleanContent;
    await this.repo.updateFeature(workspace, toolName, feature);
  }

  async deleteFeatureLearning(workspace: string, toolName: string, featureName: string, id: string): Promise<void> {
    try {
      const feature = await this.repo.getFeature(workspace, toolName, featureName);
      feature.learnings = (feature.learnings || []).filter(l => l.id !== id);
      await this.repo.updateFeature(workspace, toolName, feature);
    } catch {
      // safe fallback
    }
  }
}