import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import type { AddressInfo } from 'node:net';
import { runtimeCredentialRouter } from './runtimeCredentialRoutes.js';

test('runtime credential workspace routes reject missing Luth sessions before storage access', async t => {
  const app = express();
  app.use(express.json());
  app.use('/api', runtimeCredentialRouter);
  const server = app.listen(0);
  t.after(() => new Promise<void>(resolve => server.close(() => resolve())));
  const address = server.address() as AddressInfo;
  const base = 'http://127.0.0.1:' + address.port + '/api';
  const cases: Array<[string, string, unknown?]> = [
    ['GET', '/workspaces/workspace-one/runtime/accounts'],
    ['POST', '/workspaces/workspace-one/runtime/accounts', { providerId: 'fly-io', displayName: 'Test', fields: {} }],
    ['PUT', '/workspaces/workspace-one/runtime/accounts/account-one', { providerId: 'fly-io', displayName: 'Test' }],
    ['DELETE', '/workspaces/workspace-one/runtime/accounts/account-one'],
  ];
  for (const [method, path, body] of cases) {
    const response = await fetch(base + path, {
      method,
      headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    assert.equal(response.status, 401, method + ' ' + path + ' must reject missing Luth sessions');
  }
});
