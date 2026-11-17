# TASK: SECURITY_AND_SESSION_INFRASTRUCTURE_PROTOCOL

$$\text{INVARIANT}: \text{APP\_SECURITY} \equiv \text{GatePipeline}_8 \wedge \text{MultiSessionStorage} \wedge \text{TokenRotation}_{\text{theft-safe}} \wedge \text{ProgressiveTrust}_{T_0 \to T_4}$$
$$\text{PRIORITY}: \text{Security \& Session Infrastructure} \succ \text{New Feature Logic} \succ \text{UI Layout}$$

> **EXCLUSIVE SCOPE**: This prompt owns **auth session infrastructure, token rotation, trust tiers, and the 8-gate `createSecureRoute` wrapper structure**. For burst-protection and client-side polling limits, use `TASK_USAGE_THROTTLING_AND_BURST_PROTECTION.md` instead. Do NOT apply both simultaneously — they are sequential: run this prompt first, then the throttling prompt.
>
> **Validator**: `python3 assistant.py validate . --aspect aspect_08`
>
> **INVIOLABLE MANDATE: ZERO-TRACE LEGACY AUTH & SECURITY PURGE ($\mathbf{L_{21}}$)**:
> Completely purge any competing legacy authentication or route security systems found in the codebase (e.g. ad-hoc JWT helpers, local cookie auth schemes, unauthenticated API handler skeletons, or custom middleware wrappers). Zero traces or dual-running security adapters may remain. All routes must exclusively use the canonical 8-gate `createSecureRoute` pipeline and Skipo auth sessions.

---


## 0. PURPOSE & ACTIVATION CONTEXT

Activate this prompt to audit, implement, or verify Skipo's canonical API Security, Multi-Session Isolation, Refresh Token Rotation, and Progressive Trust Infrastructure.

When invoked, the agent MUST:
1. Prioritize security and session management infrastructure over cosmetic or feature work.
2. Execute the 7-Pillar Gap Audit across the target codebase.
3. Remediate all gaps by wrapping endpoints with the canonical `createSecureRoute` pipeline, configuring multi-session storage, and wiring secure auth cookies.
4. Execute the 5-Step Verification Gate to ensure 100% test passage and type safety.

---

## 1. INVIOLABLE SECURITY & SESSION INVARIANTS

1. **User Root Cleanliness (Zero Monolithic Credentials)**:
   - `User` remains strictly an account-level entity (`id`, `email`, `role`, `emailVerified`, `trustLevel`, `status`, `sessions: Session[]`).
   - Passwords, authentication tokens, and session credentials must **never** be stored as monolithic fields on `User`.
2. **Strict Multi-Session Isolation**:
   - Every login generates an independent `Session` record with unique device, user-agent, and IP telemetry.
   - Logging out of Session A (e.g. laptop) leaves Session B (mobile) and Session C active.
   - Password resets or explicit "Logout All Devices" commands atomically revoke all active sessions.
3. **No Raw Tokens in Storage or Logs**:
   - High-entropy raw refresh tokens (48 bytes cryptographically random) are sent **only** to clients via `HttpOnly + Secure + SameSite=lax` cookies (`<app>_refresh_token`).
   - The database stores strictly `SHA-256(rawToken)` in `Session.refreshTokenHash` and rotated token history.
4. **Token Theft Detection & Auto-Revocation**:
   - Replaying an already-rotated or invalidated refresh token indicates active token theft.
   - The engine MUST immediately revoke the entire `Session`, record a `REFRESH_TOKEN_REUSE` audit event, and return HTTP 401.
5. **Canonical 8-Gate Request Processing Pipeline**:
   - Every API endpoint MUST be wrapped with `createSecureRoute({ ... })`. Raw route exports are strictly forbidden.
   - Execution sequence:
     ```
     [Gate 0: IP Blocklist]       ──(15m temp ban on abuse)──► HTTP 403 (0 CPU/DB cost)
       │
     [Gate 1: Request Validation] ──(method/length/schema)───► HTTP 400 / 405 / 413 / 415
       │
     [Gate 2: Authentication]     ──(session validity/status)► HTTP 401 / 403
       │
     [Gate 3: Authorization]      ──(roles, trust, email)────► HTTP 403 Forbidden
       │
     [Gate 4: Rate Limiting]      ──(trust-scaled tiers)─────► HTTP 429 Too Many Requests
       │
     [Gate 5: Resource Budgeting] ──(concurrency & timeout)──► HTTP 503 / 504
       │
     [Gate 6: Application Logic]  ──(unhandled error)────────► HTTP 500 (Sanitized)
       │
     [Gate 7: Headers & Telemetry]──(CSP, security headers)──► Final Secured Response
     ```
   - Failure at any gate halts downstream processing immediately (`STOP -> NO_DOWNSTREAM_EXECUTION`).
6. **Server-Side Progressive Trust Hierarchy ($T_0 \dots T_4$)**:
   - `T0_UNVERIFIED` ($0.25\times$ rate multiplier): Default upon registration; read-only and restricted actions.
   - `T1_EMAIL_VERIFIED` ($1.0\times$): Cryptographic email challenge verified; standard capabilities.
   - `T2_ESTABLISHED` ($2.0\times$): $T_1$ + Age $\ge 7$ days + Abuse score $\le 10$; elevated quotas.
   - `T3_TRUSTED` ($5.0\times$): $T_1$ + Age $\ge 30$ days + 50 activities + Abuse $\le 5$; high-throughput batch operations.
   - `T4_PRIVILEGED` ($10.0\times$): Admin grant or verified elevated role; full administrative controls.
7. **Multi-Signal Abuse Scoring & Automatic Penalties**:
   - Score $\ge 15$ (SUSPICIOUS): Rate limits dynamically halved ($0.5\times$).
   - Score $\ge 30$ (HIGH_RISK): Active sessions revoked immediately.
   - Score $\ge 50$ (MALICIOUS): Account auto-suspended (`status = 'SUSPENDED'`), blocked at Gate 2 with HTTP 403.
8. **File Sizing & Modularity**: Max 200 lines per TypeScript file. Keep modules strictly scoped.

---

## 2. CANONICAL ROUTE WRAPPER & SIGNATURE

```typescript
// app/api/example/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSecureRoute } from "@/lib/api-governance";
import { z } from "zod";

const PayloadSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional()
});

export const POST = createSecureRoute({
  id: "create_workspace_item",
  rateLimitTier: "NORMAL_MUTATION", // "CHEAP_READ" | "NORMAL_MUTATION" | "EXPENSIVE_OPERATION" | "AUTHENTICATION"
  public: false,
  requiredRoles: ["USER"],
  minimumTrustLevel: "T1_EMAIL_VERIFIED",
  emailVerificationRequired: true,
  timeoutMs: 8000,
  schema: PayloadSchema,
  async handler(req: NextRequest, ctx) {
    const body = await req.json();
    return NextResponse.json({ success: true, item: body }, { status: 201 });
  }
});
```

---

## 3. MULTI-SESSION STORAGE SCHEMA

```typescript
export interface UserAccount {
  id: string;
  email: string;
  role: "USER" | "ADMIN";
  emailVerified: boolean;
  emailVerifiedAt?: number;
  trustLevel: "T0_UNVERIFIED" | "T1_EMAIL_VERIFIED" | "T2_ESTABLISHED" | "T3_TRUSTED" | "T4_PRIVILEGED";
  status: "ACTIVE" | "SUSPENDED" | "DISABLED" | "DELETED";
  abuseScore: number;
  sessions: SessionRecord[];
}

export interface SessionRecord {
  id: string;
  accountId: string;
  refreshTokenHash: string; // SHA-256(rawToken)
  rotatedTokenHashes: string[]; // Historical hashes for theft detection
  refreshTokenCreatedAt: number;
  refreshTokenExpiresAt: number; // Max 30 days
  createdAt: number;
  lastActivityAt: number;
  expiresAt: number;
  revokedAt?: number;
  status: "ACTIVE" | "REVOKED";
  deviceId?: string;
  userAgent?: string;
  ipAddress?: string;
}
```

---

## 4. TOKEN ROTATION & THEFT REVOCATION FLOW

```
CLIENT                              SERVER (/api/auth/refresh)
  │                                   │
  ├────── POST /api/auth/refresh ────►│
  │      (Cookie: app_refresh_token)  │ 1. Hash incoming token: H = SHA-256(rawToken)
  │                                   │ 2. Check rotatedTokenHashes:
  │                                   │    - If H found -> THEFT DETECTED -> Revoke Session -> 401
  │                                   │ 3. Check active session where refreshTokenHash == H:
  │                                   │    - If missing, expired, or revoked -> 401
  │                                   │ 4. Generate new rawRefreshToken + new H_new
  │                                   │ 5. Atomically:
  │                                   │    - Append old H to rotatedTokenHashes
  │                                   │    - Set Session.refreshTokenHash = H_new
  │                                   │    - Issue 15m HMAC AccessToken
  │◄───── Set-Cookie: new tokens ─────┤
  │       HTTP 200 OK                 │
```

---

## 5. EMAIL VERIFICATION LIFECYCLE

1. **Challenge Creation**:
   - `createEmailVerificationChallenge(account, ip)`: 32-byte cryptographically random token, stores `SHA-256(token)`, 24-hour TTL, max 5 attempts.
   - Any prior pending challenge for the account is atomically invalidated.
2. **Challenge Consumption**:
   - Validated token promotes account: `emailVerified = true`, sets `emailVerifiedAt`, advances account to `T1_EMAIL_VERIFIED`.
   - Challenge is marked consumed (`consumedAt = Date.now()`). Replays are rejected.
3. **Multi-Tier Resend Throttling**:
   - Account ceiling: max 3 challenges per 15 minutes.
   - Email ceiling: max 3 challenges per 15 minutes.
   - IP ceiling: max 5 challenges per 15 minutes. Exceeding thresholds returns HTTP 429 with `Retry-After`.

---

## 6. PHASE 1: THE 7-PILLAR CODEBASE GAP AUDIT

```text
[ ] Pillar 1: Types & Account Schema (lib/api-governance/types.ts)
    ├── UserAccount has: emailVerified, emailVerifiedAt, trustLevel, status, sessions: SessionRecord[]
    └── SessionRecord has: id, accountId, refreshTokenHash, rotatedTokenHashes, expiresAt

[ ] Pillar 2: Multi-Session & Rotation Engine (lib/api-governance/session-manager.ts)
    ├── createSession(accountId, metadata) -> { session, accessToken, refreshToken }
    ├── rotateRefreshToken(rawToken, metadata) (detects REFRESH_TOKEN_REUSE theft)
    ├── revokeSession(sessionId) & revokeAllUserSessions(accountId)
    └── attachAuthCookies(response, tokens) & clearAuthCookies(response)

[ ] Pillar 3: Email Verification Engine (lib/api-governance/email-verification.ts)
    ├── createEmailVerificationChallenge(account, ip) (SHA-256, 24h TTL)
    ├── verifyEmailChallenge(rawToken, ip) (promotes to T1_EMAIL_VERIFIED)
    └── checkResendRateLimit(accountId, email, ip) (multi-tier rate limiting)

[ ] Pillar 4: Progressive Trust & Abuse Engine (lib/api-governance/trust-engine.ts)
    ├── calculateTrust(account) -> T0..T4 & getTrustRateMultiplier(trustLevel)
    ├── recordAbuseSignal(accountId, signal, count, ip)
    └── Enforces automatic thresholds: >=15 halving, >=30 revocation, >=50 suspension

[ ] Pillar 5: Canonical 8-Gate Pipeline (lib/api-governance/create-secure-route.ts)
    └── Wraps handlers with Gate 0 through Gate 7 in strict sequence

[ ] Pillar 6: Dedicated Auth Endpoints (app/api/auth/)
    └── POST /login, POST /logout, GET /me, POST /register, POST /refresh, GET|POST /verify-email

[ ] Pillar 7: Edge Security Middleware (middleware.ts)
    └── Drops scanner/bot paths, blocks banned IPs, and injects CSP & security headers
```

---

## 7. MANDATORY 5-STEP VERIFICATION GATE

The agent MUST execute the following verification steps and achieve 100% passing results:

1. **Session & Progressive Trust Tests**:
   ```bash
   npx tsx scripts/test-session-progressive-trust.ts
   ```
2. **8-Gate Security Governance Tests**:
   ```bash
   npx tsx scripts/test-api-security-governance.ts
   ```
3. **Control Plane Compliance Audit**:
   ```bash
   bash scripts/verify-control-plane-standards.sh
   ```
4. **Static Typecheck**:
   ```bash
   pnpm typecheck
   ```
5. **Production Build**:
   ```bash
   pnpm build
   ```
