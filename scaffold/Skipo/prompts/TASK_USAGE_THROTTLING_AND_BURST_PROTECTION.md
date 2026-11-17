# TASK: USAGE_THROTTLING_AND_BURST_PROTECTION_PROTOCOL

$$\text{INVARIANT}: \text{ANTI\_BURST} \equiv \text{CircuitBreaker}_{4xx} \wedge \text{BackoffJitter}_{\ge 5s \dots 120s} \wedge \text{EventSourceClose}_{\text{native}} \wedge \text{DebouncedMutations}_{\ge 1000\text{ms}} \wedge \text{VisibilityPause}$$
$$\text{PRIORITY}: \text{Resource Throttling \& Self-DoS Prevention} \succ \text{New Features} \succ \text{Cosmetics}$$

> **EXCLUSIVE SCOPE**: This prompt owns **client-side polling controls, stream reconnection circuit-breakers, debounce invariants, and burst pattern elimination**. The 8-gate `createSecureRoute` wrapper belongs to `TASK_SECURITY_AND_SESSION_INFRASTRUCTURE.md` — do NOT re-implement it here. Run the security prompt first, this prompt second.
>
> **Validator**: `python3 assistant.py validate . --aspect aspect_08`
>
> **INVIOLABLE MANDATE: ZERO-TRACE LEGACY THROTTLING & POLLING PURGE ($\mathbf{L_{21}}$)**:
> Completely purge any competing legacy polling timers, raw unthrottled `setInterval` fetch loops, non-standard retry loops, or bespoke circuit breaker implementations. Leave zero trace behind. The codebase must exclusively use canonical Skipo backoff, jitter, and visibility-aware throttling mechanisms.

---


## 0. PURPOSE & ACTIVATION CONTEXT

Activate this prompt to audit, identify, and eliminate all potential "burst operation" functions, uncontrolled request cascades, or aggressive polling loops across client and server architectures.

### The Problem: Burst Operations & Serverless Self-DoS
A burst operation is any client or server routine generating sudden, uncontrolled request cascades (10 to 150+ req/s). On serverless environments (Vercel, Cloudflare Workers, AWS Lambda), burst operations rapidly exhaust compute quotas, trigger IP abuse blocklists, and cause self-inflicted Denial of Service (Self-DoS).

Common triggers:
1. `eventSource.onerror` omitting `eventSource.close()`, causing Chromium/WebKit's native engine to reconnect at wire speed upon receiving HTTP 401 or 403.
2. Missing 4xx circuit breakers that continually retry futile unauthorized requests.
3. Legacy short-polling loops (`setInterval < 5000ms`) running parallel to active streams.
4. Background browser tabs hammering endpoints when `document.hidden === true`.
5. High-frequency user interactions (canvas node dragging, typing) firing immediate un-debounced network mutations.

---

## 1. THE 6 HIGH-RISK BURST PATTERNS (AUDIT TARGETS)

### Pattern 1: Unclosed Stream Reconnection Cascades (`EventSource` / `WebSocket`)
- **Danger**: Native browser engines loop at wire speed on connection failures unless explicitly closed.
- **Remediation**:
  1. Call `eventSource.close()` immediately inside `onerror`.
  2. Implement an instant circuit breaker on 401/403/429: permanently halt retries until explicit user re-login.
  3. Apply jittered exponential backoff: $[5s, 15s, 30s, 60s, 120s] \pm 15\%$ with a hard ceiling of max 5 retries.
  4. Suspend retry timers while `document.hidden === true`.

### Pattern 2: Rapid Polling Loops (`setInterval` / Recursive `setTimeout`)
- **Danger**: Client intervals $< 5000\text{ms}$ hammering serverless functions.
- **Remediation**:
  1. Strict ban on client intervals $< 5000\text{ms}$ for network requests.
  2. Replace polling with persistent Server-Sent Events (SSE) or event-driven invalidation.
  3. If polling is unavoidable, enforce minimum 15s–60s intervals and pause when `document.hidden` is true.

### Pattern 3: Unthrottled `useEffect` Dependency Loops
- **Danger**: A `useEffect` triggering `fetch()`, updating state, and depending on un-memoized object references.
- **Remediation**:
  1. Never place unstable object literals or un-memoized functions in dependency arrays.
  2. Use `useRef` for stable callback references.
  3. Attach `AbortController` cleanup in the effect return handler.

### Pattern 4: Un-debounced High-Frequency User Mutations
- **Danger**: Node canvas movement, slider changes, or text typing dispatching raw HTTP `POST`/`PUT` requests per frame.
- **Remediation**:
  1. Route mutations through `MutationQueue` with minimum $1000\text{ms}$ debounce.
  2. Collapse consecutive patches for the same entity ID so only the consolidated state is sent.

### Pattern 5: Simultaneous Unbatched / Un-deduplicated Network Floods
- **Danger**: Mounting multiple child components that simultaneously fetch `/api/categories`, `/api/user`, or `/api/workspaces`.
- **Remediation**:
  1. Route GET calls through `safeFetch` or `RequestDeduplicator` to coalesce identical in-flight promises.
  2. Prefer composite batch bootstrap endpoints over multiple granular GET queries.

### Pattern 6: Immediate Retries in `catch` Blocks
- **Danger**: Retrying failed queries immediately without delay or retry bounds.
- **Remediation**:
  1. Route all requests through `safeFetch` (maximum 3 retries with exponential backoff).
  2. Never retry 4xx status codes (401, 403, 404, 429).

---

## 2. THE 6 CLIENT-SIDE STREAM & POLLING INVARIANTS

1. **Immediate Native Teardown (`eventSource.close()`)**:
   Unconditionally call `eventSource.close()` inside `onerror` before scheduling backoff.
2. **Permanent 4xx Circuit Breaker**:
   If an endpoint returns 401, 403, or 429, set `circuitBrokenRef.current = true` and halt all reconnection attempts.
3. **Jittered Exponential Backoff**:
   Delays: $[5000\text{ms}, 15000\text{ms}, 30000\text{ms}, 60000\text{ms}, 120000\text{ms}] \times (0.85 + 0.3 \times \text{random}())$.
4. **Hard Retry Ceiling (Max 5 Attempts)**:
   Cease retries and enter idle/disconnected state after 5 consecutive failures.
5. **Page Visibility Awareness (`document.hidden`)**:
   Listen to `visibilitychange`. Pause all timers when hidden; reset counters and catch up when visible.
6. **Zero Aggressive Polling Loops**:
   No network `setInterval` $< 5000\text{ms}$.

---

## 3. THE 4 SERVER-SIDE USAGE THROTTLING INVARIANTS

1. **Gate 0 Abuse Anomaly Detection & 15-Minute IP Blocklist**:
   Block IPs exhibiting $>25$ failed auth attempts in 5 minutes with HTTP 403 and `Retry-After: 900`.
2. **Gate 4 Multi-Tier Sliding Window Rate Limiting**:
   - `CHEAP_READ`: 120 req/min (or 300 req/min for SSE stream initiation).
   - `NORMAL_MUTATION`: 60 req/min.
   - `EXPENSIVE_OPERATION`: 20 req/min.
   - `AUTHENTICATION`: 25 req / 15 min.
   - Scaled dynamically by Progressive Trust multipliers ($0.25\times \dots 10.0\times$).
3. **Gate 5 Concurrency Limits & Execution Timeouts**:
   Bounded concurrent slots per IP/account; hard execution timeout budgets (default 8000ms).
4. **Periodic 30-Second SSE Heartbeat**:
   Emit `: heartbeat <timestamp>\n\n` every 30s to keep proxies alive with minimal payload overhead.

---

## 4. SYSTEMATIC SCAN COMMANDS

Run these scans across the target codebase:

```bash
# 1. Locate all EventSource instantiations (verify .close() and circuit breaker)
grep -rn "new EventSource" src/ hooks/ components/

# 2. Locate all setInterval calls (flag network calls < 5000ms)
grep -rn "setInterval" src/ hooks/ components/

# 3. Locate raw unthrottled fetch calls inside components
grep -rn "fetch(" src/ components/ hooks/

# 4. Run the Skipo Aspect 08 Architectural Validator
python3 checklists/08_api_security_governance.py .
```

---

## 5. MANDATORY VERIFICATION GATE

1. **Aspect 08 Validator**:
   ```bash
   python3 checklists/08_api_security_governance.py .
   ```
   *Requirement*: 0 errors, 100% compliance.
2. **Static Typecheck**:
   ```bash
   pnpm typecheck
   ```
   *Requirement*: Exit code 0.
3. **Production Build**:
   ```bash
   pnpm build
   ```
   *Requirement*: Clean build without warnings or unresolved dynamic routes.
