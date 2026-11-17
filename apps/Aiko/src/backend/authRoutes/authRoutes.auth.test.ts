import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import type { AddressInfo } from 'node:net';
import { authRouter, databaseRouter } from './authRoutes.js';

test('database and authenticated Luth routes reject unauthenticated requests', async t => {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRouter);
  app.use('/api/database', databaseRouter);
  const server = app.listen(0);
  t.after(() => new Promise<void>(resolve => server.close(() => resolve())));
  const address = server.address() as AddressInfo;
  const base = 'http://127.0.0.1:' + address.port;
  const cases: Array<[string, string]> = [
    ['GET', '/api/auth/me'],
    ['GET', '/api/auth/workspaces'],
    ['GET', '/api/database/status'],
    ['POST', '/api/database/test'],
  ];
  for (const [method, path] of cases) {
    const response = await fetch(base + path, { method });
    assert.equal(response.status, 401, method + ' ' + path + ' must require a Luth session');
  }
});
