import { externalInterfaces } from '@/src/backend/AppBackend';

export async function GET(request: Request) {
  return externalInterfaces.http(request) ?? new Response('Not Found', { status: 404 });
}
export async function POST(request: Request) {
  return externalInterfaces.http(request) ?? new Response('Not Found', { status: 404 });
}
