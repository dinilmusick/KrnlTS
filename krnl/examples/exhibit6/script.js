//////////////////////////////////////// CODE OVERVIEW ////////////////////////////////////////////
/**
 * @file script.js
 * @description Exhibit 6: Demonstrates the new Functionality model with Emitters (replacing legacy Broadcast Functionalities).
 */

import { krnlEntityBase } from "../../core/K_ENT_Krnl_Entity_Base.js";
import { krnlCollector } from "../../core/K_LIB_Krnl_Messaging_Concepts.js";

async function setupExhibit() {
    const container = document.getElementById("grimoire-container");
    const producer = new krnlEntityBase("DataProducer");
    const consumer = new krnlEntityBase("DataConsumer");

    // STEP 1: DEFINE LOCAL FUNCTIONALITY WITH EMITTER
    createSection(container, "Step 1: Define Functionality with Emitter", "E.\\text{addLocal}({ emitters: { id: {} } })", () => {
        producer.addLocal({
            id: "SignalStream",
            emitters: { "dataOut": {} },
            api: (data, { emitters }) => {
                const payload = {
                    timestamp: Date.now(),
                    payload: data,
                    transformed: typeof data === 'string' ? data.toUpperCase() : data * 2
                };
                emitters.get("dataOut").pushDataStreamToEmitter(payload);
                return "Signal broadcasted.";
            }
        });
        return "Functionality 'SignalStream' with emitter 'dataOut' added to Producer.";
    }, "DEFINE");

    // STEP 2: CONNECT COLLECTOR TO FUNCTIONALITY EMITTER
    createSection(container, "Step 2: Connect Collector to Signal", "\\Xi_{collect} = E_{cons}.\\text{interface.createCollector}(name).\\text{subscribeTo}(\\Phi_{emit})", () => {
        const prodFunc = producer.getLocal("SignalStream");
        if (!prodFunc) throw new Error("Define functionality first!");

        const emitter = prodFunc.emitters.get("dataOut");
        const collector = new krnlCollector();
        
        collector.subscribeTo(emitter, (msg) => {
            const log = document.getElementById("stream-log");
            const entry = document.createElement("div");
            entry.innerText = `> RECEIVED: ${JSON.stringify(msg.data, null, 2)}`;
            entry.style.borderBottom = "1px solid rgba(58, 134, 255, 0.2)";
            entry.style.padding = "0.5rem 0";
            log.prepend(entry);
        });

        // Track collector for disposal in consumer (mock)
        consumer.collectors.add(collector);

        return "Consumer subscribed to Producer's 'SignalStream:dataOut' emitter.";
    }, "SUBSCRIBE");

    // STEP 3: PUSH DATA VIA API CALL
    createPushSection(container, "Step 3: Trigger Broadcast via Call", "E.\\text{call}(id, data) \\implies \\Omega_{emit}", (data) => {
        producer.call("SignalStream", data);
        return "API called, triggering broadcast.";
    }, "PUSH");
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
