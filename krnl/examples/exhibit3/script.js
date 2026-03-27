//////////////////////////////////////// CODE OVERVIEW ////////////////////////////////////////////
/**
 * @file script.js
 * @description Exhibit 3: Demonstrates State Management and State Manager.
 */

import { krnlEntityBase } from "../../core/K_ENT_Krnl_Entity_Base.js";

///////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////// MAIN API FUNCTIONS AND DATA //////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////

function setupExhibit() {
    const container = document.getElementById("grimoire-container");

    // Entity Instance
    const entity = new krnlEntityBase("ExhibitEntity");

    // State Creation
    createStateSection(container, "State Incantation", "S \\gets E.stateManager.createState(name)", (name) => {
        const { state, index } = entity.stateManager.createState(name);
        return { fullName: state.name, index };
    });

    // State Values
    createValueSection(container, "State Values (Set/Get)", "V \\in S[k] : S \\subset E.states", (stateName, key, value) => {
        entity.stateManager.setStateValue(stateName, key, value);
        return entity.stateManager.getStateValue(stateName, key);
    });

    // Derived Map (Single Source of Truth)
    createListSection(container, "Derived State Map", "M = \\text{buildStateMap}(E.states)", () => {
        const map = entity.stateManager.buildStateMap();
        return Object.fromEntries(map);
    });

    // Entity Inspection
    createListSection(container, "Entity Manifest", "L = E.listStateNames()", () => {
        return {
            entity: entity.entityName,
            states: entity.stateManager.listStateNames(),
            structure: entity.stateManager.states.map(s => ({
                name: s.name,
                data: s.entries()
            }))
        };
    });
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////// HELPER FUNCTIONS /////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////

function createStateSection(parent, title, mathDesc, logicFn) {
    const section = document.createElement("div");
    section.className = "spell-section";
    section.innerHTML = `
        <h3>${title}</h3>
        <div class="math-lingo">${mathDesc}</div>
        <div class="input-group">
            <input type="text" placeholder="State Name (e.g. Config)" id="state-name">
            <button id="create-btn">ETCH</button>
        </div>
        <div class="output-log" id="create-log">Ready.</div>
    `;
    parent.appendChild(section);

    const btn = section.querySelector("#create-btn");
    const input = section.querySelector("#state-name");
    const log = section.querySelector("#create-log");

    btn.onclick = () => {
        try {
            const res = logicFn(input.value);
            log.innerText = `> Created: ${JSON.stringify(res)}`;
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
            <input type="text" placeholder="State Name" id="val-state-name">
            <input type="text" placeholder="Key" id="val-key">
            <input type="text" placeholder="Value" id="val-value">
            <button id="set-btn">SET/GET</button>
        </div>
        <div class="output-log" id="val-log">Ready.</div>
    `;
    parent.appendChild(section);

    const btn = section.querySelector("#set-btn");
    const sName = section.querySelector("#val-state-name");
    const sKey = section.querySelector("#val-key");
    const sVal = section.querySelector("#val-value");
    const log = section.querySelector("#val-log");

    btn.onclick = () => {
        try {
            const val = isNaN(parseFloat(sVal.value)) ? sVal.value : parseFloat(sVal.value);
            const res = logicFn(sName.value, sKey.value, val);
            log.innerText = `> Current Value: ${JSON.stringify(res)}`;
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
        <button id="refresh-btn">REFRESH</button>
        <div class="output-log" id="refresh-log">Waiting...</div>
    `;
    parent.appendChild(section);

    const btn = section.querySelector("#refresh-btn");
    const log = section.querySelector("#refresh-log");

    btn.onclick = () => {
        const res = logicFn();
        log.innerText = `> Manifest:
${JSON.stringify(res, null, 2)}`;
    };
}

setupExhibit();
