import { afterEach, describe, expect, it, vi } from 'vitest';

const { luthFetch } = vi.hoisted(() => ({ luthFetch: vi.fn() }));
vi.mock('../libraries/client/luthAuthClient.js', () => ({ luthFetch }));

import { createAikoClientRuntime } from './aikoRuntime.js';

describe('Aiko client runtime', () => {
  afterEach(() => {
    luthFetch.mockReset();
  });

  it('routes agent discovery through the authenticated application API', async () => {
    luthFetch.mockResolvedValue(
      new Response(JSON.stringify([{ id: 'agent-1', name: 'Agent One' }]), { status: 200 }),
    );

    const runtime = createAikoClientRuntime('workspace-1');
    await expect(runtime.listAgents()).resolves.toEqual([{ id: 'agent-1', name: 'Agent One' }]);

    expect(luthFetch).toHaveBeenCalledTimes(1);
    const [input, init] = luthFetch.mock.calls[0];
    expect(input).toBe('/api/aiko');
    expect(init?.method).toBe('POST');
    expect(new Headers(init?.headers).get('content-type')).toBe('application/json');
    expect(JSON.parse(String(init?.body))).toEqual({
      workspaceId: 'workspace-1',
      action: 'listAgents',
    });
  });

  it('surfaces canonical API errors instead of returning an empty result', async () => {
    luthFetch.mockResolvedValue(
      new Response(JSON.stringify({ error: 'Aiko unavailable' }), { status: 503 }),
    );

    await expect(createAikoClientRuntime('workspace-1').listAgents())
      .rejects.toThrow('Aiko unavailable');
  });
});
