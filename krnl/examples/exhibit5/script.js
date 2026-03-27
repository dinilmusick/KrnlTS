//////////////////////////////////////// CODE OVERVIEW ////////////////////////////////////////////
/**
 * @file script.js
 * @description Exhibit 5: Demonstrates Returned Functionalities.
 */

import { krnlEntityBase } from "../../core/K_ENT_Krnl_Entity_Base.js";

///////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////// MAIN API FUNCTIONS AND DATA //////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////

async function setupExhibit() {
    const container = document.getElementById("grimoire-container");
    const entity = new krnlEntityBase("MethodMaster");

    let currentInstance = null;

    // STEP 1: DEFINE
    createSection(container, "Step 1: Define Definition", "\\Phi_{def} = \\text{define}(name, method, opts)", () => {
        entity.returnedFunctionalities.define("ProcessLogic", (data) => {
            console.log("Executing definition method with:", data);
            return `Processed: ${data} at ${new Date().toLocaleTimeString()}`;
        }, { stateful: true, stateKey: "lastResult" });
        return "Functionality 'ProcessLogic' defined (Stateful).";
    }, "DEFINE");

    // STEP 2: CREATE INSTANCE
    createSection(container, "Step 2: Spawn Instance", "\\Phi_{ins} = \\text{createInstance}(\\Phi_{def}, caller)", () => {
        currentInstance = entity.returnedFunctionalities.createInstance("ProcessLogic", "ExhibitCaller");
        return `Instance Created: ${currentInstance.instanceName}\nConnected State Index: ${currentInstance.connectedStateIndex}`;
    }, "SPAWN");

    // STEP 3: CALL
    createCallSection(container, "Step 3: Invoke Call", "R = \\text{await call}(\\Phi_{ins}, data)", async (data) => {
        if (!currentInstance) throw new Error("Spawn an instance first!");
        const result = await entity.returnedFunctionalities.call(currentInstance.instanceName, data);

        // Peek at state to prove it's cached
        const stateVal = entity.stateManager.getStateValue(currentInstance.connectedStateIndex, "lastResult");

        return {
            callResult: result,
            cachedInState: stateVal
        };
    }, "INVOKE");
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////// HELPER FUNCTIONS /////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////

function createSection(parent, title, mathDesc, logicFn, btnText) {
    const section = document.createElement("div");
    section.className = "spell-section";
    section.innerHTML = `
        <h3>${title}</h3>
        <div class="math-lingo">${mathDesc}</div>
        <button class="action-btn">${btnText}</button>
        <div class="output-log">Waiting...</div>
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
            log.innerText = `> ERROR: ${e.message}`;
            log.style.color = "#ff0055";
        }
    };
}

function createCallSection(parent, title, mathDesc, logicFn, btnText) {
    const section = document.createElement("div");
    section.className = "spell-section";
    section.innerHTML = `
        <h3>${title}</h3>
        <div class="math-lingo">${mathDesc}</div>
        <div class="input-group">
            <input type="text" placeholder="Payload Data" id="call-input" value="Magic Sigil 42">
            <button id="call-btn">${btnText}</button>
        </div>
        <div class="output-log" id="call-log">Ready.</div>
    `;
    parent.appendChild(section);

    const btn = section.querySelector("#call-btn");
    const input = section.querySelector("#call-input");
    const log = section.querySelector("#call-log");

    btn.onclick = async () => {
        try {
            log.innerText = "> Calling functionality...";
            const res = await logicFn(input.value);
            log.innerText = `> Result Manifest:\n${JSON.stringify(res, null, 2)}`;
            log.style.color = "#00ff9d";
        } catch (e) {
            log.innerText = `> CALL FAILED: ${e.message}`;
            log.style.color = "#ff0055";
        }
    };
}

setupExhibit();
