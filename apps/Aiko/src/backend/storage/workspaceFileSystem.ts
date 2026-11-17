import { workspaceFS } from './workspaceStorage.js';

const processVault = new Map<string, unknown>();
export function readVaultJsonSync<T>(relativePath: string, fallback: T): T {
  return (processVault.has(relativePath) ? processVault.get(relativePath) : fallback) as T;
}
export function writeVaultJsonSync(relativePath: string, value: unknown): void {
  processVault.set(relativePath, value);
}

export class WorkspaceVirtualFileSystemRuntime {
  public filesystem = workspaceFS;
  public primary = { id: 'canonical_workspace', provider: 'canonical_workspace', label: 'Kloks Workspace', status: 'CONNECTED' };
  public backups: Array<Record<string, string>> = [];
  public syncEngine = {
    getStatus: async () => ({ status: 'CANONICAL', workspaceId: null }),
    syncAll: async () => {},
  };
  public addBackupEndpoint(endpoint: Record<string, string>) { this.backups.push(endpoint); }
  public changePrimary(_endpointId: string) {}
}
export const workspaceStorage = new WorkspaceVirtualFileSystemRuntime();
export { workspaceFS };
export default workspaceStorage;
