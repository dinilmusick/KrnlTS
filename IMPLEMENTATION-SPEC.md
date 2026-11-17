# FLOKS — IMPLEMENTATION SPECIFICATION

STATUS := CANONICAL
AUTHORITY := FLOKS repository
ROLE := React frontend component/library layer

## 1. CORE MODEL

REACT := frontend framework.
FLOKS := reusable React UI/component library.
SKIPO := application layer consuming FLOKS.
CRUCIBLE := SKIPO application consuming FLOKS and coordinating ecosystem updates.

FLOKS DOES NOT require a separate UI-component creation framework.

COMPONENT_AUTHORING := React + TypeScript + repository conventions.

## 2. OWNERSHIP

FLOKS OWNS:
- reusable React components
- frontend UI packages
- component contracts
- frontend package exports
- frontend styling/token assets belonging to FLOKS
- reusable canvas/2D UI components already belonging to FLOKS
- component manifests/contracts

FLOKS DOES NOT OWN:
- React runtime/framework
- KRNLTS backend runtime
- KLOKS backend services
- SKIPO application composition
- KRUSBL promotion mechanics
- CRUCIBLE ecosystem orchestration

## 3. DEPENDENCY DIRECTION

React → FLOKS → SKIPO → CRUCIBLE

FLOKS MAY consume:
React
ReactDOM
KLOKS contracts where an existing frontend/backend boundary requires them

FLOKS MUST NOT import:
SKIPO | KRUSBL | CRUCIBLE

## 4. COMPONENT MODEL

COMPONENT :=
{
  props,
  rendering,
  events,
  state,
  styles,
  accessibility
}

COMPONENT := React component.
COMPONENT_LIBRARY := collection of reusable COMPONENTs.

No independent component runtime is created.

## 5. PACKAGE MODEL

Existing public areas remain authoritative:
ui
canvas-ui
contracts

Existing exports remain explicit.

Every reusable component MUST have:
- stable public API
- typed props
- deterministic behavior
- tests appropriate to interaction/rendering
- export path
- contract/manifest where required

## 6. CONTRACT AUTHORITY

COMPONENT_CONTRACT > generated metadata
EXPORT_CONTRACT > generated metadata
COMPATIBILITY_CONTRACT > generated metadata

FLOKS manifests describe actual package exports.

KRUSBL may consume FLOKS contracts.
KRUSBL does not redefine them.

## 7. IMPLEMENTATION RULES

- React remains the component framework
- no parallel component creation framework
- no backend service runtime
- no application-specific SKIPO screens
- no CRUCIBLE control plane
- no promotion engine
- preserve existing component APIs unless an accepted change requires modification

## 8. TEST MODEL

REPO_TEST:
  typecheck
  component rendering
  interaction
  export surface
  manifest validation

CONTRACT_TEST:
  props/types
  exports
  package compatibility
  React peer dependency correctness

INTEGRATION_CONTRACT:
  SKIPO can import FLOKS components through published/local package exports.

## 9. ACCEPTANCE

PASS ⇔
  build
  ∧ typecheck
  ∧ tests
  ∧ exports valid
  ∧ manifests valid
  ∧ React peer boundary valid
  ∧ no backend/application/control-plane leakage

## 10. AGENT RULE

AGENT_FLOKS:
  inspect actual packages first
  preserve valid implementation
  implement missing reusable UI functionality
  update tests/contracts
  do not invent a second UI framework
  do not move SKIPO/CRUCIBLE/KRUSBL responsibilities into FLOKS
