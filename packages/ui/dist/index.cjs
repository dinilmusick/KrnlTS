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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  KrnlAgentBridge,
  KrnlAgentBridgeManager,
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
  getSharedSlot
});
