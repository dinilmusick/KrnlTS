import { describe, expect, it } from 'vitest';
import {
  SrklAccountClient,
  createSrklAccountClient,
  mergeSrklAccounts,
  type SrklAccount,
} from './srklAccountService';

describe('SrklAccountClient & mergeSrklAccounts', () => {
  it('✓ account client request construction & ✓ app ID propagation & ✓ manifest propagation', async () => {
    let capturedUrl: string | undefined;
    let capturedInit: RequestInit | undefined;

    const client = createSrklAccountClient({
      baseUrl: 'https://srkl.example///',
      userId: 'user-xyz',
      appId: 'depm-app',
      fetchImpl: async (input, init) => {
        capturedUrl = String(input);
        capturedInit = init;
        return new Response(
          JSON.stringify({
            success: true,
            count: 1,
            workspaceId: 'ws-root',
            accounts: [],
          }),
          { status: 200 }
        );
      },
    });

    await client.sync({
      appName: 'DEPM App',
      categories: ['deployment', 'storage'],
      requiredServices: ['vercel', 'backblaze_b2'],
    });

    expect(capturedUrl).toBe('https://srkl.example/api/ecosystem/accounts');
    expect(capturedInit?.method).toBe('POST');
    const headers = capturedInit?.headers as Record<string, string>;
    expect(headers['content-type']).toBe('application/json');
    expect(headers['x-user-id']).toBe('user-xyz');
    expect(headers['x-app-id']).toBe('depm-app');

    const body = JSON.parse(String(capturedInit?.body));
    expect(body.appId).toBe('depm-app');
    expect(body.appName).toBe('DEPM App');
    expect(body.categories).toEqual(['deployment', 'storage']);
    expect(body.requiredServices).toEqual(['vercel', 'backblaze_b2']);
  });

  it('✓ successful synchronization & list propagation', async () => {
    const mockAccounts: SrklAccount[] = [
      {
        id: 'acct-vercel-1',
        serviceId: 'vercel',
        provider: 'VERCEL',
        category: 'deployment',
        name: 'Vercel Prod',
        status: 'CONNECTED',
      },
    ];

    const client = new SrklAccountClient({
      baseUrl: 'https://srkl.example',
      userId: 'user-1',
      appId: 'depm',
      fetchImpl: async () =>
        new Response(
          JSON.stringify({
            success: true,
            count: 1,
            workspaceId: 'ws-1',
            accounts: mockAccounts,
          }),
          { status: 200 }
        ),
    });

    const result = await client.list();
    expect(result.success).toBe(true);
    expect(result.count).toBe(1);
    expect(result.workspaceId).toBe('ws-1');
    expect(result.accounts).toEqual(mockAccounts);
  });

  it('✓ failed synchronization throws error on non-200 response', async () => {
    const client = new SrklAccountClient({
      baseUrl: 'https://srkl.example',
      userId: 'user-1',
      appId: 'depm',
      fetchImpl: async () => new Response('Internal Server Error', { status: 500 }),
    });

    await expect(client.sync()).rejects.toThrow('SRKL account sync failed: 500');
  });

  it('✓ service filtering with getByService', async () => {
    const mockAccounts: SrklAccount[] = [
      {
        id: 'acct-gh-1',
        serviceId: 'github',
        provider: 'GITHUB',
        category: 'vcs',
        name: 'GitHub Account',
        status: 'CONNECTED',
      },
      {
        id: 'acct-aiko-1',
        serviceId: 'aiko',
        provider: 'AIKO',
        category: 'ai',
        name: 'Aiko Gateway',
        status: 'CONNECTED',
        credentials: { apiKey: 'sk-aiko-test-123' },
      },
    ];

    const client = new SrklAccountClient({
      baseUrl: 'https://srkl.example',
      userId: 'user-1',
      appId: 'aiko',
      fetchImpl: async () =>
        new Response(
          JSON.stringify({
            success: true,
            count: 2,
            workspaceId: 'ws-1',
            accounts: mockAccounts,
          }),
          { status: 200 }
        ),
    });

    const aikoAcct = await client.getByService('AIKO');
    expect(aikoAcct?.id).toBe('acct-aiko-1');
    expect(aikoAcct?.credentials?.apiKey).toBe('sk-aiko-test-123');

    const missingAcct = await client.getByService('nonexistent');
    expect(missingAcct).toBeUndefined();
  });

  it('✓ category filtering', async () => {
    let capturedBody: any;
    const client = new SrklAccountClient({
      baseUrl: 'https://srkl.example',
      userId: 'user-1',
      appId: 'depm',
      fetchImpl: async (_input, init) => {
        capturedBody = JSON.parse(String(init?.body));
        return new Response(
          JSON.stringify({
            success: true,
            count: 0,
            workspaceId: 'ws-1',
            accounts: [],
          }),
          { status: 200 }
        );
      },
    });

    await client.sync({ categories: ['ai', 'storage'] });
    expect(capturedBody.categories).toEqual(['ai', 'storage']);
  });

  it('✓ local/remote account merge & ✓ SRKL identity preservation & ✓ unrelated local-state preservation', () => {
    interface LocalAccount {
      id: string;
      srklAccountId?: string;
      source?: 'SRKL' | 'LOCAL';
      syncedAt?: string;
      name: string;
      deploymentCount?: number;
      customLocalProperty?: string;
    }

    const localList: LocalAccount[] = [
      {
        id: 'local-1',
        srklAccountId: 'srkl-gh-1',
        source: 'SRKL',
        name: 'Old GitHub Name',
        deploymentCount: 15,
        customLocalProperty: 'keep-me',
      },
      {
        id: 'local-unrelated',
        name: 'Unsynced Local Item',
        customLocalProperty: 'preserve-always',
      },
    ];

    const remoteAccounts: SrklAccount[] = [
      {
        id: 'srkl-gh-1',
        serviceId: 'github',
        provider: 'GITHUB',
        category: 'vcs',
        name: 'Updated GitHub Name',
        status: 'CONNECTED',
      },
      {
        id: 'srkl-b2-2',
        serviceId: 'backblaze_b2',
        provider: 'BACKBLAZE_B2',
        category: 'storage',
        name: 'Backblaze B2',
        status: 'CONNECTED',
      },
    ];

    const merged = mergeSrklAccounts(localList, remoteAccounts);

    expect(merged).toHaveLength(3);

    // 1. Updated existing remote record
    const updated = merged.find((a) => a.srklAccountId === 'srkl-gh-1');
    expect(updated).toBeDefined();
    expect(updated?.name).toBe('Updated GitHub Name');
    expect(updated?.deploymentCount).toBe(15);
    expect(updated?.customLocalProperty).toBe('keep-me');
    expect(updated?.source).toBe('SRKL');
    expect(updated?.syncedAt).toBeDefined();

    // 2. Newly added remote record
    const added = merged.find((a) => a.srklAccountId === 'srkl-b2-2');
    expect(added).toBeDefined();
    expect(added?.name).toBe('Backblaze B2');
    expect(added?.source).toBe('SRKL');
    expect(added?.syncedAt).toBeDefined();

    // 3. Unrelated local record without srklAccountId is preserved untouched
    const unrelated = merged.find((a) => a.id === 'local-unrelated');
    expect(unrelated).toBeDefined();
    expect(unrelated?.name).toBe('Unsynced Local Item');
    expect(unrelated?.customLocalProperty).toBe('preserve-always');
  });

  it('✓ includeCredentials flag propagation & presentation list vs privileged sync', async () => {
    const bodies: any[] = [];
    const client = new SrklAccountClient({
      baseUrl: 'https://srkl.example',
      userId: 'usr-1',
      appId: 'aiko',
      fetchImpl: async (_input, init) => {
        bodies.push(JSON.parse(String(init?.body)));
        return new Response(
          JSON.stringify({ success: true, count: 0, workspaceId: 'ws-1', accounts: [] }),
          { status: 200 }
        );
      },
    });

    await client.sync();
    expect(bodies[0].includeCredentials).toBe(true);

    await client.list();
    expect(bodies[1].includeCredentials).toBe(false);
  });

  it('✓ local client-side caching & offline getCachedByService avoids network calls', async () => {
    let fetchCount = 0;
    const client = new SrklAccountClient({
      baseUrl: 'https://srkl.example',
      userId: 'usr-1',
      appId: 'aiko',
      fetchImpl: async () => {
        fetchCount++;
        return new Response(
          JSON.stringify({
            success: true,
            count: 1,
            workspaceId: 'ws-1',
            accounts: [
              {
                id: 'acc-aiko',
                serviceId: 'aiko',
                provider: 'AIKO',
                category: 'ai',
                name: 'Aiko Gateway',
                status: 'CONNECTED',
                credentials: { apiKey: 'cached-sk-123' },
              },
            ],
          }),
          { status: 200 }
        );
      },
    });

    // Before sync: cache is empty
    expect(client.getCachedAccounts()).toHaveLength(0);
    expect(client.getCachedByService('aiko')).toBeUndefined();

    // Perform explicit sync: updates cache
    await client.sync();
    expect(fetchCount).toBe(1);
    expect(client.getCachedAccounts()).toHaveLength(1);

    // getCachedByService reads from cache with 0 network calls
    const cached = client.getCachedByService('aiko');
    expect(cached?.credentials?.apiKey).toBe('cached-sk-123');
    expect(fetchCount).toBe(1);

    // getByService without forceSync uses cache with 0 network calls
    const resolved = await client.getByService('aiko');
    expect(resolved?.id).toBe('acc-aiko');
    expect(fetchCount).toBe(1);

    // getByService with forceSync: true triggers network call
    await client.getByService('aiko', { forceSync: true });
    expect(fetchCount).toBe(2);
  });

  it('✓ token and sessionToken header propagation', async () => {
    let capturedHeaders: Record<string, string> = {};
    const client = new SrklAccountClient({
      baseUrl: 'https://srkl.example',
      userId: 'usr-secure',
      appId: 'aiko',
      token: 'jwt-access-token-xyz',
      sessionToken: 'sess-token-abc',
      fetchImpl: async (_input, init) => {
        capturedHeaders = init?.headers as Record<string, string>;
        return new Response(
          JSON.stringify({ success: true, count: 0, workspaceId: 'ws-1', accounts: [] }),
          { status: 200 }
        );
      },
    });

    await client.sync();
    expect(capturedHeaders.authorization).toBe('Bearer jwt-access-token-xyz');
    expect(capturedHeaders['x-session-token']).toBe('sess-token-abc');
    expect(capturedHeaders['x-user-id']).toBe('usr-secure');
    expect(capturedHeaders['x-app-id']).toBe('aiko');
  });
});

