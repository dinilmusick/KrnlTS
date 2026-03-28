//////////////////////////////////////// CODE OVERVIEW ////////////////////////////////////////////
/**
 * @file script.js
 * @description Exhibit 5: Demonstrates the new Functionality model (replacing legacy Returned Functionalities).
 */

import { krnlEntityBase } from "../../core/K_ENT_Krnl_Entity_Base.js";

async function setupExhibit() {
    const container = document.getElementById("grimoire-container");
    const entity = new krnlEntityBase("MethodMaster");

    // STEP 1: DEFINE LOCAL FUNCTIONALITY
    createSection(container, "Step 1: Define Local Functionality", "E.\\text{addLocal}(config)", () => {
        entity.addLocal({
            id: "ProcessLogic",
            api: (data, { state }) => {
                console.log("Executing API with:", data);
                state.lastResult = `Processed: ${data} at ${new Date().toLocaleTimeString()}`;
                return state.lastResult;
            },
            state: { lastResult: null }
        });
        return "Functionality 'ProcessLogic' added to entity.";
    }, "DEFINE");

    // STEP 2: CALL FUNCTIONALITY
    createCallSection(container, "Step 2: Invoke Call", "R = \\text{await } E.\\text{call}(id, data)", async (data) => {
        const result = await entity.call("ProcessLogic", data);
        
        // Peek at state to prove it's cached within the functionality
        const func = entity.getLocal("ProcessLogic");
        const cached = func.state.lastResult;

        return {
            callResult: result,
            cachedInFuncState: cached
        };
    }, "INVOKE");
}

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
