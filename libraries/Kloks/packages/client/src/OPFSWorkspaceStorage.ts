export class OPFSWorkspaceStorage {
  private readonly rootName: string;

  constructor(rootName = 'skipo-workspaces') {
    this.rootName = rootName;
  }

  private async root(): Promise<any> {
    const storage = (navigator as any).storage;
    if (!storage?.getDirectory) throw new Error('OPFS is not available in this browser.');
    const root = await storage.getDirectory();
    return root.getDirectoryHandle(this.rootName, { create: true });
  }

  private async directory(workspaceId: string, create = true): Promise<any> {
    const root = await this.root();
    return root.getDirectoryHandle(workspaceId, { create });
  }

  private async parent(workspaceId: string, filePath: string, create = true): Promise<{ dir: any; name: string }> {
    const parts = filePath.replace(/^\/+/, '').split('/').filter(Boolean);
    const name = parts.pop();
    if (!name) throw new Error('Workspace file path is required.');
    let dir = await this.directory(workspaceId, create);
    for (const part of parts) dir = await dir.getDirectoryHandle(part, { create });
    return { dir, name };
  }

  async read(workspaceId: string, filePath: string): Promise<Uint8Array> {
    const { dir, name } = await this.parent(workspaceId, filePath, false);
    const handle = await dir.getFileHandle(name);
    return new Uint8Array(await (await handle.getFile()).arrayBuffer());
  }

  async write(workspaceId: string, filePath: string, data: Uint8Array | string): Promise<void> {
    const { dir, name } = await this.parent(workspaceId, filePath, true);
    const handle = await dir.getFileHandle(name, { create: true });
    const writable = await handle.createWritable();
    await writable.write(typeof data === 'string' ? data : data);
    await writable.close();
  }

  async delete(workspaceId: string, filePath: string): Promise<void> {
    const { dir, name } = await this.parent(workspaceId, filePath, false);
    await dir.removeEntry(name);
  }

  async exists(workspaceId: string, filePath: string): Promise<boolean> {
    try { await this.parent(workspaceId, filePath, false).then(async ({ dir, name }) => dir.getFileHandle(name)); return true; }
    catch { return false; }
  }

  async list(workspaceId: string, folderPath = ''): Promise<string[]> {
    let dir = await this.directory(workspaceId, false);
    for (const part of folderPath.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean)) {
      dir = await dir.getDirectoryHandle(part);
    }
    const result: string[] = [];
    for await (const [name, handle] of dir.entries()) result.push(handle.kind === 'directory' ? `${name}/` : name);
    return result;
  }
}
