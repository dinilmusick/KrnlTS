/**
 * Canonical backend capability metadata exposed by the Skipo BackendFacade.
 * Module-specific adapter contracts do not belong in the application architecture.
 */

export interface BackendCapabilityDescriptor {
  readonly id: string;
  readonly name: string;
  readonly serviceId: string;
  readonly serviceName: string;
  readonly serviceVersion: string;
  readonly category: 'functionalities' | 'orchestrations';
  readonly description: string;
  readonly inputSchema?: Readonly<Record<string, unknown>>;
  readonly outputSchema?: Readonly<Record<string, unknown>>;
  readonly invocation: {
    readonly kind: 'functionality' | 'orchestration';
    readonly operation: string;
  };
  readonly capabilities: readonly string[];
  readonly protocols: readonly string[];
}
