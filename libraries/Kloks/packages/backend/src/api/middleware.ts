export type Middleware = (req: Request) => Promise<Response | null>;

export function withAuth(verifyToken: (token: string) => Promise<boolean>): Middleware {
  return async (req: Request) => {
    const authHeader = req.headers.get('authorization') ?? req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized', status: 401 }), { status: 401 });
    }

    const trimmed = authHeader.trim();
    const parts = trimmed.split(/\s+/);
    if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer' || !parts[1]) {
      return new Response(JSON.stringify({ error: 'Unauthorized', status: 401 }), { status: 401 });
    }

    const token = parts[1];
    try {
      const isValid = await verifyToken(token);
      if (!isValid) {
        return new Response(JSON.stringify({ error: 'Unauthorized', status: 401 }), { status: 401 });
      }
      return null;
    } catch {
      return new Response(JSON.stringify({ error: 'Service Unavailable', status: 503 }), { status: 503 });
    }
  };
}

export function withCors(allowedOrigin = '*'): Middleware {
  return async (req: Request) => {
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': allowedOrigin,
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }
    return null; // Next middleware/handler should add headers to actual response if needed
  };
}
