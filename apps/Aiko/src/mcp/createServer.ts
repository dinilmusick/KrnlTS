import { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import type { Env } from '../backend/adapters/httpsAdapter.js';
import { fetchHandler } from '../backend/adapters/httpsAdapter.js';
import { mcpEngine } from '../backend/mcp/mcpEngine.js';

const localApiSchema = z.object({
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
  path: z.string().regex(/^\/(?:api(?:\/|$)|health(?:\/|$))/),
  body: z.record(z.string(), z.unknown()).optional(),
  workspaceId: z.string().optional(),
});

type LocalApiArgs = {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  body?: Record<string, unknown>;
  workspaceId?: string;
};

async function callLocalApi(args: LocalApiArgs, env: Env, authorization: string): Promise<{ status: number; data: unknown }> {
  const target = new URL(args.path, 'https://aiko.internal');
  const headers = new Headers({ 'content-type': 'application/json' });
  if (authorization) headers.set('authorization', authorization);
  if (args.workspaceId) headers.set('x-workspace-id', args.workspaceId);
  const request = new Request(target, {
    method: args.method,
    headers,
    body: args.method === 'GET' || args.method === 'DELETE' ? undefined : JSON.stringify(args.body || {}),
  });
  const response = await fetchHandler(request, env);
  const body = await response.text();
  let data: unknown = body;
  try { data = JSON.parse(body); } catch {}
  return { status: response.status, data };
}

const toolResult = (status: number, data: unknown) => ({
  content: [{ type: 'text' as const, text: JSON.stringify({ status, data }, null, 2) }],
  ...(status >= 400 ? { isError: true } : {}),
});

export function createAikoMcpServer(env: Env = {}, authorization = ''): McpServer {
  const server = new McpServer({ name: 'aiko', version: '1.0.0' });

  server.registerTool('aiko_health', {
    title: 'Aiko Health',
    description: 'Check Aiko application health.',
  }, async () => {
    const response = await callLocalApi({ method: 'GET', path: '/health' }, env, authorization);
    return toolResult(response.status, response.data);
  });

  server.registerTool('aiko_list_providers', {
    title: 'List Aiko AI Providers',
    description: 'List AI providers available in Aiko.',
  }, async () => {
    const response = await callLocalApi({ method: 'GET', path: '/api/providers' }, env, authorization);
    return toolResult(response.status, response.data);
  });

  server.registerTool('aiko_list_system_tools', {
    title: 'List Aiko System Tools',
    description: 'List system tools registered with Aiko’s Kloks MCP engine.',
  }, async () => toolResult(200, mcpEngine.getSystemTools()));

  server.registerTool('aiko_api_request', {
    title: 'Call Aiko API',
    description: 'Call an Aiko API route. Requests are authorized using the Luth bearer token on the MCP HTTP request.',
    inputSchema: localApiSchema,
  }, async (args) => {
    const response = await callLocalApi(args as LocalApiArgs, env, authorization);
    return toolResult(response.status, response.data);
  });

  server.registerTool('aiko_jsonrpc', {
    title: 'Execute Aiko System JSON-RPC',
    description: 'Dispatch a JSON-RPC request to Aiko’s registered Kloks MCP system tools.',
    inputSchema: z.object({ request: z.record(z.string(), z.unknown()) }),
  }, async ({ request }) => {
    const response = await mcpEngine.handleJsonRpc(request);
    return toolResult(200, response);
  });

  return server;
}
