// ULTRST FRAMEWORK CONVENTIONS : Project structure conventions for all projects with KrnlJS Library.
// RULES_VERSION: 1.1.0
// KrnlJS = Core Library -> Ultrst Framework Projects

[STRUCTURE]
ROOT/
├── libraries/ -> External dependencies (submodules)
├── entities/ -> Child entities (recursive)
├── functionalities/ -> Logic atoms (recursive)
└── <project-name>.js -> System Assembler (Entry Point)

[IMPORT_RESTRICTIONS]
RULE: DESCRIPTOR_FILES (Entity.js, Functionality.js) -> NO library imports, NO logic.
RULE: LOGIC_FILES (logic.js, helpers.js) -> YES library imports, YES helper imports.
RULE: PATHS -> Use relative paths for internal atoms; absolute/alias for libraries.

[FUNCTIONALITY_DESCRIPTOR_IMPORT]
FILE: ./functionalities/MyFunc/MyFunc.js
-----------------------------------------
import { main } from "./main_function/logic.js";
import { initialState } from "./state_data/state.js";

export const MyFuncAtom = {
    id: "MyFunc",
    initialState,
    api: main,
    emitters: { ... }
};

[LOGIC_ATOM_IMPORT]
FILE: ./functionalities/MyFunc/main_function/logic.js
------------------------------------------------------
import { myHelper } from "../helper_functions/myHelper.js";
import { myEvent } from "../events/myEvent.js";
import { ExternalLib } from "../../../libraries/ExternalLib.js"; // Libraries ONLY here

export const main = async (input, { state, emitters }) => { ... };

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
RULE: Assemblers == CONFIG_ONLY (Imports of descriptors/atoms ONLY)
PROHIBITED: import { someLib } from "../../libraries/Lib.js" inside Entity.js or Func.js

[ATOMIC_API_SIGNATURE]
FUNCTION: (input, { state, emitters, functionality }) => {
    TRANSFORM(input);
    UPDATE(state);
    EMIT(emitters.get('name'), data);
    RETURN(result);
}

[STATE_MANAGEMENT]
RULE: State defined as literal in state_data/state.js.
RULE: Exported as 'initialState' or 'state'.
