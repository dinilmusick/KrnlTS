    // ULTRST FRAMEWORK CONVENTIONS : Project structure conventions for all projects with KrnlJS Library.
// RULES_VERSION: 1.2.0
// KrnlJS = Core Library -> Ultrst Framework Projects

[STRUCTURE]
ROOT/
├── doc.md -> Root Documentation (Links to all assets)
├── src/ -> Canonical Source
├── libraries/ -> External dependencies (submodules) <- project-local shared modules (NOT npm packages)
│   └── MyLib/
│       ├── MyLib.js
│       └── doc.md
├── entities/ -> Child entities (recursive)
│   └── MySubSystemEntity/ <-  should be krnlSubSystemOrchestratorBase for major domains that divide the system/app into major subsystems
│       ├── doc.md
│       ├── entities/ <- component entities (recursive, owned by parent)
│       │   └── MyEntity <- should be krnlEntityBase like normal entities
│       │       ├── doc.md
│       │       ├── entities/ 
│       │       ├── functionalities/ -> Logic atoms (recursive)
│       │       │    └── MyFunc/
│       │       │       ├── doc.md
│       │       │       ├── main_function/
│       │       │       └── MyFunc.js
│       │       └── MyEntity.js
│       ├── functionalities/
│       │   └── MyFunc/
│       │       ├── doc.md
│       │       ├── main_function/
│       │       └── MyFunc.js
│       └── MySubSystemEntity.js
├── functionalities/ <- project-root-level logic atoms
│   └── MyFunc/
│       ├── doc.md
│       ├── main_function/
│       └── MyFunc.js
└── <project-name>.js <- system assembler (krnlSystemEntityBase)

[SUBSYSTEM_PATTERN]
USE krnlSubSystemOrchestratorBase when a system is large enough to split into
named major domains that still run in the same process.

RULE: Subsystems extend krnlSubSystemOrchestratorBase, not krnlSystemEntityBase.
RULE: Subsystems MUST be owned by a parent entity (enforced by constructor).
RULE: Subsystem functionalities bubble to the system root like any component's.
RULE: No network ports, no WS server, no discovery on subsystems.
RULE: Subsystems live inside entities/ — they are a semantic label, not a new folder type.

EXAMPLE:
  MySystem (krnlSystemEntityBase, port 10099)
    └── AuthSubSystem (krnlSubSystemOrchestratorBase, owner = MySystem)
          └── UserEntity (krnlEntityBase, owner = AuthSubSystem)

AuthSubSystem's and UserEntity's public functionalities bubble up to MySystem automatically.
MySystem.call('login', ...) works without any manual wiring.

[REMOTE_FUNCTIONALITY_POLICY]
krnlRemoteFunctionality has two valid creation paths:

PATH A (auto, framework-generated): When a component has a public local functionality,
  the framework creates a RemoteFunctionality proxy on the owner automatically.
  Developer writes nothing. MemoryTransportAdapter is used internally.

PATH B (manual, cross-process only): When a entity needs to call a functionality
  in a SEPARATE PROCESS (different Node instance, different port), use:
  addRemote({ transport: new WebSocketTransportAdapter(commComponent, addr), ... })

RULE: Do NOT manually call addRemote() with MemoryTransportAdapter.
RULE: Do NOT manually call addRemote() to point at a sibling/cousin entity in the same process.
RULE: If you feel the need to addRemote() within a single process, the architecture needs
      refactoring — the entities should share a common owner so bubbling handles it.
RULE: krnlRemoteFunctionality across a process boundary is an advanced use case.
      Default to subsystems and bubbling first.

[DOCUMENTATION_POLICY]
RULE: Every asset (Library, Entity, Functionality, Exhibit) MUST have a 'doc.md'.
RULE: 'doc.md' MUST contain: Name, Description, API List (Signatures + Descriptions + 2 Examples).
RULE: Parent 'doc.md' MUST link to child 'doc.md' files.
RULE: Root 'doc.md' MUST link to all top-level asset 'doc.md' files.
RULE: Every System MUST provide a '/guide' endpoint that returns a hierarchical JSON guide.
RULE: The '/guide' endpoint MUST support a 'section' parameter for recursive navigation.

[LIBRARY_STRUCTURE]
RULE: Each library MUST reside in its own folder named after the library.
RULE: The folder MUST contain the library JS file and a 'doc.md'.

[VISIBILITY_&_BUBBLING]
RULE: Functionalities are 'public' by default and bubble up to the system level.
RULE: Set visibility to 'private' in the descriptor to stop bubbling at the current entity.

[IMPORT_RESTRICTIONS]
RULE: DESCRIPTOR_FILES (Entity.js, Functionality.js) -> NO library imports, NO logic.
RULE: LOGIC_FILES (logic.js, helpers.js) -> YES library imports, YES helper imports.
RULE: PATHS (npm packages) -> import { krnlEntityBase } from 'krnljs'
RULE: PATHS (internal)     -> Use relative paths for atoms within the same project.
RULE: libraries/ folder    -> Project-local shared modules ONLY. Not for npm packages.

[FUNCTIONALITY_DESCRIPTOR_IMPORT]
FILE: ./functionalities/MyFunc/MyFunc.js
-----------------------------------------
import { main } from "./main_function/logic.js";
import { onMount, onTeardown } from "./main_function/lifecycle.js";
import { initialState } from "./state_data/state.js";

export const MyFuncAtom = {
    id: "MyFunc",
    initialState,
    api: main,
    onMount,
    onTeardown,
    emitters: { ... },
    schema: { input: (data) => true }
};

[LOGIC_ATOM_IMPORT]
FILE: ./functionalities/MyFunc/main_function/logic.js
------------------------------------------------------
import { myHelper } from "../helper_functions/myHelper.js";
import { myEvent } from "../events/myEvent.js";
import { ExternalLib } from "../../../libraries/ExternalLib.js"; // Libraries ONLY here

export const main = async (input, { state, emitters, functionality }) => { ... };

[ENTITY_ASSEMBLER_IMPORT]
FILE: ./entities/MyEntity/MyEntity.js
--------------------------------------
import { MyFuncAtom } from "./functionalities/MyFunc/MyFunc.js";
import { MyChildEntity } from "./entities/Child/Child.js";

export class MyEntity extends krnlEntityBase {
    constructor() {
        super("MyEntity");
        this.addLocal(MyFuncAtom);
        this.addChild(new MyChildEntity());
    }
}

[PURE_DESCRIPTOR_POLICY]
RULE: Assemblers == CONFIG_ONLY (Imports of descriptors/atoms/baseClasses(KnrlJS Library) ONLY)
PROHIBITED: import { someLib } from "../../libraries/Lib.js" inside Entity.js or Func.js

[ATOMIC_API_SIGNATURE]
FUNCTION: (input, { state, emitters, functionality, caller }) => {
    TRANSFORM(input);
    UPDATE(state); // Automatic Proxy Reactivity
    EMIT(emitters.get('name'), data);
    RETURN(result);
}

[STATE_MANAGEMENT]
RULE: State defined as literal in state_data/state.js.
RULE: Exported as 'initialState' or 'state'.
RULE: Mutations to 'state' automatically fire 'state:changed' events.

[DISTRIBUTED_RPC]
RULE: Use 'WebSocketTransportAdapter' for remote systems.
RULE: System orchestrators must extend 'krnlSystemEntityBase'.

[UNIFIED_SERVICE_SUITE]
RULE: Every krnlSystemEntityBase automatically hosts a Unified HTTP Service on 'commPort'.
RULE: The suite is "Always-On" and provides the following endpoints:
    - /call/:fid     -> REST (POST) execute functionality.
    - /sse/:fid      -> SSE (GET) stream state updates.
    - /mcp           -> MCP (POST/GET) Streamable HTTP protocol.
    - /acp           -> ACP (GET/POST) Agent Communication Protocol.
    - /manifest      -> System manifest & tool list.

RULE: Access these endpoints using standard HTTP clients (fetch, curl) or AI Agent SDKs.
RULE: WebSocket sharing is automatic; no port offsets are required unless explicitly configured.

