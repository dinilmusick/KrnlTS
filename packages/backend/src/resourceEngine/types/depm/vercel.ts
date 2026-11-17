// ══════════════════════════════════════════════════════════════════════════════
// DEPM SYSTEM TYPES - VERCEL INTEGRATION
// ══════════════════════════════════════════════════════════════════════════════

export interface VercelUsageMetrics {
  periodLabel: string;
  fluidActiveCpu: {
    usedSeconds: number;
    usedFormatted: string;
    limitFormatted: string;
    limitSeconds: number;
    percent: number;
    remainingFormatted: string;
  };
  functionInvocations: {
    usedCount: number;
    usedFormatted: string;
    limitFormatted: string;
    limitCount: number;
    percent: number;
    remainingFormatted: string;
  };
  edgeRequests: {
    usedCount: number;
    usedFormatted: string;
    limitFormatted: string;
    limitCount: number;
    percent: number;
    remainingFormatted: string;
  };
  fluidProvisionedMemory: {
    usedGbHours: number;
    usedFormatted: string;
    limitFormatted: string;
    limitGbHours: number;
    percent: number;
    remainingFormatted: string;
  };
  functionsStorage: {
    usedMb: number;
    usedFormatted: string;
    limitFormatted: string;
    limitMb: number;
    percent: number;
    remainingFormatted: string;
  };
  fastDataTransfer: {
    usedGb: number;
    usedFormatted: string;
    limitFormatted: string;
    limitGb: number;
    percent: number;
    remainingFormatted: string;
  };
  middlewareInvocations: {
    usedCount: number;
    usedFormatted: string;
    limitFormatted?: string;
    limitCount?: number;
    percent?: number;
  };
  fastOriginTransfer?: {
    usedMb: number;
    usedFormatted: string;
    limitFormatted: string;
    limitMb: number;
    percent: number;
    remainingFormatted: string;
  };
  edgeRequestCpuDuration?: {
    usedSeconds: number;
    usedFormatted: string;
    limitFormatted: string;
    limitSeconds: number;
    percent: number;
    remainingFormatted: string;
  };
  isrReads?: {
    usedCount: number;
    usedFormatted: string;
    limitFormatted: string;
    limitCount: number;
    percent: number;
    remainingFormatted: string;
  };
}

export interface VercelProjectObservability {
  projectId: string;
  projectName: string;
  framework?: string;
  status: 'ACTIVE' | 'PAUSED' | 'BUILDING' | 'ERROR';
  displayStatus?: string;
  isPaused: boolean;
  edgeRequests: number;
  edgeRequestsFormatted: string;
  fastDataTransferGb: number;
  fastDataTransferFormatted: string;
  middlewareInvocations: number;
  middlewareInvocationsFormatted: string;
  deploymentUrl?: string;
  domains: string[];
  createdAt?: string;
  createdRelative?: string;
  createdBy?: string;
  sourceRepo?: string;
  sourceBranch?: string;
  commitSha?: string;
  commitMessage?: string;
  latestDeploymentUrl?: string;
  latestDeploymentStatus?: string;
  latestDeploymentCreatedAt?: string;
  gitRepo?: string;
  gitBranch?: string;
}
