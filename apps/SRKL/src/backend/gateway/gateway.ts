/**
 * @file gateway.ts
 * @description Central Gateway for remote service dispatch in Srkl-Engine.
 * Conforms to APP_ARCHITECTURE_SPEC Sections 14, 15, 16, 17.
 */

import { serviceRegistry } from './registry/serviceRegistry';
import { serviceResolver } from './resolver/serviceResolver';
import { httpTransport } from './transport/httpTransport';

export class Gateway {
  public get registry() {
    return serviceRegistry;
  }

  public get resolver() {
    return serviceResolver;
  }

  public get transport() {
    return httpTransport;
  }

  public async invoke<T = unknown>(serviceName: string, action: string, payload: unknown): Promise<T> {
    const record = await this.resolver.resolve(serviceName);
    if (!record) throw new Error(`Gateway: service '${serviceName}' not found`);
    const endpoint = record.endpoint || `/api/${serviceName}`;
    const encoded = this.transport.encode({ action, payload });
    const res = await this.transport.send(endpoint, encoded);
    return this.transport.decode<T>(res);
  }
}

export const gateway = new Gateway();
