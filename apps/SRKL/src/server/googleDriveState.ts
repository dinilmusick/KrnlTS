import crypto from 'crypto';

export interface GoogleDriveOAuthState {
  userId: string;
  returnTo: string;
  nonce: string;
}

export function isSafeGoogleDriveReturnUrl(target: string, origin: string): boolean {
  if (target.startsWith('/') && !target.startsWith('//') && !target.includes('\\')) return true;
  try {
    const parsed = new URL(target);
    return parsed.origin === origin && (parsed.protocol === 'https:' || parsed.protocol === 'http:');
  } catch {
    return false;
  }
}

export function encodeGoogleDriveState(
  secret: string,
  userId: string,
  returnTo: string,
  origin: string,
  now = Date.now(),
  nonce = crypto.randomBytes(32).toString('base64url'),
): { state: string; nonce: string; returnTo: string } {
  if (secret.length < 32 || !userId.trim()) throw new Error('Google OAuth state signing inputs are invalid.');
  const safeReturn = isSafeGoogleDriveReturnUrl(returnTo, origin) ? returnTo : '/';
  const payload = Buffer.from(JSON.stringify({
    userId, returnTo: safeReturn, nonce, exp: now + 10 * 60_000,
  })).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  return { state: `${payload}.${signature}`, nonce, returnTo: safeReturn };
}

export function decodeGoogleDriveState(
  secret: string,
  value: string,
  origin: string,
  now = Date.now(),
): GoogleDriveOAuthState {
  const [payload, signature, ...extra] = value.split('.');
  if (!payload || !signature || extra.length || secret.length < 32) throw new Error('Invalid Google OAuth state.');
  const expected = Buffer.from(crypto.createHmac('sha256', secret).update(payload).digest('base64url'));
  const received = Buffer.from(signature);
  if (expected.length !== received.length || !crypto.timingSafeEqual(expected, received)) {
    throw new Error('Invalid Google OAuth state signature.');
  }

  let data: any;
  try {
    data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch {
    throw new Error('Malformed Google OAuth state.');
  }
  if (
    typeof data.userId !== 'string' || !data.userId.trim() ||
    typeof data.nonce !== 'string' || data.nonce.length < 32 ||
    !Number.isFinite(Number(data.exp)) || Number(data.exp) <= now ||
    typeof data.returnTo !== 'string' ||
    !isSafeGoogleDriveReturnUrl(data.returnTo, origin)
  ) throw new Error('Expired or malformed Google OAuth state.');
  return { userId: data.userId, returnTo: data.returnTo, nonce: data.nonce };
}

export function matchesGoogleDriveStateNonce(expected: string, received: string): boolean {
  if (!expected || !received) return false;
  const left = Buffer.from(expected);
  const right = Buffer.from(received);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}
