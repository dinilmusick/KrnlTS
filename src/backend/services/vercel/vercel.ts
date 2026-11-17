/**
 * @file vercel.ts
 * @description Vercel Service Facade for Srkl-Engine.
 * Conforms to APP_ARCHITECTURE_SPEC Sections 5 & 6.
 */

export const runtime: 'client' | 'server' = 'server';
export const deployment: 'local' | 'remote' = 'remote';

export const service = {
  name: 'vercel',
  runtime,
  deployment,
  verifyToken: async (token: string) => {
    const res = await fetch('https://api.vercel.com/v2/user', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.ok;
  },
  listDeployments: async (token: string) => {
    const res = await fetch('https://api.vercel.com/v6/deployments', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },
};

export const vercelService = service;
