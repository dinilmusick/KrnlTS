/**
 * @file ProtocolResolver.ts
 * @description Protocol selection resolving matching adapters from capabilities.
 */

import type { ProtocolType, EndpointDescriptor, ServiceDefinition } from '../services/ServiceContract.js';

export class ProtocolResolver {
  static selectProtocol(
    requiredCapabilities: string[],
    availableEndpoints: EndpointDescriptor[]
  ): EndpointDescriptor | undefined {
    return availableEndpoints.find((ep) =>
      requiredCapabilities.every((req) => ep.capabilities.includes(req))
    );
  }

  static getSupportedProtocols(definition: ServiceDefinition): ProtocolType[] {
    return definition.protocols || ['http'];
  }
}
