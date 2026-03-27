//////////////////////////////////////// CODE OVERVIEW ////////////////////////////////////////////
/**
 * @file script.js
 * @description Exhibit 2: Demonstrates the Krnl Error system.
 */

import { krnlError, krnlErrorCodes, krnlErrorMessages } from "../../core/K_LIB_Krnl_Error_Concepts.js";

///////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////// MAIN API FUNCTIONS AND DATA //////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////

function setupExhibit() {
    const container = document.getElementById("grimoire-container");

    // Error Registry Section
    const listSection = document.createElement("div");
    listSection.className = "spell-section";
    listSection.innerHTML = `
        <h3>Error Registry</h3>
        <div class="math-lingo">E_{codes} = { -1, 100 \dots 400 }</div>
        <div class="error-grid" id="error-grid"></div>
    `;
    container.appendChild(listSection);

    const grid = document.getElementById("error-grid");
    Object.entries(krnlErrorCodes).forEach(([name, code]) => {
        const nameDiv = document.createElement("div");
        nameDiv.innerText = name;
        nameDiv.style.color = "#ff9e00"; // Gold
        grid.appendChild(nameDiv);

        const codeDiv = document.createElement("div");
        codeDiv.innerText = `[${code}] ${krnlErrorMessages[code] || "Unknown"}`;
        grid.appendChild(codeDiv);
    });

    // Execution Section
    createThrowSection(container, "Invoke Judicial Punishment", "throw new krnlError(code)");
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////// HELPER FUNCTIONS /////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////

function createThrowSection(parent, title, mathDesc) {
    const section = document.createElement("div");
    section.className = "spell-section";
    
    const header = document.createElement("h3");
    header.innerText = title;
    section.appendChild(header);

    const desc = document.createElement("div");
    desc.className = "math-lingo";
    desc.innerText = mathDesc;
    section.appendChild(desc);

    const select = document.createElement("select");
    select.style.background = "#000";
    select.style.border = "1px solid #ff0000";
    select.style.color = "#fff";
    select.style.padding = "0.5rem";
    select.style.marginTop = "1rem";
    select.style.width = "100%";
    select.style.fontFamily = "monospace";

    Object.entries(krnlErrorCodes).forEach(([name, code]) => {
        const opt = document.createElement("option");
        opt.value = code;
        opt.innerText = `${name} (${code})`;
        select.appendChild(opt);
    });
    section.appendChild(select);

    const btn = document.createElement("button");
    btn.innerText = "Execute Incantation";
    section.appendChild(btn);

    const output = document.createElement("div");
    output.className = "output-log";
    output.innerText = "System Safe.";
    section.appendChild(output);

    btn.onclick = () => {
        try {
            const code = parseInt(select.value);
            throw new krnlError(code);
        } catch (e) {
            output.innerText = `> CAUGHT SYSTEM ERROR:
Code: ${e.code}
Message: ${e.message}`;
            output.style.color = "#ff0055";
        }
    };

    parent.appendChild(section);
}

setupExhibit();
