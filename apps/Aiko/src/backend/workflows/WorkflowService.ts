import type { AikoWorkflow, WorkflowInput } from './types.js';
import type { FodGraph, WorkflowExecutionContext, WorkflowExecutionResult } from './types.js';
import { WorkspaceWorkflowRepository, type WorkflowRepository, type WorkflowVersion, type WorkflowExecutionRecord } from './WorkflowRepository.js';
import { GraphEngine, type VerifiedLuthPrincipal } from './engine/index.js';
import { runtimeService } from '../runtime/index.js';
import { RuntimeNodeAdapter } from '../runtime/RuntimeNodeAdapter.js';
import { deriveToolCapability, createToolOutputHandleForCapability } from './capabilities/derive.js';
import { executeToolCapability as executeCapability } from './capabilities/execute.js';
import type { CapabilityGraph, CapabilityExecutionContext, ToolCapability, ToolOutputHandle } from './capabilities/contracts.js';

export { WorkspaceWorkflowRepository } from './WorkflowRepository.js';
export class WorkspaceWorkflowStore extends WorkspaceWorkflowRepository {}

function principalFor(workspaceId: string, context?: WorkflowExecutionContext): VerifiedLuthPrincipal {
  const userId = context?.userId || (context as any)?.principal?.id || 'system';
  return { verified: true, userId, workspaceId, roles: context?.roles || ['user'] };
}
function runtimeAccess(): RuntimeNodeAdapter { return new RuntimeNodeAdapter(runtimeService); }

function capabilityGraph(graph: FodGraph): CapabilityGraph { return graph as unknown as CapabilityGraph; }

export class WorkflowService {
  constructor(
    private readonly store: WorkflowRepository = new WorkspaceWorkflowRepository(),
    private readonly engine: GraphEngine | any = new GraphEngine(),
  ) {}
  list(workspaceId: string) { return this.store.list(workspaceId); }
  get(workspaceId: string, workflowId: string) { return this.store.get(workspaceId, workflowId); }

  async create(workspaceId: string, input: WorkflowInput): Promise<AikoWorkflow> {
    if (!input.name?.trim()) throw new Error('Workflow name is required.');
    if (!workspaceId) throw new Error('A verified workspace is required.');
    const now = new Date().toISOString(), id = globalThis.crypto.randomUUID();
    const workflow: AikoWorkflow = { id, workspaceId, name: input.name.trim(), description: input.description?.trim() || '', icon: input.icon, intelligenceSpecId: input.intelligenceSpecId ?? undefined, fodProjectId: 'aiko-' + id, createdAt: now, updatedAt: now };
    await this.store.save(workflow);
    try { await this.store.saveGraph(workspaceId, id, { nodes: [], edges: [], metadata: { name: workflow.name, description: workflow.description, workflowId: id } }); }
    catch (error) { await this.store.delete(workspaceId, id); throw error; }
    return workflow;
  }
  async update(workspaceId: string, workflowId: string, input: Partial<WorkflowInput>) {
    const existing = await this.require(workspaceId, workflowId);
    return this.store.save({ ...existing, name: input.name?.trim() || existing.name, description: input.description?.trim() ?? existing.description, icon: input.icon ?? existing.icon, intelligenceSpecId: input.intelligenceSpecId === undefined ? existing.intelligenceSpecId : input.intelligenceSpecId, updatedAt: new Date().toISOString() });
  }
  delete(workspaceId: string, workflowId: string) { return this.store.delete(workspaceId, workflowId); }
  async getGraph(workspaceId: string, workflowId: string) {
    const workflow = await this.require(workspaceId, workflowId);
    const local = await this.store.getGraph(workspaceId, workflowId);
    if (local && (local.nodes?.length || local.edges?.length)) return local;
    if (typeof this.engine.getGraph === 'function') {
      const legacy = await this.engine.getGraph(workflow.fodProjectId);
      if (legacy && (legacy.nodes?.length || legacy.edges?.length)) {
        await this.store.saveGraph(workspaceId, workflowId, legacy);
        return legacy;
      }
    }
    return local || { nodes: [], edges: [] };
  }
  async saveGraph(workspaceId: string, workflowId: string, graph: FodGraph) {
    await this.require(workspaceId, workflowId);
    const saved = await this.store.saveGraph(workspaceId, workflowId, graph);
    const workflow = await this.require(workspaceId, workflowId);
    await this.store.save({ ...workflow, updatedAt: new Date().toISOString() });
    return saved.graph;
  }
  getNodeDefinitions() { return this.engine.getNodeDefinitions(); }
  validateGraph(graph: FodGraph) { return this.engine.validate(graph as any); }
  listVersions(workspaceId: string, workflowId: string): Promise<WorkflowVersion[]> { return this.store.listVersions(workspaceId, workflowId); }
  listExecutions(workspaceId: string, workflowId: string): Promise<WorkflowExecutionRecord[]> { return this.store.listExecutions(workspaceId, workflowId); }
  getExecution(workspaceId: string, workflowId: string, executionId: string) { return this.store.getExecution(workspaceId, workflowId, executionId); }

  async execute(workspaceId: string, workflowId: string, input?: unknown, context?: WorkflowExecutionContext): Promise<WorkflowExecutionResult> {
    const workflow = await this.require(workspaceId, workflowId);
    const graph = await this.getGraph(workspaceId, workflowId);
    const startedAt = new Date().toISOString(), record: WorkflowExecutionRecord = { id: globalThis.crypto.randomUUID(), workspaceId, workflowId, status: 'running', input, logs: [], startedAt, updatedAt: startedAt };
    await this.store.createExecution(record);
    try {
      let result: any;
      if (this.engine instanceof GraphEngine) {
        const principal = principalFor(workspaceId, context);
        result = await this.engine.execute(graph as any, { workspaceId, principal, variables: { ...(input && typeof input === 'object' ? input as Record<string, unknown> : {}), ...(workflow.intelligenceSpecId ? { __workflowIntelligenceSpecId: workflow.intelligenceSpecId } : {}) }, services: { runtime: runtimeAccess() }, signal: context?.signal });
      } else {
        result = await this.engine.execute(workflow.fodProjectId, input, context);
      }
      const completedAt = new Date().toISOString();
      const rawLogs = result.execution?.logs || result.logs || [];
      const logs = rawLogs.map((item: any) => ({
        id: globalThis.crypto.randomUUID(),
        timestamp: typeof item.timestamp === 'string' ? item.timestamp : new Date(item.timestamp || Date.now()).toISOString(),
        level: item.level === 'success' || item.level === 'ai' ? 'info' : (item.level || 'info'),
        message: item.message || ''
      }));
      const workflowResult: WorkflowExecutionResult = {
        success: result.success !== false,
        output: result.outputs ?? result.output,
        execution: { executionId: result.executionId || record.id, variables: result.variables || {}, logs: rawLogs, cancelled: !!result.cancelled },
        errors: Object.values(result.errors || {})
      };
      await this.store.updateExecution({
        ...record,
        status: workflowResult.success ? 'succeeded' : 'failed',
        result: workflowResult,
        error: workflowResult.success ? undefined : (workflowResult.errors || []).join('; '),
        logs,
        completedAt,
        updatedAt: completedAt
      });
      return workflowResult;
    } catch (error) {
      const completedAt = new Date().toISOString();
      await this.store.updateExecution({
        ...record,
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
        logs: [{ id: globalThis.crypto.randomUUID(), timestamp: completedAt, level: 'error', message: 'Workflow execution failed.' }],
        completedAt,
        updatedAt: completedAt
      });
      throw error;
    }
  }

  async getToolCapability(workspaceId: string, workflowId: string): Promise<ToolCapability> {
    const workflow = await this.require(workspaceId, workflowId);
    return deriveToolCapability(capabilityGraph(await this.getGraph(workspaceId, workflowId)), { kind: 'workflow', id: workflowId, workflowId }, { name: workflow.name, description: workflow.description });
  }
  async getToolOutputHandle(workspaceId: string, workflowId: string): Promise<ToolOutputHandle> {
    const capability = await this.getToolCapability(workspaceId, workflowId);
    return createToolOutputHandleForCapability(capability);
  }
  async executeToolCapability(workspaceId: string, workflowId: string, input: Record<string, unknown>, context: CapabilityExecutionContext = {}) {
    const workflow = await this.require(workspaceId, workflowId);
    const graph = await this.getGraph(workspaceId, workflowId);
    const capability = await this.getToolCapability(workspaceId, workflowId);
    const principal = principalFor(workspaceId, { userId: context.userId });
    return executeCapability(capability, capabilityGraph(graph), input, async selectedGraph => {
      let result: any;
      if (this.engine instanceof GraphEngine) {
        result = await this.engine.execute(selectedGraph as any, { workspaceId, principal, variables: input, services: { runtime: runtimeAccess() }, signal: context.signal });
      } else {
        result = await this.engine.execute(workflow.fodProjectId, input, { ...context, workspaceId, userId: principal.userId });
      }
      if (!result.success) throw new Error(Object.values(result.errors || {}).join('; ') || 'Capability execution failed.');
      return result.outputs ?? result.output;
    }, { ...context, workspaceId, userId: principal.userId });
  }
  private async require(workspaceId: string, workflowId: string) {
    const workflow = await this.store.get(workspaceId, workflowId);
    if (!workflow || workflow.workspaceId !== workspaceId) throw new Error('Workflow not found in this workspace.');
    return workflow;
  }
}
export const workflowService = new WorkflowService();
export default workflowService;
