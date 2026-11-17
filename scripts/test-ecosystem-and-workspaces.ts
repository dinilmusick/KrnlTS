/**
 * Test Suite: Workspace Deletion, JSON Export/Import Cloning, and Ecosystem Credential Server
 */
import assert from 'assert';
import http from 'http';
import { createApp } from '../src/server/AppFactory';
import { query } from '../src/server/db';

async function runTests() {
  console.log('--- 1. Initializing SRKL App Factory & In-Memory Server ---');
  const app = await createApp();
  const server = http.createServer(app);

  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve());
  });

  const port = (server.address() as any).port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`✅ SRKL Test Server listening on ${baseUrl}`);

  const testUserId = `usr-test-${Date.now()}`;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    if (String(input).endsWith('/api/session')) {
      return new Response(JSON.stringify({ authenticated: true, user: { id: testUserId, email: `${testUserId}@example.com`, name: 'Test User', emailVerified: true } }), {
        status: 200, headers: { 'content-type': 'application/json' },
      });
    }
    return originalFetch(input, init);
  }) as typeof fetch;
  const authHeaders = { authorization: 'Bearer test-luth-session', 'Content-Type': 'application/json' };

  await query(
    `INSERT INTO "srkl_application_profiles" (id, email, username, name, role, app_profiles, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
     ON CONFLICT (id) DO NOTHING`,
    [testUserId, `${testUserId}@example.com`, `testuser_${Date.now()}`, 'Test User', 'user', JSON.stringify({ srkl: { workspaces: [] } })]
  );

  try {
    console.log('--- 2. Creating New Workspace ---');
    const createRes = await fetch(`${baseUrl}/api/workspaces`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ name: 'Alpha Storage Vault', storageProvider: 'local_fs' }),
    });
    assert.strictEqual(createRes.status, 200, 'Create workspace status 200');
    const createData = await createRes.json();
    assert(createData.success, 'Create workspace success');
    const ws1 = createData.workspace;
    assert.strictEqual(ws1.name, 'Alpha Storage Vault');
    console.log(`✅ Workspace created: ${ws1.id} (${ws1.name})`);

    console.log('--- 3. Adding Service Accounts (Backblaze B2 & AWS S3) ---');
    const b2Acc = {
      id: 'acc-b2-prod',
      serviceId: 'backblaze-b2',
      name: 'Production B2 Archive',
      credentials: {
        keyId: 'K000TESTKEYID123',
        applicationKey: 'appKeySecret_9876543210',
        region: 'us-west-002',
        bucketName: 'vault-backups-2026',
      },
      status: 'ONLINE',
    };
    const addB2Res = await fetch(`${baseUrl}/api/user/services`, {
      method: 'POST',
      headers: { ...authHeaders, 'x-workspace-id': ws1.id },
      body: JSON.stringify({ serviceAccount: b2Acc }),
    });
    assert.strictEqual(addB2Res.status, 200, 'Add B2 account status 200');

    const s3Acc = {
      id: 'acc-s3-prod',
      serviceId: 'aws-s3',
      name: 'Primary S3 Bucket',
      credentials: {
        accessKeyId: 'AKIA_TEST_ACCESS_KEY',
        secretAccessKey: 'secret_s3_key_value_xyz',
        region: 'us-east-1',
        bucketName: 'enterprise-documents',
      },
      status: 'ONLINE',
    };
    const addS3Res = await fetch(`${baseUrl}/api/user/services`, {
      method: 'POST',
      headers: { ...authHeaders, 'x-workspace-id': ws1.id },
      body: JSON.stringify({ serviceAccount: s3Acc }),
    });
    assert.strictEqual(addS3Res.status, 200, 'Add S3 account status 200');
    console.log('✅ Backblaze B2 & AWS S3 accounts successfully stored in SQLite vault.');

    console.log('--- 4. Testing Ecosystem Service Broker API ---');
    // Query ecosystem for storage accounts
    const ecoRes = await fetch(`${baseUrl}/api/ecosystem/services?types=backblaze-b2,aws-s3`, {
      headers: { ...authHeaders, 'x-workspace-id': ws1.id },
    });
    assert.strictEqual(ecoRes.status, 200, 'Ecosystem query status 200');
    const ecoData = await ecoRes.json();
    assert(ecoData.success, 'Ecosystem query success');
    assert.strictEqual(ecoData.count, 2, 'Found 2 storage accounts');
    assert(ecoData.services.some((s: any) => s.id === 'acc-b2-prod'), 'Contains Backblaze account');
    assert(ecoData.services.some((s: any) => s.id === 'acc-s3-prod'), 'Contains S3 account');
    console.log('✅ Ecosystem API successfully filtered and returned declared service types.');

    // Query ecosystem using family alias 'storage'
    const aliasRes = await fetch(`${baseUrl}/api/ecosystem/services?types=storage`, {
      headers: { ...authHeaders, 'x-workspace-id': ws1.id },
    });
    const aliasData = await aliasRes.json();
    assert.strictEqual(aliasData.count, 2, 'Family alias "storage" matched both B2 and S3');
    console.log('✅ Family alias "storage" correctly matched both Backblaze B2 and AWS S3.');

    console.log('--- 5. Testing Workspace JSON Export (Download) ---');
    const exportRes = await fetch(`${baseUrl}/api/workspaces/${ws1.id}/export`, {
      headers: authHeaders,
    });
    assert.strictEqual(exportRes.status, 200, 'Export status 200');
    const exportBundle = await exportRes.json();
    assert.strictEqual(exportBundle.version, 1, 'Bundle version 1');
    assert.strictEqual(exportBundle.app, 'srkl', 'Bundle app srkl');
    assert.strictEqual(exportBundle.workspace.id, ws1.id, 'Bundle workspace ID matches');
    assert.strictEqual(exportBundle.serviceAccounts.length, 2, 'Exported 2 service accounts');
    console.log(`✅ Exported workspace bundle with ${exportBundle.serviceAccounts.length} accounts.`);

    console.log('--- 6. Testing Workspace JSON Import (Cloning) ---');
    const importRes = await fetch(`${baseUrl}/api/workspaces`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        name: 'Cloned Vault Beta',
        storageProvider: 'local_fs',
        importData: exportBundle,
      }),
    });
    assert.strictEqual(importRes.status, 200, 'Import clone status 200');
    const importData = await importRes.json();
    assert(importData.success, 'Import success');
    const ws2 = importData.workspace;
    assert.strictEqual(ws2.name, 'Cloned Vault Beta');
    assert.strictEqual(importData.importSummary.importedAccounts, 2, '2 accounts imported');
    console.log(`✅ Cloned workspace created: ${ws2.id} with all 2 accounts restored.`);

    // Verify cloned workspace has the accounts in its vault
    const clonedEcoRes = await fetch(`${baseUrl}/api/ecosystem/services?types=all`, {
      headers: { ...authHeaders, 'x-workspace-id': ws2.id },
    });
    const clonedEcoData = await clonedEcoRes.json();
    assert.strictEqual(clonedEcoData.count, 2, 'Cloned vault has 2 accounts');
    console.log('✅ Cloned workspace vault verified with identical service accounts.');

    console.log('--- 7. Testing Workspace Deletion ---');
    const deleteRes = await fetch(`${baseUrl}/api/workspaces/${ws2.id}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    assert.strictEqual(deleteRes.status, 200, 'Delete status 200');
    const deleteData = await deleteRes.json();
    assert(deleteData.success, 'Delete success');
    assert(!deleteData.workspaces.some((w: any) => w.id === ws2.id), 'Deleted workspace removed from list');
    assert.strictEqual(deleteData.activeWorkspaceId, ws1.id, 'Active workspace safely fell back to remaining workspace');
    console.log('✅ Workspace deletion and active workspace fallback confirmed.');

    console.log('--- 8. Testing Canonical Health Endpoint ---');
    const healthRes = await fetch(baseUrl + '/api/health?serviceId=google-ai-studio', {
      headers: authHeaders,
    });
    assert.strictEqual(healthRes.status, 200, 'Health endpoint status 200');
    const healthData = await healthRes.json();
    assert(healthData.success, 'Health endpoint success');
    assert.strictEqual(healthData.status, 'STANDBY', 'Health endpoint returns safe standby without credentials');
    console.log('✅ Canonical service health endpoint returned safe standby state.');

    console.log('\n=======================================================');
    console.log('🎉 ALL 8 INTEGRATION TESTS PASSED WITH 100% COMPLIANCE!');
    console.log('=======================================================\n');
    process.exit(0);
  } finally {
    try { await query('DELETE FROM "srkl_application_profiles" WHERE id = $1', [testUserId]); } catch {}
    globalThis.fetch = originalFetch;
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
