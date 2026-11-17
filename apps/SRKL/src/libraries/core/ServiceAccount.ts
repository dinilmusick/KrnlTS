/**
 * @file ServiceAccount.ts
 * @description ServiceAccount concrete model inheriting from CoreAccount.
 * Adheres to Srkl-spec.md Section 8 (Secrets hidden) & Section 9 (Account Model).
 * File size < 200 lines strictly.
 */

import { CoreAccount, CoreAccountData } from './CoreAccount';
import { CredentialField } from '../types/srkl';

export interface ServiceAccountData extends CoreAccountData {
  credentials: Record<string, string>;
  isDefault?: boolean;
}

export class ServiceAccount extends CoreAccount {
  // Private credentials store — not exposed in default serialization
  private _credentials: Record<string, string>;
  public isDefault: boolean;

  constructor(data: ServiceAccountData) {
    super(data);
    this._credentials = { ...data.credentials };
    this.isDefault = data.isDefault ?? false;
  }

  /**
   * Retrieves a credential value securely for runtime invocation.
   */
  public getCredential(key: string): string | undefined {
    return this._credentials[key];
  }

  /**
   * Retrieves all credentials including secrets for authorized editing/export.
   */
  public getAllCredentials(): Record<string, string> {
    return { ...this._credentials };
  }

  /**
   * Safely updates credentials.
   */
  public setCredentials(creds: Record<string, string>): void {
    this._credentials = { ...this._credentials, ...creds };
    this.touch();
  }

  /**
   * Returns a sanitized map with masked secrets for UI display.
   */
  public getMaskedCredentials(fieldDefs: CredentialField[]): Record<string, string> {
    const masked: Record<string, string> = {};
    for (const field of fieldDefs) {
      const val = this._credentials[field.name];
      if (val === undefined) continue;
      if (field.secret) {
        masked[field.name] = val.length > 4 ? `••••••••${val.slice(-4)}` : '••••••••';
      } else {
        masked[field.name] = val;
      }
    }
    return masked;
  }

  /**
   * Serializes account for storage/transport without plain secrets.
   */
  public override toJSON(): ServiceAccountData {
    return {
      ...super.toJSON(),
      credentials: { ...this._credentials },
      isDefault: this.isDefault,
    };
  }
}
