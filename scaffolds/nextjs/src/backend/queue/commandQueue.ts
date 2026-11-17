// Node-side in-process command scheduling. Fetch/Worker entrypoints do not import this module.
import { PQueueAdapter } from "../../libraries/skipo/systems/execution/PQueueAdapter";
import type { ExecutionJob, JobPriority } from "../../libraries/skipo/systems/execution/types";
import { DispatchCommandSchema, formatZodError, CommandPriority } from "../../libraries/validation/schemas";

const COMMAND_HANDLERS: Record<string, (payload: Record<string, unknown>) => Promise<unknown>> = {
  ECHO: async (payload) => ({ echoedAt: new Date().toISOString(), ...payload }),
  WORKSPACE_SYNC: async (payload) => ({ status: "SYNCED", workspaceId: payload.workspaceId || "ws-default", syncedAt: new Date().toISOString() }),
  GRAPH_PROCESS: async (payload) => ({ status: "PROCESSED", nodeCount: Array.isArray(payload.nodes) ? payload.nodes.length : 0, processedAt: new Date().toISOString() }),
};

async function processCommand(job: ExecutionJob<Record<string, unknown>>) {
  const handler = COMMAND_HANDLERS[job.command.type] ?? (async (payload: Record<string, unknown>) => ({ status: "COMPLETED", payload }));
  return handler(job.command.payload);
}

export const commandQueueAdapter = new PQueueAdapter<Record<string, unknown>>({
  queueName: "skipo-command-queue",
  maxConcurrency: 5,
}, processCommand);

export async function dispatchCommand(input: { type: string; payload?: Record<string, unknown>; priority?: CommandPriority }) {
  const parsed = DispatchCommandSchema.safeParse(input);
  if (!parsed.success) return formatZodError(parsed.error);
  const { type, payload, priority } = parsed.data;
  const jobId = `cmd-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  const job: ExecutionJob<Record<string, unknown>> = {
    id: jobId,
    command: { id: jobId, type, payload },
    priority: (priority as JobPriority) || "NORMAL",
    retryPolicy: { maxAttempts: 3, backoffMs: 1000 },
    createdAt: Date.now(),
    status: "QUEUED",
  };
  const enqueuedId = commandQueueAdapter.enqueue(job);
  return { success: true, jobId: enqueuedId, status: "QUEUED", type };
}

export async function getCommandStatus(jobId: string) {
  if (!jobId) return { success: false, error: "Job ID is required" };
  const status = commandQueueAdapter.getJobStatus(jobId);
  return { success: true, jobId, status: status || "UNKNOWN" };
}

export async function closeCommandQueue() {
  await commandQueueAdapter.close();
}
