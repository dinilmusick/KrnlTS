//////////////////////////////////////// CODE OVERVIEW ////////////////////////////////////////////
/**
 * @file script.js
 * @description Exhibit 7: Demonstrates Decentralized Discovery and Wiring.
 */

import { DummySystemA } from "../dummySystems/DummySystemA.js";
import { DummySystemB } from "../dummySystems/DummySystemB.js";

async function setupExhibit() {
    const container = document.getElementById("grimoire-container");
    
    let systemA = null;
    let systemB = null;

    // STEP 1: INITIALIZE SYSTEMS
    createSection(container, "Step 1: Summon Systems", "\\Sigma = \\{ S_A, S_B \\}", async () => {
        systemA = new DummySystemA("AlphaProducer", 11001);
        systemB = new DummySystemB("BetaConsumer", 11002);
        
        // Start Discovery for both
        await systemA.startDiscovery(10101);
        await systemB.startDiscovery(10101);

        return `Systems manifested and searching...\nAlpha @ 11001\nBeta @ 11002`;
    }, "SUMMON");

    // STEP 2: DISCOVERY
    createSection(container, "Step 2: Inspect Peers", "P = S_A.\\text{listPeers}()", () => {
        if (!systemA) throw new Error("Summon systems first!");
        const peers = systemA.listPeers();
        return `Discovered Peers:\n${JSON.stringify(peers, null, 2)}`;
    }, "SCAN");

    // STEP 3: WIRE SYSTEMS
    createSection(container, "Step 3: Decentralized Wiring", "S_A.\\text{wire}(S_B, \\dots)", async () => {
        if (!systemA || !systemB) throw new Error("Summon systems first!");
        
        // Wait a moment for discovery to catch up in the UI demo
        const peers = systemA.listPeers();
        const betaPeer = peers.find(p => p.name === "BetaConsumer");
        
        if (!betaPeer) throw new Error("BetaConsumer not yet discovered by Alpha.");

        // We wire Alpha's output to Beta's input
        await systemA.wire("BetaConsumer", {
            localOutput: "A-Events",
            remoteInput: "B-Commands"
        });

        // Add a manual log handler for the demo UI
        const collector = systemB.interface.getCollector("B-Commands");
        collector._directHandler = (msg) => {
            const log = document.getElementById("orch-log");
            const entry = document.createElement("div");
            entry.innerHTML = `<span style="color: #ff9e00;">[B-CONSUMED]</span> Received: <strong>${JSON.stringify(msg.data)}</strong>`;
            entry.style.borderBottom = "1px solid rgba(255, 158, 0, 0.2)";
            entry.style.padding = "0.5rem 0";
            log.prepend(entry);
        };

        return "Alpha:A-Events wired to Beta:B-Commands via decentralized wire() call.";
    }, "WIRE");

    // STEP 4: PUBLISH EVENT
    createPushSection(container, "Step 4: Orchestrate Data Flow", "S_A.\\text{publish}(D) \\implies S_B.\\text{receive}(D)", (data) => {
        if (!systemA) throw new Error("Summon systems first!");
        systemA.publishEvent(data);
        return "Event published from Alpha.";
    }, "PUBLISH");
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

    btn.onclick = async () => {
        try {
            log.innerText = "> Executing rite...";
            const res = await logicFn();
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
            <input type="text" id="push-input" value="Decentralized Signal">
            <button id="push-btn">${btnText}</button>
        </div>
        <div class="output-log" id="orch-log" style="max-height: 250px; overflow-y: auto;">Awaiting orchestration...</div>
    `;
    parent.appendChild(section);

    const btn = section.querySelector("#push-btn");
    const input = section.querySelector("#push-input");
    const log = section.querySelector("#orch-log");

    btn.onclick = () => {
        try {
            const val = input.value;
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
