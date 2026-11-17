import { NextRequest, NextResponse } from 'next/server';
import { appBackend } from '@/src/backend/AppBackend';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await appBackend.services.storage.testStorageConnection(body);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
