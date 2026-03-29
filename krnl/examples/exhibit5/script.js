//////////////////////////////////////// CODE OVERVIEW ////////////////////////////////////////////
/**
 * @file script.js
 * @description Exhibit 5: Messaging and Functionality-based Events.
 */

import { krnlEntityBase } from "../../core/K_ENT_Krnl_Entity_Base.js";

function setupExhibit() {
    const container = document.getElementById("grimoire-container");

    const entity = new krnlEntityBase("Herald");

    // STEP 1: DEFINE FUNCTIONALITY WITH EMITTER
    createSection(container, "Step 1: Bind Logic with Events", "\\text{Emitters} = \\{ 'status': \\dots \\}", () => {
        entity.addLocal({
            id: "WeatherSystem",
            emitters: { "storm": {} },
            api: (input, { emitters }) => {
                emitters.get("storm").pushDataStreamToEmitter(`STORM_STRENGTH_${input}`);
                return "Event triggered.";
            }
        });
        return "Logic 'WeatherSystem' added with emitter 'storm'.";
    }, "BIND LOGIC");

    // STEP 2: SUBSCRIBE VIA INTERFACE
    createSection(container, "Step 2: Subscribe to Promoted Emitter", "E.\\text{interface}.\\text{getEmitter}(id:storm)", () => {
        // Events are promoted as "FunctionalityID:EmitterID"
        const emitter = entity.interface.getEmitter("WeatherSystem:storm");
        emitter.subscribe((msg) => {
            const log = document.getElementById("event-log");
            log.innerText += `\n> RECV: ${msg.data}`;
            log.scrollTop = log.scrollHeight;
        });
        return "Subscribed to 'WeatherSystem:storm'. Check log below.";
    }, "SUBSCRIBE");

    // STEP 3: TRIGGER EVENT
    createValueSection(container, "Step 3: Trigger Event", "E.\\text{call}('WeatherSystem', level)", async (level) => {
        await entity.call("WeatherSystem", level);
        return "Call executed.";
    });

    // Event Log Area
    const logArea = document.createElement("div");
    logArea.id = "event-log";
    logArea.className = "output-log";
    logArea.style.height = "150px";
    logArea.style.overflowY = "auto";
    logArea.innerText = "=== Event Stream ===";
    container.appendChild(logArea);
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
            <input type="number" placeholder="Storm Level" id="val-in">
            <button id="set-btn">TRIGGER</button>
        </div>
        <div class="output-log" id="val-log">Waiting...</div>
    `;
    parent.appendChild(section);

    const btn = section.querySelector("#set-btn");
    const sIn = section.querySelector("#val-in");
    const log = section.querySelector("#val-log");

    btn.onclick = async () => {
        const res = await logicFn(sIn.value);
        log.innerText = `> ${res}`;
        log.style.color = "#00ff9d";
    };
}

setupExhibit();
