/**
 * ASCII Architecture Flowchart: credentialStore
 *
 *   ┌──────────────────────────────────┐
 *   │    Initialize credentialStore    │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │             credDir              │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │              files               │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │           credentials            │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │  Return State / Result Payload   │
 *   └──────────────────────────────────┘
 */

// ══════════════════════════════════════════════════════════════════════════════════
// ════ CREDENTIAL STORE & WORKSPACE ISOLATED ACCESS ════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════════

import { WorkspaceStorage, normalizeName } from './workspaceStorage.js';
import {
  Credential,
  validateCredential,
  redactCredentialSecret
} from '../types/credentials.js';

export class CredentialStore {
  constructor(private readonly storage: WorkspaceStorage) {}

  async list(workspace: string, includeSecrets: boolean = false): Promise<Credential[]> {
    const credDir = `${workspace}/credentials`;
    const files = await this.storage.list(credDir);
    const credentials: Credential[] = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        const raw = await this.storage.read(`${credDir}/${file}`);
        const parsed: Credential = JSON.parse(raw);
        credentials.push(includeSecrets ? parsed : redactCredentialSecret(parsed));
      }
    }

    return credentials;
  }

  async get(workspace: string, credentialName: string): Promise<Credential> {
    const norm = normalizeName(credentialName);
    const file = `${workspace}/credentials/${norm}.json`;

    if (!(await this.storage.exists(file))) {
      throw new Error(`Credential '${credentialName}' not found in workspace '${workspace}'`);
    }

    const raw = await this.storage.read(file);
    const cred: Credential = JSON.parse(raw);

    const val = validateCredential(cred);
    if (!val.valid) {
      throw new Error(`Corrupted credential file for '${credentialName}': ${val.errors.join(', ')}`);
    }

    if (normalizeName(cred.name) !== norm) {
      throw new Error(`Credential identity mismatch: File '${norm}' contains '${cred.name}'`);
    }

    return cred;
  }

  async save(workspace: string, credential: Credential): Promise<void> {
    const val = validateCredential(credential);
    if (!val.valid) {
      throw new Error(`Invalid Credential: ${val.errors.join(', ')}`);
    }

    const norm = normalizeName(credential.name);
    const file = `${workspace}/credentials/${norm}.json`;

    if (await this.storage.exists(file)) {
      const existingRaw = await this.storage.read(file);
      const existing: Credential = JSON.parse(existingRaw);
      if (existing.name !== credential.name) {
        throw new Error(`Collision error: Credential path '${norm}' owned by '${existing.name}'`);
      }
    }

    await this.storage.write(file, JSON.stringify(credential, null, 2));
  }

  async delete(workspace: string, credentialName: string): Promise<void> {
    const norm = normalizeName(credentialName);
    const file = `${workspace}/credentials/${norm}.json`;
    await this.storage.delete(file);
  }

  async resolveFeatureCredential(workspace: string, credentialRef?: string): Promise<Credential | null> {
    if (!credentialRef) return null;
    return await this.get(workspace, credentialRef);
  }
}