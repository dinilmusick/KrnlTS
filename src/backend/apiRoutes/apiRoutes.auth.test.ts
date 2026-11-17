import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import type { AddressInfo } from 'node:net';
import { apiRouter } from './apiRoutes.js';

test('Express operational and MCP routes reject requests without a Luth session', async t => {
  const app = express();
  app.use(express.json());
  app.use('/api/v1', apiRouter);
  const server = app.listen(0);
  t.after(() => new Promise<void>(resolve => server.close(() => resolve())));
  const address = server.address() as AddressInfo;
  const base = 'http://127.0.0.1:' + address.port + '/api/v1';
  const cases: Array<[string, string, unknown?]> = [
    ['GET', '/keys/export'],
    ['POST', '/presets', { name: 'preset', sigilId: 'test', tensor: [] }],
    ['POST', '/keys/import', { backup: {} }],
    ['POST', '/mcp', { jsonrpc: '2.0', id: 1, method: 'tools/list' }],
    ['GET', '/mcp/tools'],
    ['POST', '/agent/mcp-query', { prompt: 'run a tool' }],
    ['GET', '/workspaces/workspace-one/workflows'],
    ['POST', '/workspaces/workspace-one/workflows/workflow-one/execute', { input: {} }],
    ['POST', '/workspaces/workspace-one/workflows/workflow-one/tool-execute', { input: {} }],
    ['POST', '/module/resolve-intelligence', { agentType: 'AIKO' }],
    ['GET', '/module/runtime/nodes'],
    ['GET', '/module/workflows/ai-agent/contract'],
    ['GET', '/module/workflows/capabilities/contract'],
    ['GET', '/module/workspaces/workspace-one/workflows/workflow-one/tool-output'],
    ['POST', '/module/workspaces/workspace-one/workflows/workflow-one/tool-execute', { input: {} }],
    ['GET', '/module/workspaces/workspace-one/runtime/accounts'],
  ];
  for (const [method, path, body] of cases) {
    const response = await fetch(base + path, {
      method,
      headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    assert.equal(response.status, 401, method + ' ' + path + ' must require Luth authentication');
  }
});

test('provider discovery remains public', async t => {
  const app = express();
  app.use('/api/v1', apiRouter);
  const server = app.listen(0);
  t.after(() => new Promise<void>(resolve => server.close(() => resolve())));
  const address = server.address() as AddressInfo;
  const response = await fetch('http://127.0.0.1:' + address.port + '/api/v1/providers');
  assert.equal(response.status, 200);
});
