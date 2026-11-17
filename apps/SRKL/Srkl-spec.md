SRKL — Service Oracle

## Implementation Tracker
- [x] **Section 1: Identity** — `IMPLEMENTED` (`src/core/CoreEntity.ts`, `src/core/Identity.ts`, `src/components/AppShell/AppShell.tsx`, `src/App.tsx`)
- [ ] **Section 2: Bootstrap** — `NEXT`
- [ ] **Section 3: Core Architecture** — `PENDING`
- [ ] **Section 4: Inheritance** — `FOUNDATIONS IN PLACE (CoreEntity)` / `PENDING (Remaining Entities)`
- [ ] **Section 5: File Rules** — `ENFORCED (<200 lines, 1-per-file)`
- [ ] **Sections 6–26** — `PENDING`

---

1. Identity [STATUS: IMPLEMENTED]

* Name: SRKL
* Pronunciation: Circle
* Expansion: Service Oracle
* Purpose: SURVEILLANCE + ACCESS + CONTROL OF SERVICES
* Primary target: LOCAL-FIRST SERVICE HUB
* Primary runtime: React + TypeScript
* Development environment: Google AI Studio
* Implementation:
  - `src/core/CoreEntity.ts`: Foundational root entity model with ID, timestamps, validation, serialization.
  - `src/core/Identity.ts`: SystemIdentityEntity inheriting from CoreEntity with SRKL system spec.
  - `src/components/AppShell/AppShell.tsx`: Pure isolated AppShell rendering identity specs and progress tracker.
  - `src/App.tsx`: Top-level file purity law strictly maintained.
  - Verification: `npx tsc --noEmit` clean (0 errors), `compile_applet` passed.

2. Bootstrap [STATUS: NEXT]

* Root folder: SRKL/
* Rules folder: SRKL/Skipo/
* AI agent MUST inspect Skipo/ before coding.
* Skipo/ = coding constraints + architecture rules + conventions.
* Existing Skipo/ rules MUST override agent assumptions.
* New code MUST conform to Skipo/.

3. Core Architecture

SRKL
├── Core
│   ├── Entity
│   ├── Service
│   ├── Account
│   ├── Credential
│   ├── Resource
│   ├── Action
│   └── Provider
│
├── Runtime
│   ├── ServiceRuntime
│   ├── AccountRuntime
│   ├── ResourceRuntime
│   └── ActionRuntime
│
├── Services
│   ├── Backblaze
│   ├── Gemini
│   └── ...
│
├── API
│   ├── Query
│   ├── Action
│   ├── Discovery
│   └── Account
│
├── UI
│   ├── Dashboard
│   ├── Services
│   ├── Accounts
│   ├── Resources
│   ├── Actions
│   └── ServiceBuilder
│
└── Skipo

4. Inheritance

CoreEntity
    ↓
CoreService
    ↓
ServiceProvider
    ↓
ConcreteService
CoreEntity
    ↓
CoreAccount
    ↓
ServiceAccount
CoreEntity
    ↓
CoreResource
    ↓
ServiceResource
CoreEntity
    ↓
CoreAction
    ↓
ServiceAction

* ONE root entity hierarchy.
* Every domain object MUST trace to CoreEntity.
* Parent classes define shared behaviour.
* Template classes define extension contracts.
* Concrete classes implement service-specific behaviour.
* No duplicated base logic.
* No orphan domain classes.
* Composition allowed inside inheritance hierarchy.
* Dependency inversion required.
* Interfaces/contracts required at integration boundaries.

5. File Rules

* MAX 200 lines/file.
* >200 lines = INVALID.
* One primary responsibility/file.
* One primary class/module/file where practical.
* Split before complexity threshold.
* No giant utility files.
* No giant components.
* No giant service adapters.
* No duplicated implementations.
* Shared functionality → parent/core module.
* Service-specific functionality → service module.

6. Service Model

Service
├── Identity
├── Description
├── Authentication
├── Credentials
├── Accounts
├── Resources
├── Endpoints
├── Queries
├── Actions
├── Capabilities
└── Status

7. Service Definition

Each service MUST define:

ServiceDefinition
├── name
├── identifier
├── description
├── version
├── authentication
├── credentialFields[]
├── resources[]
├── endpoints[]
├── actions[]
├── polling
└── metadata

8. Credential Definition

CredentialField
├── name
├── type
├── required
├── secret
├── description
├── validation
└── storagePolicy

* Secrets MUST NEVER appear in ordinary UI state.
* Secrets MUST NEVER be logged.
* Secrets MUST NEVER be included in ordinary API responses.
* Credentials stored separately from service metadata.
* Account references credentials; service definition does not contain user secrets.

9. Account Model

Service
    ↓
Account[]
    ↓
CredentialSet

Account:

Account
├── id
├── serviceId
├── name
├── credentials
├── status
├── metadata
└── lastSync

* Multiple accounts/service.
* Multiple services/account.
* Account-specific credentials.
* Account status independently tracked.

10. Resource Model

ServiceAccount
    ↓
Resource[]

Generic resource:

Resource
├── id
├── type
├── name
├── parent
├── metadata
├── status
├── children
└── actions[]

11. Action Model

Action
├── id
├── name
├── description
├── inputSchema
├── outputSchema
├── permissions
└── executor

Actions MUST support:

READ
CREATE
UPDATE
DELETE
EXECUTE
SYNC
REFRESH

Only actions supported by a service are exposed.

12. Endpoint Model

Endpoint
├── name
├── method
├── path
├── inputSchema
├── outputSchema
├── authentication
└── mapping

* Endpoint definitions belong to service definitions.
* Runtime executes endpoint definitions.
* Service-specific mappings remain inside service adapter.
* No hardcoded service URLs inside UI.

13. Service Adapter

ServiceDefinition
        ↓
ServiceAdapter
        ↓
ServiceRuntime
        ↓
Account
        ↓
API

Adapter responsibilities:

authenticate()
getStatus()
listResources()
getResource()
executeAction()
transformResponse()

14. Service Builder

Second major UI tab:

SERVICE BUILDER
├── Service Identity
├── Authentication
├── Credential Fields
├── Resource Definitions
├── Endpoint Definitions
├── Action Definitions
├── Schemas
├── Polling
├── Validation
└── Export

* Developers can create service definitions.
* Service definitions stored independently.
* Service definitions exportable/importable.
* Service definition MUST NOT contain real credentials.
* Builder produces structured service configuration.
* Runtime consumes service configuration.

15. Backblaze First Integration

Backblaze integration MUST expose:

Account
    ↓
Buckets
    ↓
Objects

Dashboard:

BACKBLAZE
├── Account Status
├── Buckets
│   ├── Name
│   ├── Region
│   ├── Size
│   ├── Object Count
│   └── Status
│
└── Bucket
    ├── Objects
    ├── Folders
    ├── Metadata
    ├── Size
    ├── Last Modified
    └── Actions

Actions:

LIST_BUCKETS
GET_BUCKET
LIST_OBJECTS
GET_OBJECT
GET_OBJECT_METADATA
DELETE_OBJECT
DELETE_BUCKET
REFRESH

* Destructive actions MUST require confirmation.
* Account credentials MUST remain hidden.
* API errors MUST be normalised into SRKL error model.

16. Future Services

Potential integrations:

Gemini
GitHub
Vercel
Facebook
Instagram
Google Drive
OneDrive
AWS
Cloudflare
Supabase

* New service MUST NOT modify unrelated service code.
* New service MUST implement SRKL service contracts.
* New service MUST become discoverable through generic APIs.
* UI MUST consume generic models wherever possible.

17. Surveillance

Every service/account/resource SHOULD expose:

STATUS
HEALTH
USAGE
QUOTA
LIMIT
COUNT
SIZE
LAST_SYNC
LAST_ERROR
TIMESTAMP

Generic:

Service
    ↓
Account
    ↓
StatusSnapshot
    ↓
Metrics[]

* Polling configurable per service.
* Manual refresh supported.
* Last-known state retained.
* Timestamp attached to remote state.
* Remote state distinguished from cached state.

18. Central Hub

SRKL
│
├── SERVICES
│   ├── Backblaze
│   ├── Gemini
│   └── ...
│
├── ACCOUNTS
│   ├── Account A
│   └── Account B
│
├── SECRETS
│
├── STATUS
│
├── RESOURCES
│
└── ACTIONS

19. Agent API

SRKL MUST expose programmatic access.

DISCOVER
LIST SERVICES
LIST ACCOUNTS
GET ACCOUNT STATUS
LIST RESOURCES
GET RESOURCE
LIST ACTIONS
EXECUTE ACTION
GET SCHEMA
GET SERVICE DEFINITION

Agent flow:

AGENT
  ↓
SRKL DISCOVERY
  ↓
SERVICE
  ↓
ACCOUNT
  ↓
RESOURCE
  ↓
ACTION
  ↓
RESULT

* Agents MUST NOT require service-specific hardcoding.
* Agents discover available services/resources/actions dynamically.
* Schemas MUST be machine-readable.
* Permissions MUST be enforced before action execution.
* Secrets MUST NOT be returned to agents unless explicitly required by a controlled operation.

20. API Abstraction

Semantic Operation
        ↓
Service Adapter
        ↓
Protocol
        ↓
Remote Service

Semantic API MUST remain independent of transport.

Possible transports:

HTTP
WebSocket
LOCAL
MCP

21. UI Tabs

[ DASHBOARD ]
[ SERVICES ]
[ ACCOUNTS ]
[ RESOURCES ]
[ SERVICE BUILDER ]
[ ACTIVITY ]
[ SETTINGS ]

Dashboard:

SERVICE HEALTH
ACCOUNT STATUS
USAGE
QUOTAS
RECENT ACTIVITY
ERRORS

22. Activity

Every executed operation SHOULD produce:

Activity
├── timestamp
├── service
├── account
├── resource
├── action
├── status
├── duration
└── error

* Secrets excluded.
* Sensitive payloads excluded.
* Read/write/destructive operations distinguishable.

23. Error Model

SRKLError
├── code
├── message
├── service
├── operation
├── retryable
├── remoteCode
└── timestamp

* Remote errors normalized.
* UI never depends directly on provider-specific error structures.

24. Modularity Rules

CORE → DOMAIN
DOMAIN → CONTRACTS
SERVICE → CONTRACTS
RUNTIME → CONTRACTS
UI → RUNTIME/API
API → RUNTIME

* No circular dependencies.
* UI MUST NOT directly call provider APIs.
* Core MUST NOT depend on concrete services.
* Concrete services MUST depend on core contracts.
* Service adapters MUST be replaceable.
* Provider-specific code MUST remain isolated.

25. Extension Rule

ADD SERVICE
    ↓
DEFINE SERVICE
    ↓
DEFINE AUTH
    ↓
DEFINE CREDENTIALS
    ↓
DEFINE RESOURCES
    ↓
DEFINE ENDPOINTS
    ↓
DEFINE ACTIONS
    ↓
REGISTER SERVICE
    ↓
DISCOVERABLE BY UI + API + AGENTS

26. Core Principle

SRKL = SERVICE ORACLE
OBSERVE
    +
DISCOVER
    +
ACCESS
    +
ACT
    +
CONTROL
ONE HUB
MANY SERVICES
MANY ACCOUNTS
MANY RESOURCES
MANY ACTIONS
ONE COMMON MODEL