import {
  ServiceFacade as KrnlServiceFacade,
  type IServiceFacade,
  type ServiceDefinition,
} from '@ultrst-armada/krnl';

export interface ExecutableKloksServiceFacade {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly definition: ServiceDefinition;
  execute<TInput = unknown, TOutput = unknown>(operation: string, input?: TInput): Promise<TOutput>;
}

export type AdaptedKloksServiceFacade = IServiceFacade & {
  execute<TInput = unknown, TOutput = unknown>(operation: string, input?: TInput): Promise<TOutput>;
};

/**
 * Adapts Kloks' portable operation facade to the richer Krnl ServiceFacade
 * contract used by Skipo's BackendFacade. Each operation is exposed as a
 * queued Krnl functionality while the original Kloks facade remains the
 * execution target, preserving its service state and lifecycle.
 */
export function toKrnlServiceFacade(source: ExecutableKloksServiceFacade): AdaptedKloksServiceFacade {
  const functionalities = Object.fromEntries(
    Object.entries(source.definition.operations ?? {}).map(([operation, definition]) => [
      operation,
      {
        id: definition.id,
        name: definition.name || operation,
        description: definition.description,
        inputSchema: definition.inputSchema,
        outputSchema: definition.outputSchema,
        capabilities: definition.capabilities,
        execute: (input: unknown) => source.execute(operation, input),
      },
    ]),
  );

  const facade = new KrnlServiceFacade({
    id: source.id,
    name: source.name,
    version: source.version,
    functionalities,
    definition: source.definition,
    dependencies: source.definition.dependencies,
    capabilities: source.definition.capabilities,
  });

  return Object.assign(facade, {
    execute: source.execute.bind(source),
  }) as AdaptedKloksServiceFacade;
}
