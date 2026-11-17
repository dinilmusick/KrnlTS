export interface WorkspaceStorage {
  read(relPath: string): Promise<string>;
  write(relPath: string, data: string): Promise<void>;
  delete(relPath: string): Promise<void>;
  exists(relPath: string): Promise<boolean>;
  list(relPath: string): Promise<string[]>;
  mkdir(relPath: string): Promise<void>;
}

/** Minimal Node-only Kloks adapter surface injected by the Node bootstrap. */
export interface KloksWorkspaceServiceAdapter {
  readFile(workspaceId: string, filePath: string): Promise<unknown>;
  writeFile(workspaceId: string, filePath: string, data: string): Promise<unknown>;
  deleteFile(workspaceId: string, filePath: string): Promise<unknown>;
  listFiles(workspaceId: string, filePath: string): Promise<Array<{ name?: string }>>;
  listWorkspaces(userId?: string, env?: Record<string, unknown>): Promise<any>;
  createWorkspace(userId: string, data: any, env?: Record<string, unknown>): Promise<any>;
  deleteWorkspace(userId: string, workspaceId: string, env?: Record<string, unknown>): Promise<any>;
}

let nodeWorkspaceService: KloksWorkspaceServiceAdapter | null = null;

/**
 * Register the Node-only Kloks workspace service from a Node bootstrap.
 *
 * This dependency-injection boundary deliberately prevents the portable
 * Worker/Fetch graph from statically or dynamically importing Kloks' aggregate
 * Node barrel (which contains unrelated Node-only storage integrations).
 */
export function configureNodeWorkspaceService(
  service: KloksWorkspaceServiceAdapter | null,
): void {
  nodeWorkspaceService = service;
}

export function normalizeName(rawName: string): string {
  return (rawName || 'unnamed').trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || 'unnamed';
}

function splitWorkspacePath(relPath: string): { workspaceId: string; filePath: string } {
  const clean = relPath.replace(/^\/+/, '');
  const slash = clean.indexOf('/');
  if (slash < 0) return { workspaceId: clean || 'default', filePath: '' };
  return { workspaceId: clean.slice(0, slash), filePath: clean.slice(slash + 1) };
}

export class MemoryWorkspaceStorage implements WorkspaceStorage {
  private files = new Map<string, string>();
  private cleanPath(value: string) { return value.replace(/\\/g, '/').replace(/^\/+/, ''); }
  async read(relPath: string) { const key = this.cleanPath(relPath); if (!this.files.has(key)) throw new Error(`File not found: ${relPath}`); return this.files.get(key)!; }
  async write(relPath: string, data: string) { this.files.set(this.cleanPath(relPath), data); }
  async delete(relPath: string) { this.files.delete(this.cleanPath(relPath)); }
  async exists(relPath: string) { return this.files.has(this.cleanPath(relPath)); }
  async list(relPath: string) {
    const prefix = this.cleanPath(relPath); const base = prefix ? `${prefix}/` : ''; const out = new Set<string>();
    for (const key of this.files.keys()) if (key.startsWith(base)) { const rest = key.slice(base.length); if (rest) out.add(rest.split('/')[0]); }
    return [...out];
  }
  async mkdir(_relPath: string) {}
}

export async function getNodeWorkspaceService(): Promise<KloksWorkspaceServiceAdapter | null> {
  return nodeWorkspaceService;
}

export class KloksWorkspaceStorage implements WorkspaceStorage {
  private mem = new MemoryWorkspaceStorage();

  async read(relPath: string): Promise<string> {
    const svc = await getNodeWorkspaceService();
    if (!svc) return this.mem.read(relPath);
    const { workspaceId, filePath } = splitWorkspacePath(relPath);
    const value = await svc.readFile(workspaceId, filePath);
    return typeof value === 'string' ? value : new TextDecoder().decode(value as Uint8Array);
  }
  async write(relPath: string, data: string): Promise<void> {
    const svc = await getNodeWorkspaceService();
    if (!svc) return this.mem.write(relPath, data);
    const { workspaceId, filePath } = splitWorkspacePath(relPath);
    await svc.writeFile(workspaceId, filePath, data);
  }
  async delete(relPath: string): Promise<void> {
    const svc = await getNodeWorkspaceService();
    if (!svc) return this.mem.delete(relPath);
    const { workspaceId, filePath } = splitWorkspacePath(relPath);
    await svc.deleteFile(workspaceId, filePath);
  }
  async exists(relPath: string): Promise<boolean> {
    const svc = await getNodeWorkspaceService();
    if (!svc) return this.mem.exists(relPath);
    try { await this.read(relPath); return true; } catch { return false; }
  }
  async list(relPath: string): Promise<string[]> {
    const svc = await getNodeWorkspaceService();
    if (!svc) return this.mem.list(relPath);
    const { workspaceId, filePath } = splitWorkspacePath(relPath);
    const entries = await svc.listFiles(workspaceId, filePath);
    return entries.map((entry) => String(entry.name || '')).filter(Boolean);
  }
  async mkdir(_relPath: string): Promise<void> {}
}

export const workspaceStorage = new KloksWorkspaceStorage();
export const workspaceFS = workspaceStorage;

export class LocalWorkspaceStorage extends KloksWorkspaceStorage {
  constructor(_rootDir: string) { super(); }
}
