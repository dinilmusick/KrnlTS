import { createFodRuntime } from '../AppBackend.js';

const jsonHeaders = { 'Content-Type': 'application/json' };

export async function handleFodRoutes(request: Request): Promise<Response | null> {
  const url = new URL(request.url);
  if (!url.pathname.startsWith('/api/fod')) return null;

  const workspaceId = request.headers.get('x-workspace-id') || url.searchParams.get('workspaceId') || 'default';
  const runtime = createFodRuntime(workspaceId);

  try {
    if (url.pathname === '/api/fod/nodes' && request.method === 'GET') {
      return new Response(JSON.stringify(runtime.getNodeDefinitions()), { headers: jsonHeaders });
    }

    if (request.method === 'GET') {
      const flowId = url.searchParams.get('flowId');
      return new Response(
        JSON.stringify(flowId ? await runtime.getFlow(flowId) : await runtime.listFlows()),
        { headers: jsonHeaders },
      );
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), { status: 405, headers: jsonHeaders });
    }

    const body = await request.json() as any;
    const result =
      body.action === 'save'
        ? await runtime.saveFlow(body.flow)
        : body.action === 'delete'
          ? await runtime.deleteFlow(String(body.flowId))
          : body.action === 'execute'
            ? await runtime.executeFlow(String(body.flowId), body.input)
            : { success: false, error: 'Unsupported FOD action' };

    const failed = typeof result === 'object' && result !== null && 'success' in result && (result as any).success === false;
    return new Response(JSON.stringify(result), { status: failed ? 400 : 200, headers: jsonHeaders });
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: jsonHeaders },
    );
  }
}
