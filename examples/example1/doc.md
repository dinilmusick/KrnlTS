# Exhibit 1: Systems & Surgical Imports

This example demonstrates the core architectural pattern of a Krnl system: a Backend Logic Provider and a Frontend Controller communicating over a network.

## The Concept: "System Entities"
Unlike regular entities, System Entities are network-enabled.

1.  **CalculatorSystem**: A backend server (Port 10091) that hosts math logic.
2.  **WebInterfaceSystem**: A frontend controller (Port 10092) that discovers the Calculator and borrows its logic.

## The Import Model: "Surgical Imports"
Logic files do not import libraries globally. They only import what they need for that specific file.

```javascript
// CalculatorSystem/functionalities/Calculator/main_function/logic.js
import { format } from "../helper_functions/formatter.js";
import { ProjectConcepts } from "../../../libraries/ProjectConcepts.js";
```

Policy reminder: descriptor files (`Entity.js`, `MyFunctionality.js`) remain assembly-only; logic and data atoms stay in `main_function/`, `helper_functions/`, `events/`, and `state_data/`.

## The Logic: "Remote Proxies" (v1.2.0)
The WebInterface borrows logic from the Calculator using a proxy and a transport adapter:

```javascript
import { WebSocketTransportAdapter } from "../../../krnl/core/K_LIB_Krnl_System_Comm_Component.js";

this.addRemote({
    id: "RemoteCalc",
    transport: new WebSocketTransportAdapter(this.commComponent, calcPeer.address),
    targetFunction: "Calculator"
});
```

By abstracting the transport, the `WebInterfaceSystem` logic remains completely agnostic to how the network call is executed.

## Rationale
By extending `krnlSystemEntityBase`, these two apps become independent software blocks. They can find each other via UDP discovery and share logic as if they were running in the same process, while maintaining strict atomic separation in the file system.
