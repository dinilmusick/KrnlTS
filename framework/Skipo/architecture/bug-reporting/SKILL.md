# Universal Bug Reporting Contract

Every generated Skipo application MUST expose bug reporting through the existing universal conversational runtime. Bug reporting is not a second chat UI.

## Runtime contract

The common chat composer exposes an optional bug-report action. The host application supplies a reporter that forwards the report to Krusbl.

Chat overlay -> application bug reporter -> Krusbl bugReport.report

Required report context: applicationId, applicationType=skipo, applicationVersion when available, deploymentId when available, workspaceId when available, route when available, correlationId when available, conversationId/messageId when available, sourceRevision when available, diagnostics when available.

The report remains natural-language first; runtime metadata is attached automatically.

## Composite rule

Hubrys composites MUST use the same conversational overlay contract. Hubrys identifies the root composite as applicationType=hubrys-composite and may include component/service/flow scope. Hubrys forwards the report through its configured bug-report sink; Dea configures that sink to Krusbl.

## Control-plane rule

Krusbl is the defect system of record. Applications do not create independent bug backlogs.

Canonical lifecycle: REPORT -> TRIAGE -> IN_PROGRESS -> RESOLVED -> REOPENED.

Bug remediation may be handed to Dea through the existing FOD/Aiko/developer capabilities.

## Security

Bug reports require an authenticated application user. Do not accept an arbitrary reporter identity from the client when an authenticated session identity is available; the runtime must override it.
