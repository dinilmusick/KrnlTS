import {describe,expect,it} from 'vitest';
import {createSkipoSemanticRuntime} from '../src/backend/semantic/SkipoSemanticRuntime.js';
import {
  createSemanticRequest,
  CapabilityExecutionRuntime,
  type CapabilityDescriptor,
  type Requirement,
  type CapabilityExecutor,
} from '@ultrst-armada/kloks/semantic-runtime';

describe('Krusbl Ecosystem Integration: Semantic Runtime Substrate', () => {
  it('demonstrates the complete success path: semantic request -> runtime -> registry -> task -> resolution -> execution -> artifact -> completed', async () => {
    // 1. Natural-language semantic request
    const semanticReq = createSemanticRequest('Export quarterly revenue for Q3 2026', 'export_financial_report');
    expect(semanticReq.input).toBe('Export quarterly revenue for Q3 2026');
    expect(semanticReq.intent).toBe('export_financial_report');

    // 2. Skipo application semantic runtime
    const runtime = createSkipoSemanticRuntime({
      applicationId: 'ledger-app',
      applicationName: 'General Ledger',
      applicationVersion: '1.0.0',
    });

    // 3. Application capability registry & 4. Registered service endpoint capability
    runtime.registerService('financialReports', {
      definition: {
        operations: {
          generate: {
            name: 'Generate Financial Report',
            description: 'Generates report given quarter and year',
            inputSchema: {
              type: 'object',
              properties: { quarter: { type: 'string' }, year: { type: 'number' } },
              required: ['quarter', 'year'],
            },
            outputSchema: {
              type: 'application/pdf',
            },
          },
        },
      },
    });

    const capabilityId = 'financialReports.generate';
    const capability = runtime.capabilities.get(capabilityId);
    expect(capability).toBeDefined();
    expect(capability?.kind).toBe('endpoint');

    // 5. Task and context creation
    const task = runtime.createTask(semanticReq.input);
    expect(task.status).toBe('submitted');

    const agentContext = await runtime.buildContext(
      { applicationId: 'ledger-app', sessionId: 'sess-fin-99', userId: 'user-cfo' },
      task.id
    );
    expect(agentContext.task.taskId).toBe(task.id);
    expect(agentContext.capabilities.some((c) => c.id === capabilityId)).toBe(true);

    // 6. Requirement resolution (resolves known parameter from context/input)
    const quarterRequirement: Requirement = {
      id: 'req.quarter',
      semanticType: 'FiscalQuarter',
      description: 'The fiscal quarter (e.g. Q3)',
      required: true,
      sourceCapability: capabilityId,
      sourceField: 'quarter',
    };

    // Candidate capability exists in registry for sourceField
    const resolution = await runtime.resolveRequirement(quarterRequirement, agentContext);
    expect(resolution.resolved).toBe(false);
    expect(resolution.reason).toBe('CAPABILITY_REQUIRES_EXECUTION');
    expect(resolution.source).toBe(capabilityId);

    // 7. Capability execution hook via CapabilityExecutionRuntime
    const executionRuntime = new CapabilityExecutionRuntime();
    const executor: CapabilityExecutor = {
      execute: async (cap, input) => {
        return {
          reportId: 'rep-2026-Q3',
          quarter: (input as any).quarter,
          year: (input as any).year,
          status: 'generated',
          downloadUrl: 'https://cdn.ledger.local/rep-2026-Q3.pdf',
        };
      },
    };

    runtime.tasks.transition(task.id, 'working');
    expect(runtime.tasks.get(task.id)?.status).toBe('working');

    const execResult = await executionRuntime.execute(
      capability!,
      { quarter: 'Q3', year: 2026 },
      agentContext,
      executor
    );

    // 8. Artifact and result generated with provenance
    expect(execResult.artifact).toBeDefined();
    expect(execResult.artifact.producer).toBe(capabilityId);
    expect(execResult.artifact.taskId).toBe(task.id);
    expect((execResult.artifact.value as any).reportId).toBe('rep-2026-Q3');
    expect(execResult.artifact.provenance?.capabilityId).toBe(capabilityId);

    runtime.tasks.addArtifact(task.id, execResult.artifact);

    // 9. Completed task
    runtime.tasks.transition(task.id, 'completed');
    const finalTask = runtime.tasks.get(task.id);
    expect(finalTask?.status).toBe('completed');
    expect(finalTask?.context.artifacts).toHaveLength(1);
    expect(finalTask?.context.artifacts[0].id).toBe(execResult.artifact.id);
  });

  it('demonstrates the explicit failure path: missing requirement -> input-required -> no fabricated value -> task resumes', async () => {
    const runtime = createSkipoSemanticRuntime({ applicationId: 'payroll-app' });

    // Capability requiring employee SSN/TaxId
    const cap: CapabilityDescriptor = {
      id: 'payroll.disburse',
      name: 'Disburse Payroll',
      description: 'Disburses payroll to employee bank',
      kind: 'endpoint',
      inputSchema: {
        type: 'object',
        properties: { ssn: { type: 'string' } },
        required: ['ssn'],
      },
    };
    runtime.registerCapability(cap);

    const task = runtime.createTask('disburse bonus to emp-77');
    expect(task.status).toBe('submitted');

    const agentContext = await runtime.buildContext(
      { applicationId: 'payroll-app', sessionId: 'sess-pay-1' },
      task.id
    );

    // 1. Missing requirement that cannot be resolved internally
    const missingTaxIdReq: Requirement = {
      id: 'req.ssn',
      semanticType: 'SocialSecurityNumber',
      description: 'Government tax identification number',
      required: true,
      sourceCapability: 'payroll.disburse',
      sourceField: 'ssnSecret',
    };

    // 2. Requirement resolution returns NO_INTERNAL_RESOLUTION
    const resolution = await runtime.resolveRequirement(missingTaxIdReq, agentContext);
    expect(resolution.resolved).toBe(false);
    expect(resolution.reason).toBe('NO_INTERNAL_RESOLUTION');
    // Ensure no fabricated value was produced
    expect(resolution.value).toBeUndefined();

    // 3. Task enters input-required state with the explicit requirement attached
    runtime.tasks.addRequirement(task.id, missingTaxIdReq);
    let currentTask = runtime.tasks.get(task.id);
    expect(currentTask?.status).toBe('input-required');
    expect(currentTask?.context.requirements).toHaveLength(1);
    expect(currentTask?.context.requirements[0].semanticType).toBe('SocialSecurityNumber');

    // 4. Once requirement is provided externally, task resumes
    runtime.tasks.transition(task.id, 'working');
    expect(runtime.tasks.get(task.id)?.status).toBe('working');

    runtime.tasks.transition(task.id, 'completed');
    expect(runtime.tasks.get(task.id)?.status).toBe('completed');
  });
});
