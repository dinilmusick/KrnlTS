//////////////////////////////////////// CODE OVERVIEW ////////////////////////////////////////////
/**
 * @file script.js
 * @description Exhibit 4: Hierarchy and Automatic Interface Promotion.
 */

import { krnlEntityBase } from "../../core/K_ENT_Krnl_Entity_Base.js";

function setupExhibit() {
    const container = document.getElementById("grimoire-container");

    const rootEntity = new krnlEntityBase("TheArchon");

    // STEP 1: SPAWN COMPONENT
    createSection(container, "Step 1: Summon Component", "E.\\text{createComponentEntity}(name)", () => {
        const comp = rootEntity.hierarchyManager.createComponentEntity("Legionnaire");
        return `Component 'Legionnaire' summoned.`;
    }, "SUMMON");

    // STEP 2: ADD PUBLIC LOGIC TO COMPONENT
    createSection(container, "Step 2: Bind Public Logic to Component", "\\text{Comp}.\\text{addLocal}(\\{ id, visibility: 'public' \\})", () => {
        const comp = rootEntity.hierarchyManager.createComponentEntity("Legionnaire");
        comp.addLocal({
            id: "Attack",
            visibility: "public",
            api: (input) => `Legionnaire attacking ${input}!`
        });
        return "Logic 'Attack' bound to component.";
    }, "BIND PUBLIC");

    // STEP 3: VERIFY PROMOTION ON OWNER
    createSection(container, "Step 3: Verify Promotion", "\\text{Owner}.\\text{interface}.\\text{has}(id)", () => {
        const hasPromotion = rootEntity.interface.collectorNames.includes("Attack");
        return `Owner interface has promoted 'Attack': ${hasPromotion}`;
    }, "SCAN OWNER");

    // STEP 4: CALL PROMOTED LOGIC
    createValueSection(container, "Step 4: Execute Promoted Logic", "R = \\text{await } \\text{Owner}.\\text{call}(id, input)", async (target) => {
        const res = await rootEntity.call("Attack", target);
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
            <input type="text" placeholder="Target Name" id="val-in">
            <button id="set-btn">CALL OWNER</button>
        </div>
        <div class="output-log" id="val-log">Waiting...</div>
    `;
    parent.appendChild(section);

    const btn = section.querySelector("#set-btn");
    const sIn = section.querySelector("#val-in");
    const log = section.querySelector("#val-log");

    btn.onclick = async () => {
        try {
            const res = await logicFn(sIn.value);
            log.innerText = `> Owner call returned: ${res}`;
            log.style.color = "#00ff9d";
        } catch (e) {
            log.innerText = `> CALL FAILED: ${e.message}`;
            log.style.color = "#ff0055";
        }
    };
}

setupExhibit();
