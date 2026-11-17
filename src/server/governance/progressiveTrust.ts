import { TrustLevel } from './types';

export const TRUST_LEVEL_RANKS: Record<TrustLevel, number> = {
  T0_UNVERIFIED: 0,
  T1_EMAIL_VERIFIED: 1,
  T2_ESTABLISHED: 2,
  T3_TRUSTED: 3,
  T4_PRIVILEGED: 4,
};

export const TRUST_RATE_MULTIPLIERS: Record<TrustLevel, number> = {
  T0_UNVERIFIED: 0.25,
  T1_EMAIL_VERIFIED: 1.0,
  T2_ESTABLISHED: 2.0,
  T3_TRUSTED: 5.0,
  T4_PRIVILEGED: 10.0,
};

export const ABUSE_SIGNAL_WEIGHTS = {
  FAILED_LOGIN: 2,
  RAPID_REQUESTS: 5,
  INVALID_REFRESH: 5,
  UNAUTHORIZED_ACCESS: 10,
  RESOURCE_OVERFLOW: 15,
  INJECTION_PAYLOAD: 25,
  TOKEN_REUSE: 30,
};

export type AbuseSignal = keyof typeof ABUSE_SIGNAL_WEIGHTS;

interface UserTrustState {
  accountId: string;
  trustLevel: TrustLevel;
  abuseScore: number;
  lastAbuseAt?: number;
  suspended?: boolean;
}

const trustStateByAccount = new Map<string, UserTrustState>();

export function getAccountTrustState(accountId: string): UserTrustState {
  let state = trustStateByAccount.get(accountId);
  if (!state) {
    state = {
      accountId,
      trustLevel: 'T0_UNVERIFIED',
      abuseScore: 0,
    };
    trustStateByAccount.set(accountId, state);
  }
  return state;
}

export function isTrustLevelSufficient(current: TrustLevel, required: TrustLevel): boolean {
  return TRUST_LEVEL_RANKS[current] >= TRUST_LEVEL_RANKS[required];
}

export function getTrustRateMultiplier(level: TrustLevel, accountId?: string): number {
  const base = TRUST_RATE_MULTIPLIERS[level] || 1.0;
  if (!accountId) return base;
  const state = trustStateByAccount.get(accountId);
  if (!state) return base;
  if (state.abuseScore >= 15) return base * 0.5;
  return base;
}

export function recordAbuseSignal(
  accountId: string,
  signal: AbuseSignal,
  count = 1,
  _ip?: string
): { score: number; penalized: boolean; suspended: boolean } {
  const state = getAccountTrustState(accountId);
  const weight = (ABUSE_SIGNAL_WEIGHTS[signal] || 5) * count;
  state.abuseScore += weight;
  state.lastAbuseAt = Date.now();

  let penalized = false;
  let suspended = false;

  if (state.abuseScore >= 30) {
    penalized = true;
  }

  if (state.abuseScore >= 50) {
    suspended = true;
    state.suspended = true;
  }

  return { score: state.abuseScore, penalized, suspended };
}

export function promoteTrustLevel(accountId: string, nextLevel: TrustLevel): TrustLevel {
  const state = getAccountTrustState(accountId);
  if (TRUST_LEVEL_RANKS[nextLevel] > TRUST_LEVEL_RANKS[state.trustLevel]) {
    state.trustLevel = nextLevel;
  }
  return state.trustLevel;
}

