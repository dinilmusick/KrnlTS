import { RuntimeProviderError } from './errors.js';
import type { RuntimeCapability, RuntimeProvider } from './types.js';

export class RuntimeProviderRegistry {
  private readonly providers = new Map<string, RuntimeProvider>();
  register(provider: RuntimeProvider): this {
    if (!provider?.id || !/^[a-z0-9][a-z0-9._-]*$/.test(provider.id)) throw new RuntimeProviderError('INVALID_CONFIGURATION', 'Runtime provider id is invalid.');
    if (this.providers.has(provider.id)) throw new RuntimeProviderError('INVALID_CONFIGURATION', 'Runtime provider already registered: ' + provider.id);
    if (!Array.isArray(provider.capabilities)) throw new RuntimeProviderError('INVALID_CONFIGURATION', 'Runtime provider capabilities must be declared.');
    this.providers.set(provider.id, provider);
    return this;
  }
  get(providerId: string): RuntimeProvider {
    const provider = this.providers.get(providerId);
    if (!provider) throw new RuntimeProviderError('PROVIDER_UNAVAILABLE', 'Runtime provider is not registered: ' + providerId);
    return provider;
  }
  list(): Array<Pick<RuntimeProvider, 'id' | 'displayName' | 'description' | 'capabilities'>> {
    return [...this.providers.values()].map(({ id, displayName, description, capabilities }) => ({ id, displayName, description, capabilities: [...capabilities] }));
  }
  capabilities(providerId: string): RuntimeCapability[] { return [...this.get(providerId).capabilities]; }
}
