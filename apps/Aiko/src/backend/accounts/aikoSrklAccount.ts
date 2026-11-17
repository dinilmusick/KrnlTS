import { createSrklAccountClient, type SrklAccount } from '@ultrst-armada/kloks';

export interface AikoSrklAccountOptions {
  srklUrl: string;
  userId: string;
  token?: string;
  sessionToken?: string;
}

let cachedAccount: SrklAccount | undefined;

export function getCachedAikoAccount(): SrklAccount | undefined {
  return cachedAccount;
}

export function setCachedAikoAccount(account: SrklAccount | undefined): void {
  cachedAccount = account;
}

export function clearCachedAikoAccount(): void {
  cachedAccount = undefined;
}

/**
 * Aiko's credentials are canonicalized as the user's SRKL "aiko" service account.
 * Explicit sync fetches from SRKL and hydrates the local account cache.
 * Normal runtime execution relies strictly on the cached record without network roundtrips.
 */
export async function syncAikoAccount(options: AikoSrklAccountOptions): Promise<SrklAccount | undefined> {
  const client = createSrklAccountClient({
    baseUrl: options.srklUrl,
    userId: options.userId,
    appId: 'aiko',
    token: options.token,
    sessionToken: options.sessionToken,
  } as any);
  const account = await client.getByService('aiko', { forceSync: true });
  setCachedAikoAccount(account);
  return account;
}

/**
 * Resolves the Aiko API key from the given account or local cached record.
 * Throws if no synchronized account exists in local cache. Zero network queries.
 */
export function getAikoApiKey(account?: SrklAccount): string {
  const target = account || getCachedAikoAccount();
  if (!target) {
    throw new Error('No synchronized Aiko SRKL account found in local cache. Explicit sync required via syncAikoAccount().');
  }
  const key = target.credentials?.apiKey;
  if (typeof key !== 'string' || !key.trim()) {
    throw new Error('Aiko SRKL account does not contain an apiKey credential');
  }
  return key;
}
