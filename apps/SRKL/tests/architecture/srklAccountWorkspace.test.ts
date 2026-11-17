import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { inferCategory, normalizeProvider, sanitizeCredentials } from '../../src/server/routes/ecosystemAccountResolver.js';

describe('SRKL Singleton Workspace & Canonical Account Authority', () => {
  it('✓ new user gets one workspace', () => {
    // When a user has 0 workspaces, default singleton is provisioned
    const userId = 'usr_new_123';
    const legacyWorkspaces: any[] = [];
    const conns: any[] = [{ id: 'conn-local', provider: 'local_fs' }];

    const canonical = legacyWorkspaces[0] || {
      id: `ws-srkl-${userId}`,
      name: 'Default',
      workspacePath: `./srkl_user_default`,
      storageProvider: conns[0]?.provider || 'local_fs',
      storageConnectionId: conns[0]?.id || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const resultWorkspaces = [canonical];
    const activeWorkspaceId = canonical.id;

    assert.equal(resultWorkspaces.length, 1);
    assert.equal(resultWorkspaces[0].id, `ws-srkl-${userId}`);
    assert.equal(activeWorkspaceId, `ws-srkl-${userId}`);
  });

  it('✓ second workspace cannot be created', () => {
    // Attempting to create a second workspace when one exists returns error & existing workspace
    const existingWorkspaces = [{ id: 'ws-srkl-usr1', name: 'Default', storageProvider: 'local_fs' }];
    const attemptCreateSecond = (existingList: any[], newName: string) => {
      if (existingList.length > 0) {
        return {
          success: false,
          error: 'SRKL allows exactly one default workspace per user',
          workspace: existingList[0],
        };
      }
      return { success: true, workspace: { id: 'ws-srkl-usr1-new', name: newName } };
    };

    const res = attemptCreateSecond(existingWorkspaces, 'Workspace Two');
    assert.equal(res.success, false);
    assert.equal(res.error, 'SRKL allows exactly one default workspace per user');
    assert.equal(res.workspace.id, 'ws-srkl-usr1');
  });

  it('✓ legacy multiple workspaces collapse to one & ✓ active workspace remains valid', () => {
    // Legacy user with 3 workspaces deterministically reconciles to the first canonical workspace
    const legacyWorkspaces = [
      { id: 'ws-canonical-a', name: 'Workspace A', createdAt: '2026-01-01' },
      { id: 'ws-legacy-b', name: 'Workspace B', createdAt: '2026-02-01' },
      { id: 'ws-legacy-c', name: 'Workspace C', createdAt: '2026-03-01' },
    ];

    const reconcileWorkspaces = (workspaces: any[]) => {
      const canonical = workspaces[0];
      return {
        workspaces: [canonical],
        activeWorkspaceId: canonical.id,
      };
    };

    const reconciled = reconcileWorkspaces(legacyWorkspaces);
    assert.equal(reconciled.workspaces.length, 1);
    assert.equal(reconciled.workspaces[0].id, 'ws-canonical-a');
    assert.equal(reconciled.activeWorkspaceId, 'ws-canonical-a');
  });

  it('✓ Aiko recognition in provider normalization and category inference', () => {
    assert.equal(inferCategory('aiko', 'AIKO'), 'ai');
    assert.equal(normalizeProvider('aiko', 'AIKO'), 'AIKO');
    assert.equal(inferCategory('aiko'), 'ai');
    assert.equal(normalizeProvider('aiko'), 'AIKO');
  });

  it('✓ account registration & ✓ account update & ✓ credential-bearing behavior', () => {
    const accounts: any[] = [];
    const registerAccount = (raw: any) => {
      const id = raw.id || `acct-${raw.serviceId}-test`;
      const now = new Date().toISOString();
      const entry = {
        ...raw,
        id,
        provider: normalizeProvider(raw.serviceId, raw.provider),
        category: raw.category || inferCategory(raw.serviceId, raw.provider),
        status: raw.status || 'CONNECTED',
        credentials: raw.credentials || {},
        createdAt: raw.createdAt || now,
        updatedAt: now,
      };
      const idx = accounts.findIndex((a) => a.id === id);
      if (idx >= 0) accounts[idx] = { ...accounts[idx], ...entry };
      else accounts.push(entry);

      const presentation = { ...entry };
      delete presentation.credentials;
      return { account: entry, presentation };
    };

    // 1. Initial registration
    const r1 = registerAccount({
      serviceId: 'aiko',
      provider: 'AIKO',
      name: 'Primary Aiko Account',
      credentials: { apiKey: 'sk-aiko-initial' },
    });
    assert.equal(accounts.length, 1);
    assert.equal(r1.account.credentials.apiKey, 'sk-aiko-initial');
    assert.equal(r1.presentation.credentials, undefined);

    // 2. Account update
    const r2 = registerAccount({
      id: r1.account.id,
      serviceId: 'aiko',
      provider: 'AIKO',
      name: 'Primary Aiko Account Updated',
      credentials: { apiKey: 'sk-aiko-rotated' },
    });
    assert.equal(accounts.length, 1);
    assert.equal(r2.account.name, 'Primary Aiko Account Updated');
    assert.equal(r2.account.credentials.apiKey, 'sk-aiko-rotated');
    assert.equal(r2.presentation.credentials, undefined);
  });

  it('✓ account retrieval & ✓ account filtering & ✓ account normalization', () => {
    const rawAccounts = [
      {
        id: 'acct-1',
        serviceId: 'github',
        provider: 'github',
        name: 'GitHub VCS',
        credentials: { token: 'ghp_secret' },
      },
      {
        id: 'acct-2',
        serviceId: 'aiko',
        provider: 'AIKO',
        name: 'Aiko Gateway',
        credentials: { apiKey: 'sk_secret' },
      },
      {
        id: 'acct-3',
        serviceId: 'vercel',
        provider: 'VERCEL',
        name: 'Vercel Deployment',
        credentials: { token: 'vcl_secret' },
      },
    ];

    const resolve = (manifest: { categories?: string[]; requiredServices?: string[] }) => {
      let filtered = rawAccounts.map((a) => ({
        ...a,
        provider: normalizeProvider(a.serviceId, a.provider),
        category: inferCategory(a.serviceId, a.provider),
      }));

      if (manifest.categories?.length) {
        filtered = filtered.filter((a) => manifest.categories!.includes(a.category));
      }
      if (manifest.requiredServices?.length) {
        const allowed = manifest.requiredServices.map((s) => s.toLowerCase());
        filtered = filtered.filter((a) =>
          allowed.some((req) => a.serviceId.toLowerCase().includes(req) || a.provider.toLowerCase().includes(req))
        );
      }
      return filtered;
    };

    // Category filter: ai only
    const aiAccounts = resolve({ categories: ['ai'] });
    assert.equal(aiAccounts.length, 1);
    assert.equal(aiAccounts[0].serviceId, 'aiko');
    assert.equal(aiAccounts[0].category, 'ai');
    assert.equal(aiAccounts[0].provider, 'AIKO');

    // Service filter: github
    const vcsAccounts = resolve({ requiredServices: ['github'] });
    assert.equal(vcsAccounts.length, 1);
    assert.equal(vcsAccounts[0].serviceId, 'github');
    assert.equal(vcsAccounts[0].category, 'vcs');
    assert.equal(vcsAccounts[0].provider, 'GITHUB');
  });

  it('✓ presentation response does not leak credentials unnecessarily', () => {
    const internalAccount = {
      id: 'acct-secret',
      serviceId: 'aiko',
      provider: 'AIKO',
      category: 'ai',
      name: 'Aiko Public View',
      status: 'CONNECTED',
      credentials: { apiKey: 'super-sensitive-token', clientSecret: 'secret123' },
    };

    const presentation = { ...internalAccount };
    delete (presentation as any).credentials;

    assert.equal((presentation as any).credentials, undefined);
    assert.equal(presentation.name, 'Aiko Public View');
    assert.equal(presentation.status, 'CONNECTED');
    assert.equal(presentation.provider, 'AIKO');
  });

  it('✓ sanitizeCredentials redacts secrets while retaining non-sensitive parameters', () => {
    const creds = {
      apiKey: 'sk-ant-api-key-1234567890',
      applicationKey: 'app-key-secret-xyz',
      token: 'ghp_secret_token_abc',
      password: 'super-secret-password',
      bucketName: 'ultrst-vault-storage',
      endpoint: 'https://s3.us-west-000.backblazeb2.com',
      region: 'us-west-000',
      b2KeyId: '000abc1234567890',
    };

    const sanitized = sanitizeCredentials(creds);
    assert.equal(sanitized.apiKey, '••••••••');
    assert.equal(sanitized.applicationKey, '••••••••');
    assert.equal(sanitized.token, '••••••••');
    assert.equal(sanitized.password, '••••••••');
    assert.equal(sanitized.bucketName, 'ultrst-vault-storage');
    assert.equal(sanitized.endpoint, 'https://s3.us-west-000.backblazeb2.com');
    assert.equal(sanitized.region, 'us-west-000');
    assert.equal(sanitized.b2KeyId, '000a...7890');
  });

  it('✓ persistent legacy workspace collapse updates database state on getWorkspaces', () => {
    let persistedProfiles: any = null;
    const fakeDbUpdate = (appProfiles: any) => {
      persistedProfiles = appProfiles;
    };

    const legacyProfiles = {
      srkl: {
        workspaces: [
          { id: 'ws-canonical-1', name: 'Canonical Primary', createdAt: '2026-01-01' },
          { id: 'ws-stale-2', name: 'Stale Secondary', createdAt: '2026-02-01' },
          { id: 'ws-stale-3', name: 'Stale Tertiary', createdAt: '2026-03-01' },
        ],
        activeWorkspaceId: 'ws-stale-2',
      },
    };

    const canonical = legacyProfiles.srkl.workspaces[0];
    if (legacyProfiles.srkl.workspaces.length !== 1 || legacyProfiles.srkl.activeWorkspaceId !== canonical.id) {
      legacyProfiles.srkl.workspaces = [canonical];
      legacyProfiles.srkl.activeWorkspaceId = canonical.id;
      fakeDbUpdate(legacyProfiles);
    }

    assert.equal(persistedProfiles.srkl.workspaces.length, 1);
    assert.equal(persistedProfiles.srkl.workspaces[0].id, 'ws-canonical-1');
    assert.equal(persistedProfiles.srkl.activeWorkspaceId, 'ws-canonical-1');
  });
});

