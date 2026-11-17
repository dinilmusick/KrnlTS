import { serviceRegistry, GatewayServiceRecord } from '../registry/serviceRegistry';

export class GatewayResolver {
  public async resolve(name: string): Promise<GatewayServiceRecord | null> {
    return serviceRegistry.lookup(name);
  }
}

export const serviceResolver = new GatewayResolver();
