---
name: universal-backend-router
description: Universal Backend Architecture master router for multi-environment hosting (Local Desktop, LAN/Docker, Remote/Vercel Serverless) with decoupled Control Plane vs Workspace Data Plane, independent Data/Storage providers, and strict Admin authorization.
---

# UNIVERSAL BACKEND ARCHITECTURE (DENSE)

$$\text{Backend} = \text{ControlPlane}(\text{Auth}, \text{Admin}) \oplus \text{DataPlane}(\text{StorageFS}) \quad \text{s.t.} \quad \text{Control} \cap \text{Data} = \emptyset$$

## 1. 5 INVIOLABLE STRUCTURAL LAWS

$$\begin{array}{ll}
\mathbf{L_A} \text{ (Entry Purity)} & \text{entry.ts} \models \text{Imports} + \text{createApp}().\text{listen}() \wedge \text{Handlers} = \emptyset \\
\mathbf{L_B} \text{ (1-Module/File)} & \forall f \in \text{Backend}: \text{Export}(f) \le 1 \quad (\text{Service} \oplus \text{Controller} \oplus \text{Repo}) \\
\mathbf{L_C} \text{ (200-Line Limit)} & |\text{Lines}(f)| \le 200 \quad (\text{split to } *.types, *.routes, *.service \text{ at } 180L) \\
\mathbf{L_D} \text{ (Serverless Safe)}& \text{No dynamic bundler imports in prod} \wedge \text{No /tmp file proxying} \\
\mathbf{L_E} \text{ (8-Gate Pipeline)} & \forall r \in \text{Routes}: r \models \text{createSecureRoute}(\text{Gate}_0 \dots \text{Gate}_7)
\end{array}$$

## 2. 8-GATE SECURE ROUTE PIPELINE

```
[Gate 0: IP Blocklist]   --> In-memory blocklist check (403)
[Gate 1: Validation]     --> HTTP method (405), Content-Type (415), body size (413), Zod schema (422)
[Gate 2: Authentication] --> Session / Bearer JWT validation (401)
[Gate 3: Authorization]  --> User role matches requiredRoles (ADMIN/USER) (403)
[Gate 4: Rate Limiting]  --> Multi-tier sliding window (CHEAP: 120/m, MUTATION: 60/m, EXPENSIVE: 20/m) (429)
[Gate 5: Resource Limit] --> In-flight concurrency slot + execution timeout (default 8s, max 30s)
[Gate 6: Logic Engine]   --> Execute business transaction; catch errors (500 without stack traces)
[Gate 7: Headers/Logs]   --> Attach CSP, nosniff, SAMEORIGIN, X-Request-Id + ring-buffer telemetry
```

## 3. CANONICAL SECURE ROUTE PATTERN

```typescript
export const POST = createSecureRoute({
  rateLimitTier: 'NORMAL_MUTATION',
  requiredRoles: ['USER'],
  schema: RequestPayloadSchema,
  handler: async ({ user, payload, req }) => {
    const result = await workspaceService.process(user.id, payload);
    return NextResponse.json(result);
  }
});
```

## 4. SUB-SKILL ROUTER MAP

| Domain Area | Target Skill | Core Constraint |
| :--- | :--- | :--- |
| **Control Plane** | [`./control-plane/SKILL.md`](./control-plane/SKILL.md) | Multi-session, refresh token rotation, progressive trust |
| **Workspace Storage** | [`./workspace-storage/SKILL.md`](./workspace-storage/SKILL.md) | Presigned URLs, B2/S3 direct transfer, zero `/tmp` buffer |
| **Environments** | [`./environments/SKILL.md`](./environments/SKILL.md) | Local Desktop vs LAN Docker vs Vercel Serverless modes |
| **Providers** | [`./providers/SKILL.md`](./providers/SKILL.md) | Pluggable SQL (Postgres/SQLite), B2, S3, Memory |

## 5. CHECKLIST GATE
`python3 checklists/07_backend_storage_isolation.py .` && `python3 checklists/08_api_security_governance.py .`
