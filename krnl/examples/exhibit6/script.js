//////////////////////////////////////// CODE OVERVIEW ////////////////////////////////////////////
/**
 * @file script.js
 * @description Exhibit 6: Demonstrates Broadcast Functionalities.
 */

import { krnlEntityBase } from "../../core/K_ENT_Krnl_Entity_Base.js";

///////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////// MAIN API FUNCTIONS AND DATA //////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////

async function setupExhibit() {
    const container = document.getElementById("grimoire-container");
    const producer = new krnlEntityBase("DataProducer");
    const consumer = new krnlEntityBase("DataConsumer");

    let streamInstance = null;

    // STEP 1: DEFINE BROADCAST
    createSection(container, "Step 1: Define Broadcast", "\\Omega_{def} = \\text{define}(name, logic)", () => {
        producer.broadcastFunctionalities.define("SignalStream", (data) => {
            return {
                timestamp: Date.now(),
                payload: data,
                transformed: typeof data === 'string' ? data.toUpperCase() : data * 2
            };
        });
        return "Broadcast 'SignalStream' defined on Producer.";
    }, "DEFINE");

    // STEP 2: SPAWN INSTANCE
    createSection(container, "Step 2: Spawn Stream", "\\Omega_{inst} = \\text{createInstance}(\\Omega_{def}, caller)", () => {
        streamInstance = producer.broadcastFunctionalities.createInstance("SignalStream", "ConsumerEntity");
        return `Stream Instance: ${streamInstance.instanceName}\nOutput Emitter: ${streamInstance.output.name}`;
    }, "SPAWN");

    // STEP 3: SUBSCRIBE (COLLECT)
    createSection(container, "Step 3: Connect Collector", "\\Xi_{collect} = E_{cons}.\\text{interface.createCollector}(name).\\text{subscribeTo}(\\Omega_{inst}.output)", () => {
        if (!streamInstance) throw new Error("Spawn stream first!");

        const collector = consumer.interface.createCollector("StreamGatherer");
        
        // Correct wiring using subscribeTo
        collector.subscribeTo(streamInstance.output, (msg) => {
            const log = document.getElementById("stream-log");
            const entry = document.createElement("div");
            entry.innerText = `> RECEIVED: ${JSON.stringify(msg.data, null, 2)}`;
            entry.style.borderBottom = "1px solid rgba(58, 134, 255, 0.2)";
            entry.style.padding = "0.5rem 0";
            log.prepend(entry);
        });

        return "Consumer subscribed to Producer's stream.";
    }, "SUBSCRIBE");

    // STEP 4: PUSH DATA
    createPushSection(container, "Step 4: Push Stream Data", "\\text{push}(D) \\to \\Omega_{inst} \\to \\Xi_{collect}", (data) => {
        if (!streamInstance) throw new Error("Spawn stream first!");
        producer.broadcastFunctionalities.call(streamInstance.instanceName, data);
        return "Data pushed to stream.";
    }, "PUSH");
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

function createPushSection(parent, title, mathDesc, logicFn, btnText) {
    const section = document.createElement("div");
    section.className = "spell-section";
    section.innerHTML = `
        <h3>${title}</h3>
        <div class="math-lingo">${mathDesc}</div>
        <div class="input-group">
            <input type="text" id="push-input" value="Ether Wave 71">
            <button id="push-btn">${btnText}</button>
        </div>
        <div class="output-log" id="stream-log" style="max-height: 200px; overflow-y: auto;">Awaiting data flow...</div>
    `;
    parent.appendChild(section);

    const btn = section.querySelector("#push-btn");
    const input = section.querySelector("#push-input");
    const log = section.querySelector("#stream-log");

    btn.onclick = () => {
        try {
            const val = isNaN(parseFloat(input.value)) ? input.value : parseFloat(input.value);
            logicFn(val);
        } catch (e) {
            const entry = document.createElement("div");
            entry.innerText = `> ERROR: ${e.message}`;
            entry.style.color = "#ff0055";
            log.prepend(entry);
        }
    };
}

setupExhibit();
