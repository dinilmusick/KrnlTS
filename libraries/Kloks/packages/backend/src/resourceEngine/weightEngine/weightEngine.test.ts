// ══════════════════════════════════════════════════════════════════════════════
// WEIGHT ENGINE & DECOUPLED RESOURCE CALCULATOR TEST SUITE (< 200 lines)
// ══════════════════════════════════════════════════════════════════════════════
import { GraphNode, GraphEdge, AccountEntity, DeploymentEntity } from '../types/depm/index';
import { getWeightModifierScore, computeDeploymentFinalWeight } from './weightEngine';
import { computeUsageWeightScore, getConnectedDeploymentNode } from './helpers';
import { ResourceFetcherRegistry } from '../ResourceFetcherRegistry';
import { UniversalResourceCalculator } from '../calculator/UniversalResourceCalculator';

function expect<T>(actual: T) {
  return {
    toBe: (expected: T) => {
      if (actual !== expected) throw new Error(`Assertion failed: ${actual} !== ${expected}`);
    },
    toBeGreaterThan: (expected: number) => {
      if (typeof actual !== 'number' || actual <= expected) throw new Error(`Expected ${actual} > ${expected}`);
    },
    toBeLessThan: (expected: number) => {
      if (typeof actual !== 'number' || actual >= expected) throw new Error(`Expected ${actual} < ${expected}`);
    },
    toBeDefined: () => {
      if (actual === undefined || actual === null) throw new Error('Expected value to be defined');
    },
  };
}

import { describe, it } from 'vitest';

export function testWeightEngineSuite() {
  describe('WeightEngineSuite', () => {
    it('calculates real resource scores and weights correctly', () => {
  // Test 1: Active User Account with real Vercel consumption (Active CPU 30m 27s/4h, Mem 29.1/360, etc.)
  const accountUserUsage: AccountEntity = {
    id: 'sa_user_vercel',
    provider: 'VERCEL',
    name: 'Vercel',
    emailOrSlug: 'dextro1n1laevo-1517',
    tier: 'hobby',
    status: 'CONNECTED',
    credentialType: 'API_TOKEN',
    deploymentCount: 3,
    aggregateUsage: 79000,
    aggregateSpend: 0,
    aggregateQuota: 1000000,
    resetTime: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    usageMetrics: {
      periodLabel: 'Last 30 days',
      fluidActiveCpu: { usedSeconds: 1827, limitSeconds: 14400, percent: 13, usedFormatted: '30m 27s', limitFormatted: '4h', remainingFormatted: '3h 29m' },
      fluidProvisionedMemory: { usedGbHours: 29.1, limitGbHours: 360, percent: 8, usedFormatted: '29.1 GB-Hrs', limitFormatted: '360 GB-Hrs', remainingFormatted: '330.9 GB-Hrs' },
      functionInvocations: { usedCount: 79000, limitCount: 1000000, percent: 8, usedFormatted: '79K', limitFormatted: '1M', remainingFormatted: '921K' },
      edgeRequests: { usedCount: 41000, limitCount: 1000000, percent: 4, usedFormatted: '41K', limitFormatted: '1M', remainingFormatted: '959K' },
      fastDataTransfer: { usedGb: 0.15, limitGb: 100, percent: 0, usedFormatted: '154 MB', limitFormatted: '100 GB', remainingFormatted: '100 GB' },
      fastOriginTransfer: { usedMb: 114, limitMb: 10240, percent: 1, usedFormatted: '114 MB', limitFormatted: '10 GB' },
      edgeRequestCpuDuration: { usedSeconds: 6, limitSeconds: 3600, percent: 0, usedFormatted: '6s', limitFormatted: '1h' },
    } as any,
  };

  const depEntity: DeploymentEntity = {
    id: 'dep-test-1',
    name: 'docustack-engine',
    provider: 'VERCEL',
    accountId: 'sa_user_vercel',
    providerDeploymentId: 'dpl_123',
    publicOrigin: 'https://docustack-engine.vercel.app',
    status: 'READY',
    health: 'HEALTHY',
    usage: 100,
    spend: 0,
    quota: 100000,
    quotaRemaining: 99900,
    resetTime: new Date().toISOString(),
    requestRate: 5,
    resourceRate: 2,
    createdAt: new Date().toISOString(),
  };

  // Detailed score calculation
  const detailed = ResourceFetcherRegistry.calculateDetailedScore(accountUserUsage, depEntity);
  
  // The user's account has consumed 30m 27s CPU and 29.1 GB-Hrs memory -> MUST NOT BE 1.00 (100%)
  expect(detailed.effectiveWeight).toBeLessThan(0.98);
  expect(detailed.effectiveWeight).toBeGreaterThan(0.85);
  expect(detailed.dominantBottleneck.id).toBe('fluid_active_cpu');
  expect(detailed.summaryLabel.includes('CPU')).toBe(true);

  // Test 2: Graph wiring resolution & traversal
  const weightNode: GraphNode = {
    id: 'w-node-1',
    appId: 'test-app',
    type: 'WEIGHT_RESOURCE',
    x: 0,
    y: 0,
    name: 'Resource Weight',
  };

  const multNode: GraphNode = {
    id: 'm-node-1',
    appId: 'test-app',
    type: 'WEIGHT_MULTIPLY',
    x: 100,
    y: 0,
    name: 'Multiplier',
  };

  const depNode: GraphNode = {
    id: 'dep-node-1',
    appId: 'test-app',
    type: 'DEPLOYMENT',
    x: 200,
    y: 0,
    deploymentId: 'dep-test-1',
    name: 'docustack-engine',
  };

  const edge1: GraphEdge = { id: 'e1', appId: 'test-app', sourceId: 'w-node-1', targetId: 'm-node-1' };
  const edge2: GraphEdge = { id: 'e2', appId: 'test-app', sourceId: 'm-node-1', targetId: 'dep-node-1' };

  const connectedDep = getConnectedDeploymentNode(weightNode.id, [weightNode, multNode, depNode], [edge1, edge2]);
  expect(connectedDep?.id).toBe(depNode.id);

  const finalWeight = computeDeploymentFinalWeight(
    depNode.id,
    [weightNode, multNode, depNode],
    [edge1, edge2],
    [accountUserUsage],
    [depEntity]
  );
  expect(finalWeight).toBe(detailed.effectiveWeight);

  // Test 3: Cloudflare Adapter Integration
  const cfAccount: AccountEntity = {
    id: 'acc_cf',
    provider: 'CLOUDFLARE',
    name: 'Cloudflare',
    emailOrSlug: 'cf-user',
    tier: 'free',
    status: 'CONNECTED',
    credentialType: 'API_TOKEN',
    deploymentCount: 1,
    aggregateUsage: 0,
    aggregateSpend: 0,
    aggregateQuota: 100000,
    resetTime: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  const cfDetailed = ResourceFetcherRegistry.calculateDetailedScore(cfAccount);
  expect(cfDetailed.effectiveWeight).toBeGreaterThan(0.80);
  expect(cfDetailed.effectiveWeight).toBeLessThan(1.0);
    });
  });
}

testWeightEngineSuite();

