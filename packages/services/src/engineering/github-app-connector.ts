export interface GitHubAppInstallation { account: string; appId: number; installationId: number; privateKey: string; }
export interface GitHubAppConnectorOptions {
  installations: GitHubAppInstallation[];
  apiBaseUrl?: string;
  fetchImpl?: typeof fetch;
  now?: () => number;
  signer?: (installation: GitHubAppInstallation, nowSeconds: number) => Promise<string>;
}
export interface GitHubOperationResult<T> {
  ok: true;
  operation: string;
  data: T;
  diagnostics: { startedAt: string; completedAt: string; status: number; requestId?: string };
}
export interface GitHubOperationError {
  ok: false;
  operation: string;
  error: { message: string; status?: number; diagnostics?: unknown };
}
export type GitHubResult<T> = GitHubOperationResult<T> | GitHubOperationError;
export interface GitHubWorkflowRun { id: number; status: string; conclusion: string | null; html_url?: string; created_at: string; updated_at: string; run_number?: number; }
type InstallationToken = { token: string; expiresAt: number };

const encoder = new TextEncoder();
const base64 = (bytes: Uint8Array): string => {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
};
const base64Url = (bytes: Uint8Array): string => base64(bytes).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
const pemToDer = (pem: string): Uint8Array => {
  const value = pem.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, "");
  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
};
const signAppJwt = async (installation: GitHubAppInstallation, nowSeconds: number): Promise<string> => {
  const header = base64Url(encoder.encode(JSON.stringify({ alg: "RS256", typ: "JWT" })));
  const payload = base64Url(encoder.encode(JSON.stringify({ iat: nowSeconds - 30, exp: nowSeconds + 540, iss: String(installation.appId) })));
  const key = await crypto.subtle.importKey("pkcs8", pemToDer(installation.privateKey).buffer as ArrayBuffer, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, encoder.encode(header + "." + payload));
  return header + "." + payload + "." + base64Url(new Uint8Array(signature));
};

export class GitHubAppConnector {
  readonly id = "github-app";
  private readonly apiBaseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly now: () => number;
  private readonly signer: (installation: GitHubAppInstallation, nowSeconds: number) => Promise<string>;
  private readonly installations: Map<string, GitHubAppInstallation>;
  private readonly tokens = new Map<string, InstallationToken>();

  constructor(options: GitHubAppConnectorOptions) {
    if (options.installations.length === 0) throw new Error("At least one GitHub App installation is required");
    this.apiBaseUrl = options.apiBaseUrl ?? "https://api.github.com";
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.now = options.now ?? (() => Date.now());
    this.signer = options.signer ?? signAppJwt;
    this.installations = new Map(options.installations.map((installation) => [installation.account, installation]));
  }

  listAccounts(): string[] { return [...this.installations.keys()].sort(); }

  private installation(account: string): GitHubAppInstallation {
    const value = this.installations.get(account);
    if (!value) throw new Error("Unknown GitHub App installation account: " + account);
    return value;
  }

  private async installationToken(account: string): Promise<string> {
    const cached = this.tokens.get(account);
    if (cached && cached.expiresAt > this.now() + 60_000) return cached.token;
    const installation = this.installation(account);
    const jwt = await this.signer(installation, Math.floor(this.now() / 1000));
    const response = await this.fetchImpl(this.apiBaseUrl + "/app/installations/" + installation.installationId + "/access_tokens", {
      method: "POST",
      headers: { accept: "application/vnd.github+json", authorization: "Bearer " + jwt, "x-github-api-version": "2022-11-28", "content-type": "application/json" },
    });
    if (!response.ok) throw new Error("GitHub installation token request failed (" + response.status + "): " + await response.text());
    const body = await response.json() as { token: string; expires_at: string };
    this.tokens.set(account, { token: body.token, expiresAt: Date.parse(body.expires_at) });
    return body.token;
  }

  private async request<T>(account: string, path: string, init: RequestInit = {}): Promise<GitHubResult<T>> {
    const operation = (init.method ?? "GET") + " " + path;
    const startedAt = new Date(this.now()).toISOString();
    try {
      const token = await this.installationToken(account);
      const response = await this.fetchImpl(this.apiBaseUrl + path, {
        ...init,
        headers: { accept: "application/vnd.github+json", authorization: "Bearer " + token, "x-github-api-version": "2022-11-28", ...(init.body ? { "content-type": "application/json" } : {}), ...(init.headers ?? {}) },
      });
      const requestId = response.headers.get("x-github-request-id") ?? undefined;
      const completedAt = new Date(this.now()).toISOString();
      if (!response.ok) return { ok: false, operation, error: { message: "GitHub API " + response.status + ": " + await response.text(), status: response.status, diagnostics: { requestId } } };
      const data = response.status === 204 ? undefined as T : await response.json() as T;
      return { ok: true, operation, data, diagnostics: { startedAt, completedAt, status: response.status, requestId } };
    } catch (error) {
      return { ok: false, operation, error: { message: error instanceof Error ? error.message : String(error) } };
    }
  }

  getRepository(account: string, repository: string): Promise<GitHubResult<unknown>> { return this.request(account, "/repos/" + repository); }
  listRepositories(account: string, page = 1, perPage = 100): Promise<GitHubResult<unknown>> { return this.request(account, "/installation/repositories?page=" + page + "&per_page=" + perPage); }

  getFile(account: string, repository: string, path: string, ref?: string): Promise<GitHubResult<unknown>> {
    const query = ref ? "?ref=" + encodeURIComponent(ref) : "";
    return this.request(account, "/repos/" + repository + "/contents/" + path + query);
  }

  commitFile(account: string, repository: string, path: string, content: string, message: string, branch: string, sha?: string): Promise<GitHubResult<unknown>> {
    const encoded = base64(encoder.encode(content));
    return this.request(account, "/repos/" + repository + "/contents/" + path, { method: "PUT", body: JSON.stringify({ message, content: encoded, branch, ...(sha ? { sha } : {}) }) });
  }

  createPullRequest(account: string, repository: string, title: string, body: string, head: string, base = "main"): Promise<GitHubResult<unknown>> {
    return this.request(account, "/repos/" + repository + "/pulls", { method: "POST", body: JSON.stringify({ title, body, head, base }) });
  }

  dispatchWorkflow(account: string, repository: string, workflow: string, ref: string, inputs: Record<string, string> = {}): Promise<GitHubResult<undefined>> {
    return this.request(account, "/repos/" + repository + "/actions/workflows/" + workflow + "/dispatches", { method: "POST", body: JSON.stringify({ ref, inputs }) });
  }

  async pollWorkflow(account: string, repository: string, workflow: string, ref: string, startedAfter: string, options: { timeoutMs?: number; intervalMs?: number } = {}): Promise<GitHubResult<GitHubWorkflowRun>> {
    const timeoutMs = options.timeoutMs ?? 300_000;
    const intervalMs = options.intervalMs ?? 2_000;
    const deadline = this.now() + timeoutMs;
    while (this.now() <= deadline) {
      const result = await this.request<{ workflow_runs: GitHubWorkflowRun[] }>(account, "/repos/" + repository + "/actions/workflows/" + workflow + "/runs?branch=" + encodeURIComponent(ref) + "&per_page=20");
      if (result.ok === false) return result as GitHubOperationError;
      const run = result.data.workflow_runs.find((candidate) => candidate.created_at >= startedAfter);
      if (run && ["completed", "cancelled"].includes(run.status)) return { ...result, data: run };
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
    return { ok: false, operation: "GET workflow poll", error: { message: "Workflow polling timed out", diagnostics: { timeoutMs, repository, workflow, ref, startedAfter } } };
  }
}

export const createGitHubAppConnector = (options: GitHubAppConnectorOptions): GitHubAppConnector => new GitHubAppConnector(options);
