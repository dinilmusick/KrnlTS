import { randomUUID } from 'node:crypto';
import type { TelemetryInvocation } from './TelemetryTypes.js';
import type { sampleResources } from './TelemetryResources.js';

export type ActiveInvocation = {
  invocationId: string;
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  serviceId: string;
  target: string;
  kind: TelemetryInvocation['kind'];
  correlationId?: string;
  startedAt: number;
  resourcesStart?: ReturnType<typeof sampleResources>;
};

export const createTelemetryId = (prefix: string) => `${prefix}_${randomUUID()}`;
