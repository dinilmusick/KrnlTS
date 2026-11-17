import { luthFetch } from '../libraries/client/luthAuthClient.js';

export interface AikoClientAgent {
  id: string;
  name: string;
  description?: string;
}

async function call(
  workspaceId: string,
  action: string,
  payload: Record<string, unknown> = {},
) {
  const response = await luthFetch('/api/aiko', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ workspaceId, action, ...payload }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(String((data as any)?.error ?? `Aiko request failed (${response.status})`));
  }
  return data;
}

export function createAikoClientRuntime(workspaceId: string) {
  return {
    listAgents: () => call(workspaceId, 'listAgents') as Promise<AikoClientAgent[]>,
    executeAgent: (agentId: string, input: string) =>
      call(workspaceId, 'executeAgent', { agentId, query: input }),
    reportBug: (report: unknown, authToken?: string) =>
      call(workspaceId, 'reportBug', { report, authToken }),
  };
}
