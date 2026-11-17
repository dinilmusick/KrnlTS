export interface GitHubVcsProviderOptions {token: string; apiBaseUrl?: string;}
export interface GitHubFile {path: string; content: string; sha?: string;}

export class GitHubVcsProvider {
  readonly id = "github";
  private readonly apiBaseUrl: string;
  constructor(private readonly options: GitHubVcsProviderOptions) { this.apiBaseUrl = options.apiBaseUrl ?? "https://api.github.com"; }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await fetch(this.apiBaseUrl + path, {
      ...init,
      headers: {
        accept: "application/vnd.github+json",
        authorization: `Bearer ${this.options.token}`,
        "x-github-api-version": "2022-11-28",
        "content-type": "application/json",
        ...(init.headers ?? {}),
      },
    });
    if (!response.ok) throw new Error(`GitHub API ${response.status}: ${await response.text()}`);
    return response.status === 204 ? (undefined as T) : await response.json() as T;
  }

  getRepository(repository: string): Promise<unknown> { return this.request(`/repos/${repository}`); }
  createBranch(repository: string, branch: string, sha: string): Promise<unknown> {
    return this.request(`/repos/${repository}/git/refs`, {method: "POST", body: JSON.stringify({ref: `refs/heads/${branch}`, sha})});
  }
  getFile(repository: string, path: string, ref?: string): Promise<GitHubFile> {
    const query = ref ? `?ref=${encodeURIComponent(ref)}` : "";
    return this.request<GitHubFile>(`/repos/${repository}/contents/${path}${query}`);
  }
  writeFile(repository: string, file: GitHubFile, message: string, branch: string): Promise<unknown> {
    return this.request(`/repos/${repository}/contents/${file.path}`, {method: "PUT", body: JSON.stringify({message, content: Buffer.from(file.content, "utf8").toString("base64"), sha: file.sha, branch})});
  }
  createPullRequest(repository: string, title: string, body: string, head: string, base = "main"): Promise<unknown> {
    return this.request(`/repos/${repository}/pulls`, {method: "POST", body: JSON.stringify({title, body, head, base})});
  }
}
