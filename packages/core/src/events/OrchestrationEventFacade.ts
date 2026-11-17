/**
 * @file OrchestrationEventFacade.ts
 * @description Default lifecycle event surface for functionality orchestrations.
 */

import { EventBus, createEventChannels } from './EventBus.js';
import type { EventChannel, OrchestrationLifecyclePayload } from './EventTypes.js';

export interface OrchestrationEventNamespace {
  readonly triggered: EventChannel<OrchestrationLifecyclePayload>;
  readonly completed: EventChannel<OrchestrationLifecyclePayload>;
  readonly failed: EventChannel<OrchestrationLifecyclePayload>;
}

export class OrchestrationEventFacade {
  private readonly eventBus = new EventBus<{
    triggered: OrchestrationLifecyclePayload;
    completed: OrchestrationLifecyclePayload;
    failed: OrchestrationLifecyclePayload;
  }>();

  public readonly events: OrchestrationEventNamespace;

  constructor() {
    this.events = createEventChannels(this.eventBus, ['triggered', 'completed', 'failed']);
  }

  get triggered(): EventChannel<OrchestrationLifecyclePayload> { return this.events.triggered; }
  get completed(): EventChannel<OrchestrationLifecyclePayload> { return this.events.completed; }
  get failed(): EventChannel<OrchestrationLifecyclePayload> { return this.events.failed; }

  emit(
    event: 'triggered' | 'completed' | 'failed',
    payload: OrchestrationLifecyclePayload
  ): void {
    this.eventBus.emit(event, payload);
  }

  clear(): void {
    this.eventBus.clear();
  }
}
