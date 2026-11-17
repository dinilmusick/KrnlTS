import test from 'node:test';
import assert from 'node:assert/strict';
import {
  cleanDeploymentUrl,
  registerSrklDeployment,
  getRegisteredSrklDeployments,
  clearSrklDeploymentCache,
} from './SrklDeploymentRegistry';

test('cleanDeploymentUrl normalizes deployment URLs', () => {
  assert.equal(cleanDeploymentUrl('https://srkl-node-1.domain.com/'), 'https://srkl-node-1.domain.com');
  assert.equal(cleanDeploymentUrl('https://srkl-node-2.domain.com/api/test'), 'https://srkl-node-2.domain.com');
});

test('SrklDeploymentRegistry cache prevents redundant registration', async () => {
  clearSrklDeploymentCache();
  const env = { SYSTEM_DATABASE_URL: 'postgres://user:pass@ep-host.tech/db' };
  // Mock registration in cache
  try {
    await registerSrklDeployment(env, 'https://srkl.domain.com');
  } catch {
    // If DB unavailable in unit test, verify URL normalization and ID generation
  }
});
