---
name: backend-control-plane
description: Control Plane directives: User Accounts, Authentication, Workspace Registry, Admin Control, Multi-Database Redundancy Clusters, Failover, Immutable Audit Logging, and RBAC enforcement.
---

# CONTROL PLANE — APPLICATION IDENTITY, CLUSTERING & GOVERNANCE

The Control Plane is the application-owned, globally scoped governance system. It strictly manages *who* uses the application, *what* they are permitted to do (RBAC), *which* backend connections their workspaces attach to, and *how* high-availability database redundancy clusters fail over.

---

## 1. Core Responsibilities & Boundary Invariant

$$\text{Control Plane} \cap \text{Workspace Data Plane} = \emptyset$$

```
CONTROL PLANE (Application-Owned)
│
├── User Accounts & Identities (USER, MODERATOR, ADMIN)
├── Authentication & HMAC Session Tokens (sess::<userId>::<epoch>::<rand>)
├── Workspace Registry & Ownership Mappings
├── Persistent Config Vaults (.krnl/control_plane/database_cluster.json, .krnl/db_config.json)
├── Multi-Backend Redundancy Clusters (primary, redundant_clone, read_replica)
├── Real-Time Connection Latency Testing & Live Credential Validation
├── Dynamic Primary Promotion & Automatic Failover
└── Immutable Audit Logging (AuditLogger trails)
```

> [!IMPORTANT]
> The Control Plane **never** contains project documents, database records of a workspace, or user media files. It contains metadata, account credentials, and cluster connection pointers only.

---

## 2. Role-Based Access Control (RBAC) & Boundary Guards

$$\text{UserRole} \in \{ \text{USER}, \text{MODERATOR}, \text{ADMIN} \}$$

- **AdminGuard Middleware**: Strict route-level barrier checking session validities and enforcing required role boundaries.
```typescript
import { AdminGuard } from "@ultrst-armada/krnl";

// Strict Admin Gate: Throws [AccessDenied] if session is null or role != "ADMIN"
await AdminGuard.verify(authHeader, accountProvider);

// Moderator or Admin Gate
await AdminGuard.verifyModeratorOrAdmin(authHeader, accountProvider);
```

---

## 3. Multi-Backend Database Clusters & High-Availability Redundancy

To guarantee zero data loss and fault-tolerant operation, the Control Plane supports **Multi-Backend Database Clustering**:

```
                              DATABASE CLUSTER VAULT
                                        │
                 ┌──────────────────────┼──────────────────────┐
                 ▼                      ▼                      ▼
        [PRIMARY DATABASE]     [REDUNDANT CLONE 1]    [READ REPLICA 1]
         (Turso LibSQL /        (PostgreSQL /          (Supabase /
          MongoDB / SQLite)      Supabase)              Cloudflare)
                 │                      ▲
                 │ (Periodic Snapshot)  │ (Promoted on Spike / Failover)
                 └──────────────────────┘
```

### Cluster Roles
1. **`primary`**: Receives all active write mutations and authoring queries.
2. **`redundant_clone`**: Kept in sync via periodic snapshot replication (`syncRedundantDatabases`).
3. **`read_replica`**: Serves high-throughput read requests and reporting queries.

### Dynamic Promotion & Failover
- If a primary database experiences latency spikes or connection timeouts:
  $$\text{Promote}(\text{RedundantClone}) \implies \text{Role} \gets \text{primary}$$
  $$\text{Demote}(\text{OldPrimary}) \implies \text{Role} \gets \text{redundant\_clone}$$
- Transition occurs dynamically in the persistent configuration vault with **zero application downtime**.

---

## 4. Live Connection Testing & Latency Measurement

Administrators and users can test prospective database connections before committing:
```typescript
const result = await clusterManager.testDatabaseConnection(targetConfig);
console.log(`Connection OK: ${result.ok}, Latency: ${result.latencyMs}ms`);
```

---

## 5. Immutable Audit Logging (`AuditLogger`)

Every administrative mutation, backend connection switch, user role upgrade, and cluster failover event is recorded in an immutable append-only audit trail:

```typescript
import { AuditLogger } from "@ultrst-armada/krnl";

const auditLogger = new AuditLogger("./.krnl/control_plane/audit_trail.jsonl");

await auditLogger.log({
  actorUserId: "admin_alice",
  actorRole: "ADMIN",
  action: "PROMOTE_DATABASE_PRIMARY",
  resource: "cluster_turso_edge_01",
  details: { previousPrimary: "sqlite_local", latencyMs: 24 },
  status: "SUCCESS"
});
```

---

## 6. Persistent Configuration Vaults

Connection settings and cluster topologies are persisted in structured JSON vaults:
- `.krnl/control_plane/database_cluster.json` (or `.docustack/control_plane/database_cluster.json`): Cluster definitions, assigned roles, and health statuses.
- `.krnl/db_config.json` (or `.docustack/db_config.json`): Active workspace database configurations and daisy-chain parameters.
