import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('Express and Worker expose the same native workflow boundary', async () => {
  const express = await readFile(new URL('../apiRoutes/apiRoutes.ts', import.meta.url), 'utf8');
  const worker = await readFile(new URL('./httpsAdapter.ts', import.meta.url), 'utf8');
  for (const marker of ['workflowService', 'workflows', 'graph', 'execute']) {
    assert.match(express, new RegExp(marker, 'i'));
    assert.match(worker, new RegExp(marker, 'i'));
  }
  const forbiddenPattern = new RegExp(['FOD', 'BASE', 'URL'].join('_') + '|' + ['AIKO', 'API', 'URL'].join('_') + '|' + ['AIKO', 'MODULE', 'TOKEN'].join('_') + '|FodClient', 'i');
  assert.doesNotMatch(express, forbiddenPattern);
  assert.doesNotMatch(worker, forbiddenPattern);
});
