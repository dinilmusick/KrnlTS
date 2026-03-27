//////////////////////////////////////// CODE OVERVIEW ////////////////////////////////////////////
/**
 * @file script.js
 * @description Exhibit 0: Demonstrates the usage of Krnl Core Function Atoms for recursive processing.
 */

import { rMap, rFilter, rFind, rReduce, rBuildMap, findByField } from "../../extensions/K_LIB_Krnl_Core_Function_Atoms.js";

///////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////// MAIN API FUNCTIONS AND DATA //////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////

function setupExhibit() {
    const container = document.getElementById("grimoire-container");

    // R_MAP
    createSection(container, "R_MAP (Transformation)", "f: A → B", [1, 2, 3, 4], "x * 2", (arr, fnStr) => {
        const fn = new Function("x", "return " + fnStr);
        return rMap(arr, fn);
    });

    // R_FILTER
    createSection(container, "R_FILTER (Selection)", "A' ⊆ A : ∀x ∈ A', P(x) = T", [1, 2, 3, 4, 5, 6], "x % 2 === 0", (arr, fnStr) => {
        const fn = new Function("x", "return " + fnStr);
        return rFilter(arr, fn);
    });

    // R_FIND
    createSection(container, "R_FIND (Search)", "∃x ∈ A : P(x) = T", [1, 2, 3, 4], "x > 2", (arr, fnStr) => {
        const fn = new Function("x", "return " + fnStr);
        return rFind(arr, fn);
    });

    // R_REDUCE
    createSection(container, "R_REDUCE (Accumulation)", "S = \\sum f(s, x) : x \\in A", [1, 2, 3, 4], "acc + x", (arr, fnStr) => {
        const fn = new Function("acc", "x", "return " + fnStr);
        return rReduce(arr, fn, 0);
    });

    // R_BUILD_MAP
    createSection(container, "R_BUILD_MAP (Association)", "M = \\{ k(x) \\to v(x) : x \\in A \\}", [{ id: 1, name: "Alpha" }, { id: 2, name: "Beta" }], "x => x.id", (arr, fnStr) => {
        const keyFn = new Function("x", "return (" + fnStr + ")(x)");
        const map = rBuildMap(arr, keyFn, (x) => x);
        return Array.from(map.entries());
    });

    // FIND_BY_FIELD
    createSection(container, "FIND_BY_FIELD (Lookup)", "\\exists x \\in A : x.field = v", [{ id: 10, val: "A" }, { id: 20, val: "B" }], "id: 20", (arr, input) => {
        const [field, val] = input.split(":").map(s => s.trim());
        const parsedVal = isNaN(val) ? val : parseFloat(val);
        return findByField(field, parsedVal, arr);
    });
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////// HELPER FUNCTIONS /////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////

function createSection(parent, title, mathDesc, defaultInput, defaultFn, logicFn) {
    const section = document.createElement("div");
    section.className = "spell-section";

    const header = document.createElement("h3");
    header.innerText = title;
    section.appendChild(header);

    const desc = document.createElement("div");
    desc.className = "math-lingo";
    desc.innerText = mathDesc;
    section.appendChild(desc);

    const inputGroup = document.createElement("div");
    inputGroup.className = "input-group";

    const labelInput = document.createElement("span");
    labelInput.innerText = "A = ";
    inputGroup.appendChild(labelInput);

    const inputField = document.createElement("input");
    inputField.type = "text";
    inputField.value = JSON.stringify(defaultInput);
    inputGroup.appendChild(inputField);

    const labelFn = document.createElement("span");
    labelFn.innerText = "f(x) = ";
    inputGroup.appendChild(labelFn);

    const fnField = document.createElement("input");
    fnField.type = "text";
    fnField.value = defaultFn;
    inputGroup.appendChild(fnField);

    const runBtn = document.createElement("button");
    runBtn.innerText = "INVOKE";
    inputGroup.appendChild(runBtn);

    section.appendChild(inputGroup);

    const outputLog = document.createElement("div");
    outputLog.className = "output-log";
    outputLog.innerText = "Awaiting incantation...";
    section.appendChild(outputLog);

    runBtn.onclick = () => {
        try {
            const arr = JSON.parse(inputField.value);
            const res = logicFn(arr, fnField.value);
            outputLog.innerText = `> Result:
${JSON.stringify(res, null, 2)}`;
            outputLog.style.color = "#00ff9d";
        } catch (e) {
            outputLog.innerText = `> Spell Failed: ${e.message}`;
            outputLog.style.color = "#ff0055";
        }
    };

    parent.appendChild(section);
}

setupExhibit();
