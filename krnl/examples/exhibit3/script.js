//////////////////////////////////////// CODE OVERVIEW ////////////////////////////////////////////
/**
 * @file script.js
 * @description Exhibit 3: Demonstrates Scoped State (State encapsulated within functionalities).
 */

import { krnlEntityBase } from "../../core/K_ENT_Krnl_Entity_Base.js";

function setupExhibit() {
    const container = document.getElementById("grimoire-container");

    // Entity Instance
    const entity = new krnlEntityBase("ScopedStateEntity");

    // STEP 1: DEFINE FUNCTIONALITY WITH SCOPED STATE
    createSection(container, "Step 1: Define Functionality with State", "E.\\text{addLocal}({ id, state, api })", () => {
        entity.addLocal({
            id: "ProfileManager",
            state: { name: "Initiate", level: 1 },
            api: (input, { state }) => {
                if (input.action === "update") {
                    state.name = input.name || state.name;
                    state.level = input.level || state.level;
                }
                return { ...state };
            }
        });
        return "Functionality 'ProfileManager' added with private state { name, level }.";
    }, "DEFINE");

    // STEP 2: INTERACT WITH SCOPED STATE
    createValueSection(container, "Step 2: Mutate/Access State", "R = \\text{await } E.\\text{call}(id, input)", async (name, level) => {
        const res = await entity.call("ProfileManager", { action: "update", name, level });
        return res;
    });

    // STEP 3: INSPECT ENCAPSULATION
    createListSection(container, "Step 3: Verify Encapsulation", "M = E.getLocal(id).state", () => {
        const func = entity.getLocal("ProfileManager");
        return {
            entity: entity.entityName,
            functionality: func.id,
            internalState: func.state,
            isEntityStateMissing: entity.stateManager === undefined // Should be true
        };
    });
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
        try {
            const res = logicFn();
            log.innerText = `> ${res}`;
            log.style.color = "#00ff9d";
        } catch (e) {
            log.innerText = `> FAILED: ${e.message}`;
            log.style.color = "#ff0055";
        }
    };
}

function createValueSection(parent, title, mathDesc, logicFn) {
    const section = document.createElement("div");
    section.className = "spell-section";
    section.innerHTML = `
        <h3>${title}</h3>
        <div class="math-lingo">${mathDesc}</div>
        <div class="input-group">
            <input type="text" placeholder="New Name" id="val-name">
            <input type="number" placeholder="New Level" id="val-level">
            <button id="set-btn">CALL API</button>
        </div>
        <div class="output-log" id="val-log">Ready.</div>
    `;
    parent.appendChild(section);

    const btn = section.querySelector("#set-btn");
    const sName = section.querySelector("#val-name");
    const sLevel = section.querySelector("#val-level");
    const log = section.querySelector("#val-log");

    btn.onclick = async () => {
        try {
            const res = await logicFn(sName.value, parseInt(sLevel.value));
            log.innerText = `> API Returned: ${JSON.stringify(res)}`;
            log.style.color = "#00ff9d";
        } catch (e) {
            log.innerText = `> FAILED: ${e.message}`;
            log.style.color = "#ff0055";
        }
    };
}

function createListSection(parent, title, mathDesc, logicFn) {
    const section = document.createElement("div");
    section.className = "spell-section";
    section.innerHTML = `
        <h3>${title}</h3>
        <div class="math-lingo">${mathDesc}</div>
        <button id="refresh-btn">INSPECT</button>
        <div class="output-log" id="refresh-log">Waiting...</div>
    `;
    parent.appendChild(section);

    const btn = section.querySelector("#refresh-btn");
    const log = section.querySelector("#refresh-log");

    btn.onclick = () => {
        const res = logicFn();
        log.innerText = `> Manifest:\n${JSON.stringify(res, null, 2)}`;
    };
}

setupExhibit();
