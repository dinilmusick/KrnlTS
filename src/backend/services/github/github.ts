/**
 * @file github.ts
 * @description GitHub Integration Service Facade for Srkl-Engine.
 * Conforms to APP_ARCHITECTURE_SPEC Sections 5 & 6.
 */

export const runtime: 'client' | 'server' = 'server';
export const deployment: 'local' | 'remote' = 'remote';

export const service = {
  name: 'github',
  runtime,
  deployment,
  verifyToken: async (token: string) => {
    const res = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'Srkl-Service-Hub' },
    });
    return res.ok;
  },
  listRepos: async (token: string) => {
    const res = await fetch('https://api.github.com/user/repos', {
      headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'Srkl-Service-Hub' },
    });
    return res.json();
  },
};

export const githubService = service;
