import type {
  DeploymentEnvironment, EmailSignInCredentials, EmailSignUpData,
  GoogleSignInOptions, LuthAuthClientConfig, LuthAuthTokenStore,
  LuthSessionResult, RegisterApplicationResult,
} from './luthAuthTypes.js';
import { LuthAuthError } from './luthAuthTypes.js';

function normalizeOrigin(value: string): string {
  try {
    return new URL(value.trim()).origin;
  } catch {
    return '';
  }
}

export function resolveRuntimeAppUrl(): string {
  return globalThis.location?.origin?.trim() || '';
}

export function resolveClientOrigin(explicitOrigin?: string): string {
  const explicit = explicitOrigin?.trim();
  if (explicit) return normalizeOrigin(explicit);

  return normalizeOrigin(resolveRuntimeAppUrl());
}

export function resolveClientEnvironment(origin: string): DeploymentEnvironment {
  try {
    const host = new URL(origin).hostname.toLowerCase();
    if (host === 'localhost' || host === '127.0.0.1' || host === '[::1]') return 'development';
    if (host.includes('staging')) return 'staging';
    if (host.includes('preview') || host.includes('-git-') || host.endsWith('.workers.dev')) return 'preview';
    return 'production';
  } catch {
    return 'production';
  }
}

export const DEFAULT_LUTH_URL = 'https://luth.blueprint-ninjastudios.workers.dev';

const browserTokenStore: LuthAuthTokenStore = {
  get: () => { try { return globalThis.sessionStorage?.getItem('luth-session-token') || ''; } catch { return ''; } },
  set: (token) => { try { globalThis.sessionStorage?.setItem('luth-session-token', token || ''); } catch {} },
  clear: () => { try { globalThis.sessionStorage?.removeItem('luth-session-token'); } catch {} },
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function hydrateLuthTokenFromUrl(tokenStore: LuthAuthTokenStore = browserTokenStore): boolean {
  const location = globalThis.location;
  const history = globalThis.history;
  if (!location?.search || !history?.replaceState) return false;
  const href = location.href || `${location.origin || 'http://localhost'}${location.pathname || '/'}${location.search}${location.hash || ''}`;
  const url = new URL(href);
  const token = url.searchParams.get('token')?.trim();
  if (!token) return false;
  tokenStore.set(token);
  url.searchParams.delete('token');
  history.replaceState({}, globalThis.document?.title ?? '', url.pathname + (url.search ? url.search : '') + url.hash);
  return true;
}

export class LuthAuthClient {
  public readonly ecosystemId: string;
  public readonly applicationId: string;
  public readonly origin: string;
  public readonly environment: DeploymentEnvironment;
  private _luthUrls: string[];
  private _activeUrlIndex = 0;
  private _nextUrlIndex = 0;
  private readonly luthUrlResolver?: (() => Promise<string[] | string>) | undefined;
  private readonly autoRegister: boolean;
  private readonly maxRetries: number;
  private readonly retryDelayMs: number;
  private readonly timeoutMs: number;
  private readonly tokenStore: LuthAuthTokenStore;
  private registrationPromise: Promise<RegisterApplicationResult> | null = null;

  public get luthUrl(): string {
    return this._luthUrls[this._activeUrlIndex] || DEFAULT_LUTH_URL;
  }

  public get luthUrls(): string[] {
    return [...this._luthUrls];
  }

  constructor(config: LuthAuthClientConfig) {
    this.ecosystemId = config.ecosystemId;
    this.applicationId = config.applicationId;
    const initialUrls = (config.luthUrls && config.luthUrls.length > 0)
      ? config.luthUrls.map((u) => u.replace(/\/+$/, ''))
      : [(config.luthUrl || DEFAULT_LUTH_URL).replace(/\/+$/, '')];
    this._luthUrls = Array.from(new Set(initialUrls));
    this.luthUrlResolver = config.luthUrlResolver;
    this.origin = resolveClientOrigin(config.origin);
    if (!this.origin) {
      throw new LuthAuthError(
        'APPLICATION_ORIGIN_UNAVAILABLE',
        'Application deployment origin is unavailable. Supply an explicit origin; Node callers can use resolveServerRuntimeAppUrl().',
      );
    }
    this.environment = config.environment || resolveClientEnvironment(this.origin);
    this.autoRegister = config.autoRegister ?? true;
    this.maxRetries = config.maxRetries ?? 3;
    this.retryDelayMs = config.retryDelayMs ?? 100;
    this.timeoutMs = Math.max(0, config.timeoutMs ?? 10000);
    this.tokenStore = config.tokenStore || browserTokenStore;
    hydrateLuthTokenFromUrl(this.tokenStore);
  }

  public getAuthHeaders(): HeadersInit {
    const token = this.tokenStore.get();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  public clearAuthToken(): void {
    this.tokenStore.clear();
  }

  private async request(path: string, init: RequestInit = {}): Promise<Response> {
    if (this.luthUrlResolver && this._luthUrls.length <= 1) {
      try {
        const resolved = await this.luthUrlResolver();
        const urls = Array.isArray(resolved) ? resolved : [resolved];
        const cleaned = urls.filter(Boolean).map((u) => u.replace(/\/+$/, ''));
        if (cleaned.length > 0) {
          this._luthUrls = Array.from(new Set([...cleaned, ...this._luthUrls]));
        }
      } catch {}
    }

    const headers = new Headers(init.headers);
    const authHeaders = new Headers(this.getAuthHeaders());
    authHeaders.forEach((value, key) => { if (!headers.has(key)) headers.set(key, value); });

    let lastError: unknown = null;
    const poolSize = this._luthUrls.length;
    const retryCycles = Math.max(1, this.maxRetries + 1);
    const startIndex = poolSize > 1 ? (this._nextUrlIndex % poolSize) : 0;

    for (let cycle = 0; cycle < retryCycles; cycle++) {
      for (let offset = 0; offset < poolSize; offset++) {
        const idx = (startIndex + offset) % poolSize;
        const targetUrl = this._luthUrls[idx];
        const controller = this.timeoutMs > 0 ? new AbortController() : null;
        const timeout = controller ? setTimeout(() => controller.abort(), this.timeoutMs) : null;
        let removeAbortListener: (() => void) | undefined;

        try {
          if (controller && init.signal) {
            if (init.signal.aborted) controller.abort(init.signal.reason);
            else {
              const onAbort = () => controller.abort(init.signal?.reason);
              init.signal.addEventListener('abort', onAbort, { once: true });
              removeAbortListener = () => init.signal?.removeEventListener('abort', onAbort);
            }
          }

          const response = await fetch(`${targetUrl}${path}`, {
            ...init,
            credentials: init.credentials ?? 'include',
            cache: init.cache ?? 'no-store',
            headers,
            ...(controller ? { signal: controller.signal } : {}),
          });

          if (response.status === 502 || response.status === 503 || response.status === 504) {
            lastError = new LuthAuthError('LUTH_DEPLOYMENT_UNAVAILABLE', `Luth deployment unavailable (${response.status})`, response.status);
            continue;
          }

          this._activeUrlIndex = idx;
          this._nextUrlIndex = offset === 0 ? (idx + 1) % poolSize : idx;
          return response;
        } catch (err) {
          lastError = err;
        } finally {
          if (timeout) clearTimeout(timeout);
          removeAbortListener?.();
        }
      }

      if (cycle < retryCycles - 1) await sleep(this.retryDelayMs * 2 ** cycle);
    }

    throw lastError || new Error('Luth request failed: all endpoints exhausted.');
  }

  public async register(): Promise<RegisterApplicationResult> {
    let lastError: unknown = null;
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await this.request('/api/registry/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ecosystemId: this.ecosystemId,
            applicationId: this.applicationId,
            origin: this.origin,
            environment: this.environment,
          }),
        });
        const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
        if (response.ok) return data as unknown as RegisterApplicationResult;
        const error = new LuthAuthError(
          String(data.code || (response.status === 404 ? 'APPLICATION_NOT_REGISTERED' : 'REGISTRATION_FAILED')),
          String(data.message || 'Application registration failed'),
          response.status,
        );
        if (response.status < 500) throw error;
        lastError = error;
      } catch (error) {
        if (error instanceof LuthAuthError && error.status && error.status < 500) throw error;
        lastError = error;
      }
      if (attempt < this.maxRetries) await sleep(this.retryDelayMs * 2 ** attempt);
    }
    throw new LuthAuthError(
      'REGISTRATION_FAILED',
      lastError instanceof Error ? lastError.message : 'Application registration timed out',
    );
  }

  public async ensureRegistered(): Promise<RegisterApplicationResult | null> {
    if (!this.autoRegister) return null;
    if (!this.registrationPromise) {
      this.registrationPromise = this.register().catch((error) => {
        this.registrationPromise = null;
        throw error;
      });
    }
    return this.registrationPromise;
  }

  public async getSession(): Promise<LuthSessionResult> {
    await this.ensureRegistered();
    const response = await this.request('/api/session');
    const token = response.headers?.get?.('set-auth-token');
    if (token) this.tokenStore.set(token);
    if (response.status === 401) {
      this.clearAuthToken();
      return { authenticated: false, error: 'SESSION_INVALID' };
    }
    if (!response.ok) throw new LuthAuthError('AUTHENTICATION_FAILED', `Session fetch failed (${response.status})`, response.status);
    const result = await response.json() as LuthSessionResult;
    if (result.session?.token) this.tokenStore.set(result.session.token);
    return result;
  }

  /** Revalidates and hydrates the current Luth session using the canonical session endpoint. */
  public async refreshSession(): Promise<LuthSessionResult> {
    return this.getSession();
  }

  public async signInWithEmail(credentials: EmailSignInCredentials): Promise<unknown> {
    await this.ensureRegistered();
    return this.postAuth('/api/auth/sign-in/email', credentials, 'Sign in failed');
  }

  public async signUpWithEmail(data: EmailSignUpData): Promise<unknown> {
    await this.ensureRegistered();
    return this.postAuth('/api/auth/sign-up/email', data, 'Sign up failed');
  }

  public async signInWithGoogle(options?: GoogleSignInOptions): Promise<unknown> {
    await this.ensureRegistered();
    return this.postAuth('/api/auth/sign-in/social', {
      provider: 'google',
      callbackURL: options?.callbackURL || this.origin,
    }, 'Google sign-in failed');
  }

  public async signOut(): Promise<void> {
    const response = await this.request('/api/auth/sign-out', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    if (!response.ok) {
      throw new LuthAuthError(String(data.code || 'AUTHENTICATION_FAILED'), String(data.message || 'Sign out failed'), response.status);
    }
    this.clearAuthToken();
    const session = await this.getSession();
    if (session.authenticated) {
      throw new LuthAuthError('SESSION_INVALIDATION_FAILED', 'Luth session is still active after sign-out.');
    }
  }

  private async postAuth(path: string, body: unknown, fallback: string): Promise<unknown> {
    const response = await this.request(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    const session = data.session as Record<string, unknown> | undefined;
    const token = response.headers?.get?.('set-auth-token') || String(data.token || session?.token || '');
    if (token) this.tokenStore.set(token);
    if (!response.ok) {
      throw new LuthAuthError(String(data.code || 'AUTHENTICATION_FAILED'), String(data.message || fallback), response.status);
    }
    return data;
  }
}

export function createLuthAuthClient(config: LuthAuthClientConfig): LuthAuthClient {
  return new LuthAuthClient(config);
}
