/**
 * @file index.ts
 * @description Dedicated SRKL Ecosystem Service Broker package exports.
 * Enables applications across the ecosystem to declare service dependencies,
 * connect to SRKL Vaults, and retrieve credentials.
 * Strictly adheres to Skipo governance (< 200 lines).
 */

export { SrklClient, createSrklClient, CANONICAL_SRKL_URL } from './SrklClient.js';
export { getPrimarySrklDeploymentUrl, getSrklAccounts, srklListBackblazeBuckets } from './SrklDiscoveryService.js';
export { useSrklServices } from './useSrklServices.js';
export { decryptVaultBufferInBrowser, hexToBytes } from './SrklCryptoClient.js';
export { SrklCredentialRegistry, globalCredentialRegistry } from './SrklCredentialRegistry.js';
export { SrklVaultAccessClient } from './SrklVaultAccessClient.js';
export type { VaultAccessClientOptions } from './SrklVaultAccessClient.js';
export { syncSrklAccounts } from './srklSyncBridge.js';
export { srklService } from './srkl.js';
export type { UseSrklServicesOptions, UseSrklServicesResult } from './useSrklServices.js';
export type {
  EcosystemServiceCategory,
  AppAccountManifest,
  EcosystemAccount,
  EcosystemAccountsRequest,
  EcosystemAccountsResponse,
  SrklServiceAccount,
  SrklClientOptions,
  SrklEcosystemQueryOptions,
  SrklEcosystemResponse,
  AppServiceDeclaration,
  AdaptedStorageConnection,
  KeyMaterial,
  SrklVaultAccessResponse,
  ServiceAccountEntry,
  CredentialRegistryMap,
} from './types.js';
