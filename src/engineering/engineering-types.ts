export type Identifier = string;

export type ProviderKind =
  | "github"
  | "gitlab"
  | "bitbucket"
  | "git"
  | "local"
  | "container"
  | "webcontainer"
  | "remote-sandbox"
  | "ci";

export interface RepositoryRef {
  id: Identifier;
  provider: ProviderKind;
  owner?: string;
  name: string;
  defaultBranch?: string;
  remote?: string;
}

export interface WorkspaceRef {
  id: Identifier;
  root: string;
  repositories: readonly RepositoryRef[];
  snapshotId?: Identifier;
}

export interface ExecutionRequest {
  workspaceId: Identifier;
  command: string;
  cwd?: string;
  environment?: Readonly<Record<string, string>>;
  timeoutMs?: number;
  network?: "none" | "restricted" | "full";
  resources?: {cpu?: number; memoryMb?: number; diskMb?: number};
}

export interface ExecutionResult {
  executionId: Identifier;
  status: "succeeded" | "failed" | "cancelled" | "timed-out";
  exitCode?: number;
  stdout: string;
  stderr: string;
  artifactIds: readonly Identifier[];
}

export interface VerificationCheck {
  id: Identifier;
  name: string;
  status: "passed" | "failed" | "skipped" | "blocked";
  durationMs?: number;
  executionId?: Identifier;
  details?: string;
}

export interface VerificationReport {
  id: Identifier;
  status: "passed" | "failed" | "blocked";
  checks: readonly VerificationCheck[];
  artifactIds: readonly Identifier[];
}

export interface ArtifactRef {
  id: Identifier;
  digest: string;
  type: string;
  uri?: string;
  sourceExecutionId?: Identifier;
}

export type EngineeringCapability =
  | "repository.read"
  | "repository.write"
  | "git.write"
  | "workspace.create"
  | "execution.run"
  | "browser.run"
  | "verification.run"
  | "artifact.write"
  | "package.publish"
  | "deployment.write"
  | "promotion.write";

export interface CapabilityGrant {
  capability: EngineeringCapability;
  resource?: string;
  expiresAt?: string;
}

export interface EngineeringOperationContext {
  taskId: Identifier;
  traceId: Identifier;
  workspaceId?: Identifier;
  grants: readonly CapabilityGrant[];
}

export interface ProvenanceRecord {
  operationId: Identifier;
  actorId: Identifier;
  taskId: Identifier;
  traceId: Identifier;
  timestamp: string;
  source?: RepositoryRef;
  commit?: string;
  artifacts?: readonly Identifier[];
}
