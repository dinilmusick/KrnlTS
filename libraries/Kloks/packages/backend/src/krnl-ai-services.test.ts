import { describe, expect, it } from 'vitest';
import {
  AIProviderServiceDefinition,
  AIInferenceServiceDefinition,
  AIModelCatalogServiceDefinition,
  AIRoutingServiceDefinition,
  AIKeyServiceDefinition,
  AIToolServiceDefinition,
  AIProviderServiceFacade,
  AIInferenceServiceFacade,
  AIModelCatalogServiceFacade,
  AIRoutingServiceFacade,
  AIKeyServiceFacade,
  AIToolServiceFacade,
} from './krnl-ai-services.js';

describe('Kloks AI service contracts', () => {
  const services = [
    [AIProviderServiceDefinition, AIProviderServiceFacade],
    [AIInferenceServiceDefinition, AIInferenceServiceFacade],
    [AIModelCatalogServiceDefinition, AIModelCatalogServiceFacade],
    [AIRoutingServiceDefinition, AIRoutingServiceFacade],
    [AIKeyServiceDefinition, AIKeyServiceFacade],
    [AIToolServiceDefinition, AIToolServiceFacade],
  ] as const;

  it('exposes every reusable AI capability as a stable service definition', () => {
    expect(services.map(([definition]) => definition.id)).toEqual([
      'kloks.backend.aiProvider',
      'kloks.backend.aiInference',
      'kloks.backend.aiModels',
      'kloks.backend.aiRouting',
      'kloks.backend.aiKeys',
      'kloks.backend.aiTools',
    ]);
  });

  it('keeps each facade aligned with its definition', () => {
    for (const [definition, facade] of services) {
      expect(facade.id).toBe(definition.id);
      expect(facade.name).toBe(definition.name);
      expect(facade.version).toBe(definition.version);
      expect(facade.definition).toBe(definition);
      expect(typeof facade.createInstance).toBe('function');
      expect(typeof facade.execute).toBe('function');
    }
  });

  it('defines executable operations for every service', () => {
    for (const [definition] of services) {
      expect(Object.keys(definition.operations).length).toBeGreaterThan(0);
      for (const operation of Object.values(definition.operations)) {
        expect(operation.id).toBeTruthy();
        expect(operation.name).toBeTruthy();
        expect(typeof operation.handler).toBe('function');
      }
    }
  });
});
