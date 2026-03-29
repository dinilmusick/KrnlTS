//////////////////////////////////////// CODE OVERVIEW ////////////////////////////////////////////
/**
 * @file script.js
 * @description Exhibit 3: Scoped State and Visibility.
 */

import { krnlEntityBase } from "../../core/K_ENT_Krnl_Entity_Base.js";

function setupExhibit() {
    const container = document.getElementById("grimoire-container");

    const entity = new krnlEntityBase("StateLab");

    // STEP 1: SINGLE STATE (SHARED)
    createSection(container, "Step 1: Single State (Shared)", "S_{single} = \\text{initialState}", () => {
        entity.addLocal({
            id: "Counter",
            stateModel: "single",
            initialState: { count: 0 },
            api: (input, { state }) => {
                state.count++;
                return state.count;
            }
        });
        return "Single-state 'Counter' added. All callers share the same number.";
    }, "INIT SINGLE");

    // STEP 2: MULTI STATE (PER CALLER)
    createSection(container, "Step 2: Multi-State (Per Caller)", "S_{caller} = \\text{initialState}_i", () => {
        entity.addLocal({
            id: "Profile",
            stateModel: "multi",
            initialState: { lastAction: "none" },
            api: (input, { state, caller }) => {
                state.lastAction = input;
                return { caller, state };
            }
        });
        return "Multi-state 'Profile' added. State tracks unique 'caller' names.";
    }, "INIT MULTI");

    // STEP 3: INTERACT AS DIFFERENT CALLERS
    createValueSection(container, "Step 3: Call Multi-State", "R = \\text{await } E.\\text{call}(id, input, \\{ caller \\})", async (action, caller) => {
        const res = await entity.call("Profile", action, { caller });
        return res;
    });

    // STEP 4: VISIBILITY DEMO
    createSection(container, "Step 4: Private Visibility", "\\text{visibility} = 'private'", () => {
        entity.addLocal({
            id: "SecretKey",
            visibility: "private",
            api: () => "BEYOND_REACH"
        });
        const hasIO = entity.interface.collectorNames.includes("SecretKey");
        return `Private logic 'SecretKey' added. Registered in interface: ${hasIO}`;
    }, "TEST VISIBILITY");
}

function createSection(parent, title, mathDesc, logicFn, btnText) {
    const section = document.createElement("div");
    section.className = "spell-section";
    section.innerHTML = `
        <h3>${title}</h3>
        <div class="math-lingo">${mathDesc}</div>
        <button class="action-btn">${btnText}</button>
        <div class="output-log">Ready.</div>
    `;
    parent.appendChild(section);

    const btn = section.querySelector("button");
    const log = section.querySelector(".output-log");

    btn.onclick = () => {
        const res = logicFn();
        log.innerText = `> ${res}`;
        log.style.color = "#00ff9d";
    };
}

function createValueSection(parent, title, mathDesc, logicFn) {
    const section = document.createElement("div");
    section.className = "spell-section";
    section.innerHTML = `
        <h3>${title}</h3>
        <div class="math-lingo">${mathDesc}</div>
        <div class="input-group">
            <input type="text" placeholder="Action" id="val-act">
            <input type="text" placeholder="Caller Name" id="val-call">
            <button id="set-btn">CALL API</button>
        </div>
        <div class="output-log" id="val-log">Ready.</div>
    `;
    parent.appendChild(section);

    const btn = section.querySelector("#set-btn");
    const sAct = section.querySelector("#val-act");
    const sCall = section.querySelector("#val-call");
    const log = section.querySelector("#val-log");

    btn.onclick = async () => {
        const res = await logicFn(sAct.value, sCall.value);
        log.innerText = `> API Returned: ${JSON.stringify(res)}`;
        log.style.color = "#00ff9d";
    };
}

setupExhibit();
