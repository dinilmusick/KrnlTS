import type {
  OrchestrationContext,
  OrchestrationStep,
  StepCondition,
} from './canonical/model.js';

export function assertFunctionalityServiceBoundary(target: string): void {
  if (
    target.endsWith('ServiceFacade') ||
    target.startsWith('service.') ||
    target.includes('Service.') ||
    (target.endsWith('Service') && !target.includes('Functionality') && !target.includes('Atom')) ||
    (target.startsWith('Service') && !target.includes('Functionality') && !target.includes('Atom'))
  ) {
    throw new Error(
      `[FunctionalityOrchestration] Plane Isolation Invariant Violation: Invariant Violation: FunctionalityOrchestration only composes functionalities within the service, not independent services. External Service composition is forbidden. Target "${target}" is not an internal functionality.`
    );
  }
}

export function addParallelFunctionalitySteps(
  steps: OrchestrationStep[],
  name: string,
  functionalityNames: readonly string[],
  dependsOn: string[] | undefined,
  assertBoundary: (target: string) => void,
): void {
  if (!name || typeof name !== 'string') {
    throw new Error('[FunctionalityOrchestration] Parallel group name must be a non-empty string.');
  }
  if (!functionalityNames || functionalityNames.length === 0) {
    throw new Error('[FunctionalityOrchestration] Parallel step requires at least one functionality.');
  }
  const previousStep = steps.length > 0 ? steps[steps.length - 1].id : undefined;
  const baseDependsOn = dependsOn || (previousStep ? [previousStep] : []);
  const parallelStepIds: string[] = [];
  for (const funcName of functionalityNames) {
    assertBoundary(funcName);
    const stepId = `${name}_${funcName}`;
    parallelStepIds.push(stepId);
    steps.push({ id: stepId, name: funcName, type: 'task', target: funcName, dependsOn: baseDependsOn });
  }
  steps.push({
    id: `${name}_join`,
    name: `${name} Join`,
    type: 'fanIn',
    dependsOn: parallelStepIds,
  });
}

export function addBranchFunctionalitySteps(
  steps: OrchestrationStep[],
  name: string,
  condition: StepCondition,
  thenFunc: string,
  elseFunc: string | undefined,
  dependsOn: string[] | undefined,
  assertBoundary: (target: string) => void,
): void {
  assertBoundary(thenFunc);
  if (elseFunc) assertBoundary(elseFunc);
  const previousStep = steps.length > 0 ? steps[steps.length - 1].id : undefined;
  const baseDependsOn = dependsOn || (previousStep ? [previousStep] : []);
  const thenStepId = `${name}_then_${thenFunc}`;
  steps.push({
    id: thenStepId,
    name: thenFunc,
    type: 'task',
    target: thenFunc,
    condition,
    dependsOn: baseDependsOn,
  });
  const joinDeps = [thenStepId];
  if (elseFunc) {
    const elseStepId = `${name}_else_${elseFunc}`;
    steps.push({
      id: elseStepId,
      name: elseFunc,
      type: 'task',
      target: elseFunc,
      condition: async (ctx: OrchestrationContext) => !(await condition(ctx)),
      dependsOn: baseDependsOn,
    });
    joinDeps.push(elseStepId);
  }
  steps.push({
    id: `${name}_join`,
    name: `${name} Join`,
    type: 'fanIn',
    dependsOn: joinDeps,
  });
}

export function addFanOutFunctionalityStep(
  steps: OrchestrationStep[],
  name: string,
  funcName: string,
  getItems: (ctx: OrchestrationContext) => unknown[] | Promise<unknown[]>,
  options: { dependsOn?: string[]; concurrency?: number },
  assertBoundary: (target: string) => void,
): void {
  assertBoundary(funcName);
  const previousStep = steps.length > 0 ? steps[steps.length - 1].id : undefined;
  steps.push({
    id: name,
    name,
    type: 'fanOut',
    target: funcName,
    getItems,
    concurrency: options.concurrency ?? 5,
    dependsOn: options.dependsOn || (previousStep ? [previousStep] : []),
  });
}
