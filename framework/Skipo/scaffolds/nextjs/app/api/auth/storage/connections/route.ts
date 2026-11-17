import { NextRequest, NextResponse } from 'next/server';
import { appBackend } from '@/src/backend/AppBackend';

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id') || undefined;
    const result = await appBackend.services.storage.getStorageConnections(userId);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id') || 'default';
    const body = await req.json();
    const result = await appBackend.services.storage.saveStorageConnection(userId, body);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
