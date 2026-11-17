import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import {
  getAikoApiKey,
  getCachedAikoAccount,
  setCachedAikoAccount,
  clearCachedAikoAccount,
  syncAikoAccount,
} from './aikoSrklAccount';

describe('Aiko SRKL account', () => {
  beforeEach(() => {
    clearCachedAikoAccount();
  });

  it('reads the API key only from the canonical account credential payload', () => {
    assert.strictEqual(
      getAikoApiKey({
        id: 'a1',
        serviceId: 'aiko',
        provider: 'AIKO',
        category: 'ai',
        name: 'Aiko',
        status: 'CONNECTED',
        credentials: { apiKey: 'test-key' },
      }),
      'test-key'
    );
  });

  it('rejects an account without an API key', () => {
    assert.throws(
      () =>
        getAikoApiKey({
          id: 'a1',
          serviceId: 'aiko',
          provider: 'AIKO',
          category: 'ai',
          name: 'Aiko',
          status: 'CONNECTED',
          credentials: {},
        }),
      /apiKey/
    );
  });

  it('throws an informative error if neither account nor cached record is available', () => {
    assert.throws(() => getAikoApiKey(), /No synchronized Aiko SRKL account found in local cache/);
  });

  it('reads API key from local cache when no explicit account is passed (offline runtime)', () => {
    setCachedAikoAccount({
      id: 'a1-cached',
      serviceId: 'aiko',
      provider: 'AIKO',
      category: 'ai',
      name: 'Cached Aiko Gateway',
      status: 'CONNECTED',
      credentials: { apiKey: 'offline-cached-key' },
    });

    assert.strictEqual(getCachedAikoAccount()?.id, 'a1-cached');
    assert.strictEqual(getAikoApiKey(), 'offline-cached-key');

    clearCachedAikoAccount();
    assert.strictEqual(getCachedAikoAccount(), undefined);
    assert.throws(() => getAikoApiKey(), /No synchronized Aiko SRKL account/);
  });

  it('syncAikoAccount explicitly fetches from SRKL and updates local cache', async () => {
    const originalFetch = globalThis.fetch;
    let fetchCount = 0;
    globalThis.fetch = async () => {
      fetchCount++;
      return new Response(
        JSON.stringify({
          success: true,
          count: 1,
          workspaceId: 'ws-1',
          accounts: [
            {
              id: 'a1-synced',
              serviceId: 'aiko',
              provider: 'AIKO',
              category: 'ai',
              name: 'Aiko Service',
              status: 'CONNECTED',
              credentials: { apiKey: 'sk-synced-from-srkl' },
            },
          ],
        }),
        { status: 200 }
      );
    };

    try {
      const synced = await syncAikoAccount({ srklUrl: 'https://srkl.mock', userId: 'usr-1' });
      assert.strictEqual(fetchCount, 1);
      assert.strictEqual(synced?.id, 'a1-synced');
      assert.strictEqual(getCachedAikoAccount()?.id, 'a1-synced');

      // Subsequent runtime key resolution operates offline with ZERO network calls
      assert.strictEqual(getAikoApiKey(), 'sk-synced-from-srkl');
      assert.strictEqual(fetchCount, 1);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

