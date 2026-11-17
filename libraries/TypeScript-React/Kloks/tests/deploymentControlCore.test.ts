import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  pauseCloudflarePagesProject,
  pauseVercelProject,
  resumeCloudflarePagesProject,
  resumeVercelProject,
} from '../packages/backend/src/core/deploymentControlCore';

afterEach(() => vi.restoreAllMocks());

describe('deployment control core', () => {
  it('pauses a Vercel project through the project pause endpoint', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 200 }));
    await expect(pauseVercelProject('prj_123', { token: 'tok_123', teamId: 'team_123' })).resolves.toMatchObject({ controlState: 'PAUSED' });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.vercel.com/v1/projects/prj_123/pause?teamId=team_123',
      expect.objectContaining({ method: 'POST', headers: expect.objectContaining({ Authorization: 'Bearer tok_123' }) })
    );
  });

  it('resumes a Vercel project through the same pause resource', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 200 }));
    await resumeVercelProject('prj_123', { token: 'tok_123' });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.vercel.com/v1/projects/prj_123/unpause',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('pauses Cloudflare Pages while preserving the existing preview policy', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify({ result: { source: { type: 'github', config: { production_deployments_enabled: true, preview_deployment_setting: 'custom', repo_name: 'repo' } } } }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: true }), { status: 200 }));
    const result = await pauseCloudflarePagesProject('my-pages', { token: 'tok_cf', accountId: 'acc_cf' });
    expect(result.pauseState).toEqual({ productionDeploymentsEnabled: true, previewDeploymentSetting: 'custom' });
    expect(fetchMock.mock.calls[1][1]).toMatchObject({ method: 'PATCH' });
    expect(JSON.parse(String(fetchMock.mock.calls[1][1]?.body))).toMatchObject({ source: { config: { production_deployments_enabled: false, preview_deployment_setting: 'none', repo_name: 'repo' } } });
  });

  it('restores Cloudflare Pages from the saved pause state', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify({ result: { source: { type: 'github', config: { repo_name: 'repo', production_deployments_enabled: false, preview_deployment_setting: 'none' } } } }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: true }), { status: 200 }));
    await resumeCloudflarePagesProject('my-pages', { productionDeploymentsEnabled: true, previewDeploymentSetting: 'custom' }, { token: 'tok_cf', accountId: 'acc_cf' });
    expect(JSON.parse(String(fetchMock.mock.calls[1][1]?.body))).toMatchObject({ source: { config: { production_deployments_enabled: true, preview_deployment_setting: 'custom', repo_name: 'repo' } } });
  });

  it('does not convert provider failures into success', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ error: { message: 'denied' } }), { status: 403, statusText: 'Forbidden' }));
    await expect(pauseVercelProject('prj_123', { token: 'tok_123' })).rejects.toThrow('Vercel API error (403): denied');
  });
});
