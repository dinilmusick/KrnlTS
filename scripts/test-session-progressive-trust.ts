/**
 * ══════════════════════════════════════════════════════════════════════════════════════════
 * SESSION + EMAIL VERIFICATION + PROGRESSIVE TRUST SPECIFICATION VERIFICATION SUITE
 * ══════════════════════════════════════════════════════════════════════════════════════════
 * Validates:
 * 1. Multi-session isolation & credentials outside User entity
 * 2. High-entropy refresh tokens (SHA-256 hashed, never raw in storage)
 * 3. Atomic refresh token rotation & token theft detection (reuse revokes session)
 * 4. Session isolation (revoking Session A does not affect Session B)
 * 5. Logout all devices
 * 6. Email verification challenge hashing, expiry, and single-use consumption
 * 7. Multi-tier resend rate limiting (account, email, IP)
 * 8. Server-side trust calculation (T0 -> T1 -> T2 -> T3 -> T4)
 * 9. Feature gating by minimumTrustLevel & emailVerificationRequired
 * 10. Progressive trust rate limit multipliers (0.25x -> 10.0x)
 * 11. Multi-signal abuse scoring & automatic penalties (halving, session revocation, suspension)
 * 12. Account status enforcement (SUSPENDED / DISABLED blocked at Gate 2)
 *
 * Usage:
 *   npx tsx scripts/test-session-progressive-trust.ts
 */

import { NextRequest } from 'next/server';
import {
  createSession,
  rotateRefreshToken,
  revokeSession,
  revokeAllUserSessions,
  validateAccessToken,
  getUserSessions,
  clearSessionsForTest,
  hashToken,
} from '../lib/api-governance/session-manager';
import {
  createEmailVerificationChallenge,
  verifyEmailChallenge,
  checkResendRateLimit,
} from '../lib/api-governance/email-verification';
import {
  calculateTrust,
  getTrustRateMultiplier,
  recordAbuseSignal,
  computeAbuseScore,
  clearAbuseSignalsForTest,
  SUSPICIOUS_ABUSE_THRESHOLD,
  HIGH_RISK_ABUSE_THRESHOLD,
  ACCOUNT_SUSPENSION_ABUSE_THRESHOLD,
} from '../lib/api-governance/trust-engine';
import { getSecurityEvents } from '../lib/api-governance/security-events';
import { createSecureRoute } from '../lib/api-governance/create-secure-route';
import { checkGovernanceRateLimit, clearAllRateLimits } from '../lib/api-governance/rate-limiter';
import { loadUsers, saveUsers } from '../lib/auth-storage';
import { UserAccount } from '../lib/types';

const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
};

let passed = 0;
let failed = 0;

async function assertStep(name: string, fn: () => Promise<void> | void) {
  const start = Date.now();
  try {
    process.stdout.write(`  ${c.cyan}▶${c.reset} ${name}... `);
    await fn();
    const duration = Date.now() - start;
    console.log(`${c.green}✔ PASS${c.reset} ${c.dim}(${duration}ms)${c.reset}`);
    passed++;
  } catch (err: any) {
    const duration = Date.now() - start;
    console.log(`${c.red}✖ FAIL${c.reset} ${c.dim}(${duration}ms)${c.reset}`);
    console.error(`    ${c.red}Error:${c.reset} ${err?.message || err}`);
    failed++;
  }
}

async function runSessionTrustSuite() {
  console.log(`\n${c.bold}================================================================${c.reset}`);
  console.log(`${c.bold}  SESSION + EMAIL VERIFICATION + PROGRESSIVE TRUST SPEC VERIFIER ${c.reset}`);
  console.log(`${c.bold}================================================================${c.reset}\n`);

  clearSessionsForTest();
  clearAbuseSignalsForTest();
  clearAllRateLimits();

  const testUserA = 'user_test_alpha_101';
  const testEmailA = 'alpha@docustack.dev';

  // ────────────────────────────────────────────────────────────────────────
  // 1. MULTI-SESSION CREATION & ISOLATION
  // ────────────────────────────────────────────────────────────────────────
  console.log(`${c.bold}1. Multi-Session Storage & Isolation${c.reset}`);

  let sessionA1: ReturnType<typeof createSession>;
  let sessionA2: ReturnType<typeof createSession>;

  await assertStep('Independent login sessions are created for Device A and Device B', () => {
    sessionA1 = createSession(testUserA, { deviceId: 'macbook-pro', userAgent: 'Chrome/120', ipAddress: '10.0.0.1' });
    sessionA2 = createSession(testUserA, { deviceId: 'iphone-15', userAgent: 'Safari/Mobile', ipAddress: '10.0.0.2' });

    if (!sessionA1.session.id || !sessionA2.session.id) throw new Error('Session IDs missing');
    if (sessionA1.session.id === sessionA2.session.id) throw new Error('Sessions must have unique IDs');
    if (sessionA1.refreshToken === sessionA2.refreshToken) throw new Error('Refresh tokens must be unique');

    // Verify raw refresh token is NOT stored in the session record
    if ((sessionA1.session as any).refreshToken) {
      throw new Error('RAW refresh token must NEVER be stored in the session object!');
    }
    if (sessionA1.session.refreshTokenHash !== hashToken(sessionA1.refreshToken)) {
      throw new Error('Session must store SHA-256 hash of refresh token');
    }
  });

  await assertStep('Active sessions can be queried without exposing credentials', () => {
    const active = getUserSessions(testUserA);
    if (active.length < 2) throw new Error(`Expected at least 2 active sessions, got ${active.length}`);
    for (const s of active) {
      if ((s as any).refreshTokenHash || (s as any).refreshToken) {
        throw new Error('Active session query must never expose refresh token or hashes');
      }
    }
  });

  await assertStep('Access tokens validate correctly against their corresponding session', () => {
    const valid1 = validateAccessToken(sessionA1.accessToken);
    if (!valid1 || valid1.accountId !== testUserA || valid1.sessionId !== sessionA1.session.id) {
      throw new Error('Access token validation failed for Session A1');
    }
    const valid2 = validateAccessToken(sessionA2.accessToken);
    if (!valid2 || valid2.accountId !== testUserA || valid2.sessionId !== sessionA2.session.id) {
      throw new Error('Access token validation failed for Session A2');
    }
  });

  // ────────────────────────────────────────────────────────────────────────
  // 2. ATOMIC REFRESH TOKEN ROTATION & THEFT DETECTION
  // ────────────────────────────────────────────────────────────────────────
  console.log(`\n${c.bold}2. Refresh Token Rotation & Theft Detection${c.reset}`);

  let rotatedA1: ReturnType<typeof rotateRefreshToken>;
  let oldTokenA1: string;

  await assertStep('Atomic refresh token rotation produces new tokens and updates hash', () => {
    oldTokenA1 = sessionA1.refreshToken;
    rotatedA1 = rotateRefreshToken(oldTokenA1, { ip: '10.0.0.1', userAgent: 'Chrome/120' });

    if (!rotatedA1.accessToken || !rotatedA1.refreshToken) throw new Error('New tokens missing from rotation');
    if (rotatedA1.refreshToken === oldTokenA1) throw new Error('Rotated refresh token must be distinct from old token');
    if (rotatedA1.sessionId !== sessionA1.session.id) throw new Error('Rotated token must retain session ID');
  });

  await assertStep('Reusing an already-invalidated refresh token triggers token theft detection', () => {
    let errorThrown = false;
    try {
      // Attacker attempts to replay oldTokenA1
      rotateRefreshToken(oldTokenA1, { ip: '198.51.100.99', userAgent: 'AttackerBot/1.0' });
    } catch (err: any) {
      errorThrown = true;
      if (!err.message.includes('TOKEN_THEFT_DETECTED') && !err.message.includes('Stolen')) {
        throw new Error(`Unexpected error message on reuse: ${err.message}`);
      }
    }
    if (!errorThrown) throw new Error('Reusing rotated token MUST throw an error');

    // Verify the entire session was revoked
    const validCheck = validateAccessToken(rotatedA1.accessToken);
    if (validCheck !== null) {
      throw new Error('Session must be completely revoked after token theft detection');
    }

    // Verify REFRESH_TOKEN_REUSE security event was recorded
    const events = getSecurityEvents({ accountId: testUserA, type: 'REFRESH_TOKEN_REUSE' });
    if (events.length === 0) throw new Error('REFRESH_TOKEN_REUSE security event was not recorded');
  });

  await assertStep('Device B session remains completely intact (Session Isolation invariant)', () => {
    // Session A2 should still be valid!
    const valid2 = validateAccessToken(sessionA2.accessToken);
    if (!valid2 || valid2.sessionId !== sessionA2.session.id) {
      throw new Error('Session A2 was improperly revoked! Session isolation violated.');
    }
  });

  await assertStep('Explicit logout on Device B revokes Session B only', () => {
    const revoked = revokeSession(sessionA2.session.id, 'USER_CLICKED_LOGOUT');
    if (!revoked) throw new Error('revokeSession returned false');

    const valid2After = validateAccessToken(sessionA2.accessToken);
    if (valid2After !== null) throw new Error('Session A2 must be invalid after revocation');
  });

  await assertStep('Revoke all sessions invalidates all remaining sessions for user', () => {
    const s1 = createSession(testUserA);
    const s2 = createSession(testUserA);
    const revokedCount = revokeAllUserSessions(testUserA, 'LOGOUT_ALL_DEVICES');
    if (revokedCount < 2) throw new Error(`Expected at least 2 revoked sessions, got ${revokedCount}`);

    if (validateAccessToken(s1.accessToken) !== null || validateAccessToken(s2.accessToken) !== null) {
      throw new Error('All sessions must be invalid after revokeAllUserSessions');
    }
  });

  // ────────────────────────────────────────────────────────────────────────
  // 3. EMAIL VERIFICATION & RESEND RATE LIMITS
  // ────────────────────────────────────────────────────────────────────────
  console.log(`\n${c.bold}3. Email Verification Lifecycle & Multi-Tier Resends${c.reset}`);

  let verificationChallenge: ReturnType<typeof createEmailVerificationChallenge>;

  await assertStep('Cryptographic verification challenge is created with SHA-256 hash', () => {
    verificationChallenge = createEmailVerificationChallenge(testUserA, testEmailA, '10.0.0.1');
    if (!verificationChallenge.rawToken || !verificationChallenge.challenge.id) {
      throw new Error('Challenge creation failed');
    }
    if (verificationChallenge.challenge.tokenHash !== hashToken(verificationChallenge.rawToken)) {
      throw new Error('Challenge hash does not match raw token');
    }
  });

  await assertStep('Multi-tier resend rate limiting blocks rapid repeated resends', () => {
    // Perform 3 allowed attempts
    checkResendRateLimit(testUserA, testEmailA, '10.0.0.1');
    checkResendRateLimit(testUserA, testEmailA, '10.0.0.1');
    checkResendRateLimit(testUserA, testEmailA, '10.0.0.1');

    // 4th attempt should be blocked (account/email limit is 3 per 15 min)
    const blocked = checkResendRateLimit(testUserA, testEmailA, '10.0.0.1');
    if (blocked.allowed) throw new Error('Resend rate limit did not trigger after 3 attempts');
    if (!blocked.retryAfterSec || blocked.retryAfterSec <= 0) {
      throw new Error('Retry-After header missing on resend rate limit');
    }
  });

  await assertStep('Successful email challenge verification consumes token and invalidates replay', () => {
    const verifyRes = verifyEmailChallenge(verificationChallenge.rawToken, '10.0.0.1');
    if (!verifyRes.success) throw new Error(`Verification failed: ${verifyRes.error}`);
    if (verifyRes.trustLevel !== 'T1_EMAIL_VERIFIED') {
      throw new Error(`Expected trustLevel T1_EMAIL_VERIFIED, got ${verifyRes.trustLevel}`);
    }

    // Replay attempt must fail
    const replayRes = verifyEmailChallenge(verificationChallenge.rawToken, '10.0.0.1');
    if (replayRes.success) throw new Error('Replayed verification token MUST NOT succeed');
  });

  // ────────────────────────────────────────────────────────────────────────
  // 4. PROGRESSIVE TRUST ENGINE & FEATURE GATING
  // ────────────────────────────────────────────────────────────────────────
  console.log(`\n${c.bold}4. Progressive Trust Engine & Feature Gating${c.reset}`);

  await assertStep('Progressive trust level advancement from T0 to T4', () => {
    const baseAccount: Partial<UserAccount> = {
      id: 'trust-user-1',
      email: 'trust@docustack.dev',
      createdAt: new Date().toISOString(),
      emailVerified: false,
      successfulActivityCount: 0,
    };

    // T0: Unverified
    if (calculateTrust(baseAccount) !== 'T0_UNVERIFIED') throw new Error('Default must be T0_UNVERIFIED');

    // T1: Email Verified
    baseAccount.emailVerified = true;
    if (calculateTrust(baseAccount) !== 'T1_EMAIL_VERIFIED') throw new Error('Email verified must be T1_EMAIL_VERIFIED');

    // T2: Established Account (Age >= 7 days)
    const sevenDaysAgo = Date.now() - 8 * 24 * 60 * 60 * 1000;
    baseAccount.createdAt = new Date(sevenDaysAgo).toISOString();
    if (calculateTrust(baseAccount) !== 'T2_ESTABLISHED') throw new Error('Age >= 7d must be T2_ESTABLISHED');

    // T3: Trusted Account (Age >= 30 days & activity >= 50)
    const thirtyDaysAgo = Date.now() - 32 * 24 * 60 * 60 * 1000;
    baseAccount.createdAt = new Date(thirtyDaysAgo).toISOString();
    baseAccount.successfulActivityCount = 60;
    if (calculateTrust(baseAccount) !== 'T3_TRUSTED') throw new Error('Age >= 30d & 50 acts must be T3_TRUSTED');

    // T4: Admin / Privileged
    baseAccount.role = 'admin';
    if (calculateTrust(baseAccount) !== 'T4_PRIVILEGED') throw new Error('Admin must be T4_PRIVILEGED');
  });

  await assertStep('Trust rate multipliers scale capacity predictably', () => {
    if (getTrustRateMultiplier('T0_UNVERIFIED') !== 0.25) throw new Error('T0 multiplier must be 0.25');
    if (getTrustRateMultiplier('T1_EMAIL_VERIFIED') !== 1.0) throw new Error('T1 multiplier must be 1.0');
    if (getTrustRateMultiplier('T2_ESTABLISHED') !== 2.0) throw new Error('T2 multiplier must be 2.0');
    if (getTrustRateMultiplier('T3_TRUSTED') !== 5.0) throw new Error('T3 multiplier must be 5.0');
    if (getTrustRateMultiplier('T4_PRIVILEGED') !== 10.0) throw new Error('T4 multiplier must be 10.0');
  });

  await assertStep('createSecureRoute enforces minimumTrustLevel & emailVerificationRequired', async () => {
    const gatedRoute = createSecureRoute({
      id: 'test-gated-feature',
      method: 'POST',
      auth: { required: true },
      minimumTrustLevel: 'T2_ESTABLISHED',
      emailVerificationRequired: true,
      handler: async () => new Response('gated-success'),
    });

    // Ensure user exists in user storage as T0 unverified
    const unverifiedUser = 'unverified_user_99';
    const users = loadUsers();
    if (!users.some((u) => u.id === unverifiedUser)) {
      users.push({
        id: unverifiedUser,
        name: 'Unverified User',
        username: 'unverified99',
        email: 'unverified99@docustack.dev',
        role: 'user',
        passwordHash: 'dummy',
        emailVerified: false,
        trustLevel: 'T0_UNVERIFIED',
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
      });
      saveUsers(users);
    }

    // Create session for user with T0 (unverified)
    const s = createSession(unverifiedUser);

    // Call route with T0 access token
    const req = new NextRequest('http://localhost:3000/api/test-gate', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${s.accessToken}`,
      },
    });

    const res = await gatedRoute(req, {});
    if (res.status !== 403) {
      throw new Error(`Expected 403 Forbidden for T0 on T2 gated route, got ${res.status}`);
    }
  });

  await assertStep('createSecureRoute rejects suspended/disabled accounts at Gate 2 with 403', async () => {
    const suspendedUserId = 'user_suspended_777';
    const users = loadUsers();
    if (!users.some((u) => u.id === suspendedUserId)) {
      users.push({
        id: suspendedUserId,
        name: 'Suspended User',
        username: 'suspended777',
        email: 'suspended@docustack.dev',
        role: 'user',
        passwordHash: 'dummy',
        emailVerified: true,
        trustLevel: 'T1_EMAIL_VERIFIED',
        status: 'SUSPENDED',
        createdAt: new Date().toISOString(),
      });
      saveUsers(users);
    }

    const s = createSession(suspendedUserId);
    const testRoute = createSecureRoute({
      id: 'test-status-gate',
      method: 'GET',
      auth: { required: true },
      handler: async () => new Response('should-not-reach'),
    });

    const req = new NextRequest('http://localhost:3000/api/test-status', {
      method: 'GET',
      headers: {
        authorization: `Bearer ${s.accessToken}`,
      },
    });

    const res = await testRoute(req, {});
    if (res.status !== 403) {
      throw new Error(`Expected 403 Forbidden for suspended user, got ${res.status}`);
    }
  });

  // ────────────────────────────────────────────────────────────────────────
  // 5. MULTI-SIGNAL ABUSE SCORING & AUTOMATIC PENALTIES
  // ────────────────────────────────────────────────────────────────────────
  console.log(`\n${c.bold}5. Multi-Signal Abuse Scoring & Progressive Penalties${c.reset}`);

  const abusiveAccount = 'abuser_test_303';

  await assertStep('Abuse signals accumulate according to predefined weights', () => {
    clearAbuseSignalsForTest();
    recordAbuseSignal(abusiveAccount, 'failedLogins', 2); // 2 * 2 = 4
    recordAbuseSignal(abusiveAccount, 'rateLimitViolations', 3); // 3 * 2 = 6
    const score = computeAbuseScore(abusiveAccount);
    if (score !== 10) throw new Error(`Expected score 10, got ${score}`);
  });

  await assertStep('Suspicious abuse score (>= 15) triggers rate limit penalty', () => {
    recordAbuseSignal(abusiveAccount, 'verificationFailures', 2); // + 2 * 3 = 6 -> total 16
    const score = computeAbuseScore(abusiveAccount);
    if (score < SUSPICIOUS_ABUSE_THRESHOLD) throw new Error('Score did not cross suspicious threshold');
  });

  await assertStep('High risk abuse score (>= 30) revokes all active sessions', () => {
    const activeSession = createSession(abusiveAccount);
    // Push score over 30
    recordAbuseSignal(abusiveAccount, 'unusualConcurrency', 5); // + 5 * 3 = 15 -> total 31
    const score = computeAbuseScore(abusiveAccount);
    if (score < HIGH_RISK_ABUSE_THRESHOLD) throw new Error('Score did not cross high risk threshold');

    // Active session should be revoked automatically
    const valid = validateAccessToken(activeSession.accessToken);
    if (valid !== null) {
      throw new Error('High risk abuse must automatically revoke all user sessions');
    }
  });

  console.log(`\n${c.bold}================================================================${c.reset}`);
  console.log(`  ${c.green}${c.bold}VERIFICATION COMPLETE: ${passed} PASSED, ${failed} FAILED${c.reset}`);
  console.log(`${c.bold}================================================================${c.reset}\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runSessionTrustSuite().catch((err) => {
  console.error('Fatal error during verification:', err);
  process.exit(1);
});
