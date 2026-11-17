import { WorkspaceServiceFacade } from '@ultrst-armada/kloks/backend/krnl-services';
import { workingWorkspaceService } from '@ultrst-armada/kloks/backend/node';

const FILE_PATH = 'kone/performance.json';
const jsonHeaders = { 'Content-Type': 'application/json' };

function response(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: jsonHeaders });
}

async function ownedWorkspace(workspaceId: string, userId: string, env: Record<string, unknown>) {
  const result = await WorkspaceServiceFacade.execute<any, any>('findWorkspace', { workspaceId, env });
  const owner = result?.user;
  return Boolean(result?.workspace && owner && (owner.id === userId || owner.email === userId));
}

export async function handlePerformanceRoutes(
  request: Request,
  userId: string,
  env: Record<string, unknown>,
): Promise<Response | null> {
  const url = new URL(request.url);
  if (url.pathname !== '/api/performance') return null;

  const workspaceId = request.headers.get('x-workspace-id') || url.searchParams.get('workspaceId') || '';
  if (!workspaceId) return response({ success: false, error: 'workspaceId is required' }, 400);

  try {
    if (!(await ownedWorkspace(workspaceId, userId, env))) {
      return response({ success: false, error: 'Workspace not found.' }, 404);
    }

    if (request.method === 'GET') {
      try {
        const raw = await workingWorkspaceService.readFile(workspaceId, FILE_PATH);
        const text = typeof raw === 'string' ? raw : new TextDecoder().decode(raw);
        return response({ success: true, performance: JSON.parse(text) });
      } catch (error) {
        if (/not found|no such file|missing/i.test(error instanceof Error ? error.message : String(error))) {
          return response({ success: true, performance: null });
        }
        throw error;
      }
    }

    if (request.method !== 'PUT') {
      return response({ success: false, error: 'Method not allowed' }, 405);
    }

    const body = await request.json() as any;
    const performance = body?.performance;
    if (!performance || typeof performance !== 'object' || typeof performance.id !== 'string' ||
      typeof performance.name !== 'string' || !Array.isArray(performance.songs)) {
      return response({ success: false, error: 'A valid performance definition is required.' }, 400);
    }

    await workingWorkspaceService.writeFile(
      workspaceId,
      FILE_PATH,
      JSON.stringify(performance),
    );
    return response({ success: true, performance });
  } catch (error) {
    return response({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }, 500);
  }
}
