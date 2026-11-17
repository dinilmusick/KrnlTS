---
name: ui-backend-connection
description: Uniform guidelines and state machine specifications for Backend Connection UX: Progressive disclosure, Tri-choice workspace storage, Capability-driven Provider Registry, One-click OAuth and fallback wizard, Live Connection Testing, Automatic Schema Initialization, and Workspace Settings Data & Storage panel.
---

# BACKEND CONNECTION UX (DENSE)

$$\text{StorageChoice} \in \{\text{LOCAL (Zero-Cloud)}, \text{BYOB (User Cloud)}, \text{MANAGED}\} \quad \wedge \quad \text{Control} \cap \text{Data} = \emptyset$$

## 1. TRI-CHOICE WORKSPACE STORAGE MODEL

```
[Local Machine]   --> Zero credentials, offline SQLite + LocalFS, private
[Connect BYOB]    --> Backblaze B2, S3, Supabase, Postgres (User-owned credentials)
[Managed Cloud]   --> Auto-provisioned by platform cluster
```

## 2. CAPABILITY-DRIVEN PROVIDER DESCRIPTOR

```typescript
export interface ProviderDescriptor {
  id: 'local_fs' | 'backblaze_b2' | 'aws_s3' | 'supabase_storage';
  name: string;
  category: 'filesystem' | 'object_storage' | 'database';
  supportsOAuth: boolean;
  requiredFields: Array<{
    key: string;
    label: string;
    type: 'text' | 'password' | 'url';
    isSecret: boolean;
  }>;
}
```

## 3. CONNECTION STATE MACHINE ALGORITHM

```
State(IDLE)
  ──► EnterCredentials / SelectStoredConnection
  ──► State(TESTING): POST /api/auth/storage/test -> probeLatency()
        ├── FAIL -> State(ERROR): Show actionable CopyableErrorAlert
        └── PASS -> State(SAVING)
  ──► State(PROVISIONING): Auto-derive folder: ultrst_{app}_{user}_{ws}
  ──► State(READY): Mount WorkspaceFS -> Redirect to Workspace UI
```

## 4. UI INVARIANTS
1. External credentials MUST use `@skipo/ui` `CredentialField` with direct console link.
2. Workspace folder path MUST be auto-derived (`ultrst_{app}_{user}_{ws}`). Zero manual folder inputs.
3. Test connectivity button mandatory before saving.

## 5. CHECKLIST GATE
`python3 checklists/02_ui_primitives_themes.py .` && `python3 checklists/07_backend_storage_isolation.py .`
