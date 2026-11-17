/**
 * @file oracle.ts
 * @description Service Oracle Master Registry & Surveillance Facade.
 * Conforms to APP_ARCHITECTURE_SPEC Sections 5 & 6.
 */

import { ServiceRegistry } from '@/libraries/services/registry';

export const runtime: 'client' | 'server' = 'server';
export const deployment: 'local' | 'remote' = 'local';

const registry = new ServiceRegistry();

export const service = {
  name: 'oracle',
  runtime,
  deployment,
  getAvailableTemplates: () => ServiceRegistry.getAvailableTemplates(),
  getAllProviders: () => registry.getAll(),
  getProvider: (identifier: string) => registry.get(identifier),
  registerTemplate: (identifier: string) => registry.registerTemplate(identifier),
};

export const oracleService = service;
