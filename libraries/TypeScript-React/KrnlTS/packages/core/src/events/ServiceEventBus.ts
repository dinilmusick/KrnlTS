/**
 * @file ServiceEventBus.ts
 * @description Backward-compatible generic event bus.
 *
 * KrnlTS no longer defines service-owned application events. First-class
 * application events are owned by functionalities and orchestration lifecycle.
 */

import { EventBus } from './EventBus.js';

export class ServiceEventBus<TEvents extends Record<string, unknown> = Record<string, unknown>>
  extends EventBus<TEvents> {}
