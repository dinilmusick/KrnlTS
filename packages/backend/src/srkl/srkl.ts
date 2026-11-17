// ══════════════════════════════════════════════════════════════════════════════
// SRKL SERVICE FACADE
// Specification: APP_ARCHITECTURE_SPEC & MULTI_TARGET_BUILD_SPEC
// Exports: runtime, deployment, and service
// ══════════════════════════════════════════════════════════════════════════════

import { SrklVaultAccessClient } from './SrklVaultAccessClient.js';
import { SrklCredentialRegistry } from './SrklCredentialRegistry.js';
import { decryptVaultBufferInBrowser, hexToBytes } from './SrklCryptoClient.js';

import { getSrklAccounts, listBackblazeBuckets, getSrklStatus, getPrimarySrklDeploymentUrl } from '../core/srklCore.js';

export const runtime = {
  VaultAccessClient: SrklVaultAccessClient,
  CredentialRegistry: SrklCredentialRegistry,
  decryptVaultBufferInBrowser,
  hexToBytes,
};

export const deployment = {
  target: 'universal',
  supportedEngines: ['browser', 'worker', 'node'],
  version: '1.0.0',
};

export const service = {
  name: 'srkl',
  description: 'SRKL Ecosystem Volatile Memory Credential Vault Service',
  runtime,
  deployment,
  getSrklAccounts: (userId?: string, serviceName?: string, env?: any) => getSrklAccounts(userId, serviceName, env),
  getAccounts: (userId?: string, serviceName?: string, env?: any) => getSrklAccounts(userId, serviceName, env),
  listBackblazeBuckets: (payload: any, userId?: string, env?: any) => listBackblazeBuckets(payload, userId, env),
  getSrklStatus: (env?: any) => getSrklStatus(env),
  getDeploymentUrl: (env?: any) => getPrimarySrklDeploymentUrl(env),
};

export const srklService = service;
export default service;
