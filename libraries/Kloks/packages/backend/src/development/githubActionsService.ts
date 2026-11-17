import {
  createService,
  createServiceDefinition,
  type IService,
  type ServiceDefinition,
} from '@ultrst-armada/krnl';

export interface GitHubActionsConfig {
  token: string;
  apiBaseUrl?: string;
  fetchImpl?: typeof fetch;
}

export interface WorkflowRun {
  id: number;
  name?: string;
  status?: string;
  conclusion?: string | null;
  html_url?: string;
}

export class GitHubActionsClient {
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;

  constructor(private readonly config: GitHubActionsConfig) {
    this.baseUrl = config.apiBaseUrl ?? 'https://api.github.com';
    this.fetchImpl = config.fetchImpl ?? fetch;
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await this.fetchImpl(this.baseUrl + path, {
      ...init,
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${this.config.token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        ...(init.headers ?? {}),
      },
    });
    const text = await response.text();
    const data = text ? JSON.parse(text) : undefined;
    if (!response.ok) {
      throw new Error(`GitHub Actions request failed (${response.status}): ${data?.message ?? response.statusText}`);
    }
    return data as T;
  }

  listWorkflowRuns(repository: string, workflowId?: string | number, branch?: string) {
    const suffix = workflowId ? `/actions/workflows/${workflowId}/runs` : '/actions/runs';
    const query = branch ? `?branch=${encodeURIComponent(branch)}` : '';
    return this.request<{ workflow_runs: WorkflowRun[] }>(`/repos/${repository}${suffix}${query}`);
  }

  getWorkflowRun(repository: string, runId: number) {
    return this.request<WorkflowRun>(`/repos/${repository}/actions/runs/${runId}`);
  }

  getWorkflowJobs(repository: string, runId: number) {
    return this.request<{ jobs: Array<{ id: number; name: string; status: string; conclusion?: string | null }> }>(
      `/repos/${repository}/actions/runs/${runId}/jobs`,
    );
  }

  getJobLogs(repository: string, jobId: number) {
    return this.request<string>(`/repos/${repository}/actions/jobs/${jobId}/logs`);
  }

  listArtifacts(repository: string, runId?: number) {
    const path = runId
      ? `/repos/${repository}/actions/runs/${runId}/artifacts`
      : `/repos/${repository}/actions/artifacts`;
    return this.request<{ artifacts: Array<{ id: number; name: string; expired: boolean }> }>(path);
  }

  dispatchWorkflow(repository: string, workflowId: string | number, ref: string, inputs: Record<string, string> = {}) {
    return this.request<void>(`/repos/${repository}/actions/workflows/${workflowId}/dispatches`, {
      method: 'POST',
      body: JSON.stringify({ ref, inputs }),
      headers: { 'Content-Type': 'application/json' },
    });
  }

  rerunWorkflow(repository: string, runId: number) {
    return this.request<void>(`/repos/${repository}/actions/runs/${runId}/rerun`, { method: 'POST' });
  }

  rerunFailedJobs(repository: string, runId: number) {
    return this.request<void>(`/repos/${repository}/actions/runs/${runId}/rerun-failed-jobs`, { method: 'POST' });
  }

  cancelWorkflow(repository: string, runId: number) {
    return this.request<void>(`/repos/${repository}/actions/runs/${runId}/cancel`, { method: 'POST' });
  }
}

type ActionInput = {
  repository: string;
  token: string;
  workflowId?: string | number;
  branch?: string;
  runId?: number;
  jobId?: number;
  ref?: string;
  inputs?: Record<string, string>;
};

export const GitHubActionsServiceDefinition: ServiceDefinition = createServiceDefinition({
  id: 'kloks.backend.githubActions',
  name: 'GitHubActionsService',
  version: '1.0.0',
  operations: {
    listWorkflowRuns: { id: 'GitHubActionsService.listWorkflowRuns', name: 'listWorkflowRuns', handler: async (i: ActionInput) => new GitHubActionsClient({ token: i.token }).listWorkflowRuns(i.repository, i.workflowId, i.branch) },
    getWorkflowRun: { id: 'GitHubActionsService.getWorkflowRun', name: 'getWorkflowRun', handler: async (i: ActionInput) => new GitHubActionsClient({ token: i.token }).getWorkflowRun(i.repository, i.runId!) },
    getWorkflowJobs: { id: 'GitHubActionsService.getWorkflowJobs', name: 'getWorkflowJobs', handler: async (i: ActionInput) => new GitHubActionsClient({ token: i.token }).getWorkflowJobs(i.repository, i.runId!) },
    getJobLogs: { id: 'GitHubActionsService.getJobLogs', name: 'getJobLogs', handler: async (i: ActionInput) => new GitHubActionsClient({ token: i.token }).getJobLogs(i.repository, i.jobId!) },
    listArtifacts: { id: 'GitHubActionsService.listArtifacts', name: 'listArtifacts', handler: async (i: ActionInput) => new GitHubActionsClient({ token: i.token }).listArtifacts(i.repository, i.runId) },
    dispatchWorkflow: { id: 'GitHubActionsService.dispatchWorkflow', name: 'dispatchWorkflow', handler: async (i: ActionInput) => new GitHubActionsClient({ token: i.token }).dispatchWorkflow(i.repository, i.workflowId!, i.ref!, i.inputs) },
    rerunWorkflow: { id: 'GitHubActionsService.rerunWorkflow', name: 'rerunWorkflow', handler: async (i: ActionInput) => new GitHubActionsClient({ token: i.token }).rerunWorkflow(i.repository, i.runId!) },
    rerunFailedJobs: { id: 'GitHubActionsService.rerunFailedJobs', name: 'rerunFailedJobs', handler: async (i: ActionInput) => new GitHubActionsClient({ token: i.token }).rerunFailedJobs(i.repository, i.runId!) },
    cancelWorkflow: { id: 'GitHubActionsService.cancelWorkflow', name: 'cancelWorkflow', handler: async (i: ActionInput) => new GitHubActionsClient({ token: i.token }).cancelWorkflow(i.repository, i.runId!) },
  },
});

export const GitHubActionsServiceFacade = {
  id: GitHubActionsServiceDefinition.id,
  name: GitHubActionsServiceDefinition.name,
  version: GitHubActionsServiceDefinition.version,
  runtime: 'server' as const,
  deployment: 'remote' as const,
  definition: GitHubActionsServiceDefinition,
  createInstance: () => createService(GitHubActionsServiceDefinition),
  execute: async <TIn = unknown, TOut = unknown>(op: string, input?: TIn) => {
    const instance: IService = createService(GitHubActionsServiceDefinition);
    await instance.start();
    return instance.call<TIn, TOut>(op, input);
  },
};
