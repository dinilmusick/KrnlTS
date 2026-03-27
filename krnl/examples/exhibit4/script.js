//////////////////////////////////////// CODE OVERVIEW ////////////////////////////////////////////
/**
 * @file script.js
 * @description Exhibit 4: Demonstrates Entity Compositional Hierarchy.
 */

import { krnlEntityBase } from "../../core/K_ENT_Krnl_Entity_Base.js";

///////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////// MAIN API FUNCTIONS AND DATA //////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////

function setupExhibit() {
    const container = document.getElementById("grimoire-container");

    const rootEntity = new krnlEntityBase("RootSystem");

    // Component Creation
    createSpawnSection(container, "Summon Component Entity", "e \\in E_{owned} : E.\\text{createComponentEntity}(name)", (name) => {
        const child = rootEntity.hierarchyManager.createComponentEntity(name);
        return { name: child.entityName, owner: child.hierarchyManager.getOwnerEntity().entityName };
    });

    // Hierarchy Visualization
    createTreeSection(container, "Hierarchy Manifest", "E \\supset \\{e_1, e_2, \\dots, e_n\\}", () => {
        const buildTree = (entity) => {
            const children = entity.hierarchyManager.getAllOwnedComponentEntities();
            return {
                name: entity.entityName,
                components: children.map(c => buildTree(c))
            };
        };
        return buildTree(rootEntity);
    });

    // Disposal Control
    createActionSection(container, "Recursive Dissolution", "E.\\text{dispose}() \\implies \\forall e \\in E_{owned}, e.\\text{dispose}()", () => {
        rootEntity.dispose();
        return "System fully dissolved. Hierarchy cleared.";
    });
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////// HELPER FUNCTIONS /////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////

function createSpawnSection(parent, title, mathDesc, logicFn) {
    const section = document.createElement("div");
    section.className = "spell-section";
    section.innerHTML = `
        <h3>${title}</h3>
        <div class="math-lingo">${mathDesc}</div>
        <div class="input-group">
            <input type="text" placeholder="Component Name" id="comp-name">
            <button id="spawn-btn">SUMMON</button>
        </div>
        <div class="output-log" id="spawn-log">Ready to summon.</div>
    `;
    parent.appendChild(section);

    const btn = section.querySelector("#spawn-btn");
    const input = section.querySelector("#comp-name");
    const log = section.querySelector("#spawn-log");

    btn.onclick = () => {
        try {
            const res = logicFn(input.value);
            log.innerText = `> Summoned: ${JSON.stringify(res, null, 2)}`;
            log.style.color = "#00ff9d";
        } catch (e) {
            log.innerText = `> BANISHMENT FAILED: ${e.message}`;
            log.style.color = "#ff0055";
        }
    };
}

function createTreeSection(parent, title, mathDesc, logicFn) {
    const section = document.createElement("div");
    section.className = "spell-section";
    section.innerHTML = `
        <h3>${title}</h3>
        <div class="math-lingo">${mathDesc}</div>
        <button id="scan-btn">SCAN TREE</button>
        <div class="output-log" id="scan-log">Waiting for scan...</div>
    `;
    parent.appendChild(section);

    const btn = section.querySelector("#scan-btn");
    const log = section.querySelector("#scan-log");

    btn.onclick = () => {
        const res = logicFn();
        log.innerText = `> Tree Structure:\n${JSON.stringify(res, null, 2)}`;
    };
}

function createActionSection(parent, title, mathDesc, logicFn) {
    const section = document.createElement("div");
    section.className = "spell-section";
    section.innerHTML = `
        <h3>${title}</h3>
        <div class="math-lingo">${mathDesc}</div>
        <button id="action-btn" style="border-color: #ff0055; color: #ff0055;">EXECUTE DISPOSAL</button>
        <div class="output-log" id="action-log">System stable.</div>
    `;
    parent.appendChild(section);

    const btn = section.querySelector("#action-btn");
    const log = section.querySelector("#action-log");

    btn.onclick = () => {
        const res = logicFn();
        log.innerText = `> ${res}`;
        log.style.color = "#ff0055";
        btn.disabled = true;
    };
}

setupExhibit();
