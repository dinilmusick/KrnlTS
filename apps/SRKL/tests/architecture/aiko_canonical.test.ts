import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SrklBackend, createFodRuntime, createAikoRuntime } from '../../src/backend/SrklBackend.js';
import { handleAikoRoutes } from '../../src/backend/adapters/aikoRoutes.js';
import { handleFodRoutes } from '../../src/backend/adapters/fodRoutes.js';

describe('SRKL Canonical Skipo Architecture', () => {
  it('exposes canonical FOD and Aiko service facades and runtime builders', () => {
    assert.equal(typeof createFodRuntime, 'function');
    assert.equal(typeof createAikoRuntime, 'function');
    assert.ok(SrklBackend.services.fod);
    assert.ok(SrklBackend.services.aiko);
    assert.ok(SrklBackend.services.bugReport);
  });

  it('instantiates canonical FOD runtime with GutTS and backend endpoints', () => {
    const runtime = createFodRuntime('test-workspace');
    assert.ok(runtime);
    const nodes = runtime.getNodeDefinitions();
    assert.ok(Array.isArray(nodes));
    assert.ok(nodes.length > 0);
    const hasGutts = nodes.some((n: any) => n.id?.startsWith('gutts.') || n.metadata?.apiId);
    assert.ok(hasGutts);
  });

  it('instantiates canonical Aiko runtime and executes listAgents', async () => {
    const runtime = createAikoRuntime('test-workspace');
    assert.ok(runtime);
    const agents = await runtime.listAgents();
    assert.ok(Array.isArray(agents));
    assert.ok(agents.length > 0);
    assert.equal(agents[0].id, 'skipo-application-agent');
  });

  it('handles /api/aiko listAgents route', async () => {
    const req = new Request('http://localhost/api/aiko', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'listAgents', workspaceId: 'test-workspace' }),
    });
    const res = await handleAikoRoutes(req);
    assert.ok(res);
    assert.equal(res?.status, 200);
    const data = await res?.json();
    assert.ok(Array.isArray(data));
  });

  it('handles /api/fod/nodes route', async () => {
    const req = new Request('http://localhost/api/fod/nodes?workspaceId=test-workspace', {
      method: 'GET',
    });
    const res = await handleFodRoutes(req);
    assert.ok(res);
    assert.equal(res?.status, 200);
    const data = await res?.json();
    assert.ok(Array.isArray(data));
  });
});
