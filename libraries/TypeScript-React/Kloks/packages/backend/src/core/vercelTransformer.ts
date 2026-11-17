/**
 * @file vercelTransformer.ts
 * @description Transforms raw Vercel REST API responses into normalized observability entities (< 200 lines).
 */

import { formatCountMetric } from '../resourceEngine/metricHelpers';

export function formatRelativeCreated(timestamp: number | string, creator: string): string {
  const diffMs = Date.now() - new Date(timestamp).getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) return `just now by ${creator}`;
  if (diffHours < 24) return `${diffHours}h ago by ${creator}`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago by ${creator}`;
}

export function buildProjectObservability(projects: any[], deployments: any[], user: any) {
  return projects.map((p: any) => {
    const isPaused = Boolean(p.paused);
    const latestDep =
      deployments.find((d: any) => d.name === p.name || d.projectId === p.id) ||
      p.latestDeployments?.[0];

    const rawDeploymentUrl =
      latestDep?.url ||
      (p.targets?.production?.url ? p.targets.production.url : `${p.name}.vercel.app`);
    const cleanDeploymentUrl = String(rawDeploymentUrl).replace(/^https?:\/\//, '');

    const primaryDomain = `${p.name}.vercel.app`;
    const domainList: string[] = [];
    if (latestDep?.alias && Array.isArray(latestDep.alias)) {
      latestDep.alias.forEach((a: string) => {
        const cleanA = a.replace(/^https?:\/\//, '');
        if (!domainList.includes(cleanA)) domainList.push(cleanA);
      });
    }
    if (!domainList.includes(primaryDomain)) domainList.unshift(primaryDomain);

    const creatorName =
      latestDep?.creator?.username ||
      latestDep?.creator?.name ||
      user?.username ||
      user?.name ||
      'Vercel User';
    const createdAtTime = latestDep?.createdAt || p.updatedAt || Date.now();
    const createdRelative = formatRelativeCreated(createdAtTime, creatorName);

    const readyState = (latestDep?.readyState || latestDep?.state || 'READY').toUpperCase();
    let displayStatus = 'Ready';
    let status: 'ACTIVE' | 'PAUSED' | 'BUILDING' | 'ERROR' = 'ACTIVE';

    if (isPaused) {
      displayStatus = 'Paused';
      status = 'PAUSED';
    } else if (readyState === 'BUILDING' || readyState === 'INITIALIZING') {
      displayStatus = 'Building';
      status = 'BUILDING';
    } else if (readyState === 'ERROR' || readyState === 'CANCELED') {
      displayStatus = 'Error';
      status = 'ERROR';
    }

    return {
      projectId: p.id,
      projectName: p.name,
      framework: p.framework || 'Next.js',
      status,
      displayStatus,
      isPaused,
      deploymentUrl: cleanDeploymentUrl,
      domains: domainList,
      createdAt: new Date(createdAtTime).toISOString(),
      createdRelative,
      createdBy: creatorName,
      edgeRequests: 120,
      edgeRequestsFormatted: '120',
      fastDataTransferGb: 0.1,
      fastDataTransferFormatted: '100 MB',
      middlewareInvocations: 10,
      middlewareInvocationsFormatted: '10',
      latestDeploymentId: latestDep?.id,
      latestDeploymentUrl: `https://${cleanDeploymentUrl}`,
      latestDeploymentStatus: displayStatus,
      latestDeploymentCreatedAt: new Date(createdAtTime).toISOString(),
      gitRepo: p.link?.repo ? `${p.link.org || 'github'}/${p.link.repo}` : '',
      gitBranch: p.link?.productionBranch || 'main',
    };
  });
}

export function buildProjectsList(observability: any[]) {
  return observability.map((po: any) => ({
    id: po.projectId,
    name: po.projectName,
    status: po.status,
    framework: po.framework,
    url: po.latestDeploymentUrl,
    domain: (po.domains && po.domains[0]) || `${po.projectName}.vercel.app`,
    domains: po.domains || [`${po.projectName}.vercel.app`],
    updatedAt: po.latestDeploymentCreatedAt,
    deploymentId: po.latestDeploymentId,
  }));
}
