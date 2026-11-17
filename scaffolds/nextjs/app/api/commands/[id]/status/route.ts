// ══════════════════════════════════════════════════════════════════════════════
// NEXT.JS API ROUTE: /api/commands/[id]/status
// Architecture: BullMQ command status inspector
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { getCommandStatus } from '../../../../../src/backend/queue/commandQueue';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await getCommandStatus(id);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
