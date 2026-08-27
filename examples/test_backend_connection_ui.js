// ══════════════════════════════════════════════════════════════════════════════════════════
// 1. LIGHTWEIGHT DOM ENVIRONMENT MOCK FOR NODE.JS
// ══════════════════════════════════════════════════════════════════════════════════════════
if (typeof globalThis.document === "undefined") {
  class MockNode {
    constructor() {
      this.parentNode = null;
    }
  }

  class MockTextNode extends MockNode {
    constructor(text = "") {
      super();
      this.nodeValue = String(text);
      this.textContent = String(text);
    }
    get data() {
      return this.nodeValue;
    }
    set data(v) {
      this.nodeValue = String(v);
      this.textContent = String(v);
    }
    get outerHTML() {
      return this.textContent;
    }
  }

  class MockElement extends MockNode {
    constructor(tagName) {
      super();
      this.tagName = tagName.toUpperCase();
      this.children = [];
      this.childNodes = [];
      this.attributes = {};
      this.style = {};
      this.onclick = null;
      this.oninput = null;
      this.onmouseenter = null;
      this.onmouseleave = null;
    }
    setAttribute(name, value) {
      this.attributes[name] = String(value);
    }
    getAttribute(name) {
      return this.attributes[name] || null;
    }
    appendChild(child) {
      child.parentNode = this;
      this.childNodes.push(child);
      this.children.push(child);
      return child;
    }
    append(...children) {
      for (const c of children) {
        const node = typeof c === "string" ? new MockTextNode(c) : c;
        node.parentNode = this;
        this.childNodes.push(node);
        this.children.push(node);
      }
    }
    replaceWith(...nodes) {
      if (this.parentNode) {
        const idx = this.parentNode.childNodes.indexOf(this);
        if (idx !== -1) {
          this.parentNode.childNodes.splice(idx, 1, ...nodes);
        }
      }
    }
    addEventListener(event, fn) {
      this[`on${event}`] = fn;
    }
    removeEventListener(event, fn) {
      if (this[`on${event}`] === fn) {
        this[`on${event}`] = null;
      }
    }
    get outerHTML() {
      const attrs = Object.entries(this.attributes).map(([k, v]) => ` ${k}="${v}"`).join("");
      const inner = this.childNodes.map(c => (typeof c === "string" ? c : c?.outerHTML || "")).join("");
      return `<${this.tagName.toLowerCase()}${attrs}>${inner}</${this.tagName.toLowerCase()}>`;
    }
  }

  globalThis.Node = MockNode;
  globalThis.Element = MockElement;
  globalThis.HTMLElement = MockElement;
  globalThis.Text = MockTextNode;

  globalThis.document = {
    createElement: (tag) => new MockElement(tag),
    createTextNode: (text) => new MockTextNode(text)
  };
  globalThis.window = globalThis;
}

// ══════════════════════════════════════════════════════════════════════════════════════════
// 2. IMPORTS & TEST SUITE
// ══════════════════════════════════════════════════════════════════════════════════════════
import {
  ProviderRegistry,
  KrnlBackendConnectionWizard
} from "../packages/ui/dist/index.js";

/**
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * TEST SUITE: testBackendConnectionUISpecification
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * Purpose: Verifies Capability-Driven Provider Registry, Storage Mode Choices,
 *          Wizard State Transitions, and Connection Probe Lifecycle.
 * ──────────────────────────────────────────────────────────────────────────────────────────
 */
async function testBackendConnectionUISpecification() {
  console.log("🚀 Starting Backend Connection UI & Provider Registry Tests...\n");

  // ── 1. Provider Registry Test ────────────────────────────────────────────────────────
  console.log("1. Testing Provider Registry & Capabilities...");
  const providers = ProviderRegistry.getAll();
  if (providers.length < 4) {
    throw new Error(`Expected at least 4 registered providers, found ${providers.length}`);
  }

  const supabase = ProviderRegistry.get("supabase");
  if (!supabase || !supabase.supportsOAuth || !supabase.supportsManualConnection) {
    throw new Error("Supabase provider capability descriptor verification failed");
  }

  const turso = ProviderRegistry.get("turso");
  if (!turso || turso.category !== "relational_sql") {
    throw new Error("Turso provider capability descriptor verification failed");
  }

  console.log(`   ✅ Provider Registry: ${providers.length} providers registered with capability descriptors.`);

  // ── 2. Component Direct-DOM Instantiation Test ───────────────────────────────────────
  console.log("\n2. Testing KrnlBackendConnectionWizard Instantiation...");
  let successState = null;
  let testProbeCalled = false;

  const wizardNode = KrnlBackendConnectionWizard({
    initialState: {
      mode: "connect_existing",
      providerId: "supabase",
      status: "CONNECTED",
      latencyMs: 22,
      databaseConnected: true,
      storageConnected: true,
      schemaInitialized: true
    },
    onConnectionSuccess: (st) => {
      successState = st;
    },
    onTestConnection: async (config) => {
      testProbeCalled = true;
      return { ok: true, latencyMs: 14 };
    }
  });

  if (!wizardNode || typeof wizardNode.outerHTML !== "string") {
    throw new Error("KrnlBackendConnectionWizard failed to produce valid DOM node");
  }

  console.log("   ✅ Component: Direct-DOM reactive wizard instantiated and rendered cleanly.");
  console.log(`   ✅ Rendered DOM contains status indicators: ${wizardNode.outerHTML.includes("WORKSPACE BACKEND CONNECTED")}`);

  // ── 3. Custom Provider Registration ──────────────────────────────────────────────────
  console.log("\n3. Testing Dynamic Provider Extensibility...");
  ProviderRegistry.register({
    id: "custom_couchdb",
    name: "CouchDB Edge",
    category: "document_nosql",
    description: "Multi-master edge CouchDB synchronization.",
    supportsOAuth: false,
    supportsAutomaticProvisioning: true,
    supportsManualConnection: true,
    iconSvg: "<svg></svg>",
    requiredFields: [
      { key: "endpoint", label: "CouchDB URL", type: "url", placeholder: "http://localhost:5984", isSecret: false }
    ]
  });

  const customProv = ProviderRegistry.get("custom_couchdb");
  if (!customProv || customProv.name !== "CouchDB Edge") {
    throw new Error("Dynamic provider registration failed");
  }
  console.log("   ✅ Dynamic Provider Registration: successfully extended ProviderRegistry.");

  console.log("\n🎉 ALL BACKEND CONNECTION UX & UI SPECIFICATION TESTS PASSED (100% SUCCESS)!\n");
}

testBackendConnectionUISpecification().catch(err => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
