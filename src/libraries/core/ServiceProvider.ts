/**
 * @file ServiceProvider.ts
 * @description ServiceProvider contract inheriting from CoreService.
 * Implements Section 4 & Section 13 Service Adapter contract.
 * File size < 200 lines strictly.
 */

import { CoreService, CoreServiceData } from './CoreService';
import { SurveillanceMetrics } from '../types/srkl';
import type { ServiceAccount } from './ServiceAccount';
import type { ServiceResource } from './ServiceResource';

export interface ServiceProviderData extends CoreServiceData {
  providerType: string;
}

export abstract class ServiceProvider extends CoreService {
  public readonly providerType: string;

  constructor(data: ServiceProviderData) {
    super(data);
    this.providerType = data.providerType;
  }

  /**
   * Validates account credentials against service requirements.
   */
  public abstract authenticate(credentials: Record<string, unknown>): Promise<boolean>;

  /**
   * Retrieves live surveillance telemetry for a specific service account.
   */
  public abstract getStatus(account: ServiceAccount): Promise<SurveillanceMetrics>;

  /**
   * Enumerates resources (e.g. buckets, models, repositories) under the given account.
   */
  public abstract listResources(
    account: ServiceAccount,
    parentId?: string
  ): Promise<ServiceResource[]>;

  /**
   * Retrieves detail metadata for a single specific resource.
   */
  public abstract getResource(
    account: ServiceAccount,
    resourceId: string
  ): Promise<ServiceResource | null>;

  /**
   * Executes a semantic action against the service resource or account.
   */
  public abstract executeAction(
    account: ServiceAccount,
    actionId: string,
    payload: Record<string, unknown>
  ): Promise<unknown>;

  /**
   * Normalizes raw response data from external APIs into the SRKL schema.
   */
  public abstract transformResponse(response: unknown): unknown;
}
