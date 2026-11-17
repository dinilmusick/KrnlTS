import { describe, expect, it, vi } from 'vitest';
import { GitHubActionsClient } from './githubActionsService.js';

describe('GitHubActionsService', () => {
  it('authenticates requests without exposing the token in the request URL', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(JSON.stringify({ workflow_runs: [] }), { status: 200 }));
    const client = new GitHubActionsClient({ token: 'secret-token', apiBaseUrl: 'https://example.test', fetchImpl });
    await client.listWorkflowRuns('owner/repo', 'ci.yml', 'main');
    const [, init] = fetchImpl.mock.calls[0];
    expect(fetchImpl.mock.calls[0][0]).toBe('https://example.test/repos/owner/repo/actions/workflows/ci.yml/runs?branch=main');
    expect((init as RequestInit).headers).toMatchObject({ Authorization: 'Bearer secret-token' });
    expect(String(fetchImpl.mock.calls[0][0])).not.toContain('secret-token');
  });

  it('dispatches a workflow with an explicit ref and inputs', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    const client = new GitHubActionsClient({ token: 'secret-token', apiBaseUrl: 'https://example.test', fetchImpl });
    await client.dispatchWorkflow('owner/repo', 'development.yml', 'main', { task: 'test' });
    const [, init] = fetchImpl.mock.calls[0];
    expect(init).toMatchObject({ method: 'POST', body: JSON.stringify({ ref: 'main', inputs: { task: 'test' } }) });
  });
});
