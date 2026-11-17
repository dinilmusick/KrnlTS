/**
 * @file aiServices.test.ts
 * @description Unit and contract tests for @kloks/backend AI services and KrnlTS facades
 */

import { describe, it, expect } from 'vitest';
import {
  listProviders,
  getProviderMeta,
  aiProviderService,
  modelCatalog,
  modelHealthService,
  keyStore,
  keysStorage,
  mcpEngine,
  toolManagerService,
  validateToolInput,
  classifyAndFormatError,
  metricsLogger,
  healthCheckService,
  failoverExecutionEngine,
  AIProviderServiceFacade,
  AIModelCatalogServiceFacade,
  AIKeyServiceFacade,
} from '../packages/backend/src/node.js';

describe('Kloks AI Submodules', () => {
  it('ai-provider lists canonical providers with correct metadata', () => {
    const providers = listProviders();
    expect(providers.length).toBeGreaterThanOrEqual(5);

    const google = getProviderMeta('google');
    expect(google).toBeDefined();
    expect(google?.name).toBe('Google Gemini');
    expect(google?.defaultHeaderKey).toBe('x-goog-api-key');

    const groq = aiProviderService.getProvider('groq');
    expect(groq?.baseUrl).toContain('groq.com');
  });

  it('ai-models catalog returns standard models and tracks health', () => {
    const models = modelCatalog.getAllModels();
    expect(models.length).toBeGreaterThanOrEqual(5);

    const flash = modelCatalog.getModel('gemini-2.5-flash');
    expect(flash).toBeDefined();
    expect(flash?.providerId).toBe('google');

    modelHealthService.recordSuccess('google', 'gemini-2.5-flash', 150);
    expect(modelHealthService.isModelAvailable('google', 'gemini-2.5-flash')).toBe(true);

    modelHealthService.recordFailure('test-prov', 'faulty-model', 'Auth error');
    modelHealthService.recordFailure('test-prov', 'faulty-model', 'Auth error');
    modelHealthService.recordFailure('test-prov', 'faulty-model', 'Auth error');
    expect(modelHealthService.isModelAvailable('test-prov', 'faulty-model')).toBe(false);
  });

  it('ai-keys manages rotation, active key selection, and usage accounting', () => {
    keysStorage.clear();
    const created = keyStore.addKey({
      providerId: 'groq',
      label: 'Groq Test Key',
      key: 'gsk_test123',
      status: 'valid',
      isActive: true,
      weight: 10,
      remainingCreditsUsd: 100,
    });

    expect(created.id).toBeDefined();
    expect(keyStore.getKeys('groq').length).toBe(1);

    const active = keyStore.getActiveKey('groq');
    expect(active?.key).toBe('gsk_test123');

    keyStore.recordUsage(created.id, true, 85);
    expect(keyStore.getKey(created.id)?.totalCalls).toBe(1);
    expect(keyStore.getKey(created.id)?.lastLatencyMs).toBe(85);
  });

  it('ai-tools registers tools and validates schemas', async () => {
    const tool = {
      name: 'calculator',
      description: 'Performs arithmetic',
      inputSchema: {
        type: 'object',
        properties: { a: { type: 'number' }, b: { type: 'number' } },
        required: ['a', 'b'],
      },
    };

    toolManagerService.registerTool(tool, async (args: any) => ({
      sum: (args.a as number) + (args.b as number),
    }));

    const validResult = validateToolInput(tool, { a: 5, b: 10 });
    expect(validResult.valid).toBe(true);

    const invalidResult = validateToolInput(tool, { a: 'not-a-number' });
    expect(invalidResult.valid).toBe(false);

    const execRes = await toolManagerService.execute('calculator', { a: 2, b: 3 });
    expect(execRes.success).toBe(true);
    expect((execRes.output as any).sum).toBe(5);
  });

  it('ai-inference classifies errors accurately', () => {
    const rateLimit = classifyAndFormatError('groq', 'llama-3', 'rate limit exceeded', 429);
    expect(rateLimit.details.classification).toBe('RATE_LIMITED');
    expect(rateLimit.details.isKeySpecific).toBe(true);

    const auth = classifyAndFormatError('google', 'gemini', 'unauthorized', 401);
    expect(auth.details.classification).toBe('AUTH_FAILURE');
  });

  it('ai-routing logs metrics and executes failover', async () => {
    metricsLogger.log({
      providerId: 'groq',
      modelId: 'llama-3',
      durationMs: 95,
      success: true,
    });
    expect(metricsLogger.getAverageLatency('groq')).toBe(95);

    const candidates = [
      { providerId: 'prov-a', modelId: 'model-fail' },
      { providerId: 'prov-b', modelId: 'model-ok' },
    ];

    const result = await failoverExecutionEngine.executeWithFailover(
      candidates,
      async (candidate) => {
        if (candidate.providerId === 'prov-a') {
          throw new Error('Candidate A died');
        }
        return 'Candidate B success';
      },
      { maxRetries: 2, backoffMs: 0 }
    );

    expect(result.success).toBe(true);
    expect(result.attempts).toBe(2);
    expect(result.selectedCandidate?.providerId).toBe('prov-b');
    expect(result.result).toBe('Candidate B success');
  });

  it('KrnlTS AI Service Facades execute operations via Krnl contract', async () => {
    const providers = await AIProviderServiceFacade.execute('listProviders');
    expect(Array.isArray(providers)).toBe(true);

    const models = await AIModelCatalogServiceFacade.execute('getAllModels');
    expect(Array.isArray(models)).toBe(true);

    const keys = await AIKeyServiceFacade.execute('getKeys');
    expect(Array.isArray(keys)).toBe(true);
  });
});
