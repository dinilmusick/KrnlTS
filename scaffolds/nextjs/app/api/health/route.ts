import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'my-app',
    runtime: 'nextjs',
    timestamp: new Date().toISOString(),
  });
}
