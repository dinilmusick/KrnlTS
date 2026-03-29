//////////////////////////////////////// CODE OVERVIEW ////////////////////////////////////////////
/**
 * @file script.js
 * @description Exhibit 6: Remote Functionalities and External Proxies.
 */

import { krnlEntityBase } from "../../core/K_ENT_Krnl_Entity_Base.js";

function setupExhibit() {
    const container = document.getElementById("grimoire-container");

    // 1. External Singleton Entity (e.g., A global database)
    const externalDB = new krnlEntityBase("GlobalRegistry");
    externalDB.addLocal({
        id: "save",
        api: (data, { caller }) => `[DB] Record saved for ${caller}: ${data}`
    });

    // 2. Local Entity that wants to borrow logic
    const clientEntity = new krnlEntityBase("LocalClient");

    // STEP 1: ADD REMOTE PROXY
    createSection(container, "Step 1: Add Remote Proxy", "\\text{E}.\\text{addRemote}(\\{ targetEntity, targetFunction \\})", () => {
        clientEntity.addRemote({
            id: "RemoteSave",
            targetEntity: externalDB,
            targetFunction: "save"
        });
        return "Proxy 'RemoteSave' added. Targeted at 'GlobalRegistry:save'.";
    }, "INIT PROXY");

    // STEP 2: VERIFY LOCAL INTERFACE
    createSection(container, "Step 2: Verify Registration", "E.\\text{interface}.\\text{has}(id)", () => {
        const hasIO = clientEntity.interface.emitterNames.includes("RemoteSave");
        return `Proxy registered as local emitter: ${hasIO}`;
    }, "CHECK INTERFACE");

    // STEP 3: EXECUTE LOCAL CALL (FORWARDS REMOTE)
    createValueSection(container, "Step 3: Forward Call", "R = \\text{await } E.\\text{call}('RemoteSave', data)", async (data) => {
        // Calling our local proxy which forwards to the external singleton
        const res = await clientEntity.call("RemoteSave", data);
        return res;
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
            <input type="text" placeholder="Record Data" id="val-in">
            <button id="set-btn">CALL PROXY</button>
        </div>
        <div class="output-log" id="val-log">Waiting...</div>
    `;
    parent.appendChild(section);

    const btn = section.querySelector("#set-btn");
    const sIn = section.querySelector("#val-in");
    const log = section.querySelector("#val-log");

    btn.onclick = async () => {
        const res = await logicFn(sIn.value);
        log.innerText = `> Response: ${res}`;
        log.style.color = "#00ff9d";
    };
}

setupExhibit();
