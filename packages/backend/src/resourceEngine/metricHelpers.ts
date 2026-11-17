/**
 * @file metricHelpers.ts
 * @description Pure metric formatters and Vercel usage metric builders (< 150 lines).
 */

export function formatCpuSeconds(seconds: number): string {
  if (!seconds || seconds <= 0) return '0 s';
  if (seconds < 60) return `${Math.round(seconds)} s`;
  if (seconds < 3600) return `${(seconds / 60).toFixed(1)} m`;
  return `${(seconds / 3600).toFixed(1)} h`;
}

export function formatCountMetric(count: number): string {
  if (!count || count <= 0) return '0';
  if (count < 1000) return String(Math.round(count));
  if (count < 1000000) return `${(count / 1000).toFixed(1)}k`;
  return `${(count / 1000000).toFixed(1)}M`;
}

export function buildUsageMetrics(tier: string, raw: any, projectsCount: number = 1) {
  const isHobby = tier === 'hobby';
  const cpuLimitSeconds = isHobby ? 4 * 3600 : 40 * 3600;
  const invocationsLimit = isHobby ? 100000 : 1000000;
  const edgeRequestsLimit = isHobby ? 500000 : 5000000;
  const transferLimitGb = isHobby ? 100 : 1000;
  const memoryLimitGbHours = isHobby ? 100 : 1000;
  const storageLimitMb = isHobby ? 500 : 5000;

  const usedCpu = Number(raw?.cpuUsage || raw?.metrics?.cpu || 0);
  const usedInvocations = Number(raw?.invocations || raw?.metrics?.invocations || 0);
  const usedEdgeRequests = Number(raw?.edgeRequests || raw?.metrics?.edgeRequests || 0);
  const usedTransferGb = Number(raw?.bandwidthGb || 0);
  const usedMemoryGbHours = Number(raw?.memoryGbHours || 0);
  const usedStorageMb = Number(raw?.storageMb || 0);

  return {
    usageMetrics: {
      periodLabel: 'Last 30 Days',
      fluidActiveCpu: {
        usedSeconds: usedCpu,
        limitSeconds: cpuLimitSeconds,
        usedFormatted: formatCpuSeconds(usedCpu),
        limitFormatted: formatCpuSeconds(cpuLimitSeconds),
        percent: Math.min(100, Math.round((usedCpu / cpuLimitSeconds) * 100)),
        remainingFormatted: formatCpuSeconds(Math.max(0, cpuLimitSeconds - usedCpu)),
      },
      functionInvocations: {
        usedCount: usedInvocations,
        limitCount: invocationsLimit,
        usedFormatted: formatCountMetric(usedInvocations),
        limitFormatted: formatCountMetric(invocationsLimit),
        percent: Math.min(100, Math.round((usedInvocations / invocationsLimit) * 100)),
        remainingFormatted: formatCountMetric(Math.max(0, invocationsLimit - usedInvocations)),
      },
      edgeRequests: {
        usedCount: usedEdgeRequests,
        limitCount: edgeRequestsLimit,
        usedFormatted: formatCountMetric(usedEdgeRequests),
        limitFormatted: formatCountMetric(edgeRequestsLimit),
        percent: Math.min(100, Math.round((usedEdgeRequests / edgeRequestsLimit) * 100)),
        remainingFormatted: formatCountMetric(Math.max(0, edgeRequestsLimit - usedEdgeRequests)),
      },
      fastDataTransfer: {
        usedGb: usedTransferGb,
        limitGb: transferLimitGb,
        usedFormatted: `${usedTransferGb} GB`,
        limitFormatted: `${transferLimitGb} GB`,
        percent: Math.min(100, Math.round((usedTransferGb / transferLimitGb) * 100)),
        remainingFormatted: `${Math.max(0, transferLimitGb - usedTransferGb)} GB`,
      },
      fluidProvisionedMemory: {
        usedGbHours: usedMemoryGbHours,
        limitGbHours: memoryLimitGbHours,
        usedFormatted: `${usedMemoryGbHours} GB-h`,
        limitFormatted: `${memoryLimitGbHours} GB-h`,
        percent: Math.min(100, Math.round((usedMemoryGbHours / memoryLimitGbHours) * 100)),
        remainingFormatted: `${Math.max(0, memoryLimitGbHours - usedMemoryGbHours)} GB-h`,
      },
      functionsStorage: {
        usedMb: usedStorageMb,
        limitMb: storageLimitMb,
        usedFormatted: `${usedStorageMb} MB`,
        limitFormatted: `${storageLimitMb} MB`,
        percent: Math.min(100, Math.round((usedStorageMb / storageLimitMb) * 100)),
        remainingFormatted: `${Math.max(0, storageLimitMb - usedStorageMb)} MB`,
      },
      fastOriginTransfer: 0,
      edgeRequestCpuDuration: 0,
      isrReads: 0,
      middlewareInvocations: 0,
    },
  };
}
