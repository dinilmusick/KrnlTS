import {mkdtemp, rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";

export interface Workspace {id: string; root: string;}

export class LocalWorkspaceProvider {
  readonly id = "local-workspace";
  private readonly workspaces = new Map<string, Workspace>();

  async create(prefix = "krusbl-"): Promise<Workspace> {
    const root = await mkdtemp(join(tmpdir(), prefix));
    const workspace = {id: crypto.randomUUID(), root};
    this.workspaces.set(workspace.id, workspace);
    return workspace;
  }

  get(workspaceId: string): Workspace {
    const workspace = this.workspaces.get(workspaceId);
    if (!workspace) throw new Error(`Unknown workspace: ${workspaceId}`);
    return workspace;
  }

  async destroy(workspaceId: string): Promise<void> {
    const workspace = this.get(workspaceId);
    await rm(workspace.root, {recursive: true, force: true});
    this.workspaces.delete(workspaceId);
  }
}
