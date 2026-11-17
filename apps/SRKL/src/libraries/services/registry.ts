/**
 * @file registry.ts
 * @description Master Service Registry for SRKL Hub.
 * Conforms to Srkl-spec.md Section 18 & Section 25.
 * File size < 200 lines strictly.
 */

import { ServiceProvider } from '../core/ServiceProvider';
import { BackblazeService, BACKBLAZE_DEFINITION } from './backblaze/BackblazeService';
import { GeminiService, GEMINI_DEFINITION } from './gemini/GeminiService';
import { GithubService, GITHUB_DEFINITION } from './github/GithubService';
import { VercelService } from './vercel/VercelService';
import { VERCEL_DEFINITION } from './templates/vercelDefinition';
import { CloudflareService } from './cloudflare/CloudflareService';
import { CLOUDFLARE_DEFINITION } from './templates/cloudflareDefinition';
import { AWS_S3_DEFINITION } from './templates/s3Definition';
import { CustomService } from './custom/CustomService';
import { GOOGLE_AI_STUDIO_DEFINITION } from './templates/googleAiStudioDefinition';
import { ServiceDefinition } from '../types/srkl';

export class ServiceRegistry {
  private _providers: Map<string, ServiceProvider> = new Map();

  constructor() {
    for (const def of ServiceRegistry.getAvailableTemplates()) {
      this.registerTemplate(def.identifier);
    }
  }

  public register(provider: ServiceProvider): void {
    this._providers.set(provider.identifier, provider);
  }

  public registerCustomDefinition(definition: ServiceDefinition): ServiceProvider {
    const custom = new CustomService(definition);
    this.register(custom);
    return custom;
  }

  public registerTemplate(identifier: string): ServiceProvider | null {
    if (identifier === BACKBLAZE_DEFINITION.identifier) {
      const provider = new BackblazeService();
      this.register(provider);
      return provider;
    }
    if (identifier === GEMINI_DEFINITION.identifier) {
      const provider = new GeminiService();
      this.register(provider);
      return provider;
    }
    if (identifier === GITHUB_DEFINITION.identifier) {
      const provider = new GithubService();
      this.register(provider);
      return provider;
    }
    if (identifier === VERCEL_DEFINITION.identifier) {
      const provider = new VercelService();
      this.register(provider);
      return provider;
    }
    if (identifier === CLOUDFLARE_DEFINITION.identifier) {
      const provider = new CloudflareService();
      this.register(provider);
      return provider;
    }
    if (identifier === GOOGLE_AI_STUDIO_DEFINITION.identifier) {
      const provider = new CustomService(GOOGLE_AI_STUDIO_DEFINITION);
      this.register(provider);
      return provider;
    }
    if (identifier === AWS_S3_DEFINITION.identifier) {
      const provider = new CustomService(AWS_S3_DEFINITION);
      this.register(provider);
      return provider;
    }
    return null;
  }

  public get(identifier: string): ServiceProvider | undefined {
    return this._providers.get(identifier);
  }

  public getAll(): ServiceProvider[] {
    return Array.from(this._providers.values());
  }

  public getAllDefinitions(): ServiceDefinition[] {
    return this.getAll().map((p) => p.definition);
  }

  public remove(identifier: string): boolean {
    return this._providers.delete(identifier);
  }

  public static getDefaultDefinitions(): ServiceDefinition[] {
    return [BACKBLAZE_DEFINITION, GEMINI_DEFINITION, GITHUB_DEFINITION, VERCEL_DEFINITION, CLOUDFLARE_DEFINITION, GOOGLE_AI_STUDIO_DEFINITION, AWS_S3_DEFINITION];
  }

  public static getAvailableTemplates(): ServiceDefinition[] {
    return [BACKBLAZE_DEFINITION, GEMINI_DEFINITION, GITHUB_DEFINITION, VERCEL_DEFINITION, CLOUDFLARE_DEFINITION, GOOGLE_AI_STUDIO_DEFINITION, AWS_S3_DEFINITION];
  }
}
