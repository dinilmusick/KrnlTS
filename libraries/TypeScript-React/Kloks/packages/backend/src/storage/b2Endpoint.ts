/**
 * Backblaze B2 Endpoint & Credential Normalizer
 */

export function isSecretMasked(str?: string): boolean {
  return Boolean(str && (str.includes('•') || str.includes('***')));
}

export function resolveBackblazeEndpoint(
  inputEndpointOrRegion?: string,
  keyId?: string
): { endpoint: string; region: string } {
  let raw = (inputEndpointOrRegion || '').trim().toLowerCase();
  raw = raw.replace(/^https?:\/\//, '').replace(/[\/?#].*$/, '').trim();

  // 1. Full B2 S3 Endpoint: "s3.us-east-005.backblazeb2.com" or "us-east-005.backblazeb2.com"
  const endpointMatch = raw.match(/(?:s3\.)?([a-z0-9-]+)\.backblazeb2\.com/i);
  if (endpointMatch) {
    const region = endpointMatch[1];
    return {
      region,
      endpoint: `https://s3.${region}.backblazeb2.com`,
    };
  }

  // 2. Region name entered directly: "us-east-005", "eu-central-003"
  if (raw && /^[a-z0-9-]+$/.test(raw) && !raw.includes('.')) {
    return {
      region: raw,
      endpoint: `https://s3.${raw}.backblazeb2.com`,
    };
  }

  // 3. Custom gateway: e.g. proxy.mydomain.com
  if (raw && raw.includes('.')) {
    return {
      region: 'us-west-004',
      endpoint: `https://${raw}`,
    };
  }

  // 4. Auto-detect region from Key ID prefix
  let derivedRegion = 'us-west-004';
  if (keyId) {
    const cleanKey = keyId.trim();
    if (cleanKey.startsWith('005')) derivedRegion = 'us-east-005';
    else if (cleanKey.startsWith('004')) derivedRegion = 'us-west-004';
    else if (cleanKey.startsWith('003')) derivedRegion = 'eu-central-003';
    else if (cleanKey.startsWith('002')) derivedRegion = 'us-west-002';
    else if (cleanKey.startsWith('001')) derivedRegion = 'us-west-001';
    else if (cleanKey.startsWith('000')) derivedRegion = 'us-west-000';
  }

  return {
    region: derivedRegion,
    endpoint: `https://s3.${derivedRegion}.backblazeb2.com`,
  };
}

export function normalizeBackblazeCredentials(
  inputKeyId?: string,
  inputAppKey?: string
): { keyId: string; appKey: string } {
  let keyId = (inputKeyId || '').trim();
  let appKey = (inputAppKey || '').trim();

  // 1. Auto-extract if user pasted multi-line block containing "keyID: ... applicationKey: ..."
  const rawCombined = `${keyId}\n${appKey}`;
  const idMatch = rawCombined.match(/keyID[:\s]+([0-9a-zA-Z]{12,36})/i);
  const secretMatch = rawCombined.match(/applicationKey[:\s]+([0-9a-zA-Z/+=_-]{20,64})/i);
  if (idMatch && secretMatch) {
    keyId = idMatch[1].trim();
    appKey = secretMatch[1].trim();
  }

  // 2. Auto-detect if user swapped Key ID and Application Key
  // (B2 Application Key secret starts with 'K00' and is 31 chars; Key ID is 25 chars starting with '00')
  if (keyId.startsWith('K00') && (!appKey || appKey.startsWith('00') || appKey.length === 25)) {
    const temp = keyId;
    keyId = appKey || temp;
    appKey = temp;
  }

  if (isSecretMasked(appKey)) {
    throw new Error('BACKBLAZE_APP_KEY_MASKED: Application Key secret is masked.');
  }

  return { keyId, appKey };
}
