/**
 * Test Suite: Encrypted SQLite Workspace Vault & Per-Service Logs
 */
import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { encryptVaultBuffer, decryptVaultBuffer, getDefaultWorkspaceSecret } from '../src/server/storage/cryptoVault';
import { SqliteWorkspaceManager } from '../src/server/storage/sqliteWorkspaceManager';
import { appendServiceLog, getServiceLogs } from '../src/server/storage/workspaceLogService';
import { formatCanonicalWorkspaceFolderName } from '../src/server/storage/workspaceCanonical';

async function runTests() {
  console.log('--- 1. Testing Crypto Vault AES-256-GCM ---');
  const secret = getDefaultWorkspaceSecret('usr-test', 'ws-test-1');
  const sampleData = Buffer.from('SRKL Secret Credentials Payload 2026', 'utf-8');
  const encrypted = encryptVaultBuffer(sampleData, secret);
  assert(encrypted.length > sampleData.length, 'Encrypted buffer must include header');
  const decrypted = decryptVaultBuffer(encrypted, secret);
  assert.strictEqual(decrypted.toString('utf-8'), 'SRKL Secret Credentials Payload 2026', 'Decrypted text matches');

  // Tamper test
  let tampered = false;
  try {
    const corrupted = Buffer.from(encrypted);
    corrupted[corrupted.length - 1] ^= 0xff;
    decryptVaultBuffer(corrupted, secret);
  } catch {
    tampered = true;
  }
  assert(tampered, 'Tampered buffer must fail authentication tag check');
  console.log('✅ Crypto Vault AES-256-GCM passed.');

  console.log('--- 2. Testing SQLite WebAssembly Workspace Manager ---');
  const manager = await SqliteWorkspaceManager.init();
  const testAccount = {
    id: 'acc_gemini_prod',
    serviceId: 'gemini',
    name: 'Gemini 1.5 Pro Account',
    credentials: { apiKey: 'AIzaSySecretToken_123456789' },
    status: 'configured',
    metadata: { tier: 'pro', maxRpm: 120 },
  };

  manager.upsertServiceAccount(testAccount);
  const accounts = manager.getServiceAccounts();
  assert.strictEqual(accounts.length, 1);
  assert.strictEqual(accounts[0].id, 'acc_gemini_prod');
  assert.strictEqual(accounts[0].credentials.apiKey, 'AIzaSySecretToken_123456789');

  // Custom definition test
  manager.upsertCustomDefinition({
    identifier: 'custom_mistral',
    name: 'Mistral Large Hub',
    endpoints: ['/v1/chat/completions'],
  });
  const customDefs = manager.getCustomDefinitions();
  assert.strictEqual(customDefs.length, 1);
  assert.strictEqual(customDefs[0].name, 'Mistral Large Hub');

  // Export and encrypted reload
  const exported = manager.exportBinary();
  const encExported = encryptVaultBuffer(exported, secret);
  const decExported = decryptVaultBuffer(encExported, secret);
  const reloadedManager = await SqliteWorkspaceManager.init(decExported);
  const reloadedAccounts = reloadedManager.getServiceAccounts();
  assert.strictEqual(reloadedAccounts.length, 1);
  assert.strictEqual(reloadedAccounts[0].credentials.apiKey, 'AIzaSySecretToken_123456789');
  console.log('✅ SQLite WebAssembly Workspace Manager & Persistence passed.');

  console.log('--- 3. Testing Per-Service Workspace Log Folders ---');
  const canonicalFolder = formatCanonicalWorkspaceFolderName('srkl', 'dinil', 'test_vault');
  const testPrefix = path.join('/tmp', canonicalFolder);
  if (fs.existsSync(testPrefix)) fs.rmSync(testPrefix, { recursive: true, force: true });

  await appendServiceLog(null, testPrefix, {
    serviceId: 'gemini',
    action: 'CHAT_COMPLETION',
    status: 'ok',
    latencyMs: 142,
    details: 'Prompt tokens: 50, completion tokens: 200',
  });

  await appendServiceLog(null, testPrefix, {
    serviceId: 'gemini',
    action: 'EMBEDDINGS',
    status: 'ok',
    latencyMs: 45,
    details: 'Generated embeddings for document',
  });

  const logs = await getServiceLogs(null, testPrefix, 'gemini');
  assert.strictEqual(logs.length, 2, 'Must retrieve two service log events');
  assert.strictEqual(logs[0].action, 'EMBEDDINGS');
  assert.strictEqual(logs[1].action, 'CHAT_COMPLETION');

  const jsonlFile = path.join(testPrefix, 'logs', 'gemini', 'activity.jsonl');
  assert(fs.existsSync(jsonlFile), 'activity.jsonl must exist in service log folder');
  console.log('✅ Per-Service Workspace Log Folders passed.');

  // Clean up test folder
  fs.rmSync(testPrefix, { recursive: true, force: true });
  console.log('\n🎉 ALL WORKSPACE VAULT TESTS PASSED SUCCESSFULLY!');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
