/**
 * API Security & Resource Governance Verification Suite for Srkl-Engine
 * Tests Gates 0 through 7, IP blocklist, rate limiting, concurrency, and timeouts.
 *
 * Usage:
 *   npx tsx scripts/test-api-security-governance.ts
 */

import {
  isIpBlocked,
  blockIp,
  unblockIp,
  recordAuthFailure,
  checkRateLimit,
  resetRateLimit,
  acquireConcurrencySlot,
  releaseConcurrencySlot,
  executeWithTimeout,
  createSecureRoute,
  applySecurityHeaders,
  handleSecureApiError,
} from '../src/server/governance';

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
    console.log(`${c.green}✔ PASS${c.reset} ${c.dim}(${Date.now() - start}ms)${c.reset}`);
    passed++;
  } catch (err: any) {
    console.log(`${c.red}✖ FAIL${c.reset} ${c.dim}(${Date.now() - start}ms)${c.reset}`);
    console.error(`    ${c.red}Error:${c.reset} ${err?.message || err}`);
    failed++;
  }
}

// Mock Express Request & Response
function createMockReqRes(options: {
  method?: string;
  ip?: string;
  headers?: Record<string, string>;
  body?: any;
  query?: Record<string, any>;
}) {
  const headers = options.headers || {};
  const req: any = {
    method: options.method || 'GET',
    ip: options.ip || '198.51.100.1',
    headers,
    body: options.body || {},
    query: options.query || {},
    params: {},
    is: (type: string) => (headers['content-type']?.includes(type) ? type : false),
    socket: { remoteAddress: options.ip || '198.51.100.1' },
  };

  const responseHeaders: Record<string, string> = {};
  let statusCode = 200;
  let responseData: any = null;

  const res: any = {
    status: (code: number) => {
      statusCode = code;
      return res;
    },
    setHeader: (k: string, v: string) => {
      responseHeaders[k.toLowerCase()] = v;
      return res;
    },
    json: (data: any) => {
      responseData = data;
      return res;
    },
    sendStatus: (code: number) => {
      statusCode = code;
      return res;
    },
    headersSent: false,
    _getStatus: () => statusCode,
    _getData: () => responseData,
    _getHeader: (k: string) => responseHeaders[k.toLowerCase()],
  };

  return { req, res };
}

async function run() {
  console.log(`\n${c.bold}================================================================${c.reset}`);
  console.log(`${c.bold}  SRKL-ENGINE API SECURITY & GOVERNANCE VERIFICATION SUITE       ${c.reset}`);
  console.log(`${c.bold}================================================================${c.reset}\n`);

  console.log(`${c.bold}Gate 0: IP Blocklist & Abuse Detection${c.reset}`);
  await assertStep('Clean IP allows traffic through Gate 0', () => {
    const status = isIpBlocked('198.51.100.10');
    if (status.blocked) throw new Error('Clean IP was incorrectly blocked');
  });

  await assertStep('Blocked IP is rejected with Retry-After header', () => {
    blockIp('198.51.100.20', 'REQUEST_RATE_SPIKE', 'Test anomaly', 60000);
    const status = isIpBlocked('198.51.100.20');
    if (!status.blocked || !status.retryAfterSeconds) throw new Error('Blocked IP was not detected');
    unblockIp('198.51.100.20');
  });

  await assertStep('25 repeated 401 auth failures trigger automated 15-minute ban', () => {
    const testIp = '198.51.100.30';
    for (let i = 0; i < 26; i++) {
      recordAuthFailure(testIp);
    }
    const status = isIpBlocked(testIp);
    if (!status.blocked) throw new Error('25 auth failures did not trigger ban');
    unblockIp(testIp);
  });

  console.log(`\n${c.bold}Gate 1: Request Validation${c.reset}`);
  await assertStep('createSecureRoute rejects disallowed HTTP method with 405', async () => {
    const route = createSecureRoute({
      id: 'test-get-only',
      method: 'GET',
      public: true,
      handler: (_req, _ctx, res) => res.json({ ok: true }),
    });
    const { req, res } = createMockReqRes({ method: 'POST' });
    await route(req, res);
    if (res._getStatus() !== 405) throw new Error(`Expected 405, got ${res._getStatus()}`);
  });

  await assertStep('createSecureRoute rejects non-JSON mutation with 415', async () => {
    const route = createSecureRoute({
      id: 'test-json-only',
      method: 'POST',
      public: true,
      handler: (_req, _ctx, res) => res.json({ ok: true }),
    });
    const { req, res } = createMockReqRes({
      method: 'POST',
      headers: { 'content-type': 'text/plain' },
    });
    await route(req, res);
    if (res._getStatus() !== 415) throw new Error(`Expected 415, got ${res._getStatus()}`);
  });

  await assertStep('createSecureRoute rejects payload exceeding maxBodySize with 413', async () => {
    const route = createSecureRoute({
      id: 'test-body-limit',
      method: 'POST',
      public: true,
      limits: { maxBodySize: 100 },
      handler: (_req, _ctx, res) => res.json({ ok: true }),
    });
    const { req, res } = createMockReqRes({
      method: 'POST',
      headers: { 'content-type': 'application/json', 'content-length': '200' },
    });
    await route(req, res);
    if (res._getStatus() !== 413) throw new Error(`Expected 413, got ${res._getStatus()}`);
  });

  console.log(`\n${c.bold}Gate 2 & 3: Authentication & Authorization${c.reset}`);
  await assertStep('createSecureRoute rejects unauthenticated call with 401', async () => {
    const route = createSecureRoute({
      id: 'test-auth-required',
      handler: (_req, _ctx, res) => res.json({ ok: true }),
    });
    const { req, res } = createMockReqRes({});
    await route(req, res);
    if (res._getStatus() !== 401) throw new Error(`Expected 401, got ${res._getStatus()}`);
  });

  await assertStep('createSecureRoute allows public route without auth', async () => {
    const route = createSecureRoute({
      id: 'test-public',
      public: true,
      handler: (_req, _ctx, res) => res.json({ ok: true }),
    });
    const { req, res } = createMockReqRes({});
    await route(req, res);
    if (res._getStatus() !== 200 || !res._getData().ok) throw new Error(`Expected 200 ok, got ${res._getStatus()}`);
  });

  console.log(`\n${c.bold}Gate 4: Rate Limiting${c.reset}`);
  await assertStep('Rate limiter tracks request quota and returns remaining count', () => {
    resetRateLimit('test-rate-key');
    const r1 = checkRateLimit('test-rate-key', { requests: 5, windowMs: 10000 });
    if (!r1.allowed || r1.remaining !== 4) throw new Error(`Expected 4 remaining, got ${r1.remaining}`);
  });

  await assertStep('Rate limit exhaustion returns 429 and Retry-After', () => {
    const key = 'test-exhaust';
    resetRateLimit(key);
    for (let i = 0; i < 3; i++) checkRateLimit(key, { requests: 3, windowMs: 10000 });
    const r = checkRateLimit(key, { requests: 3, windowMs: 10000 });
    if (r.allowed || r.retryAfterSeconds <= 0) throw new Error('Expected rate limit rejection');
  });

  console.log(`\n${c.bold}Gate 5: Concurrency & Timeouts${c.reset}`);
  await assertStep('Concurrency limiter acquires and releases execution slots', () => {
    const key = 'test-concurrency';
    const s1 = acquireConcurrencySlot(key, 1);
    const s2 = acquireConcurrencySlot(key, 1);
    if (!s1 || s2) throw new Error('Concurrency limit not enforced');
    releaseConcurrencySlot(key);
    const s3 = acquireConcurrencySlot(key, 1);
    if (!s3) throw new Error('Slot not released');
    releaseConcurrencySlot(key);
  });

  await assertStep('executeWithTimeout aborts runaway operation', async () => {
    let caught = false;
    try {
      await executeWithTimeout(async () => {
        await new Promise((resolve) => setTimeout(resolve, 150));
      }, 50, 'RunawayTest');
    } catch (err: any) {
      if (err.message.includes('EXECUTION_TIMEOUT')) caught = true;
    }
    if (!caught) throw new Error('Timeout was not triggered');
  });

  console.log(`\n${c.bold}Gate 7: Security Headers & Sanitized Error Handling${c.reset}`);
  await assertStep('applySecurityHeaders attaches nosniff, frame protection, and request ID', () => {
    const { res } = createMockReqRes({});
    applySecurityHeaders(res, 'test-req-123');
    if (res._getHeader('x-content-type-options') !== 'nosniff') throw new Error('Missing nosniff');
    if (res._getHeader('x-frame-options') !== 'SAMEORIGIN') throw new Error('Missing SAMEORIGIN');
    if (res._getHeader('x-request-id') !== 'test-req-123') throw new Error('Missing request ID');
  });

  await assertStep('handleSecureApiError sanitizes internal 500 error stack trace', () => {
    const { res } = createMockReqRes({});
    const sensitiveError = new Error('DATABASE_PASSWORD_EXPOSED_SECRET_123');
    handleSecureApiError(sensitiveError, res, 'test-route', 'req-err-456');
    if (res._getStatus() !== 500) throw new Error(`Expected 500, got ${res._getStatus()}`);
    const data = res._getData();
    if (data.error.includes('PASSWORD_EXPOSED') || data.stack) {
      throw new Error('Raw error or stack leaked in response');
    }
  });

  console.log(`\n${c.bold}================================================================${c.reset}`);
  console.log(`Results: ${c.green}${passed} Passed${c.reset}, ${failed > 0 ? c.red : c.reset}${failed} Failed${c.reset}`);
  console.log(`${c.bold}================================================================${c.reset}\n`);

  if (failed > 0) process.exit(1);
}

run();
