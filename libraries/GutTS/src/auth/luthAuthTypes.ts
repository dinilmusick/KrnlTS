export type DeploymentEnvironment = 'production' | 'staging' | 'preview' | 'development';

export interface LuthDeploymentRecord {
  id: string;
  url: string;
  label?: string;
  environment?: DeploymentEnvironment;
  isActive: boolean;
  isPrimary?: boolean;
  priority?: number;
}

export interface LuthAuthClientConfig {
  ecosystemId: string;
  applicationId: string;
  luthUrl?: string;
  luthUrls?: string[];
  luthUrlResolver?: () => Promise<string[] | string>;
  origin?: string;
  environment?: DeploymentEnvironment;
  autoRegister?: boolean;
  maxRetries?: number;
  retryDelayMs?: number;
  /** Per-request fetch timeout in milliseconds. Set to 0 to disable. */
  timeoutMs?: number;
  tokenStore?: LuthAuthTokenStore;
}

export interface LuthAuthTokenStore {
  get(): string;
  set(token: string): void;
  clear(): void;
}

export interface RegisterApplicationResult {
  registered: boolean;
  ecosystemId: string;
  applicationId: string;
  origin: string;
  environment: DeploymentEnvironment;
  authenticationEnabled: boolean;
}

export interface LuthUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  emailVerified?: boolean;
}

export interface LuthSession {
  id: string;
  userId: string;
  expiresAt: string;
  token?: string;
}

export interface LuthSessionResult {
  authenticated: boolean;
  user?: LuthUser;
  session?: LuthSession;
  error?: string;
}

export interface EmailSignInCredentials {
  email: string;
  password: string;
}

export interface EmailSignUpData {
  email: string;
  password: string;
  name: string;
}

export interface GoogleSignInOptions {
  callbackURL?: string;
}

export class LuthAuthError extends Error {
  public readonly code: string;
  public readonly status?: number;

  constructor(code: string, message: string, status?: number) {
    super(`[${code}] ${message}`);
    this.name = 'LuthAuthError';
    this.code = code;
    if (status !== undefined) this.status = status;
  }
}
