//////////////////////////////////////// CODE OVERVIEW ////////////////////////////////////////////
/**
 * @file script.js
 * @description Exhibit 3: Ultrst Philosophy - Atomic Assembly and Events.
 */

import { krnlEntityBase } from "../../core/K_ENT_Krnl_Entity_Base.js";

function setupExhibit() {
    const container = document.getElementById("grimoire-container");

    const entity = new krnlEntityBase("AtomicSystem");

    // STEP 1: DEFINE THE ATOM (MAIN + HELPERS + EVENTS)
    createSection(container, "Step 1: Assembled Atom", "\\text{Events} = \\{ \\text{beginning, during, end, failure} \\}", () => {
        entity.addLocal({
            id: "Profile",
            initialState: { logs: [] },
            api: (input, { state, helpers }) => {
                const timestamp = helpers.get("getNow")();
                state.logs.push(`Action: ${input} at ${timestamp}`);
                return `Action recorded at ${timestamp}`;
            },
            helpers: {
                "getNow": () => new Date().toLocaleTimeString()
            },
            events: {
                beginning: ({ functionality }) => console.log(`[${functionality.id}] RITE_BEGINS`),
                during: ({ input }) => console.log(`[During] Processing: ${input}`),
                end: ({ output }) => console.log(`[End] Result: ${output}`)
            }
        });
        return "Atomic 'Profile' functionality assembled. Check console for events.";
    }, "ASSEMBLE");

    // STEP 2: MULTI-STATE TEST
    createSection(container, "Step 2: Scoped State (Multi)", "S_{Alice} \\neq S_{Bob}", () => {
        entity.addLocal({
            id: "UserPoints",
            stateModel: "multi",
            initialState: { points: 0 },
            api: (input, { state, caller }) => {
                state.points += input;
                return `${caller} total: ${state.points}`;
            }
        });
        return "Multi-state 'UserPoints' added.";
    }, "INIT MULTI");

    // STEP 3: CALL AS DIFFERENT ENTITIES
    createValueSection(container, "Step 3: Call as Callers", "E.\\text{call}(id, val, \\{ caller \\})", async (val, caller) => {
        const res = await entity.call("UserPoints", parseInt(val), { caller });
        return res;
    });

    // STEP 4: LIBRARIES
    createSection(container, "Step 4: Register Library Atom", "E.\\text{addLibrary}(id, struct)", () => {
        entity.addLibrary("Constants", { VERSION: "2.0.Ultrst", AUTHOR: "Dinil Palackal" });
        return `Library 'Constants' registered. Author: ${entity.libraries.get("Constants").AUTHOR}`;
    }, "ADD LIB");
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
            <input type="number" placeholder="Points" id="val-in">
            <input type="text" placeholder="Caller Name" id="val-call">
            <button id="set-btn">EXECUTE</button>
        </div>
        <div class="output-log" id="val-log">Waiting...</div>
    `;
    parent.appendChild(section);

    const btn = section.querySelector("#set-btn");
    const sIn = section.querySelector("#val-in");
    const sCall = section.querySelector("#val-call");
    const log = section.querySelector("#val-log");

    btn.onclick = async () => {
        const res = await logicFn(sIn.value, sCall.value);
        log.innerText = `> Result: ${res}`;
        log.style.color = "#00ff9d";
    };
}

setupExhibit();
