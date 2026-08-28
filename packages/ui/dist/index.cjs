"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  KrnlAgentBridge: () => KrnlAgentBridge,
  KrnlAgentBridgeManager: () => KrnlAgentBridgeManager,
  KrnlBackendConnectionWizard: () => KrnlBackendConnectionWizard,
  KrnlButton: () => KrnlButton,
  KrnlDock: () => KrnlDock,
  KrnlDropdown: () => KrnlDropdown,
  KrnlJsonViewer: () => KrnlJsonViewer,
  KrnlMonacoEditor: () => KrnlMonacoEditor,
  KrnlReactiveBridge: () => KrnlReactiveBridge,
  KrnlTextArea: () => KrnlTextArea,
  KrnlTextInput: () => KrnlTextInput,
  KrnlTile: () => KrnlTile,
  KrnlTooltip: () => KrnlTooltip,
  KrnlWorkspaceSelector: () => KrnlWorkspaceSelector,
  KrnlWorkspaceStorageSettings: () => KrnlWorkspaceStorageSettings,
  KrnlWorkspaceTile: () => KrnlWorkspaceTile,
  ProviderRegistry: () => ProviderRegistry,
  getSharedSlot: () => getSharedSlot
});
module.exports = __toCommonJS(index_exports);

// src/atoms/KrnlButton.ts
var import_vanjs_core = __toESM(require("vanjs-core"), 1);
var { button, span, div } = import_vanjs_core.default.tags;
function KrnlButton({
  variant = "primary",
  tooltipLabel = "Execute Action",
  icon = "\u26A1",
  loading = false,
  disabled = false,
  type = "button",
  tooltipPosition = "bottom",
  onclick
}) {
  const isLoading = typeof loading === "object" && "val" in loading ? loading : import_vanjs_core.default.state(loading);
  const isDisabled = typeof disabled === "object" && "val" in disabled ? disabled : import_vanjs_core.default.state(disabled);
  const btnProps = {
    type,
    class: () => `krnl-btn-icon-only krnl-btn-${variant}`,
    disabled: () => isDisabled.val || isLoading.val,
    "aria-label": tooltipLabel
  };
  if (onclick) {
    btnProps.onclick = onclick;
  }
  return div(
    { style: "position: relative; display: inline-flex;" },
    button(
      btnProps,
      span({ class: "krnl-btn-icon" }, () => isLoading.val ? "\u23F3" : icon),
      span(
        { class: `krnl-tooltip krnl-tooltip-${tooltipPosition}` },
        () => isLoading.val ? "Processing..." : tooltipLabel
      )
    )
  );
}

// src/atoms/KrnlTextInput.ts
var import_vanjs_core2 = __toESM(require("vanjs-core"), 1);
var { div: div2, label: labelTag, input } = import_vanjs_core2.default.tags;
function KrnlTextInput({
  label: labelText,
  value,
  placeholder = "",
  onChange,
  required = false,
  type = "text"
}) {
  const valState = typeof value === "object" && "val" in value ? value : import_vanjs_core2.default.state(value || "");
  const inputProps = {
    class: "krnl-input",
    type,
    placeholder,
    value: () => valState.val,
    required: !!required,
    oninput: (e) => {
      const newV = e.target.value;
      valState.val = newV;
      if (onChange) onChange(newV);
    }
  };
  return div2(
    { class: "krnl-form-group" },
    labelText ? labelTag({ class: "krnl-label" }, labelText, required ? " *" : "") : null,
    input(inputProps)
  );
}

// src/atoms/KrnlDropdown.ts
var import_vanjs_core3 = __toESM(require("vanjs-core"), 1);
var { div: div3, label: labelTag2, select, option } = import_vanjs_core3.default.tags;
function KrnlDropdown({
  label: labelText,
  value,
  options = [],
  onChange,
  required = false
}) {
  const optionsState = typeof options === "object" && "val" in options ? options : import_vanjs_core3.default.state(options);
  const valState = typeof value === "object" && "val" in value ? value : import_vanjs_core3.default.state(value || "");
  const normOptions = () => {
    const raw = optionsState.val || [];
    return (Array.isArray(raw) ? raw : []).map((opt) => {
      if (typeof opt === "string") return { label: opt, value: opt };
      if (typeof opt === "number") return { label: String(opt), value: String(opt) };
      if (opt && typeof opt === "object") {
        const v = opt.value !== void 0 ? opt.value : opt.name !== void 0 ? opt.name : opt.id !== void 0 ? opt.id : opt.key !== void 0 ? opt.key : JSON.stringify(opt);
        const l = opt.label !== void 0 ? opt.label : opt.displayName !== void 0 ? opt.displayName : opt.name !== void 0 ? opt.name : opt.id !== void 0 ? opt.id : v;
        return { label: String(l), value: String(v) };
      }
      return { label: String(opt), value: String(opt) };
    });
  };
  import_vanjs_core3.default.derive(() => {
    const opts2 = normOptions();
    if (!valState.val && opts2.length > 0 && opts2[0].value) {
      valState.val = opts2[0].value;
      if (onChange) onChange(opts2[0].value);
    }
  });
  const selectProps = {
    class: "krnl-input krnl-select",
    value: () => valState.val,
    required: !!required,
    onchange: (e) => {
      const newV = e.target.value;
      valState.val = newV;
      if (onChange) onChange(newV);
    }
  };
  const opts = normOptions();
  const optionNodes = opts.length === 0 ? [option({ value: "", disabled: true, selected: true }, "Select option...")] : opts.map((opt) => option({ value: opt.value, selected: opt.value === valState.val }, opt.label));
  return div3(
    { class: "krnl-form-group" },
    labelText ? labelTag2({ class: "krnl-label" }, labelText, required ? " *" : "") : null,
    select(selectProps, ...optionNodes)
  );
}

// src/atoms/KrnlTextArea.ts
var import_vanjs_core4 = __toESM(require("vanjs-core"), 1);
var { div: div4, label: labelTag3, textarea } = import_vanjs_core4.default.tags;
function KrnlTextArea({
  label: labelText,
  value,
  placeholder = "",
  onChange,
  rows = 4
}) {
  const valState = typeof value === "object" && "val" in value ? value : import_vanjs_core4.default.state(value || "");
  return div4(
    { class: "krnl-form-group" },
    labelText ? labelTag3({ class: "krnl-label" }, labelText) : null,
    textarea({
      class: "krnl-input krnl-textarea",
      rows,
      placeholder,
      value: () => valState.val,
      oninput: (e) => {
        const newV = e.target.value;
        valState.val = newV;
        if (onChange) onChange(newV);
      }
    })
  );
}

// src/atoms/KrnlTile.ts
var import_vanjs_core5 = __toESM(require("vanjs-core"), 1);
var { div: div5, span: span2 } = import_vanjs_core5.default.tags;
function KrnlTile({ label: labelText, value, subtitle }) {
  const valState = typeof value === "object" && "val" in value ? value : import_vanjs_core5.default.state(value);
  return div5(
    { class: "krnl-tile" },
    labelText ? span2({ class: "krnl-tile-title" }, labelText) : null,
    span2({ class: "krnl-tile-value" }, () => {
      const v = valState.val;
      if (typeof v === "object") return JSON.stringify(v);
      return String(v !== void 0 && v !== null ? v : "\u2014");
    }),
    subtitle ? span2({ class: "krnl-tile-subtitle" }, subtitle) : null
  );
}

// src/atoms/KrnlJsonViewer.ts
var import_vanjs_core6 = __toESM(require("vanjs-core"), 1);
var { div: div6, h4, pre, code } = import_vanjs_core6.default.tags;
function KrnlJsonViewer({ label: labelText, data }) {
  const dataState = typeof data === "object" && "val" in data ? data : import_vanjs_core6.default.state(data);
  return div6(
    { class: "krnl-json-viewer" },
    labelText ? h4({ style: "margin-bottom: 0.5rem; color: var(--krnl-accent);" }, labelText) : null,
    pre(
      { class: "krnl-json-code" },
      code(() => JSON.stringify(dataState.val, null, 2))
    )
  );
}

// src/atoms/KrnlDock.ts
var import_vanjs_core8 = __toESM(require("vanjs-core"), 1);

// src/atoms/KrnlTooltip.ts
var import_vanjs_core7 = __toESM(require("vanjs-core"), 1);
function KrnlTooltip({ text, placement = "auto", children }) {
  const { div: div7, span: span3 } = import_vanjs_core7.default.tags;
  const isVisible = import_vanjs_core7.default.state(false);
  const calculatedPlacement = import_vanjs_core7.default.state(placement);
  const wrapper = div7(
    {
      class: "krnl-tooltip-wrapper",
      style: "position: relative; display: inline-flex;",
      onmouseenter: (e) => {
        const target = e.currentTarget;
        const rect = target.getBoundingClientRect();
        if (placement === "auto") {
          calculatedPlacement.val = rect.top < 80 ? "bottom" : "top";
        } else {
          calculatedPlacement.val = placement;
        }
        isVisible.val = true;
      },
      onmouseleave: () => {
        isVisible.val = false;
      }
    },
    Array.isArray(children) ? children : [children],
    () => {
      if (!isVisible.val) return span3({ style: "display: none;" });
      let positionStyle = "position: absolute; z-index: 9999; white-space: nowrap; pointer-events: none;";
      if (calculatedPlacement.val === "bottom") {
        positionStyle += " top: calc(100% + 6px); left: 50%; transform: translateX(-50%);";
      } else if (calculatedPlacement.val === "top") {
        positionStyle += " bottom: calc(100% + 6px); left: 50%; transform: translateX(-50%);";
      } else if (calculatedPlacement.val === "left") {
        positionStyle += " right: calc(100% + 6px); top: 50%; transform: translateY(-50%);";
      } else {
        positionStyle += " left: calc(100% + 6px); top: 50%; transform: translateY(-50%);";
      }
      return div7(
        {
          class: "krnl-tooltip-content",
          style: `${positionStyle} background: rgba(18, 18, 18, 0.95); color: #e5c07b; border: 1px solid #d4af37; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-family: monospace; box-shadow: 0 4px 12px rgba(0,0,0,0.5);`
        },
        text
      );
    }
  );
  return wrapper;
}

// src/atoms/KrnlDock.ts
function KrnlDock({ items, position = "bottom", className = "" }) {
  const { div: div7, button: button2, span: span3 } = import_vanjs_core8.default.tags;
  const activeId = import_vanjs_core8.default.state(items.find((i) => i.active)?.id || items[0]?.id || "");
  const dockStyle = `
    position: fixed;
    ${position === "bottom" ? "bottom: 16px; left: 50%; transform: translateX(-50%); flex-direction: row;" : ""}
    ${position === "top" ? "top: 16px; left: 50%; transform: translateX(-50%); flex-direction: row;" : ""}
    ${position === "left" ? "left: 16px; top: 50%; transform: translateY(-50%); flex-direction: column;" : ""}
    ${position === "right" ? "right: 16px; top: 50%; transform: translateY(-50%); flex-direction: column;" : ""}
    display: flex;
    gap: 8px;
    padding: 8px 12px;
    background: rgba(24, 24, 28, 0.85);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(212, 175, 55, 0.3);
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6), 0 0 10px rgba(212, 175, 55, 0.15);
    z-index: 9000;
  `;
  return div7(
    { class: `krnl-dock krnl-dock-${position} ${className}`, style: dockStyle },
    items.map((item) => {
      const isItemActive = () => activeId.val === item.id;
      const btn = button2(
        {
          class: "krnl-dock-item",
          style: () => `
            display: flex;
            align-items: center;
            justify-content: center;
            width: 44px;
            height: 44px;
            border-radius: 10px;
            background: ${isItemActive() ? "rgba(212, 175, 55, 0.25)" : "rgba(255, 255, 255, 0.05)"};
            border: 1px solid ${isItemActive() ? "#d4af37" : "rgba(255, 255, 255, 0.1)"};
            color: ${isItemActive() ? "#d4af37" : "#e0e0e0"};
            cursor: pointer;
            transition: all 0.15s ease;
            position: relative;
          `,
          onclick: () => {
            activeId.val = item.id;
            item.onClick();
          }
        },
        typeof item.icon === "string" ? span3({ style: "font-size: 20px;" }, item.icon) : item.icon,
        item.badge ? span3(
          {
            style: "position: absolute; top: -4px; right: -4px; background: #e06c75; color: white; border-radius: 8px; font-size: 10px; padding: 2px 5px; font-weight: bold;"
          },
          String(item.badge)
        ) : null
      );
      return KrnlTooltip({
        text: item.label,
        placement: position === "top" ? "bottom" : "top",
        children: btn
      });
    })
  );
}

// src/atoms/KrnlAgentBridge.ts
var KrnlAgentBridgeManager = class {
  states = /* @__PURE__ */ new Map();
  registrations = /* @__PURE__ */ new Map();
  listeners = /* @__PURE__ */ new Set();
  ws = null;
  constructor() {
    if (typeof window !== "undefined") {
      window.__krnlBridge = this;
      this.initWebSocket();
    }
  }
  initWebSocket() {
    if (typeof window === "undefined" || typeof WebSocket === "undefined") return;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) return;
    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/agent/ws`;
      this.ws = new WebSocket(wsUrl);
      this.ws.onopen = () => {
        this.sendFullSnapshot();
        this.sendReadySignal();
      };
      this.ws.onmessage = async (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.action === "trigger" && msg.fid) {
            const ticketId = msg.ticketId || msg.id;
            await this.trigger(msg.fid, msg.input, ticketId);
          } else if (msg.action === "query") {
            this.sendFullSnapshot();
            this.sendReadySignal();
          }
        } catch (e) {
          console.error("[KrnlAgentBridge] Error handling WS message:", e);
        }
      };
      this.ws.onclose = () => {
        this.ws = null;
        setTimeout(() => this.initWebSocket(), 2e3);
      };
      this.ws.onerror = () => {
        if (this.ws) {
          this.ws.close();
        }
      };
    } catch (e) {
      console.warn("[KrnlAgentBridge] WebSocket connection error:", e);
    }
  }
  register(fid, reg) {
    this.registrations.set(fid, reg);
    this.sendComponentReady(fid);
  }
  unregister(fid) {
    this.registrations.delete(fid);
    this.sendComponentUnready(fid);
  }
  setState(fid, state) {
    this.states.set(fid, state);
    this.notifyListeners();
    this.sendFullSnapshot();
  }
  getState(fid) {
    if (fid) {
      return this.states.get(fid) || null;
    }
    return Object.fromEntries(this.states.entries());
  }
  async trigger(fid, overrideInput, ticketId) {
    const reg = this.registrations.get(fid);
    if (!reg) {
      if (ticketId) {
        this.sendJobComplete(ticketId, fid, null, `[KrnlAgentBridge] Component '${fid}' is not mounted.`);
      }
      throw new Error(`[KrnlAgentBridge] Endpoint component '${fid}' is not mounted in the UI.`);
    }
    return await reg.trigger(overrideInput, ticketId);
  }
  sendJobComplete(ticketId, fid, result, error) {
    const payload = {
      type: "job_complete",
      ticketId,
      fid,
      result: result !== void 0 ? result : null,
      error: error || null
    };
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
      return;
    }
    if (typeof window !== "undefined") {
      const sendHttpAck = (attempt = 0) => {
        fetch("/agent/job_complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ticketId,
            fid,
            result: result !== void 0 ? result : null,
            error: error || null
          })
        }).catch((err) => {
          console.error("[KrnlAgentBridge] Failed to post job_complete ACK (attempt " + (attempt + 1) + "):", err);
          if (attempt < 2) {
            setTimeout(() => sendHttpAck(attempt + 1), 500);
          }
        });
      };
      sendHttpAck();
    }
  }
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  notifyListeners() {
    const snapshot = Object.fromEntries(this.states.entries());
    this.listeners.forEach((fn) => {
      try {
        fn(snapshot);
      } catch (e) {
      }
    });
  }
  sendComponentReady(fid) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: "component_ready", fid }));
    }
  }
  sendComponentUnready(fid) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: "component_unready", fid }));
    }
  }
  sendReadySignal() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const fids = Array.from(this.registrations.keys());
      this.ws.send(JSON.stringify({ type: "component_ready_all", fids }));
    }
  }
  sendFullSnapshot() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const snapshot = Object.fromEntries(this.states.entries());
      this.ws.send(JSON.stringify({ type: "state", snapshot }));
    }
  }
};
var KrnlAgentBridge = new KrnlAgentBridgeManager();

// src/atoms/KrnlReactive.ts
var import_vanjs_core9 = __toESM(require("vanjs-core"), 1);
var KrnlReactiveBridge = class {
  static states = /* @__PURE__ */ new Map();
  /**
   * Retrieves or creates a reactive VanJS state bound to an Entity state key.
   */
  static useEntityState(key, initialValue) {
    if (!this.states.has(key)) {
      this.states.set(key, import_vanjs_core9.default.state(initialValue));
    }
    return this.states.get(key);
  }
  /**
   * Synchronizes an Entity event emission with a reactive state.
   */
  static syncEvent(state, eventPayload) {
    state.val = eventPayload;
  }
  /**
   * Binds a DOM input element directly to a reactive state (two-way binding with zero VDOM).
   */
  static bindInput(state) {
    return {
      value: () => state.val,
      oninput: (e) => {
        state.val = e.target.value;
      }
    };
  }
};

// src/atoms/KrnlSharedState.ts
var import_vanjs_core10 = __toESM(require("vanjs-core"), 1);
var slotRegistry = /* @__PURE__ */ new Map();
function getSharedSlot(id) {
  if (!id) {
    return {
      options: import_vanjs_core10.default.state([]),
      value: import_vanjs_core10.default.state(null)
    };
  }
  if (!slotRegistry.has(id)) {
    slotRegistry.set(id, {
      options: import_vanjs_core10.default.state([]),
      value: import_vanjs_core10.default.state(null)
    });
  }
  return slotRegistry.get(id);
}

// src/atoms/KrnlMonacoEditor.ts
var import_vanjs_core11 = __toESM(require("vanjs-core"), 1);
function KrnlMonacoEditor(props = {}) {
  const container = import_vanjs_core11.default.tags.div({
    class: `krnl-monaco-wrapper ${props.class || ""}`,
    style: `
      width: ${props.width || "100%"};
      height: ${props.height || "100%"};
      min-height: 120px;
      border: 1px solid rgba(212, 175, 55, 0.25);
      border-radius: 8px;
      overflow: hidden;
      background: #16161e;
      position: relative;
      ${props.style || ""}
    `
  });
  queueMicrotask(() => {
    const win = window;
    const initialVal = typeof props.value === "object" && props.value !== null && "val" in props.value ? props.value.val : props.value || "";
    const initEditor = () => {
      if (!win.monaco) return;
      try {
        win.monaco.editor.defineTheme("krnl-dark", {
          base: "vs-dark",
          inherit: true,
          rules: [
            { token: "keyword", foreground: "d4af37", fontStyle: "bold" },
            { token: "string", foreground: "98c379" },
            { token: "number", foreground: "d19a66" },
            { token: "comment", foreground: "5c6370", fontStyle: "italic" },
            { token: "type", foreground: "e5c07b" },
            { token: "identifier", foreground: "f5ede4" }
          ],
          colors: {
            "editor.background": "#16161e",
            "editor.foreground": "#f5ede4",
            "editor.lineHighlightBackground": "#1f1f2a",
            "editorLineNumber.foreground": "#5c6370",
            "editorLineNumber.activeForeground": "#d4af37",
            "editorCursor.foreground": "#d4af37",
            "editor.selectionBackground": "#2d3139",
            "editorWidget.background": "#16161e",
            "editorWidget.border": "#d4af37"
          }
        });
      } catch (e) {
      }
      const editor = win.monaco.editor.create(container, {
        value: initialVal,
        language: props.language || "typescript",
        theme: props.theme || "krnl-dark",
        readOnly: props.readOnly ?? false,
        automaticLayout: true,
        fontSize: 12,
        fontFamily: 'Fira Code, Menlo, Monaco, "Courier New", monospace',
        lineNumbers: props.lineNumbers || "on",
        minimap: { enabled: props.minimap ?? false },
        scrollBeyondLastLine: false,
        renderLineHighlight: "all",
        tabSize: 2
      });
      if (props.onChange) {
        editor.onDidChangeModelContent(() => {
          props.onChange(editor.getValue());
        });
      }
      if (typeof props.value === "object" && props.value !== null && "val" in props.value) {
        import_vanjs_core11.default.derive(() => {
          const currentVal = props.value.val;
          if (editor.getValue() !== currentVal) {
            editor.setValue(currentVal);
          }
        });
      }
      container.__monacoEditor = editor;
    };
    if (win.monaco) {
      initEditor();
    } else if (win.require) {
      win.require(["vs/editor/editor.main"], initEditor);
    }
  });
  return container;
}

// src/atoms/KrnlBackendConnectionWizard.ts
var import_vanjs_core12 = __toESM(require("vanjs-core"), 1);
var ProviderRegistry = class {
  static providers = /* @__PURE__ */ new Map();
  static {
    this.register({
      id: "supabase",
      name: "Supabase",
      category: "relational_sql",
      description: "Cloud PostgreSQL database, PostgREST API, and S3-compatible file storage.",
      supportsOAuth: true,
      supportsAutomaticProvisioning: false,
      supportsManualConnection: true,
      iconSvg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M21.362 9.354H12V.396a.396.396 0 0 0-.716-.233L2.203 12.424l-.19.243a.475.475 0 0 0 .375.769H12v8.958a.396.396 0 0 0 .716.233l9.081-12.261.19-.243a.475.475 0 0 0-.375-.769z"/></svg>`,
      requiredFields: [
        { key: "endpoint", label: "Project URL", type: "url", placeholder: "https://xxxx.supabase.co", isSecret: false, required: true },
        { key: "clientKey", label: "Public / Anon Key", type: "password", placeholder: "eyJhbGciOi...", isSecret: true, required: true }
      ]
    });
    this.register({
      id: "turso",
      name: "Turso (LibSQL)",
      category: "relational_sql",
      description: "Edge-distributed SQLite over low-latency HTTP pipeline.",
      supportsOAuth: false,
      supportsAutomaticProvisioning: false,
      supportsManualConnection: true,
      iconSvg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`,
      requiredFields: [
        { key: "endpoint", label: "Database URL", type: "url", placeholder: "https://my-db.turso.io", isSecret: false, required: true },
        { key: "clientKey", label: "Auth Token", type: "password", placeholder: "eyJhbG...", isSecret: true, required: true }
      ]
    });
    this.register({
      id: "pocketbase",
      name: "PocketBase",
      category: "embedded_baas",
      description: "Self-hosted embedded SQLite backend with collections and file store.",
      supportsOAuth: false,
      supportsAutomaticProvisioning: false,
      supportsManualConnection: true,
      iconSvg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>`,
      requiredFields: [
        { key: "endpoint", label: "Server URL", type: "url", placeholder: "http://127.0.0.1:8090", isSecret: false, required: true }
      ]
    });
    this.register({
      id: "postgres",
      name: "PostgreSQL",
      category: "relational_sql",
      description: "Direct connection to a managed or self-hosted PostgreSQL database.",
      supportsOAuth: false,
      supportsAutomaticProvisioning: false,
      supportsManualConnection: true,
      iconSvg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>`,
      requiredFields: [
        { key: "endpoint", label: "Connection URI", type: "url", placeholder: "postgresql://user:pass@host:5432/db", isSecret: true, required: true }
      ]
    });
    this.register({
      id: "mongodb",
      name: "MongoDB Atlas",
      category: "document_nosql",
      description: "Serverless document database via MongoDB Data API.",
      supportsOAuth: false,
      supportsAutomaticProvisioning: false,
      supportsManualConnection: true,
      iconSvg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
      requiredFields: [
        { key: "endpoint", label: "Data API Endpoint", type: "url", placeholder: "https://data.mongodb-api.com/app/...", isSecret: false, required: true },
        { key: "clientKey", label: "API Key", type: "password", placeholder: "...", isSecret: true, required: true }
      ]
    });
  }
  static register(descriptor) {
    this.providers.set(descriptor.id, descriptor);
  }
  static getAll() {
    return Array.from(this.providers.values());
  }
  static get(id) {
    return this.providers.get(id);
  }
};
function KrnlBackendConnectionWizard(props = {}) {
  const { div: div7, h3, p, input: input2, span: span3 } = import_vanjs_core12.default.tags;
  const currentStep = import_vanjs_core12.default.state(
    props.initialState?.status === "CONNECTED" ? "READY" : "SELECT_STORAGE_MODE"
  );
  const selectedMode = import_vanjs_core12.default.state(props.initialState?.mode || "local");
  const selectedProviderId = import_vanjs_core12.default.state(props.initialState?.providerId || "supabase");
  const formValues = import_vanjs_core12.default.state({
    endpoint: props.initialState?.endpoint || "",
    clientKey: props.initialState?.clientKey || ""
  });
  const latency = import_vanjs_core12.default.state(props.initialState?.latencyMs || 0);
  const statusMessage = import_vanjs_core12.default.state(props.initialState?.errorMessage || "");
  const isProbeRunning = import_vanjs_core12.default.state(false);
  const dbConnected = import_vanjs_core12.default.state(props.initialState?.databaseConnected ?? true);
  const storageConnected = import_vanjs_core12.default.state(props.initialState?.storageConnected ?? true);
  const schemaReady = import_vanjs_core12.default.state(props.initialState?.schemaInitialized ?? true);
  const handleSelectLocal = () => {
    selectedMode.val = "local";
    dbConnected.val = true;
    storageConnected.val = true;
    schemaReady.val = true;
    currentStep.val = "READY";
    props.onConnectionSuccess?.({
      mode: "local",
      status: "CONNECTED",
      databaseConnected: true,
      storageConnected: true,
      schemaInitialized: true
    });
  };
  const handleSelectConnectExisting = () => {
    selectedMode.val = "connect_existing";
    currentStep.val = "SELECT_PROVIDER";
  };
  const handleSelectProvider = (providerId) => {
    selectedProviderId.val = providerId;
    currentStep.val = "AUTHENTICATING";
  };
  const handleRunConnectionTest = async () => {
    isProbeRunning.val = true;
    currentStep.val = "VERIFYING";
    if (props.onTestConnection) {
      try {
        const result = await props.onTestConnection(formValues.val);
        latency.val = result.latencyMs;
        if (result.ok) {
          dbConnected.val = true;
          storageConnected.val = true;
          schemaReady.val = true;
          currentStep.val = "INITIALIZING";
          setTimeout(() => {
            currentStep.val = "READY";
            props.onConnectionSuccess?.({
              mode: "connect_existing",
              providerId: selectedProviderId.val,
              endpoint: formValues.val.endpoint,
              clientKey: formValues.val.clientKey,
              status: "CONNECTED",
              latencyMs: latency.val,
              databaseConnected: true,
              storageConnected: true,
              schemaInitialized: true
            });
          }, 400);
        } else {
          statusMessage.val = result.errorMessage || "Connection failed. Verify endpoint and credentials.";
          currentStep.val = "CONNECTION_ERROR";
        }
      } catch (err) {
        statusMessage.val = err.message || "Network error occurred during probe.";
        currentStep.val = "CONNECTION_ERROR";
      } finally {
        isProbeRunning.val = false;
      }
    } else {
      setTimeout(() => {
        latency.val = 18;
        dbConnected.val = true;
        storageConnected.val = true;
        schemaReady.val = true;
        currentStep.val = "READY";
        isProbeRunning.val = false;
        props.onConnectionSuccess?.({
          mode: "connect_existing",
          providerId: selectedProviderId.val,
          endpoint: formValues.val.endpoint,
          status: "CONNECTED",
          latencyMs: 18,
          databaseConnected: true,
          storageConnected: true,
          schemaInitialized: true
        });
      }, 500);
    }
  };
  const handleDisconnect = () => {
    currentStep.val = "SELECT_STORAGE_MODE";
    props.onDisconnect?.();
  };
  return div7(
    {
      class: "krnl-backend-wizard",
      style: `
        display: flex;
        flex-direction: column;
        gap: 16px;
        background: var(--krnl-bg-surface, #141416);
        border: 1px solid var(--krnl-border, #2a2a2e);
        border-radius: var(--krnl-radius, 6px);
        padding: 20px;
        box-shadow: 0 0 16px var(--krnl-accent-glow, rgba(212,163,89,0.15)), 2px 2px 0px var(--krnl-border, #2a2a2e);
      `
    },
    // Step 1: Storage Mode Selection (Where should your data live?)
    () => {
      if (currentStep.val !== "SELECT_STORAGE_MODE") return div7();
      return div7(
        { style: "display: flex; flex-direction: column; gap: 14px;" },
        h3({ style: "margin: 0; font-size: 16px; font-weight: 700;" }, "WHERE SHOULD YOUR DATA LIVE?"),
        // Option A: Local
        div7(
          {
            class: "krnl-storage-card",
            style: `
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: 14px;
              border: 1px solid var(--krnl-border, #2a2a2e);
              border-radius: var(--krnl-radius, 6px);
              background: var(--krnl-bg-primary, #0c0c0e);
              cursor: pointer;
              transition: all 0.15s ease;
            `,
            onclick: handleSelectLocal
          },
          div7(
            { style: "display: flex; flex-direction: column; gap: 4px;" },
            span3({ style: "font-weight: 600; font-size: 14px;" }, "\u{1F4BB} Local (Zero-Cloud)"),
            span3({ style: "font-size: 12px; color: var(--krnl-text-muted, #8e8e93);" }, "SQLite + Local Storage \u2022 Offline-first \u2022 100% Private")
          ),
          KrnlButton({
            icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>`,
            tooltipLabel: "Select Local SQLite storage",
            onclick: handleSelectLocal
          })
        ),
        // Option B: Connect Existing (BYOB)
        div7(
          {
            class: "krnl-storage-card",
            style: `
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: 14px;
              border: 1px solid var(--krnl-border, #2a2a2e);
              border-radius: var(--krnl-radius, 6px);
              background: var(--krnl-bg-primary, #0c0c0e);
              cursor: pointer;
              transition: all 0.15s ease;
            `,
            onclick: handleSelectConnectExisting
          },
          div7(
            { style: "display: flex; flex-direction: column; gap: 4px;" },
            span3({ style: "font-weight: 600; font-size: 14px;" }, "\u{1F517} Connect Backend (BYOB)"),
            span3({ style: "font-size: 12px; color: var(--krnl-text-muted, #8e8e93);" }, "Supabase, Turso, PocketBase, PostgreSQL, MongoDB")
          ),
          KrnlButton({
            icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>`,
            tooltipLabel: "Connect your existing infrastructure",
            onclick: handleSelectConnectExisting
          })
        ),
        // Option C: Managed Cloud (Coming Soon)
        div7(
          {
            style: `
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: 14px;
              border: 1px dashed var(--krnl-border, #2a2a2e);
              border-radius: var(--krnl-radius, 6px);
              opacity: 0.6;
            `
          },
          div7(
            { style: "display: flex; flex-direction: column; gap: 4px;" },
            span3({ style: "font-weight: 600; font-size: 14px;" }, "\u2601\uFE0F Managed Cloud"),
            span3({ style: "font-size: 12px; color: var(--krnl-text-muted, #8e8e93);" }, "Automated high-availability cluster (Available soon)")
          ),
          span3({ style: "font-size: 11px; padding: 2px 8px; border-radius: 4px; background: #222;" }, "SOON")
        )
      );
    },
    // Step 2: Provider Selection Grid
    () => {
      if (currentStep.val !== "SELECT_PROVIDER") return div7();
      const providers = ProviderRegistry.getAll();
      return div7(
        { style: "display: flex; flex-direction: column; gap: 14px;" },
        div7(
          { style: "display: flex; align-items: center; justify-content: space-between;" },
          h3({ style: "margin: 0; font-size: 16px; font-weight: 700;" }, "CHOOSE YOUR PROVIDER"),
          KrnlButton({
            icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>`,
            tooltipLabel: "Back to storage choices",
            onclick: () => {
              currentStep.val = "SELECT_STORAGE_MODE";
            }
          })
        ),
        div7(
          { style: "display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 10px;" },
          ...providers.map(
            (p2) => div7(
              {
                class: "krnl-provider-card",
                style: `
                  display: flex;
                  flex-direction: column;
                  gap: 8px;
                  padding: 12px;
                  border: 1px solid var(--krnl-border, #2a2a2e);
                  border-radius: var(--krnl-radius, 6px);
                  background: var(--krnl-bg-primary, #0c0c0e);
                  cursor: pointer;
                  transition: all 0.15s ease;
                `,
                onclick: () => handleSelectProvider(p2.id)
              },
              div7(
                { style: "display: flex; align-items: center; justify-content: space-between;" },
                span3({ style: "font-weight: 600; font-size: 13px;" }, p2.name),
                KrnlButton({
                  icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>`,
                  tooltipLabel: `Connect ${p2.name}`,
                  onclick: () => handleSelectProvider(p2.id)
                })
              ),
              span3({ style: "font-size: 11px; color: var(--krnl-text-muted, #8e8e93);" }, p2.category)
            )
          )
        )
      );
    },
    // Step 3: Guided Configuration & Verification Form
    () => {
      if (currentStep.val !== "AUTHENTICATING" && currentStep.val !== "VERIFYING" && currentStep.val !== "CONNECTION_ERROR") {
        return div7();
      }
      const provider = ProviderRegistry.get(selectedProviderId.val);
      if (!provider) return div7();
      return div7(
        { style: "display: flex; flex-direction: column; gap: 14px;" },
        div7(
          { style: "display: flex; align-items: center; justify-content: space-between;" },
          h3({ style: "margin: 0; font-size: 16px; font-weight: 700;" }, `CONNECT ${provider.name.toUpperCase()}`),
          KrnlButton({
            icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>`,
            tooltipLabel: "Back to provider selection",
            onclick: () => {
              currentStep.val = "SELECT_PROVIDER";
            }
          })
        ),
        ...provider.requiredFields.map(
          (field) => div7(
            { style: "display: flex; flex-direction: column; gap: 6px;" },
            span3({ style: "font-size: 12px; font-weight: 600; color: var(--krnl-text-muted, #8e8e93);" }, field.label),
            input2({
              type: field.type,
              placeholder: field.placeholder,
              value: formValues.val[field.key] || "",
              style: `
                padding: 10px;
                border: 1px solid var(--krnl-border, #2a2a2e);
                border-radius: var(--krnl-radius, 6px);
                background: var(--krnl-bg-primary, #0c0c0e);
                color: var(--krnl-text-primary, #ffffff);
                font-size: 13px;
                font-family: inherit;
              `,
              oninput: (e) => {
                formValues.val = { ...formValues.val, [field.key]: e.target.value };
              }
            })
          )
        ),
        // Error message banner
        () => {
          if (currentStep.val !== "CONNECTION_ERROR") return div7();
          return div7(
            {
              style: "padding: 8px 12px; border-radius: 4px; background: rgba(239, 68, 68, 0.15); border: 1px solid #ef4444; color: #ef4444; font-size: 12px;"
            },
            statusMessage.val
          );
        },
        // Action Toolbar
        div7(
          { style: "display: flex; align-items: center; justify-content: flex-end; gap: 8px; margin-top: 6px;" },
          KrnlButton({
            icon: isProbeRunning.val ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/></svg>` : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>`,
            tooltipLabel: isProbeRunning.val ? "Testing live connection..." : "Test Connection & Connect",
            onclick: handleRunConnectionTest
          })
        )
      );
    },
    // Step 4: Ready State & Workspace Settings Status Card
    () => {
      if (currentStep.val !== "READY") return div7();
      return div7(
        { style: "display: flex; flex-direction: column; gap: 14px;" },
        div7(
          { style: "display: flex; align-items: center; justify-content: space-between;" },
          div7(
            { style: "display: flex; align-items: center; gap: 8px;" },
            span3({ style: "display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #22c55e; box-shadow: 0 0 8px #22c55e;" }),
            span3({ style: "font-weight: 700; font-size: 14px;" }, "WORKSPACE BACKEND CONNECTED")
          ),
          div7(
            { style: "display: flex; align-items: center; gap: 6px;" },
            KrnlButton({
              icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>`,
              tooltipLabel: "Test Live Connection Latency",
              onclick: handleRunConnectionTest
            }),
            KrnlButton({
              icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
              tooltipLabel: "Reconfigure Backend Connection",
              onclick: () => {
                currentStep.val = "SELECT_PROVIDER";
              }
            }),
            KrnlButton({
              icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18.36 6.64a9 9 0 1 1-12.73 0M12 2v10"/></svg>`,
              tooltipLabel: "Disconnect backend (keeps remote data intact)",
              onclick: handleDisconnect
            })
          )
        ),
        // Health checklist
        div7(
          {
            class: "krnl-status-checklist",
            style: "display: flex; flex-direction: column; gap: 8px; padding: 12px; background: var(--krnl-bg-primary, #0c0c0e); border-radius: var(--krnl-radius, 6px); border: 1px solid var(--krnl-border, #2a2a2e);"
          },
          div7(
            { style: "display: flex; align-items: center; justify-content: space-between; font-size: 13px;" },
            span3({ style: "color: var(--krnl-text-muted, #8e8e93);" }, "Database Engine:"),
            span3({ style: "color: #22c55e; font-weight: 600;" }, `\u2713 Connected ${latency.val > 0 ? `(${latency.val}ms)` : ""}`)
          ),
          div7(
            { style: "display: flex; align-items: center; justify-content: space-between; font-size: 13px;" },
            span3({ style: "color: var(--krnl-text-muted, #8e8e93);" }, "Object / File Storage:"),
            span3({ style: "color: #22c55e; font-weight: 600;" }, "\u2713 Ready")
          ),
          div7(
            { style: "display: flex; align-items: center; justify-content: space-between; font-size: 13px;" },
            span3({ style: "color: var(--krnl-text-muted, #8e8e93);" }, "Domain Schemas:"),
            span3({ style: "color: #22c55e; font-weight: 600;" }, "\u2713 Initialized")
          )
        )
      );
    }
  );
}

// src/atoms/KrnlWorkspaceTile.ts
var import_vanjs_core13 = __toESM(require("vanjs-core"), 1);
function KrnlWorkspaceTile({
  id,
  name,
  icon = "\u{1F4C1}",
  primaryProvider,
  backupProviders = [],
  syncStatus = "SYNCED",
  onSelectWorkspace,
  onOpenSettings
}) {
  const { div: div7, span: span3 } = import_vanjs_core13.default.tags;
  const getStatusColor = () => {
    switch (syncStatus) {
      case "SYNCED":
        return "#22c55e";
      case "SYNCING":
        return "#eab308";
      case "OUT_OF_SYNC":
        return "#f97316";
      case "ERROR":
        return "#ef4444";
      default:
        return "#8e8e93";
    }
  };
  const backupsText = backupProviders.length > 0 ? `+ ${backupProviders.join(", ")}` : "No backups";
  return div7(
    {
      class: "krnl-workspace-tile",
      style: `
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding: 16px;
        background: var(--krnl-bg-surface, #141416);
        border: 1px solid var(--krnl-border, #2a2a2e);
        border-radius: var(--krnl-radius, 6px);
        min-width: 200px;
        height: 140px;
        cursor: pointer;
        transition: all 0.15s ease;
        box-shadow: 2px 2px 0px var(--krnl-border, #2a2a2e);
      `,
      onclick: () => onSelectWorkspace?.(id)
    },
    // Header Row: Icon, Name & Action Button
    div7(
      { style: "display: flex; align-items: flex-start; justify-content: space-between; gap: 8px;" },
      div7(
        { style: "display: flex; align-items: center; gap: 8px;" },
        span3({ style: "font-size: 20px;" }, icon),
        span3({ style: "font-weight: 700; font-size: 14px; color: var(--krnl-text-primary, #ffffff);" }, name)
      ),
      KrnlButton({
        icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
        tooltipLabel: `Manage storage for ${name}`,
        onclick: (e) => {
          e.stopPropagation();
          onOpenSettings?.(id);
        }
      })
    ),
    // Footer Row: Storage Provider Summary & Status Pill
    div7(
      { style: "display: flex; flex-direction: column; gap: 4px;" },
      div7(
        { style: "display: flex; align-items: center; justify-content: space-between; font-size: 12px;" },
        span3({ style: "font-weight: 600; color: var(--krnl-accent, #d4a359);" }, `Primary: ${primaryProvider}`),
        div7(
          { style: "display: flex; align-items: center; gap: 4px;" },
          span3({ style: `width: 6px; height: 6px; border-radius: 50%; background: ${getStatusColor()}; display: inline-block;` }),
          span3({ style: `font-size: 10px; font-weight: 700; color: ${getStatusColor()};` }, syncStatus)
        )
      ),
      span3({ style: "font-size: 11px; color: var(--krnl-text-muted, #8e8e93);" }, backupsText)
    )
  );
}

// src/atoms/KrnlWorkspaceSelector.ts
var import_vanjs_core14 = __toESM(require("vanjs-core"), 1);
function KrnlWorkspaceSelector({
  workspaces = [],
  workspaceOrder = [],
  onSelectWorkspace,
  onOpenSettings,
  onCreateWorkspace
}) {
  const { div: div7, h2, span: span3 } = import_vanjs_core14.default.tags;
  const sortedWorkspaces = [...workspaces].sort((a, b) => {
    const idxA = workspaceOrder.indexOf(a.id);
    const idxB = workspaceOrder.indexOf(b.id);
    if (idxA === -1 && idxB === -1) return 0;
    if (idxA === -1) return 1;
    if (idxB === -1) return -1;
    return idxA - idxB;
  });
  return div7(
    {
      class: "krnl-workspace-selector",
      style: `
        display: flex;
        flex-direction: column;
        gap: 20px;
        padding: 24px;
        background: var(--krnl-bg-primary, #0c0c0e);
        min-height: 100%;
      `
    },
    // Header Toolbar
    div7(
      { style: "display: flex; align-items: center; justify-content: space-between;" },
      h2({ style: "margin: 0; font-size: 18px; font-weight: 700; color: var(--krnl-text-primary, #ffffff);" }, "WORKSPACES"),
      KrnlButton({
        icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
        tooltipLabel: "Create new workspace",
        onclick: () => onCreateWorkspace?.()
      })
    ),
    // Grid Container
    div7(
      {
        style: `
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 16px;
        `
      },
      ...sortedWorkspaces.map(
        (w) => KrnlWorkspaceTile({
          id: w.id,
          name: w.name,
          icon: w.icon || "\u{1F4C1}",
          primaryProvider: w.primaryStorage.provider,
          backupProviders: (w.backupStorages || []).map((b) => b.provider),
          syncStatus: w.primaryStorage.syncState || "SYNCED",
          onSelectWorkspace,
          onOpenSettings
        })
      ),
      // + New Workspace Card
      div7(
        {
          class: "krnl-new-workspace-card",
          style: `
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 10px;
            padding: 16px;
            background: var(--krnl-bg-surface, #141416);
            border: 1px dashed var(--krnl-border, #2a2a2e);
            border-radius: var(--krnl-radius, 6px);
            min-width: 200px;
            height: 140px;
            cursor: pointer;
            transition: all 0.15s ease;
          `,
          onclick: () => onCreateWorkspace?.()
        },
        KrnlButton({
          icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
          tooltipLabel: "Add new project workspace",
          onclick: () => onCreateWorkspace?.()
        }),
        span3({ style: "font-weight: 600; font-size: 13px; color: var(--krnl-text-muted, #8e8e93);" }, "+ NEW WORKSPACE")
      )
    )
  );
}

// src/atoms/KrnlWorkspaceStorageSettings.ts
var import_vanjs_core15 = __toESM(require("vanjs-core"), 1);
function KrnlWorkspaceStorageSettings({
  workspace,
  onTestConnection,
  onChangePrimary,
  onDetachStorage
}) {
  const { div: div7, h3, h4: h42, span: span3 } = import_vanjs_core15.default.tags;
  const latency = import_vanjs_core15.default.state(0);
  const isProbing = import_vanjs_core15.default.state(false);
  const handleProbe = async (endpointId) => {
    isProbing.val = true;
    try {
      if (onTestConnection) {
        const res = await onTestConnection(endpointId);
        latency.val = res.latencyMs;
      } else {
        setTimeout(() => {
          latency.val = 16;
          isProbing.val = false;
        }, 300);
      }
    } finally {
      isProbing.val = false;
    }
  };
  return div7(
    {
      class: "krnl-workspace-storage-settings",
      style: `
        display: flex;
        flex-direction: column;
        gap: 20px;
        padding: 20px;
        background: var(--krnl-bg-surface, #141416);
        border: 1px solid var(--krnl-border, #2a2a2e);
        border-radius: var(--krnl-radius, 6px);
      `
    },
    // Header
    div7(
      { style: "display: flex; align-items: center; justify-content: space-between;" },
      h3({ style: "margin: 0; font-size: 16px; font-weight: 700;" }, `STORAGE SETTINGS: ${workspace.name.toUpperCase()}`),
      div7(
        { style: "display: flex; align-items: center; gap: 8px;" },
        span3({ style: "display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #22c55e;" }),
        span3({ style: "font-size: 12px; font-weight: 600; color: #22c55e;" }, "ACTIVE")
      )
    ),
    // Primary Storage Section
    div7(
      { style: "display: flex; flex-direction: column; gap: 10px;" },
      h42({ style: "margin: 0; font-size: 13px; color: var(--krnl-text-muted, #8e8e93);" }, "PRIMARY STORAGE (CANONICAL)"),
      div7(
        {
          style: `
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 14px;
            background: var(--krnl-bg-primary, #0c0c0e);
            border: 1px solid var(--krnl-border, #2a2a2e);
            border-radius: var(--krnl-radius, 6px);
          `
        },
        div7(
          { style: "display: flex; flex-direction: column; gap: 4px;" },
          span3({ style: "font-weight: 700; font-size: 14px;" }, workspace.primaryStorage.provider.toUpperCase()),
          span3({ style: "font-size: 11px; color: var(--krnl-text-muted, #8e8e93);" }, `Endpoint ID: ${workspace.primaryStorage.id}`)
        ),
        div7(
          { style: "display: flex; align-items: center; gap: 8px;" },
          () => latency.val > 0 ? span3({ style: "font-size: 12px; color: #22c55e; font-weight: 600;" }, `${latency.val}ms`) : span3(),
          KrnlButton({
            icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>`,
            tooltipLabel: "Test connection probe",
            onclick: () => handleProbe(workspace.primaryStorage.id)
          })
        )
      )
    ),
    // Backup Storages Section
    div7(
      { style: "display: flex; flex-direction: column; gap: 10px;" },
      div7(
        { style: "display: flex; align-items: center; justify-content: space-between;" },
        h42({ style: "margin: 0; font-size: 13px; color: var(--krnl-text-muted, #8e8e93);" }, "BACKUP STORAGES (REPLICAS)"),
        span3({ style: "font-size: 11px; color: var(--krnl-text-muted, #8e8e93);" }, `${workspace.backupStorages.length} active backup(s)`)
      ),
      ...workspace.backupStorages.map(
        (b) => div7(
          {
            style: `
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: 12px;
              background: var(--krnl-bg-primary, #0c0c0e);
              border: 1px solid var(--krnl-border, #2a2a2e);
              border-radius: var(--krnl-radius, 6px);
            `
          },
          div7(
            { style: "display: flex; align-items: center; gap: 8px;" },
            span3({ style: "font-size: 12px; font-weight: 600;" }, `\u2611 ${b.provider.toUpperCase()}`),
            span3({ style: "font-size: 10px; padding: 2px 6px; border-radius: 4px; background: #1a1a1e; color: #22c55e;" }, b.syncState || "SYNCED")
          ),
          div7(
            { style: "display: flex; align-items: center; gap: 6px;" },
            KrnlButton({
              icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>`,
              tooltipLabel: `Promote ${b.provider} to Primary Storage`,
              onclick: () => onChangePrimary?.(b.id)
            }),
            KrnlButton({
              icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18.36 6.64a9 9 0 1 1-12.73 0M12 2v10"/></svg>`,
              tooltipLabel: `Detach ${b.provider} (preserves remote data)`,
              onclick: () => onDetachStorage?.(b.id)
            })
          )
        )
      )
    ),
    // Sync Configuration Info Pill
    div7(
      {
        style: `
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          background: var(--krnl-bg-primary, #0c0c0e);
          border: 1px solid var(--krnl-border, #2a2a2e);
          border-radius: var(--krnl-radius, 6px);
          font-size: 12px;
        `
      },
      span3({ style: "color: var(--krnl-text-muted, #8e8e93);" }, "Sync Strategy:"),
      span3({ style: "font-weight: 600; color: var(--krnl-accent, #d4a359);" }, `${workspace.sync?.mode ? workspace.sync.mode.toUpperCase() : "ON_WRITE"} (${workspace.sync?.conflictStrategy || "primary_wins"})`)
    )
  );
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  KrnlAgentBridge,
  KrnlAgentBridgeManager,
  KrnlBackendConnectionWizard,
  KrnlButton,
  KrnlDock,
  KrnlDropdown,
  KrnlJsonViewer,
  KrnlMonacoEditor,
  KrnlReactiveBridge,
  KrnlTextArea,
  KrnlTextInput,
  KrnlTile,
  KrnlTooltip,
  KrnlWorkspaceSelector,
  KrnlWorkspaceStorageSettings,
  KrnlWorkspaceTile,
  ProviderRegistry,
  getSharedSlot
});
