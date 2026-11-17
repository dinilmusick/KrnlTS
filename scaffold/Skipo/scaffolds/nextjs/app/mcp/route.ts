import { externalInterfaces } from '@/src/backend/AppBackend';

export async function POST(request: Request) {
  return externalInterfaces.mcp(request) ?? new Response('Not Found', { status: 404 });
}
