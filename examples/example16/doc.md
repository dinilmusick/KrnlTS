# Example 16: Krnl Sub-App Integration & Orchestration

This example demonstrates how self-contained React full-stack sub-apps are integrated into the Krnl ecosystem.

## Key Features Demonstrated
1. **Sub-App Discovery & Manifest Registration**:
   - `StorefrontApp` with `subapp.json`, `package.json`, and `src/register.js`.
   - `PaymentApp` with `subapp.json`, `package.json`, and `src/register.js`.
2. **Zero-Server Operation**:
   - Sub-apps do not start HTTP servers or bind ports.
   - Krnl's root Unified HTTP Adapter hosts and projects all endpoints on behalf of the sub-apps.
3. **Functionality Wrapping & Flow Orchestration**:
   - Operations wrap into first-class `krnlLocalFunctionality` instances on the host `Entity`.
   - `entity.flow('completeCheckout')` pipelines cart calculation, card authorization, and order placement.
4. **Workspace Manifest Aggregation**:
   - `entity.getWorkspaceRequirements()` aggregates sub-app dependencies into the workspace.
5. **Transport Projection**:
   - Root `/call/:fid`, `/call/StorefrontApp.calculateCart`, `/call/PaymentApp.chargeCard`, and `/manifest`.

## Running the Example
```bash
node examples/example16/run_test.js
```
