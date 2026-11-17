/**
 * @file krnl-services.ts
 * @description First-class KrnlTS ServiceDefinitions and ServiceFacades for @kloks/backend:
 * - AuthServiceFacade
 * - StorageServiceFacade
 * - WorkspaceServiceFacade
 * - ControlPlaneServiceFacade
 */

import {
  createService,
  createServiceDefinition,
  type IService,
  type ServiceDefinition,
} from '@ultrst-armada/krnl';
import { loginSystemUser, resolveUserFromToken } from './auth/UnifiedAuthCore.js';
import { queryUnifiedDb } from './core/unifiedDb.js';
import {
  deleteUserWorkspaceStorageFile,
  deleteUserWorkspaceStorageFolder,
  listUserWorkspaceStorageFiles,
  readUserWorkspaceStorageFile,
  writeUserWorkspaceStorageFile,
} from './core/storageConnectionRuntimeCore.js';
type UserRole = 'admin' | 'user';
import { b2ListBuckets } from './storage/B2DirectClient.js';
import {
  createBackblazeStorageConnection,
  deleteUserStorageConnection,
  getGoogleDriveAccountIdentityForUser,
  getStorageProviderCapabilities,
  listBackblazeBucketsForConnection,
  listUserStorageConnections,
  listUserStorageConnectionsWithSecrets,
  setPrimaryUserStorageConnection,
  testBackblazeCredentials,
} from './core/storageConnectionCore.js';
import { getPrimarySrklDeploymentUrl, getSrklAccounts, srklListBackblazeBuckets } from './srkl/SrklDiscoveryService.js';
import {
  createGoogleDriveAuthorizationRequest,
  verifyGoogleDriveAuthorizationState,
} from './core/googleDriveOAuthCore.js';
import {
  completeGoogleDriveAuthorization,
  deleteGoogleDriveFileForConnection,
  listGoogleDriveFilesForConnection,
  listGoogleDriveFoldersForConnection,
  persistGoogleDriveTokens,
  readGoogleDriveFileForConnection,
  selectGoogleDriveRootFolder,
  testGoogleDriveConnectionForUser,
  writeGoogleDriveFileForConnection,
} from './core/storageConnectionCore.js';
import { findUserWorkspace, getWorkspaces, createWorkspace, updateWorkspace, deleteWorkspace } from './core/workspaceCore.js';
import {
  formatCanonicalWorkspaceFolderName,
  sanitizeWorkspaceName,
} from './workspace/WorkspaceCanonical.js';

// 1. AuthService (KrnlTS Service)
export const AuthServiceDefinition: ServiceDefinition = createServiceDefinition({
  id: 'kloks.backend.auth',
  name: 'AuthService',
  version: '1.0.0',
  state: {
    initial: { activeSessions: 0 },
  },
  operations: {
    login: {
      id: 'AuthService.login',
      name: 'login',
      handler: async (input: { email: string; password: string; isAdmin?: boolean; env?: Record<string, unknown> }) =>
        loginSystemUser(input.email, input.password, Boolean(input.isAdmin), (sql, params) => queryUnifiedDb(sql, params, input.env), input.env),
    },
    resolveUser: {
      id: 'AuthService.resolveUser',
      name: 'resolveUser',
      handler: async (input: { tokenOrUserId: string; env?: Record<string, unknown> }) =>
        resolveUserFromToken(input.tokenOrUserId, (sql, params) => queryUnifiedDb(sql, params, input.env), input.env),
    },
  },
});

const authServiceInstance: IService = createService(AuthServiceDefinition);

export const AuthServiceFacade = {
  id: AuthServiceDefinition.id,
  name: AuthServiceDefinition.name,
  version: AuthServiceDefinition.version,
  runtime: 'server' as const,
  deployment: 'local' as const,
  definition: AuthServiceDefinition,
  get telemetry() { return authServiceInstance.telemetry; },
  createInstance: () => createService(AuthServiceDefinition),
  execute: async <TIn = unknown, TOut = unknown>(op: string, input?: TIn) => { await authServiceInstance.start(); return authServiceInstance.call<TIn, TOut>(op, input); },
};

// 2. StorageService (KrnlTS Service)
export const StorageServiceDefinition: ServiceDefinition = createServiceDefinition({
  id: 'kloks.backend.storage',
  name: 'StorageService',
  version: '1.0.0',
  operations: {
    getProviderCapabilities: {
      id: 'StorageService.getProviderCapabilities',
      name: 'getProviderCapabilities',
      handler: async (input: { env?: Record<string, unknown> }) =>
        getStorageProviderCapabilities((sql, params) => queryUnifiedDb(sql, params, input.env)),
    },
    getConnections: {
      id: 'StorageService.getConnections',
      name: 'getConnections',
      handler: async (input: { userId: string; env?: Record<string, unknown> }) =>
        listUserStorageConnections(input.userId, (sql, params) => queryUnifiedDb(sql, params, input.env)),
    },
    testBackblazeCredentials: {
      id: 'StorageService.testBackblazeCredentials',
      name: 'testBackblazeCredentials',
      handler: async (input: { keyId: string; applicationKey: string }) =>
        testBackblazeCredentials(input.keyId, input.applicationKey),
    },
    /** Server-only operation for backend storage engines. Never bind this operation to browser HTTP routes. */
    getConnectionsWithSecrets: {
      id: 'StorageService.getConnectionsWithSecrets',
      name: 'getConnectionsWithSecrets',
      handler: async (input: { userId: string; env?: Record<string, unknown> }) =>
        listUserStorageConnectionsWithSecrets(
          input.userId,
          (sql, params) => queryUnifiedDb(sql, params, input.env),
        ),
    },
    setPrimaryConnection: {
      id: 'StorageService.setPrimaryConnection',
      name: 'setPrimaryConnection',
      handler: async (input: { userId: string; connectionId: string; env?: Record<string, unknown> }) =>
        setPrimaryUserStorageConnection(
          input.userId,
          input.connectionId,
          (sql, params) => queryUnifiedDb(sql, params, input.env),
        ),
    },
    deleteConnection: {
      id: 'StorageService.deleteConnection',
      name: 'deleteConnection',
      handler: async (input: { userId: string; connectionId: string; env?: Record<string, unknown> }) =>
        deleteUserStorageConnection(
          input.userId,
          input.connectionId,
          (sql, params) => queryUnifiedDb(sql, params, input.env),
        ),
    },

    createBackblazeConnection: {
      id: 'StorageService.createBackblazeConnection',
      name: 'createBackblazeConnection',
      handler: async (input: {
        userId: string;
        label?: string;
        keyId: string;
        applicationKey: string;
        bucketName: string;
        region?: string;
        endpoint?: string;
        env?: Record<string, unknown>;
      }) =>
        createBackblazeStorageConnection(input, (sql, params) => queryUnifiedDb(sql, params, input.env)),
    },
    listBackblazeConnectionBuckets: {
      id: 'StorageService.listBackblazeConnectionBuckets',
      name: 'listBackblazeConnectionBuckets',
      handler: async (input: { userId: string; connectionId: string; env?: Record<string, unknown> }) =>
        listBackblazeBucketsForConnection(
          input.userId,
          input.connectionId,
          (sql, params) => queryUnifiedDb(sql, params, input.env),
        ),
    },
    createGoogleDriveAuthorizationRequest: {
      id: 'StorageService.createGoogleDriveAuthorizationRequest',
      name: 'createGoogleDriveAuthorizationRequest',
      handler: async (input: { userId: string; returnTo: string; callbackOrigin: string; env?: Record<string, unknown> }) =>
        createGoogleDriveAuthorizationRequest(
          input,
          (sql, params) => queryUnifiedDb(sql, params, input.env),
        ),
    },
    verifyGoogleDriveAuthorizationState: {
      id: 'StorageService.verifyGoogleDriveAuthorizationState',
      name: 'verifyGoogleDriveAuthorizationState',
      handler: async (input: { state: string; nonceCookie: string; callbackOrigin: string; env?: Record<string, unknown> }) =>
        verifyGoogleDriveAuthorizationState(
          input,
          (sql, params) => queryUnifiedDb(sql, params, input.env),
        ),
    },
    completeGoogleDriveAuthorization: {
      id: 'StorageService.completeGoogleDriveAuthorization',
      name: 'completeGoogleDriveAuthorization',
      handler: async (input: { userId: string; code: string; env?: Record<string, unknown> }) =>
        completeGoogleDriveAuthorization(
          input.userId,
          input.code,
          (sql, params) => queryUnifiedDb(sql, params, input.env),
        ),
    },
    /** Server-only token persistence for the shared Google Drive adapter. */
    persistGoogleDriveTokens: {
      id: 'StorageService.persistGoogleDriveTokens',
      name: 'persistGoogleDriveTokens',
      handler: async (input: {
        userId: string;
        connectionId: string;
        tokens: { accessToken: string; refreshToken?: string; expiresAt?: number; tokenType?: string };
        env?: Record<string, unknown>;
      }) => persistGoogleDriveTokens(
        input.userId,
        input.connectionId,
        input.tokens,
        (sql, params) => queryUnifiedDb(sql, params, input.env),
      ),
    },

    listGoogleDriveFolders: {
      id: 'StorageService.listGoogleDriveFolders',
      name: 'listGoogleDriveFolders',
      handler: async (input: { userId: string; connectionId: string; parentFolderId?: string; env?: Record<string, unknown> }) =>
        listGoogleDriveFoldersForConnection(
          input.userId,
          input.connectionId,
          input.parentFolderId,
          (sql, params) => queryUnifiedDb(sql, params, input.env),
        ),
    },
    selectGoogleDriveRootFolder: {
      id: 'StorageService.selectGoogleDriveRootFolder',
      name: 'selectGoogleDriveRootFolder',
      handler: async (input: { userId: string; connectionId: string; folderId: string; env?: Record<string, unknown> }) =>
        selectGoogleDriveRootFolder(
          input.userId,
          input.connectionId,
          input.folderId,
          (sql, params) => queryUnifiedDb(sql, params, input.env),
        ),
    },
    getGoogleDriveAccountIdentity: {
      id: 'StorageService.getGoogleDriveAccountIdentity',
      name: 'getGoogleDriveAccountIdentity',
      handler: async (input: { userId: string; connectionId: string; env?: Record<string, unknown> }) =>
        getGoogleDriveAccountIdentityForUser(
          input.userId,
          input.connectionId,
          (sql, params) => queryUnifiedDb(sql, params, input.env),
        ),
    },
    testGoogleDriveConnection: {
      id: 'StorageService.testGoogleDriveConnection',
      name: 'testGoogleDriveConnection',
      handler: async (input: { userId: string; connectionId: string; env?: Record<string, unknown> }) =>
        testGoogleDriveConnectionForUser(
          input.userId,
          input.connectionId,
          (sql, params) => queryUnifiedDb(sql, params, input.env),
        ),
    },
    writeGoogleDriveFile: {
      id: 'StorageService.writeGoogleDriveFile',
      name: 'writeGoogleDriveFile',
      handler: async (input: { userId: string; connectionId: string; path: string; data: string | Uint8Array; contentType?: string; env?: Record<string, unknown> }) =>
        writeGoogleDriveFileForConnection(
          input.userId,
          input.connectionId,
          input.path,
          input.data,
          input.contentType,
          (sql, params) => queryUnifiedDb(sql, params, input.env),
        ),
    },
    readGoogleDriveFile: {
      id: 'StorageService.readGoogleDriveFile',
      name: 'readGoogleDriveFile',
      handler: async (input: { userId: string; connectionId: string; path: string; env?: Record<string, unknown> }) =>
        readGoogleDriveFileForConnection(
          input.userId,
          input.connectionId,
          input.path,
          (sql, params) => queryUnifiedDb(sql, params, input.env),
        ),
    },
    deleteGoogleDriveFile: {
      id: 'StorageService.deleteGoogleDriveFile',
      name: 'deleteGoogleDriveFile',
      handler: async (input: { userId: string; connectionId: string; path: string; env?: Record<string, unknown> }) =>
        deleteGoogleDriveFileForConnection(
          input.userId,
          input.connectionId,
          input.path,
          (sql, params) => queryUnifiedDb(sql, params, input.env),
        ),
    },
    listGoogleDriveFiles: {
      id: 'StorageService.listGoogleDriveFiles',
      name: 'listGoogleDriveFiles',
      handler: async (input: { userId: string; connectionId: string; path?: string; env?: Record<string, unknown> }) =>
        listGoogleDriveFilesForConnection(
          input.userId,
          input.connectionId,
          input.path || '',
          (sql, params) => queryUnifiedDb(sql, params, input.env),
        ),
    },
    writeWorkspaceStorageFile: {
      id: 'StorageService.writeWorkspaceStorageFile',
      name: 'writeWorkspaceStorageFile',
      handler: async (input: {
        userId: string; connectionId: string; folderPrefix: string; relativePath: string;
        content: string | Uint8Array; contentType?: string; bucketName?: string; rootFolderId?: string;
        env?: Record<string, unknown>;
      }) => writeUserWorkspaceStorageFile(input),
    },
    readWorkspaceStorageFile: {
      id: 'StorageService.readWorkspaceStorageFile',
      name: 'readWorkspaceStorageFile',
      handler: async (input: {
        userId: string; connectionId: string; folderPrefix: string; relativePath: string;
        bucketName?: string; rootFolderId?: string; env?: Record<string, unknown>;
      }) => readUserWorkspaceStorageFile(input),
    },
    deleteWorkspaceStorageFile: {
      id: 'StorageService.deleteWorkspaceStorageFile',
      name: 'deleteWorkspaceStorageFile',
      handler: async (input: {
        userId: string; connectionId: string; folderPrefix: string; relativePath: string;
        bucketName?: string; rootFolderId?: string; env?: Record<string, unknown>;
      }) => deleteUserWorkspaceStorageFile(input),
    },
    deleteWorkspaceStorageFolder: {
      id: 'StorageService.deleteWorkspaceStorageFolder',
      name: 'deleteWorkspaceStorageFolder',
      handler: async (input: {
        userId: string; connectionId: string; folderPrefix: string;
        bucketName?: string; rootFolderId?: string; env?: Record<string, unknown>;
      }) => deleteUserWorkspaceStorageFolder(input),
    },
    listWorkspaceStorageFiles: {
      id: 'StorageService.listWorkspaceStorageFiles',
      name: 'listWorkspaceStorageFiles',
      handler: async (input: {
        userId: string; connectionId: string; folderPrefix: string; subPrefix?: string;
        bucketName?: string; rootFolderId?: string; env?: Record<string, unknown>;
      }) => listUserWorkspaceStorageFiles(input),
    },

    listBackblazeBuckets: {
      id: 'StorageService.listBackblazeBuckets',
      name: 'listBackblazeBuckets',
      handler: async (input: { keyId: string; applicationKey: string }) => b2ListBuckets(input.keyId, input.applicationKey),
    },
    resolveAdapterType: {
      id: 'StorageService.resolveAdapterType',
      name: 'resolveAdapterType',
      handler: async (input: { provider: 'local' | 'local_fs' | 's3' | 's3_compatible' | 'b2' | 'supabase' | 'google_drive'; basePath?: string }) => {
        const normalized = input.provider === 'local' ? 'local_fs' : input.provider;
        // This portable service reports capability only. Instantiating LocalFSAdapter
        // belongs to the explicit /backend/node entrypoint because it imports fs/path.
        if (normalized === 'local_fs') {
          return {
            provider: 'local',
            initialized: true,
            runtimeSupport: 'node_only',
            requiresNodeAdapter: true,
          };
        }
        return {
          provider: normalized,
          initialized: true,
          runtimeSupport: 'fetch',
          requiresNodeAdapter: false,
        };
      },
    },
  },
});

const storageServiceInstance: IService = createService(StorageServiceDefinition);

export const StorageServiceFacade = {
  id: StorageServiceDefinition.id,
  name: StorageServiceDefinition.name,
  version: StorageServiceDefinition.version,
  runtime: 'server' as const,
  deployment: 'local' as const,
  definition: StorageServiceDefinition,
  get telemetry() { return storageServiceInstance.telemetry; },
  createInstance: () => createService(StorageServiceDefinition),
  execute: async <TIn = unknown, TOut = unknown>(op: string, input?: TIn) => { await storageServiceInstance.start(); return storageServiceInstance.call<TIn, TOut>(op, input); },
};

// 3. WorkspaceService (KrnlTS Service)
export const WorkspaceServiceDefinition: ServiceDefinition = createServiceDefinition({
  id: 'kloks.backend.workspace',
  name: 'WorkspaceService',
  version: '1.0.0',
  operations: {
    listWorkspaces: {
      id: 'WorkspaceService.listWorkspaces',
      name: 'listWorkspaces',
      handler: async (input: { userId?: string; env?: Record<string, unknown> }) => getWorkspaces(input.userId, input.env),
    },
    findWorkspace: {
      id: 'WorkspaceService.findWorkspace',
      name: 'findWorkspace',
      handler: async (input: { workspaceId: string; env?: Record<string, unknown> }) => findUserWorkspace(input.workspaceId, input.env),
    },
    createWorkspace: {
      id: 'WorkspaceService.createWorkspace',
      name: 'createWorkspace',
      handler: async (input: { userId: string; workspace: Record<string, unknown>; env?: Record<string, unknown> }) => createWorkspace(input.userId, input.workspace, input.env),
    },
    updateWorkspace: {
      id: 'WorkspaceService.updateWorkspace',
      name: 'updateWorkspace',
      handler: async (input: { userId: string; params: Record<string, unknown>; env?: Record<string, unknown> }) => updateWorkspace(input.userId, input.params, input.env),
    },
    deleteWorkspace: {
      id: 'WorkspaceService.deleteWorkspace',
      name: 'deleteWorkspace',
      handler: async (input: { userId: string; workspaceId: string; env?: Record<string, unknown> }) => deleteWorkspace(input.userId, input.workspaceId, input.env),
    },
    validateWorkspaceConfig: {
      id: 'WorkspaceService.validateWorkspaceConfig',
      name: 'validateWorkspaceConfig',
      handler: async (input: { id: string; name: string; storageType?: string; appName?: string; userName?: string }) => {
        const sanitized = sanitizeWorkspaceName(input.name);
        const folderName = formatCanonicalWorkspaceFolderName(
          input.appName ?? 'app',
          input.userName ?? 'user',
          sanitized
        );
        return {
          valid: Boolean(input.id && sanitized),
          workspaceId: input.id,
          name: sanitized,
          folderName,
          storageType: input.storageType ?? 'local',
        };
      },
    },
  },
});

const workspaceServiceInstance: IService = createService(WorkspaceServiceDefinition);

export const WorkspaceServiceFacade = {
  id: WorkspaceServiceDefinition.id,
  name: WorkspaceServiceDefinition.name,
  version: WorkspaceServiceDefinition.version,
  runtime: 'server' as const,
  deployment: 'local' as const,
  definition: WorkspaceServiceDefinition,
  get telemetry() { return workspaceServiceInstance.telemetry; },
  createInstance: () => createService(WorkspaceServiceDefinition),
  execute: async <TIn = unknown, TOut = unknown>(op: string, input?: TIn) => { await workspaceServiceInstance.start(); return workspaceServiceInstance.call<TIn, TOut>(op, input); },
};

// 4. ControlPlaneService (KrnlTS Service)
export const ControlPlaneServiceDefinition: ServiceDefinition = createServiceDefinition({
  id: 'kloks.backend.controlPlane',
  name: 'ControlPlaneService',
  version: '1.0.0',
  operations: {
    status: {
      id: 'ControlPlaneService.status',
      name: 'status',
      handler: async () => ({
        healthy: true,
        timestamp: Date.now(),
      }),
    },
  },
});

const controlPlaneServiceInstance: IService = createService(ControlPlaneServiceDefinition);

export const ControlPlaneServiceFacade = {
  id: ControlPlaneServiceDefinition.id,
  name: ControlPlaneServiceDefinition.name,
  version: ControlPlaneServiceDefinition.version,
  runtime: 'server' as const,
  deployment: 'local' as const,
  definition: ControlPlaneServiceDefinition,
  get telemetry() { return controlPlaneServiceInstance.telemetry; },
  createInstance: () => createService(ControlPlaneServiceDefinition),
  execute: async <TIn = unknown, TOut = unknown>(op: string, input?: TIn) => { await controlPlaneServiceInstance.start(); return controlPlaneServiceInstance.call<TIn, TOut>(op, input); },
};

// 5. DatabaseService (KrnlTS Service)
export const DatabaseServiceDefinition: ServiceDefinition = createServiceDefinition({
  id: 'kloks.backend.database',
  name: 'DatabaseService',
  version: '1.0.0',
  operations: {
    query: {
      id: 'DatabaseService.query',
      name: 'query',
      handler: async (input: { sql: string; params?: unknown[]; env?: Record<string, unknown> }) =>
        queryUnifiedDb(input.sql, input.params || [], input.env),
    },
    isHealthy: {
      id: 'DatabaseService.isHealthy',
      name: 'isHealthy',
      handler: async (input: { env?: Record<string, unknown> }) => {
        try {
          await queryUnifiedDb('SELECT 1 AS ok', [], input.env);
          return { healthy: true };
        } catch {
          return { healthy: false, reason: 'SYSTEM_DATABASE_UNAVAILABLE' };
        }
      },
    },
  },
});

const databaseServiceInstance: IService = createService(DatabaseServiceDefinition);

export const DatabaseServiceFacade = {
  id: DatabaseServiceDefinition.id,
  name: DatabaseServiceDefinition.name,
  version: DatabaseServiceDefinition.version,
  runtime: 'server' as const,
  deployment: 'local' as const,
  definition: DatabaseServiceDefinition,
  createInstance: () => createService(DatabaseServiceDefinition),
  execute: async <TIn = unknown, TOut = unknown>(op: string, input?: TIn) => { await databaseServiceInstance.start(); return databaseServiceInstance.call<TIn, TOut>(op, input); },
};

// 7. GeminiService (KrnlTS Service)
export const GeminiServiceDefinition: ServiceDefinition = createServiceDefinition({
  id: 'kloks.backend.gemini',
  name: 'GeminiService',
  version: '1.0.0',
  operations: {
    generateText: {
      id: 'GeminiService.generateText',
      name: 'generateText',
      handler: async (input: { prompt: string; model?: string }) => {
        return { text: `[GeminiResponse] Generated response for: ${input.prompt}`, model: input.model ?? 'gemini-2.5-flash', timestamp: Date.now() };
      },
    },
  },
});

const geminiServiceInstance: IService = createService(GeminiServiceDefinition);

export const GeminiServiceFacade = {
  id: GeminiServiceDefinition.id,
  name: GeminiServiceDefinition.name,
  version: GeminiServiceDefinition.version,
  runtime: 'server' as const,
  deployment: 'remote' as const,
  definition: GeminiServiceDefinition,
  createInstance: () => createService(GeminiServiceDefinition),
  execute: async <TIn = unknown, TOut = unknown>(op: string, input?: TIn) => { await geminiServiceInstance.start(); return geminiServiceInstance.call<TIn, TOut>(op, input); },
};

// ══════════════════════════════════════════════════════════════════════════════
// KRNL CANONICAL BACKEND SERVICE EXPORTS (Standardized krnl* Prefix Rule)
// ══════════════════════════════════════════════════════════════════════════════
export const krnlAuthServiceDefinition = AuthServiceDefinition;
export const krnlAuthServiceFacade = AuthServiceFacade;
export const krnlStorageServiceDefinition = StorageServiceDefinition;
export const krnlStorageServiceFacade = StorageServiceFacade;
export const krnlWorkspaceServiceDefinition = WorkspaceServiceDefinition;
export const krnlWorkspaceServiceFacade = WorkspaceServiceFacade;
export const krnlControlPlaneServiceDefinition = ControlPlaneServiceDefinition;
export const krnlControlPlaneServiceFacade = ControlPlaneServiceFacade;
export const krnlDatabaseServiceDefinition = DatabaseServiceDefinition;
export const krnlDatabaseServiceFacade = DatabaseServiceFacade;
export const krnlGeminiServiceDefinition = GeminiServiceDefinition;
export const krnlGeminiServiceFacade = GeminiServiceFacade;



// 6. SrklService (credential discovery + Backblaze federation)
export const SrklServiceDefinition: ServiceDefinition = createServiceDefinition({
  id: 'kloks.backend.srkl',
  name: 'SrklService',
  version: '1.0.0',
  operations: {
    getAccounts: {
      id: 'SrklService.getAccounts',
      name: 'getAccounts',
      handler: async (input: { userId: string; service?: string; env?: Record<string, unknown> }) => getSrklAccounts(input.userId, input.service, (sql, params) => queryUnifiedDb(sql, params, input.env)),
    },
    getPrimaryDeploymentUrl: {
      id: 'SrklService.getPrimaryDeploymentUrl',
      name: 'getPrimaryDeploymentUrl',
      handler: async (input: { env?: Record<string, unknown> }) => ({
        success: true,
        deploymentUrl: await getPrimarySrklDeploymentUrl((sql, params) => queryUnifiedDb(sql, params, input.env)),
      }),
    },

    listBackblazeBuckets: {
      id: 'SrklService.listBackblazeBuckets',
      name: 'listBackblazeBuckets',
      handler: async (input: { keyId?: string; applicationKey?: string; accountId?: string; userId?: string; env?: Record<string, unknown> }) =>
        srklListBackblazeBuckets(
          input.keyId,
          input.applicationKey,
          undefined,
          undefined,
          input.userId,
          (sql, params) => queryUnifiedDb(sql, params, input.env),
          input.accountId,
        ),
    },
  },
});

const srklServiceInstance: IService = createService(SrklServiceDefinition);

export const SrklServiceFacade = {
  id: SrklServiceDefinition.id,
  name: SrklServiceDefinition.name,
  version: SrklServiceDefinition.version,
  runtime: 'server' as const,
  deployment: 'remote' as const,
  definition: SrklServiceDefinition,
  createInstance: () => createService(SrklServiceDefinition),
  execute: async <TIn = unknown, TOut = unknown>(op: string, input?: TIn) => { await srklServiceInstance.start(); return srklServiceInstance.call<TIn, TOut>(op, input); },
};

export const krnlSrklServiceDefinition = SrklServiceDefinition;
export const krnlSrklServiceFacade = SrklServiceFacade;
