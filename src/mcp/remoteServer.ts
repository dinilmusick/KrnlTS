import { createMcpHandler } from '@modelcontextprotocol/server';
import { extractLuthToken } from '@ultrst-armada/kloks/auth';
import type { Env } from '../backend/adapters/httpsAdapter.js';
import { createAikoMcpServer } from './createServer.js';

function withCors(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Accept, Mcp-Session-Id, Authorization');
  headers.set('Access-Control-Allow-Methods', 'POST, GET, DELETE, OPTIONS');
  headers.set('Access-Control-Expose-Headers', 'Mcp-Session-Id, WWW-Authenticate');
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

export async function handleRemoteMcp(request: Request, env: Env = {}): Promise<Response> {
  if (request.method === 'OPTIONS') return withCors(new Response(null, { status: 204 }));
  const token = extractLuthToken(request);
  const authorization = token ? (token.startsWith('Bearer ') ? token : `Bearer ${token}`) : '';
  const handler = createMcpHandler(() => createAikoMcpServer(env, authorization));
  return withCors(await handler.fetch(request));
}
