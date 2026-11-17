import { GoogleDriveWorkspaceService } from './GoogleDriveWorkspaceService.js';
import { BaseStorageAdapter } from './BaseStorageAdapter.js';
import type {
  ConnectionTestResult,
  FileInfo,
  StorageConfig,
} from './types.js';
import type {
  GoogleDriveWorkspaceTokens,
  GoogleDriveWorkspaceOptions,
  GoogleDriveWorkspaceFolder,
} from './GoogleDriveWorkspaceService.js';

export type GoogleDriveTokenSet = GoogleDriveWorkspaceTokens;

/** Server-only dependencies. Never serialize this object into a connection record. */
export interface GoogleDriveRuntimeAuthOptions {
  clientSecret?: string;
  fetcher?: typeof fetch;
  getCredentials?: () => Promise<GoogleDriveWorkspaceTokens | undefined>;
  persistCredentials?: (tokens: GoogleDriveWorkspaceTokens) => Promise<void> | void;
}

export class GoogleDriveStorageService extends BaseStorageAdapter {
  private readonly runtimeAuth: GoogleDriveRuntimeAuthOptions;
  private workspacePromise?: Promise<GoogleDriveWorkspaceService>;

  constructor(config: StorageConfig, runtimeAuth: GoogleDriveRuntimeAuthOptions = {}) {
    super({ ...config, provider: 'google_drive' });
    this.runtimeAuth = runtimeAuth;
  }

  private async workspace(): Promise<GoogleDriveWorkspaceService> {
    if (!this.workspacePromise) {
      this.workspacePromise = (async () => {
        const credentials = await this.runtimeAuth.getCredentials?.();
        const tokens: GoogleDriveWorkspaceTokens = credentials ?? {
          accessToken: this.config.googleAccessToken || '',
          ...(this.config.googleRefreshToken ? { refreshToken: this.config.googleRefreshToken } : {}),
          ...(this.config.googleAccessTokenExpiresAt
            ? { expiresAt: this.config.googleAccessTokenExpiresAt }
            : {}),
        };
        const options: GoogleDriveWorkspaceOptions = {
          clientId: this.config.googleClientId || '',
          clientSecret: this.runtimeAuth.clientSecret,
          redirectUri: this.config.googleRedirectUri || '',
          tokens,
          rootFolderId: this.config.googleRootFolderId,
          googleAccountId: this.config.googleAccountId,
          fetcher: this.runtimeAuth.fetcher,
          persistTokens: async (next) => {
            await this.runtimeAuth.persistCredentials?.({ ...next });
            this.config.googleAccessToken = next.accessToken;
            this.config.googleRefreshToken = next.refreshToken;
            this.config.googleAccessTokenExpiresAt = next.expiresAt;
          },
        };
        return new GoogleDriveWorkspaceService(options);
      })().catch((error) => {
        this.workspacePromise = undefined;
        throw error;
      });
    }
    return this.workspacePromise;
  }

  async read(path: string): Promise<Uint8Array> {
    return (await this.workspace()).read(path);
  }

  async write(path: string, data: Uint8Array | string, contentType?: string): Promise<void> {
    return (await this.workspace()).write(path, data, contentType);
  }

  async delete(path: string): Promise<void> {
    return (await this.workspace()).delete(path);
  }

  async exists(path: string): Promise<boolean> {
    return (await this.workspace()).exists(path);
  }

  async list(path = ''): Promise<FileInfo[]> {
    return (await this.workspace()).list(path);
  }

  async stat(path: string): Promise<FileInfo> {
    return (await this.workspace()).stat(path);
  }

  async mkdir(path: string): Promise<void> {
    return (await this.workspace()).mkdir(path);
  }

  async listFolders(parentFolderId?: string): Promise<GoogleDriveWorkspaceFolder[]> {
    return (await this.workspace()).listFolders(parentFolderId);
  }

  async selectRootFolder(folderId: string): Promise<GoogleDriveWorkspaceFolder> {
    const folder = await (await this.workspace()).selectRootFolder(folderId);
    this.config.googleRootFolderId = folder.id;
    return folder;
  }

  async getAccountIdentity(): Promise<{ accountId: string; email?: string }> {
    const identity = await (await this.workspace()).getAccountIdentity();
    this.config.googleAccountId = identity.accountId;
    return identity;
  }

  async refreshTokens(): Promise<GoogleDriveWorkspaceTokens> {
    const tokens = await (await this.workspace()).refreshTokens();
    this.config.googleAccessToken = tokens.accessToken;
    this.config.googleRefreshToken = tokens.refreshToken;
    this.config.googleAccessTokenExpiresAt = tokens.expiresAt;
    return tokens;
  }

  getConnectionMetadata(): Pick<StorageConfig,
    'provider' | 'googleClientId' | 'googleRedirectUri' | 'googleAccountId' | 'googleRootFolderId'
  > {
    return {
      provider: 'google_drive',
      ...(this.config.googleClientId ? { googleClientId: this.config.googleClientId } : {}),
      ...(this.config.googleRedirectUri ? { googleRedirectUri: this.config.googleRedirectUri } : {}),
      ...(this.config.googleAccountId ? { googleAccountId: this.config.googleAccountId } : {}),
      ...(this.config.googleRootFolderId ? { googleRootFolderId: this.config.googleRootFolderId } : {}),
    };
  }

  async testConnection(): Promise<ConnectionTestResult> {
    const result = await (await this.workspace()).testConnection();
    if (result.ok && typeof result.details?.accountId === 'string') {
      this.config.googleAccountId = result.details.accountId;
    }
    return result;
  }
}
