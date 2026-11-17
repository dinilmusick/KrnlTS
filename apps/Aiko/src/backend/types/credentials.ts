/**
 * ASCII Architecture Flowchart: credentials
 *
 *   ┌──────────────────────────────────┐
 *   │      Initialize credentials      │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │        validateCredential        │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │               errs               │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │            validTypes            │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │  Return State / Result Payload   │
 *   └──────────────────────────────────┘
 */

// ══════════════════════════════════════════════════════════════════════════════════
// ════ WORKSPACE CREDENTIALS DATA MODELS ════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════════

export type CredentialType = 'API_KEY' | 'BEARER_TOKEN' | 'BASIC_AUTH' | 'OAUTH_TOKEN' | 'CUSTOM';

export interface CredentialMetadata {
  description?: string;
  provider?: string;
}

export type CredentialData =
  | { type: 'API_KEY'; apiKey: string }
  | { type: 'BEARER_TOKEN'; token: string }
  | { type: 'BASIC_AUTH'; username: string; password: string }
  | { type: 'OAUTH_TOKEN'; accessToken: string; refreshToken?: string; expiresAt?: number }
  | { type: 'CUSTOM'; fields: Record<string, string> };

export interface Credential {
  schemaVersion: string;
  name: string;
  type: CredentialType;
  data: CredentialData;
  metadata?: CredentialMetadata;
}

export interface CredentialValidationResult {
  valid: boolean;
  errors: string[];
}

// ══════════════════════════════════════════════════════════════════════════════════
// ════ VALIDATION & REDACTION HELPERS ═══════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════════

export function validateCredential(cred: any): CredentialValidationResult {
  const errs: string[] = [];
  if (!cred || typeof cred !== 'object') {
    return { valid: false, errors: ['Credential must be an object'] };
  }

  if (typeof cred.schemaVersion !== 'string' || !/^\d+\.\d+\.\d+$/.test(cred.schemaVersion)) {
    errs.push('Invalid credential schemaVersion');
  }

  if (typeof cred.name !== 'string' || !cred.name.trim()) {
    errs.push('Credential name is required');
  }

  const validTypes: CredentialType[] = ['API_KEY', 'BEARER_TOKEN', 'BASIC_AUTH', 'OAUTH_TOKEN', 'CUSTOM'];
  if (!validTypes.includes(cred.type)) {
    errs.push('Invalid CredentialType');
  }

  if (!cred.data || typeof cred.data !== 'object') {
    errs.push('Credential data must be an object');
  } else {
    if (cred.type === 'API_KEY' && (typeof cred.data.apiKey !== 'string' || !cred.data.apiKey)) {
      errs.push('API_KEY credential data requires apiKey string');
    }
    if (cred.type === 'BEARER_TOKEN' && (typeof cred.data.token !== 'string' || !cred.data.token)) {
      errs.push('BEARER_TOKEN credential data requires token string');
    }
    if (cred.type === 'BASIC_AUTH' && (typeof cred.data.username !== 'string' || typeof cred.data.password !== 'string')) {
      errs.push('BASIC_AUTH credential data requires username and password');
    }
    if (cred.type === 'OAUTH_TOKEN' && (typeof cred.data.accessToken !== 'string' || !cred.data.accessToken)) {
      errs.push('OAUTH_TOKEN credential data requires accessToken string');
    }
    if (cred.type === 'CUSTOM' && (!cred.data.fields || typeof cred.data.fields !== 'object')) {
      errs.push('CUSTOM credential data requires fields object');
    }
  }

  return { valid: errs.length === 0, errors: errs };
}

export function redactCredentialSecret(cred: Credential): Credential {
  const mask = (str: string) => (str.length <= 4 ? '••••' : '••••••••');
  let redactedData: CredentialData = { ...cred.data };

  if (cred.data.type === 'API_KEY') {
    redactedData = { type: 'API_KEY', apiKey: mask(cred.data.apiKey) };
  } else if (cred.data.type === 'BEARER_TOKEN') {
    redactedData = { type: 'BEARER_TOKEN', token: mask(cred.data.token) };
  } else if (cred.data.type === 'BASIC_AUTH') {
    redactedData = {
      type: 'BASIC_AUTH',
      username: cred.data.username,
      password: mask(cred.data.password)
    };
  } else if (cred.data.type === 'OAUTH_TOKEN') {
    redactedData = {
      type: 'OAUTH_TOKEN',
      accessToken: mask(cred.data.accessToken),
      refreshToken: cred.data.refreshToken ? mask(cred.data.refreshToken) : undefined,
      expiresAt: cred.data.expiresAt
    };
  } else if (cred.data.type === 'CUSTOM') {
    const redactedFields: Record<string, string> = {};
    for (const [k, v] of Object.entries(cred.data.fields)) {
      redactedFields[k] = mask(v);
    }
    redactedData = { type: 'CUSTOM', fields: redactedFields };
  }

  return {
    ...cred,
    data: redactedData
  };
}