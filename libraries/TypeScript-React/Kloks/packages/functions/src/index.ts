/**
 * @file index.ts
 * @description KrnlTS FunctionsServiceFacade plus the portable function library.
 */

import {
  createService,
  createServiceDefinition,
  type IService,
  type ServiceDefinition,
} from '@ultrst-armada/krnl';

export * from './portable.js';

import { toKebabCase, toCamelCase, toPascalCase } from './string.js';
import { deepClone, deepMerge } from './object.js';

export const FunctionsServiceDefinition: ServiceDefinition = createServiceDefinition({
  id: 'kloks.functions.core',
  name: 'FunctionsService',
  version: '1.0.0',
  operations: {
    toKebabCase: {
      id: 'FunctionsService.toKebabCase',
      name: 'toKebabCase',
      handler: async (input: { value: string }) => toKebabCase(input.value),
    },
    toCamelCase: {
      id: 'FunctionsService.toCamelCase',
      name: 'toCamelCase',
      handler: async (input: { value: string }) => toCamelCase(input.value),
    },
    toPascalCase: {
      id: 'FunctionsService.toPascalCase',
      name: 'toPascalCase',
      handler: async (input: { value: string }) => toPascalCase(input.value),
    },
    deepClone: {
      id: 'FunctionsService.deepClone',
      name: 'deepClone',
      handler: async (input: { value: unknown }) => deepClone(input.value),
    },
    deepMerge: {
      id: 'FunctionsService.deepMerge',
      name: 'deepMerge',
      handler: async (input: { target: Record<string, any>; source: Record<string, any> }) =>
        deepMerge(input.target, input.source),
    },
  },
});

const defaultFunctionsService: IService = createService(FunctionsServiceDefinition);

export const FunctionsServiceFacade = {
  id: FunctionsServiceDefinition.id,
  name: FunctionsServiceDefinition.name,
  version: FunctionsServiceDefinition.version,
  runtime: 'server' as const,
  deployment: 'local' as const,
  definition: FunctionsServiceDefinition,
  get telemetry() { return defaultFunctionsService.telemetry; },
  createInstance: () => createService(FunctionsServiceDefinition),
  execute: async <TIn = unknown, TOut = unknown>(op: string, input?: TIn) => { await defaultFunctionsService.start(); return defaultFunctionsService.call<TIn, TOut>(op, input); },
};

// ══════════════════════════════════════════════════════════════════════════════
// KRNL CANONICAL SERVICE EXPORTS (Standardized krnl* Prefix Rule)
// ══════════════════════════════════════════════════════════════════════════════
export const krnlFunctionsServiceDefinition = FunctionsServiceDefinition;
export const krnlFunctionsServiceFacade = FunctionsServiceFacade;

