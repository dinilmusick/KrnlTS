import type { WorkspaceStorage } from '../storage/workspaceStorage.js';
import { workspaceStorage } from '../storage/workspaceStorage.js';
import type { AikoWorkflow, FodGraph, WorkflowExecutionResult } from './types.js';

export interface WorkflowVersion {
  id: string;
  workspaceId: string;
  workflowId: string;
  version: number;
  graph: FodGraph;
  createdAt: string;
}
export interface WorkflowExecutionLog {
  id: string;
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  data?: unknown;
}
export interface WorkflowExecutionRecord {
  id: string;
  workspaceId: string;
  workflowId: string;
  status: 'running' | 'succeeded' | 'failed';
  input?: unknown;
  result?: WorkflowExecutionResult;
  error?: string;
  logs: WorkflowExecutionLog[];
  startedAt: string;
  completedAt?: string;
  updatedAt: string;
}
export interface WorkflowRepository {
  list(workspaceId: string): Promise<AikoWorkflow[]>;
  get(workspaceId: string, workflowId: string): Promise<AikoWorkflow | null>;
  save(workflow: AikoWorkflow): Promise<AikoWorkflow>;
  delete(workspaceId: string, workflowId: string): Promise<boolean>;
  getGraph(workspaceId: string, workflowId: string): Promise<FodGraph | null>;
  saveGraph(workspaceId: string, workflowId: string, graph: FodGraph): Promise<{ graph: FodGraph; version: WorkflowVersion }>;
  listVersions(workspaceId: string, workflowId: string): Promise<WorkflowVersion[]>;
  createExecution(record: WorkflowExecutionRecord): Promise<WorkflowExecutionRecord>;
  updateExecution(record: WorkflowExecutionRecord): Promise<WorkflowExecutionRecord>;
  getExecution(workspaceId: string, workflowId: string, executionId: string): Promise<WorkflowExecutionRecord | null>;
  listExecutions(workspaceId: string, workflowId: string): Promise<WorkflowExecutionRecord[]>;
}

const MAX_EXECUTIONS_PER_WORKFLOW = 100;
const MAX_GRAPH_VERSIONS_PER_WORKFLOW = 500;
const MAX_LOGS_PER_EXECUTION = 1000;
const locks = new Map<string, Promise<void>>();

function assertScope(workspaceId: string, id: string, label: string): void {
  const invalid = (value: string) => !value || value === '.' || value === '..' || value.includes('/') || value.includes('\\') || value.includes('\0');
  if (invalid(workspaceId)) throw new Error('Invalid workspace scope.');
  if (invalid(id)) throw new Error('Invalid ' + label + '.');
}
function missing(error: unknown): boolean {
  const value = error as { code?: string; status?: number; statusCode?: number; message?: string };
  return value?.code === 'ENOENT' || value?.code === 'NOT_FOUND' || value?.status === 404 || value?.statusCode === 404 || /^file not found(?::|$)/i.test(value?.message || '');
}
function decode<T>(raw: string, path: string): T {
  try { return JSON.parse(raw) as T; } catch { throw new Error('Corrupt workflow persistence record: ' + path); }
}
function clone<T>(value: T): T { return JSON.parse(JSON.stringify(value)) as T; }

/** WorkspaceStorage is backed by Aiko's canonical Kloks workspace service in production.
 * The in-memory adapter is injected only by tests; this repository never falls back to disk.
 */
export class WorkspaceWorkflowRepository implements WorkflowRepository {
  constructor(private readonly storage: WorkspaceStorage = workspaceStorage) {}

  private root(workspaceId: string) { assertScope(workspaceId, 'workflows', 'workspace'); return workspaceId + '/workflows'; }
  private workflowPath(workspaceId: string) { return this.root(workspaceId) + '/index.json'; }
  private graphStatePath(workspaceId: string, workflowId: string) {
    assertScope(workspaceId, workflowId, 'workflow ID'); return this.root(workspaceId) + '/graphs/' + encodeURIComponent(workflowId) + '/state.json';
  }
  private executionsPath(workspaceId: string, workflowId: string) {
    assertScope(workspaceId, workflowId, 'workflow ID'); return this.root(workspaceId) + '/executions/' + encodeURIComponent(workflowId) + '.json';
  }

  private async serialized<T>(workspaceId: string, operation: () => Promise<T>): Promise<T> {
    const previous = locks.get(workspaceId) || Promise.resolve();
    let release!: () => void;
    const current = new Promise<void>(resolve => { release = resolve; });
    const queued = previous.then(() => current);
    locks.set(workspaceId, queued);
    await previous;
    try { return await operation(); }
    finally { release(); if (locks.get(workspaceId) === queued) locks.delete(workspaceId); }
  }

  private async readJson<T>(path: string, fallback: T): Promise<T> {
    try { return decode<T>(await this.storage.read(path), path); }
    catch (error) { if (missing(error)) return fallback; throw error; }
  }

  async list(workspaceId: string): Promise<AikoWorkflow[]> {
    assertScope(workspaceId, 'workflows', 'workspace');
    const items = await this.readJson<AikoWorkflow[]>(this.workflowPath(workspaceId), []);
    if (!Array.isArray(items)) throw new Error('Workflow index is invalid.');
    return items.filter(item => item.workspaceId === workspaceId);
  }
  async get(workspaceId: string, workflowId: string): Promise<AikoWorkflow | null> {
    assertScope(workspaceId, workflowId, 'workflow ID');
    return (await this.list(workspaceId)).find(item => item.id === workflowId) || null;
  }
  async save(workflow: AikoWorkflow): Promise<AikoWorkflow> {
    assertScope(workflow.workspaceId, workflow.id, 'workflow ID');
    return this.serialized(workflow.workspaceId, async () => {
      const items = await this.list(workflow.workspaceId);
      const next = items.some(item => item.id === workflow.id)
        ? items.map(item => item.id === workflow.id ? clone(workflow) : item)
        : [...items, clone(workflow)];
      await this.storage.write(this.workflowPath(workflow.workspaceId), JSON.stringify(next));
      return workflow;
    });
  }
  async delete(workspaceId: string, workflowId: string): Promise<boolean> {
    assertScope(workspaceId, workflowId, 'workflow ID');
    return this.serialized(workspaceId, async () => {
      const items = await this.list(workspaceId);
      if (!items.some(item => item.id === workflowId)) return false;
      await this.storage.write(this.workflowPath(workspaceId), JSON.stringify(items.filter(item => item.id !== workflowId)));
      const graphState = this.graphStatePath(workspaceId, workflowId);
      const executions = this.executionsPath(workspaceId, workflowId);
      await Promise.all([graphState, executions].map(path => this.storage.delete(path).catch(error => { if (!missing(error)) throw error; })));
      return true;
    });
  }
  async getGraph(workspaceId: string, workflowId: string): Promise<FodGraph | null> {
    if (!await this.get(workspaceId, workflowId)) throw new Error('Workflow not found in this workspace.');
    try {
      const state = decode<{ graph: FodGraph; versions: WorkflowVersion[] }>(
        await this.storage.read(this.graphStatePath(workspaceId, workflowId)), this.graphStatePath(workspaceId, workflowId),
      );
      return state.graph;
    } catch (error) {
      if (missing(error)) return null;
      throw error;
    }
  }
  async saveGraph(workspaceId: string, workflowId: string, graph: FodGraph) {
    assertScope(workspaceId, workflowId, 'workflow ID');
    return this.serialized(workspaceId, async () => {
      if (!await this.get(workspaceId, workflowId)) throw new Error('Workflow not found in this workspace.');
      const statePath = this.graphStatePath(workspaceId, workflowId);
      const state = await this.readJson<{ graph: FodGraph; versions: WorkflowVersion[] }>(statePath, { graph: { nodes: [], edges: [] }, versions: [] });
      const versions = state.versions;
      const version: WorkflowVersion = {
        id: globalThis.crypto.randomUUID(), workspaceId, workflowId, version: versions.reduce((max, item) => Math.max(max, item.version), 0) + 1,
        graph: clone(graph), createdAt: new Date().toISOString(),
      };
      await this.storage.write(statePath, JSON.stringify({ graph: clone(graph), versions: [...versions, version].slice(-MAX_GRAPH_VERSIONS_PER_WORKFLOW) }));
      return { graph, version };
    });
  }
  async listVersions(workspaceId: string, workflowId: string) {
    if (!await this.get(workspaceId, workflowId)) throw new Error('Workflow not found in this workspace.');
    const state = await this.readJson<{ graph: FodGraph; versions: WorkflowVersion[] }>(this.graphStatePath(workspaceId, workflowId), { graph: { nodes: [], edges: [] }, versions: [] });
    return state.versions;
  }
  async createExecution(record: WorkflowExecutionRecord) {
    assertScope(record.workspaceId, record.workflowId, 'workflow ID');
    return this.serialized(record.workspaceId, async () => {
      if (!await this.get(record.workspaceId, record.workflowId)) throw new Error('Workflow not found in this workspace.');
      const records = await this.readJson<WorkflowExecutionRecord[]>(this.executionsPath(record.workspaceId, record.workflowId), []);
      if (records.some(item => item.id === record.id)) throw new Error('Execution already exists.');
      const next = [...records, clone({ ...record, logs: record.logs.slice(-MAX_LOGS_PER_EXECUTION) })];
      const running = next.filter(item => item.status === 'running');
      const completed = next.filter(item => item.status !== 'running').slice(-MAX_EXECUTIONS_PER_WORKFLOW);
      await this.storage.write(this.executionsPath(record.workspaceId, record.workflowId), JSON.stringify([...completed, ...running]));
      return record;
    });
  }
  async updateExecution(record: WorkflowExecutionRecord) {
    return this.serialized(record.workspaceId, async () => {
      const path = this.executionsPath(record.workspaceId, record.workflowId);
      const records = await this.readJson<WorkflowExecutionRecord[]>(path, []);
      if (!records.some(item => item.id === record.id && item.workspaceId === record.workspaceId && item.workflowId === record.workflowId)) {
        throw new Error('Execution not found in this workspace.');
      }
      const next = records.map(item => item.id === record.id ? clone({ ...record, logs: record.logs.slice(-MAX_LOGS_PER_EXECUTION) }) : item);
      await this.storage.write(path, JSON.stringify(next));
      return record;
    });
  }
  async getExecution(workspaceId: string, workflowId: string, executionId: string) {
    assertScope(workspaceId, workflowId, 'workflow ID'); assertScope(workspaceId, executionId, 'execution ID');
    const records = await this.readJson<WorkflowExecutionRecord[]>(this.executionsPath(workspaceId, workflowId), []);
    return records.find(item => item.id === executionId && item.workspaceId === workspaceId && item.workflowId === workflowId) || null;
  }
  async listExecutions(workspaceId: string, workflowId: string) {
    assertScope(workspaceId, workflowId, 'workflow ID');
    return (await this.readJson<WorkflowExecutionRecord[]>(this.executionsPath(workspaceId, workflowId), []))
      .filter(item => item.workspaceId === workspaceId && item.workflowId === workflowId);
  }
}

export default WorkspaceWorkflowRepository;
