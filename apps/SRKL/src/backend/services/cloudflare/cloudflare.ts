/**
 * @file cloudflare.ts
 * @description Cloudflare Service Facade for Srkl-Engine.
 * Conforms to APP_ARCHITECTURE_SPEC Sections 5 & 6.
 * File size < 200 lines strictly.
 */

export const runtime: 'client' | 'server' = 'server';
export const deployment: 'local' | 'remote' = 'remote';

export const service = {
  name: 'cloudflare',
  runtime,
  deployment,
  verifyToken: async (token: string) => {
    const res = await fetch('https://api.cloudflare.com/client/v4/user/tokens/verify', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json().catch(() => ({}));
    return res.ok && data.success === true;
  },
  listWorkers: async (token: string, accountId: string) => {
    const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/workers/scripts`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },
  listPages: async (token: string, accountId: string) => {
    const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/pages/projects`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },
};

export const cloudflareService = service;
