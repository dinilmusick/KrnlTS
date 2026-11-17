// ══════════════════════════════════════════════════════════════════════════════
// SRKL SYNC BRIDGE SERVICE (SKIPO INVARIANT I7-I10)
// ══════════════════════════════════════════════════════════════════════════════

export async function syncSrklAccounts(
  userId: string,
  sessionToken: string,
  srklUrl?: string
): Promise<{ success: boolean; accounts?: any[]; error?: string; sourceUrl?: string }> {
  const resp = await fetch('/api/srkl/sync', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${sessionToken}`,
      'x-user-id': userId,
    },
    body: JSON.stringify({ srklUrl }),
  });
  return await resp.json();
}
