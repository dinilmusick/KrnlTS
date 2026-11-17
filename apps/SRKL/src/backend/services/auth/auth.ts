/**
 * @file auth.ts
 * @description SRKL auth facade backed exclusively by the canonical Luth client.
 */
import { createLuthAuthClient } from '@ultrst-armada/kloks/auth';

export const runtime: 'client' = 'client';
export const deployment: 'local' | 'remote' = 'remote';

function getAuthClient() {
  return createLuthAuthClient({
    ecosystemId: 'ultrst-armada',
    applicationId: 'srkl',
  });
}

export const service = {
  name: 'auth',
  runtime,
  deployment,
  getCurrentUser: async () => {
    const result = await getAuthClient().getSession();
    return result.authenticated ? result.user ?? null : null;
  },
  logout: async () => {
    await getAuthClient().signOut();
    return true;
  },
};

export const authService = service;
