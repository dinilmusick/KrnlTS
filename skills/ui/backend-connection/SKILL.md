---
name: ui-backend-connection
description: Uniform guidelines and state machine specifications for Backend Connection UX: Progressive disclosure, Tri-choice workspace storage, Capability-driven Provider Registry, One-click OAuth and fallback wizard, Live Connection Testing, Automatic Schema Initialization, and Workspace Settings Data & Storage panel.
---

# BACKEND CONNECTION UX SPECIFICATION

Standardized guidelines for constructing intuitive, secure, and provider-agnostic UI workflows for connecting and managing Workspace Data Plane storage.

---

## 1. Core UX Objective & Cardinal Principle

The user must always be asked:
$$\text{User Mental Model} = \text{"Where should this workspace's data live?"}$$

$$\text{Prohibited Mental Burden} \neq \text{"Which database / bucket / API / credentials / endpoint do I configure?"}$$

The UI abstracts infrastructure complexity behind progressive disclosure while maintaining strict decoupling between the application's **Control Plane** (accounts/auth/admin) and **Workspace Data Plane** (project files/databases).

```
Workspace Creation ──► Choose Storage [Local | Connect Existing | Managed] ──► Authorization / Wizard ──► Auto-Init ──► Ready
```

---

## 2. Tri-Choice Storage Selection UI

During workspace creation or initial setup, present three clear storage options:

```
┌─────────────────────────────────────────────────────────────┐
│ CREATE WORKSPACE                                            │
│                                                             │
│ Workspace Name                                              │
│ [ My Knowledge Base                                    ]    │
│                                                             │
│ WHERE SHOULD YOUR DATA LIVE?                                │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 💻 LOCAL (Zero-Cloud)                                   │ │
│ │ SQLite + Local Filesystem                               │ │
│ │ • 100% private to this machine                          │ │
│ │ • Full offline operation, zero credentials required     │ │
│ │                                            [ SELECT ➔ ] │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🔗 CONNECT BACKEND (BYOB)                               │ │
│ │ Supabase, PocketBase, Turso, PostgreSQL, S3, MongoDB    │ │
│ │ • Use infrastructure you already own                    │ │
│ │ • Seamless multi-device sync                            │ │
│ │                                           [ CONNECT ➔ ] │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ☁️ MANAGED CLOUD                                         │ │
│ │ Instant cloud backend provisioned by the platform       │ │
│ │ • Zero setup, high-availability cluster                 │ │
│ │                                           [ COMING SOON]│ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Capability-Driven Provider Registry

Never hardcode provider-specific forms throughout the UI. Providers register via a normalized `ProviderDescriptor` declaring their capabilities:

```typescript
export interface ProviderDescriptor {
  id: string;
  name: string;
  category: "relational_sql" | "document_nosql" | "embedded_baas" | "object_storage";
  iconSvg: string;
  description: string;
  supportsOAuth: boolean;
  supportsAutomaticProvisioning: boolean;
  supportsManualConnection: boolean;
  requiredFields: Array<{
    key: string;
    label: string;
    type: "text" | "password" | "url";
    placeholder: string;
    isSecret: boolean;
  }>;
}
```

### UI Capability Logic
- If `provider.supportsOAuth` $\implies$ Display **[Connect via OAuth]** ($\le 2$ clicks).
- If `provider.supportsAutomaticProvisioning` $\implies$ Display **[Auto-Create Project]**.
- If `provider.supportsManualConnection` $\implies$ Display **[Enter Credentials Wizard]**.

---

## 4. One-Click OAuth & Two-Click Fallback Wizard

### A. Preferred Flow: OAuth Integration ($\le 2$ clicks)
$$\text{Click [Connect]} \xrightarrow{\text{OAuth Authorize}} \text{Select Project} \xrightarrow{\text{Authorize}} \text{Verified} \to \text{Ready}$$

### B. Fallback Flow: Guided Wizard
For providers without OAuth:
1. **Project URL / Endpoint** (e.g. `https://xxxx.supabase.co` or `https://my-db.turso.io`)
2. **Public / Client API Key** (e.g. Supabase `anon` key or Turso auth token)
3. **[Test Connection]** live validation probe

> [!CAUTION]
> **Strict Secret Security Barrier**:
> - `service_role` and master admin secrets are **STRICTLY PROHIBITED** from browser inputs and frontend JavaScript.
> - Secrets are never logged, never rendered after entry, and never stored in plain workspace metadata.

---

## 5. Finite State Machine (Connection Lifecycle)

```
        ┌────────────────────────────────────────────────┐
        │                  DISCONNECTED                  │
        └───────────────────────┬────────────────────────┘
                                │ (Select Connect)
                                ▼
        ┌────────────────────────────────────────────────┐
        │                SELECT_PROVIDER                 │
        └───────────────────────┬────────────────────────┘
                                │ (Select Provider)
                                ▼
        ┌────────────────────────────────────────────────┐
        │                 AUTHENTICATING                 │
        └───────┬────────────────────────────────┬───────┘
                │ (Failure)                      │ (Success)
                ▼                                ▼
     ┌─────────────────────┐          ┌─────────────────────┐
     │  CONNECTION_ERROR   │          │    AUTHENTICATED    │
     │      [RETRY]        │          └──────────┬──────────┘
     └─────────────────────┘                     │
                                                 ▼
                                      ┌─────────────────────┐
                                      │   SELECT_RESOURCE   │
                                      └──────────┬──────────┘
                                                 │
                                                 ▼
                                      ┌─────────────────────┐
                                      │      VERIFYING      │
                                      └──────┬────────┬─────┘
                         (Failure)           │        │ (Success)
            ┌────────────────────────────────┘        ▼
            ▼                                ┌─────────────────────┐
     ┌─────────────────────┐                 │      VERIFIED       │
     │  PERMISSION_ERROR   │                 └──────────┬──────────┘
     │      [RETRY]        │                            │
     └─────────────────────┘                            ▼
                                             ┌─────────────────────┐
                                             │    INITIALIZING     │
                                             │  (Schemas/Buckets)  │
                                             └──────────┬──────────┘
                                                        │
                                                        ▼
                                             ┌─────────────────────┐
                                             │        READY        │
                                             │    (● Connected)    │
                                             └─────────────────────┘
```

---

## 6. Live Connection Testing & Actionable Error States

Before committing any connection, execute `testConnection()` checking:
1. **Endpoint Reachability** (DNS / network latency probe)
2. **Authentication Validity** (API token / session check)
3. **Database Accessibility** (Ping or read query)
4. **Storage Accessibility** (Bucket probe)
5. **Permissions & Schema Status**

### Actionable Connection Status Taxonomy

| Status Code | Visual Indicator | Actionable User Guidance |
| :--- | :--- | :--- |
| `CONNECTED` | 🟢 Success Badge | Connection active and operational. |
| `AUTHENTICATION_FAILED` | 🔴 Error | "Invalid API key or token. Please re-enter your client key." |
| `PERMISSION_DENIED` | 🟡 Warning | "Public client lacks required table read/write permissions." |
| `ENDPOINT_UNREACHABLE` | 🔴 Error | "Unable to reach endpoint URL. Check your internet connection or URL." |
| `INITIALIZATION_REQUIRED` | 🔵 Action | "Connected! Initializing required tables and buckets..." |

---

## 7. Automatic Schema & Workspace Provisioning

Upon verified connection, the application automatically provisions required database tables, indexes, and storage buckets:
- Zero manual SQL execution required from the user.
- Automatic creation of domain tables (e.g. `documents`, `tags`, `metadata`, `cache`).
- Automatic creation of binary media buckets (`storage/documents`, `storage/media`).

---

## 8. Workspace Settings $\to$ Data & Storage Panel

Inside Workspace Settings:

```
┌─────────────────────────────────────────────────────────────┐
│ WORKSPACE SETTINGS ➔ DATA & STORAGE                         │
│                                                             │
│ Current Backend                                             │
│ ● Connected  [Supabase Remote]                              │
│                                                             │
│ Health Checklist                                            │
│   ✓ Database Connected (Latency: 24ms)                      │
│   ✓ Object Storage Bucket Ready                             │
│   ✓ Domain Schemas Initialized                              │
│                                                             │
│ Actions (Icon-Only with Hover Tooltips)                     │
│   [🔄 Test Connection]   [⚙️ Reconfigure]   [🔌 Disconnect] │
└─────────────────────────────────────────────────────────────┘
```

### Invariant: Disconnect $\neq$ Data Deletion
- Clicking **[Disconnect]** removes the application connection pointer only.
- Remote database records and files are **preserved intact**.
- Explicit confirmation dialogue: *"This removes the connection from this application. Your backend data will not be deleted."*

---

## 9. UI Directives Compliance

- **Icon-Only Buttons**: Action buttons must render strictly as icons (`[ 🔄 ]`, `[ ⚙️ ]`, `[ 🔌 ]`, `[ ➔ ]`) with tooltips appearing on hover.
- **Hover-Only Descriptions**: Subtitles and feature guides appear exclusively on card hover or tooltip trigger.
- **Subtle Glow Effects**: Selected cards, active status pills, and action buttons utilize `--krnl-accent-glow` and `--krnl-rune-glow` box-shadows.
