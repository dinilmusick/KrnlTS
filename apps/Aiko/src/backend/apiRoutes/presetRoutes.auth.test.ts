import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import type { AddressInfo } from 'node:net';
import { presetRouter } from './presetRoutes.js';

test('shared Intelligence Spec mutations reject non-administrator principals', async t => {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    (req as any).aikoPrincipal = { id: 'user-one', role: 'user' };
    next();
  });
  app.use(presetRouter);
  const server = app.listen(0);
  t.after(() => new Promise<void>(resolve => server.close(() => resolve())));
  const address = server.address() as AddressInfo;
  const base = 'http://127.0.0.1:' + address.port;
  for (const path of ['/presets', '/intelligence-specs', '/preferences-presets', '/preference-specs']) {
    const response = await fetch(base + path, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'forbidden', sigilId: 'test', tensor: [] }),
    });
    assert.equal(response.status, 403, path + ' must be administrator-only');
  }
});
