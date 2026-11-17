import { createFodRuntime } from '../SrklBackend';

export async function handleFodRoutes(request: Request): Promise<Response | null> {
  const url = new URL(request.url);
  if (!url.pathname.startsWith('/api/fod')) return null;
  const workspaceId = url.searchParams.get('workspaceId') || 'default';
  const runtime = createFodRuntime(workspaceId);
  if (url.pathname === '/api/fod/nodes' && request.method === 'GET') {
    return new Response(JSON.stringify(runtime.getNodeDefinitions()), { headers: { 'Content-Type': 'application/json' } });
  }
  if (request.method === 'GET') {
    const flowId = url.searchParams.get('flowId');
    return new Response(JSON.stringify(flowId ? await runtime.getFlow(flowId) : await runtime.listFlows()), { headers: { 'Content-Type': 'application/json' } });
  }
  const body = await request.json() as any;
  const result = body.action === 'save' ? await runtime.saveFlow(body.flow) : body.action === 'delete' ? await runtime.deleteFlow(String(body.flowId)) : body.action === 'execute' ? await runtime.executeFlow(String(body.flowId)) : { error: 'Unsupported FOD action' };
  return new Response(JSON.stringify(result), { status: 'error' in (result as any) ? 400 : 200, headers: { 'Content-Type': 'application/json' } });
}
