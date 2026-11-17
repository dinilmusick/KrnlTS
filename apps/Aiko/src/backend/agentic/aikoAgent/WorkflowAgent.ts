import { failoverExecutionEngine } from '../../failoverEngine.js';
import { IntelligenceSpecResolver } from '../intelligenceSpecResolver.js';
import { workflowService } from '../../workflows/WorkflowService.js';
import type { AikoWorkflow } from '../../workflows/types.js';
import type { AikoAgentInput, AikoAgentResult, WorkflowExecutionResult } from './types.js';

interface WorkflowSelection { workflowId: string | null; input?: unknown; response?: string; }

function parseSelection(raw: string): WorkflowSelection {
  const cleaned = raw.replace(/^\x60\x60\x60(?:json)?/i, '').replace(/\x60\x60\x60$/i, '').trim();
  try { return JSON.parse(cleaned) as WorkflowSelection; } catch { return { workflowId: null, response: raw }; }
}

function promptFor(query: string, workflows: AikoWorkflow[], memories: unknown): string {
  return [
    'You are Aiko workflow router.',
    'Choose exactly one semantic workflow when one can satisfy the request.',
    'Never reason about tools, features, endpoints, HTTP methods, URLs, or node internals.',
    'Return JSON only: {"workflowId":"...","input":{},"response":""}.',
    'If no workflow applies, return {"workflowId":null,"response":"..."}',
    'WORKFLOWS:', JSON.stringify(workflows.map(w => ({ id: w.id, name: w.name, description: w.description }))),
    'MEMORIES:', JSON.stringify(memories || {}),
    'REQUEST:', query,
  ].join('\n');
}

export class WorkflowAgent {
  constructor(private readonly workflows = workflowService) {}

  async execute(input: AikoAgentInput, memories: unknown = {}): Promise<AikoAgentResult> {
    const start = Date.now();
    const { profile, specId, resolvedModel } = IntelligenceSpecResolver.resolveAgentModel('AIKO', { explicitSpecId: input.intelligenceSpecId });
    const workflows = await this.workflows.list(input.workspace);
    if (workflows.length === 0) {
      return { success: true, workflowExecutions: [], response: 'No workflows are configured for this workspace.', finalResult: { workflows: [] }, intelligenceSpecId: specId, resolvedModelId: input.selectedModel || resolvedModel?.id, providerId: input.selectedProvider || resolvedModel?.providerId, durationMs: Date.now() - start };
    }
    const runInference = async (prompt: string) => {
      if (input.customInference) return input.customInference(prompt, profile);
      if (input.selectedProvider && input.selectedModel) return (await failoverExecutionEngine.executeDirectRequest(input.selectedProvider as any, input.selectedModel, prompt)).content;
      return (await failoverExecutionEngine.executeProfileRequest(profile, prompt)).content;
    };
    let selection: WorkflowSelection;
    try { selection = parseSelection(await runInference(promptFor(input.query, workflows, memories))); }
    catch (error) { return { success: false, workflowExecutions: [], error: { kind: 'MODEL_RESOLUTION_ERROR', message: error instanceof Error ? error.message : String(error) }, durationMs: Date.now() - start }; }
    if (!selection.workflowId) return { success: true, workflowExecutions: [], response: selection.response || 'I could not identify a workflow for that request.', finalResult: { directResponse: selection.response }, intelligenceSpecId: specId, resolvedModelId: input.selectedModel || resolvedModel?.id, providerId: input.selectedProvider || resolvedModel?.providerId, durationMs: Date.now() - start };
    const workflow = workflows.find(w => w.id === selection.workflowId);
    if (!workflow) return { success: false, workflowExecutions: [], error: { kind: 'UNKNOWN_CAPABILITY', message: 'WORKFLOW_NOT_FOUND: ' + selection.workflowId }, durationMs: Date.now() - start };
    let result: WorkflowExecutionResult;
    try { result = await this.workflows.execute(input.workspace, workflow.id, selection.input, { metadata: { query: input.query }, userId: input.userId, roles: input.roles }); }
    catch (error) { return { success: false, workflowExecutions: [{ workflowId: workflow.id, workflowName: workflow.name, status: 'FAILED', durationMs: Date.now() - start }], error: { kind: 'EXECUTION_FAILED', message: error instanceof Error ? error.message : String(error) }, durationMs: Date.now() - start }; }
    return {
      success: result.success,
      workflowExecutions: [{ workflowId: workflow.id, workflowName: workflow.name, status: result.success ? 'SUCCESS' : 'FAILED', output: result.output as any, durationMs: Date.now() - start }],
      response: result.success ? 'Workflow "' + workflow.name + '" completed successfully.' : 'Workflow "' + workflow.name + '" failed.',
      finalResult: result.output as any,
      intelligenceSpecId: specId,
      resolvedModelId: input.selectedModel || resolvedModel?.id,
      providerId: input.selectedProvider || resolvedModel?.providerId,
      error: result.success ? undefined : { kind: 'EXECUTION_FAILED', message: JSON.stringify(result.errors || []) },
      durationMs: Date.now() - start,
    };
  }
}
export default WorkflowAgent;
