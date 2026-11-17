const BASE_CORS_HEADERS = {
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Workspace-Id, X-Vault-Key, X-App-ID',
  'Vary': 'Origin',
};

export function corsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('origin');
  const requestOrigin = new URL(request.url).origin;
  if (origin && origin === requestOrigin) {
    return { ...BASE_CORS_HEADERS, 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true' };
  }
  return BASE_CORS_HEADERS;
}

export const jsonRes = (request: Request, data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', ...corsHeaders(request) } });

export async function parseBody(req: Request) {
  try {
    return await req.json();
  } catch {
    return {};
  }
}
