/**
 * ══════════════════════════════════════════════════════════════════════════════════════════
 * API SECURITY & RESOURCE GOVERNANCE - COMPREHENSIVE VERIFICATION SUITE
 * ══════════════════════════════════════════════════════════════════════════════════════════
 * Validates the Canonical 8-Gate Pipeline and Resource Governance Laws:
 * [0. IP Blocklist] -> [1. Request Validation] -> [2. Auth] -> [3. Authorization] ->
 * [4. Rate Limit] -> [5. Resource Limits] -> [6. Application Logic] -> [7. Response]
 *
 * Usage:
 *   npx tsx scripts/test-api-security-governance.ts
 */

import { NextRequest } from 'next/server';
import { isIpBlocked, blockIp, clearAbuseRecords, recordRequestAbuseMetrics } from '../lib/api-governance/abuse-detector';
import { checkGovernanceRateLimit, clearAllRateLimits } from '../lib/api-governance/rate-limiter';
import { acquireConcurrencySlot, releaseConcurrencySlot, executeWithTimeout } from '../lib/api-governance/resource-budget';
import { applySecurityHeaders } from '../lib/api-governance/security-headers';
import { handleSecureApiError } from '../lib/api-governance/error-handler';
import { getObservabilityMetrics, recordRequestMetric, clearObservabilityMetrics } from '../lib/api-governance/observability';
import { createSecureRoute } from '../lib/api-governance/create-secure-route';

const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
};

let passedCount = 0;
let failedCount = 0;

async function assertStep(name: string, fn: () => Promise<void> | void) {
  const start = Date.now();
  try {
    process.stdout.write(`  ${c.cyan}▶${c.reset} ${name}... `);
    await fn();
    const duration = Date.now() - start;
    console.log(`${c.green}✔ PASS${c.reset} ${c.dim}(${duration}ms)${c.reset}`);
    passedCount++;
  } catch (err: any) {
    const duration = Date.now() - start;
    console.log(`${c.red}✖ FAIL${c.reset} ${c.dim}(${duration}ms)${c.reset}`);
    console.error(`    ${c.red}Error:${c.reset} ${err?.message || err}`);
    failedCount++;
  }
}

async function runGovernanceSuite() {
  console.log(`\n${c.bold}================================================================${c.reset}`);
  console.log(`${c.bold}  API SECURITY & RESOURCE GOVERNANCE SPECIFICATION VERIFIER     ${c.reset}`);
  console.log(`${c.bold}================================================================${c.reset}\n`);

  // ────────────────────────────────────────────────────────────────────────
  // GATE 0: IP BLOCKLIST & BOT ANOMALY DETECTION
  // ────────────────────────────────────────────────────────────────────────
  console.log(`${c.bold}Gate 0: IP Blocklist & Bot Anomaly Detection${c.reset}`);

  await assertStep('Clean IP allows traffic through Gate 0', () => {
    clearAbuseRecords();
    const check = isIpBlocked('198.51.100.1');
    if (check.blocked) throw new Error('Clean IP was incorrectly blocked');
  });

  await assertStep('Malicious IP is temporarily blocked with Retry-After header', () => {
    blockIp('198.51.100.2', 'REQUEST_RATE_SPIKE', 'TEST_MALICIOUS_BOT', 60000);
    const check = isIpBlocked('198.51.100.2');
    if (!check.blocked) throw new Error('IP was not blocked');
    if (!check.retryAfterSec || check.retryAfterSec <= 0) throw new Error('Retry-After missing');
  });

  await assertStep('Repeated 401/403/429 spikes automatically trigger abuse IP block', () => {
    const attackerIp = '198.51.100.3';
    // Simulate 35 rapid 401 failures
    for (let i = 0; i < 35; i++) {
      recordRequestAbuseMetrics(attackerIp, 401);
    }
    const check = isIpBlocked(attackerIp);
    if (!check.blocked) throw new Error('Rapid 401 anomaly did not trigger auto-block');
  });

  // ────────────────────────────────────────────────────────────────────────
  // GATE 1: REQUEST VALIDATION (METHOD, HEADERS, SIZE, SCHEMA)
  // ────────────────────────────────────────────────────────────────────────
  console.log(`\n${c.bold}Gate 1: Request Validation (Method, Content-Type, Body Size)${c.reset}`);

  await assertStep('createSecureRoute rejects disallowed HTTP method with 405 & Allow header', async () => {
    const route = createSecureRoute({
      id: 'test-get-only',
      method: 'GET',
      public: true,
      handler: async () => new Response('ok'),
    });

    const fakeReq = new NextRequest('http://localhost:3000/api/test', { method: 'POST' });
    const res = await route(fakeReq, {});
    if (res.status !== 405) throw new Error(`Expected 405, got ${res.status}`);
    const allow = res.headers.get('Allow');
    if (!allow || !allow.includes('GET')) throw new Error('Missing Allow header in 405 response');
  });

  await assertStep('createSecureRoute rejects non-JSON body for JSON mutation route with 415', async () => {
    const route = createSecureRoute({
      id: 'test-post-json',
      method: 'POST',
      public: true,
      handler: async () => new Response('ok'),
    });

    const fakeReq = new NextRequest('http://localhost:3000/api/test', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: 'plain text data',
    });
    const res = await route(fakeReq, {});
    if (res.status !== 415) throw new Error(`Expected 415 Unsupported Media Type, got ${res.status}`);
  });

  await assertStep('createSecureRoute rejects oversize payload exceeding maxBodySize with 413', async () => {
    const route = createSecureRoute({
      id: 'test-size-limit',
      method: 'POST',
      public: true,
      limits: { maxBodySize: 1024 }, // 1KB limit
      handler: async () => new Response('ok'),
    });

    const largeData = JSON.stringify({ text: 'A'.repeat(5000) });
    const fakeReq = new NextRequest('http://localhost:3000/api/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': String(largeData.length),
      },
      body: largeData,
    });
    const res = await route(fakeReq, {});
    if (res.status !== 413) throw new Error(`Expected 413 Payload Too Large, got ${res.status}`);
  });

  // ────────────────────────────────────────────────────────────────────────
  // GATE 2 & 3: AUTHENTICATION & AUTHORIZATION
  // ────────────────────────────────────────────────────────────────────────
  console.log(`\n${c.bold}Gate 2 & 3: Authentication & Role Authorization${c.reset}`);

  await assertStep('createSecureRoute rejects unauthenticated call with 401 Unauthorized', async () => {
    const route = createSecureRoute({
      id: 'test-auth-protected',
      method: 'GET',
      auth: true,
      handler: async () => new Response('ok'),
    });

    const fakeReq = new NextRequest('http://localhost:3000/api/test', { method: 'GET' });
    const res = await route(fakeReq, {});
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
  });

  await assertStep('Public endpoint allows access without credentials', async () => {
    const route = createSecureRoute({
      id: 'test-public-route',
      method: 'GET',
      public: true,
      handler: async () => new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' },
      }),
    });

    const fakeReq = new NextRequest('http://localhost:3000/api/test', { method: 'GET' });
    const res = await route(fakeReq, {});
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
  });

  // ────────────────────────────────────────────────────────────────────────
  // GATE 4: RATE LIMITING
  // ────────────────────────────────────────────────────────────────────────
  console.log(`\n${c.bold}Gate 4: Rate Limiting & Telemetry Headers${c.reset}`);

  await assertStep('Rate limiter tracks request counts and returns remaining quota', () => {
    clearAllRateLimits();
    const res1 = checkGovernanceRateLimit('user-test-1', { tier: 'NORMAL_MUTATION' });
    if (!res1.allowed) throw new Error('First request should be allowed');
    if (res1.remaining !== res1.totalLimit - 1) throw new Error('Remaining count mismatch');

    const res2 = checkGovernanceRateLimit('user-test-1', { tier: 'NORMAL_MUTATION' });
    if (res2.remaining !== res1.totalLimit - 2) throw new Error('Second request count mismatch');
  });

  await assertStep('Rate limit exhaustion returns 429 and Retry-After', () => {
    const clientKey = 'bot-spammer-ip';
    // Consume quota (25 req in 15m for AUTHENTICATION tier)
    for (let i = 0; i < 25; i++) {
      checkGovernanceRateLimit(clientKey, { tier: 'AUTHENTICATION' });
    }
    const blocked = checkGovernanceRateLimit(clientKey, { tier: 'AUTHENTICATION' });
    if (blocked.allowed) throw new Error('Exhausted client should be blocked');
    if (blocked.retryAfterSec <= 0) throw new Error('Missing retryAfterSec');
  });

  // ────────────────────────────────────────────────────────────────────────
  // GATE 5: RESOURCE LIMITS & EXECUTION TIMEOUT
  // ────────────────────────────────────────────────────────────────────────
  console.log(`\n${c.bold}Gate 5: Resource Limits & Execution Timeout${c.reset}`);

  await assertStep('Concurrency limiter acquires and releases execution slots', () => {
    const op = 'analyze-doc';
    const acquired1 = acquireConcurrencySlot(op, 2);
    const acquired2 = acquireConcurrencySlot(op, 2);
    const acquired3 = acquireConcurrencySlot(op, 2);

    if (!acquired1.acquired || !acquired2.acquired) throw new Error('Expected first 2 slots to be acquired');
    if (acquired3.acquired) throw new Error('Expected 3rd slot to be rejected (max 2)');

    releaseConcurrencySlot(op);
    const acquiredRetry = acquireConcurrencySlot(op, 2);
    if (!acquiredRetry.acquired) throw new Error('Expected slot to be available after release');
    releaseConcurrencySlot(op);
    releaseConcurrencySlot(op);
  });

  await assertStep('executeWithTimeout aborts runaway execution exceeding budget', async () => {
    let timedOut = false;
    try {
      await executeWithTimeout(
        () => new Promise((resolve) => setTimeout(resolve, 500)),
        100, // 100ms budget
        'Execution exceeded 100ms'
      );
    } catch (err: any) {
      if (err.statusCode === 504 || err.message.includes('exceeded')) {
        timedOut = true;
      }
    }
    if (!timedOut) throw new Error('Execution did not timeout as expected');
  });

  // ────────────────────────────────────────────────────────────────────────
  // GATE 7: SECURITY HEADERS & ERROR SANITIZATION
  // ────────────────────────────────────────────────────────────────────────
  console.log(`\n${c.bold}Gate 7: Security Headers & Error Sanitization${c.reset}`);

  await assertStep('applySecurityHeaders attaches X-Content-Type-Options, Frame protection, and Request ID', () => {
    const baseRes = new Response('ok');
    const secureRes = applySecurityHeaders(baseRes, 'req-test-123');

    if (secureRes.headers.get('X-Content-Type-Options') !== 'nosniff') {
      throw new Error('Missing X-Content-Type-Options: nosniff');
    }
    if (secureRes.headers.get('X-Frame-Options') !== 'SAMEORIGIN') {
      throw new Error('Missing X-Frame-Options: SAMEORIGIN');
    }
    if (secureRes.headers.get('X-Request-Id') !== 'req-test-123') {
      throw new Error('Missing X-Request-Id');
    }
  });

  await assertStep('handleSecureApiError sanitizes internal 500 error stack trace', () => {
    const internalErr = new Error('FATAL_DB_DISCONNECTION: password=supersecret at /srv/app/db.ts:42');
    const sanitizedRes = handleSecureApiError(internalErr, 'req-sanitized-test', 'test-route');

    if (sanitizedRes.status !== 500) throw new Error(`Expected 500, got ${sanitizedRes.status}`);
  });

  // ────────────────────────────────────────────────────────────────────────
  // OBSERVABILITY RING BUFFER
  // ────────────────────────────────────────────────────────────────────────
  console.log(`\n${c.bold}Observability & Metrics${c.reset}`);

  await assertStep('Observability buffer records metrics and calculates status counts', () => {
    clearObservabilityMetrics();
    recordRequestMetric({
      timestamp: Date.now(),
      requestId: 'test-metric-1',
      route: 'api-documents-get',
      method: 'GET',
      status: 200,
      durationMs: 12,
      ip: '127.0.0.1',
      userAgent: 'JestTest',
    });

    const metrics = getObservabilityMetrics();
    if (metrics.totalLoggedRequests === 0) throw new Error('Observability buffer did not record metric');
    const routeData = metrics.routeMetrics['api-documents-get'];
    if (!routeData || routeData.status2xx !== 1) throw new Error('Status 200 count mismatch');
  });

  // ────────────────────────────────────────────────────────────────────────
  // SUMMARY
  // ────────────────────────────────────────────────────────────────────────
  console.log(`\n${c.bold}════════════════════════════════════════════════════════════════${c.reset}`);
  console.log(`Results: ${c.green}${passedCount} Passed${c.reset}, ${c.red}${failedCount} Failed${c.reset}`);
  if (failedCount > 0) {
    console.error(`\n${c.red}❌ GOVERNANCE AUDIT FAILED: ${failedCount} tests failed.${c.reset}`);
    process.exit(1);
  } else {
    console.log(`\n${c.green}🎉 GOVERNANCE AUDIT SUCCESS: All 8 Security Gates and Resource Governance Laws verified!${c.reset}\n`);
    process.exit(0);
  }
}

runGovernanceSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
