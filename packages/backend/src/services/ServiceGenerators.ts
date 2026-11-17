/**
 * @file ServiceGenerators.ts
 * @description Factory generators for Skipo backends and composite services.
 */

import { CompositeBackend } from './CompositeBackend.js';
import { createLocalService, createRemoteService } from './ServiceBoundary.js';
import { EndpointGenerator } from './EndpointGenerator.js';
import type { ServiceDefinition, ProtocolAdapter, EndpointDescriptor, IService } from '@ultrst-armada/krnl';

export function createBackend(name: string): CompositeBackend {
  return new CompositeBackend(name);
}

export function createCompositeService(name: string): CompositeBackend {
  return new CompositeBackend(name);
}

export {
  createLocalService,
  createRemoteService,
  EndpointGenerator,
};

export type {
  ServiceDefinition,
  ProtocolAdapter,
  EndpointDescriptor,
  IService,
};
