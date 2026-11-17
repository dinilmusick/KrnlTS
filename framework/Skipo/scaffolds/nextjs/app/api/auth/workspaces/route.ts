import { NextRequest, NextResponse } from 'next/server';
import { appBackend } from '@/src/backend/AppBackend';

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id') || req.nextUrl.searchParams.get('userId') || undefined;
    const result = await appBackend.services.workspace.getWorkspaces(userId);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id') || 'default';
    const body = await req.json();
    const result = await appBackend.services.workspace.createWorkspace(userId, body);
    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
