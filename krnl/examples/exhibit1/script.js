//////////////////////////////////////// CODE OVERVIEW ////////////////////////////////////////////
/**
 * @file script.js
 * @description Exhibit 1: Demonstrates Krnl Base Concepts, Enums, and Data Factories.
 */

import { krnlDataFactory, krnlPrimitiveDataTypes, krnlSystemTypes } from "../../core/K_LIB_Krnl_Base_Concepts.js";
import { createEnum } from "../../extensions/K_LIB_Krnl_Core_Function_Atoms.js";

///////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////// MAIN API FUNCTIONS AND DATA //////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////

function setupExhibit() {
    const container = document.getElementById("grimoire-container");

    // Enums
    createSection(container, "System Types Enum", "E_{sys} = \\{Qwnsr, Brnda, Symba, Mosy\\}", krnlSystemTypes);
    createSection(container, "Data Types Enum", "E_{data} = \\{Audio, Control, MIDI, \\dots\\}", krnlPrimitiveDataTypes);

    // Custom Enum Factory
    createEnumSection(container, "Dynamic Enum Creation", "E = \\text{createEnum}([s_1, s_2, \\dots, s_n])", ["FIRE", "WATER", "EARTH", "AIR"]);

    // Audio Factory
    createFactorySection(container, "Audio Stream Construction", "A = \\text{Factory.audio}(config)", {
        codec: "pcm16",
        sampleRate: 48000,
        channels: 2,
        extra: { bufferSize: 512 }
    }, (opts) => krnlDataFactory.audio(opts));

    // Control Factory
    createFactorySection(container, "Control Signal Construction", "C = \\text{Factory.control}(config)", {
        name: "MasterVolume",
        value: 0.75,
        curve: "logarithmic"
    }, (opts) => krnlDataFactory.control(opts));

    // MIDI Factory
    createFactorySection(container, "MIDI Message Construction", "M = \\text{Factory.midi}(config)", {
        status: 144,
        data1: 60,
        data2: 127,
        channel: 1
    }, (opts) => krnlDataFactory.midi(opts));

    // Text Factory
    createFactorySection(container, "Text Data Construction", "T = \\text{Factory.text}(config)", {
        text: "The seals are broken.",
        encoding: "utf-8",
        language: "en"
    }, (opts) => krnlDataFactory.text(opts));

    // Trigger Factory
    createFactorySection(container, "Trigger Event Construction", "E = \\text{Factory.trigger}(config)", {
        name: "ALARM_ACTIVATED",
        value: 1
    }, (opts) => krnlDataFactory.trigger(opts));
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////// HELPER FUNCTIONS /////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////

function createEnumSection(parent, title, mathDesc, defaultTypes) {
    const section = document.createElement("div");
    section.className = "spell-section";
    section.innerHTML = `
        <h3>${title}</h3>
        <div class="math-lingo">${mathDesc}</div>
        <div class="input-group">
            <input type="text" id="enum-input" value="${defaultTypes.join(', ')}">
            <button id="enum-btn">CREATE ENUM</button>
        </div>
        <pre class="output-log" id="enum-log">Awaiting types...</pre>
    `;
    parent.appendChild(section);

    const btn = section.querySelector("#enum-btn");
    const input = section.querySelector("#enum-input");
    const log = section.querySelector("#enum-log");

    btn.onclick = () => {
        try {
            const types = input.value.split(",").map(s => s.trim()).filter(s => s.length > 0);
            const res = createEnum(types);
            log.innerText = JSON.stringify(res, null, 2);
            log.style.color = "#00ff9d";
        } catch (e) {
            log.innerText = "Enum Creation Failed: " + e.message;
            log.style.color = "#ff0055";
        }
    };
}

function createSection(parent, title, mathDesc, data) {
    const section = document.createElement("div");
    section.className = "spell-section";
    section.innerHTML = `
        <h3>${title}</h3>
        <div class="math-lingo">${mathDesc}</div>
        <pre class="output-log">${JSON.stringify(data, null, 2)}</pre>
    `;
    parent.appendChild(section);
}

function createFactorySection(parent, title, mathDesc, defaultOpts, factoryFn) {
    const section = document.createElement("div");
    section.className = "spell-section";

    const header = document.createElement("h3");
    header.innerText = title;
    section.appendChild(header);

    const desc = document.createElement("div");
    desc.className = "math-lingo";
    desc.innerText = mathDesc;
    section.appendChild(desc);

    const input = document.createElement("textarea");
    input.className = "json-input";
    input.value = JSON.stringify(defaultOpts, null, 2);
    section.appendChild(input);

    const btn = document.createElement("button");
    btn.innerText = "Transmute";
    section.appendChild(btn);

    const output = document.createElement("div");
    output.className = "output-log";
    output.innerText = "Awaiting input...";
    section.appendChild(output);

    btn.onclick = () => {
        try {
            const opts = JSON.parse(input.value);
            const res = factoryFn(opts);
            output.innerText = JSON.stringify(res, null, 2);
            output.style.color = "#00ff9d";
        } catch (e) {
            output.innerText = "Transmutation Failed: " + e.message;
            output.style.color = "#ff0055";
        }
    };

    parent.appendChild(section);
}

setupExhibit();
