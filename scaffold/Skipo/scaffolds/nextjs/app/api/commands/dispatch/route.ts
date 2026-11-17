export const runtime = 'nodejs';

// ══════════════════════════════════════════════════════════════════════════════
// NEXT.JS API ROUTE: /api/commands/dispatch
// Architecture: BullMQ command queue dispatcher with Zod boundary validation
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { dispatchCommand } from '../../../../src/backend/queue/commandQueue';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await dispatchCommand(body);
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
