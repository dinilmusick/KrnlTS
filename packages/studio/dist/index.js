import {
  AstMutationEngine,
  FunctionExecutor,
  JsonRpcRouter,
  StudioFileWatcher,
  StudioServer
} from "./chunk-YRRHZKMV.js";

// src/client/plugins/VanJSRenderPlugin.ts
import van from "vanjs-core";
var { div, span, button } = van.tags;
function createVanJSRenderPlugin(options = {}) {
  return (area) => {
    area.addPipe((context) => {
      if (context.type === "render") {
        const { element } = context.data;
        if (context.data.type === "node") {
          const nodeData = context.data.data;
          const nodeType = nodeData.nodeType || "functionality";
          const nodeView = div(
            {
              class: `krnl-node krnl-node-${nodeType}`,
              style: `
                background: rgba(22, 22, 30, 0.95);
                border: 2px solid ${nodeType === "entity" ? "#d4af37" : "#4b5263"};
                border-radius: 10px;
                padding: 12px 16px;
                min-width: 220px;
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6), 0 0 12px ${nodeType === "entity" ? "rgba(212, 175, 55, 0.3)" : "transparent"};
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace;
                color: #f5ede4;
                position: relative;
                user-select: none;
              `,
              oncontextmenu: (e) => {
                e.preventDefault();
                if (options.onNodeContextMenu) {
                  options.onNodeContextMenu(nodeData.id, e);
                }
              }
            },
            div(
              { style: "font-size: 10px; text-transform: uppercase; color: #d4af37; font-weight: bold; margin-bottom: 4px;" },
              nodeType
            ),
            div(
              { style: "font-size: 15px; font-weight: bold; margin-bottom: 8px;" },
              nodeData.label || nodeData.name || "Unnamed Node"
            ),
            nodeData.filePath ? div(
              { style: "font-size: 9px; color: #7f848e; font-family: monospace; overflow: hidden; text-overflow: ellipsis;" },
              nodeData.filePath
            ) : null
          );
          element.replaceChildren(nodeView);
        }
      }
      return context;
    });
  };
}

// src/client/ui-builder/VanJSCodeGenerator.ts
var VanJSCodeGenerator = class {
  /**
   * Generates production-ready VanJS TypeScript source code from a component tree.
   */
  static generateCode(root, componentName = "GeneratedView") {
    const usedAtoms = /* @__PURE__ */ new Set();
    this.collectUsedAtoms(root, usedAtoms);
    const atomImports = Array.from(usedAtoms).filter((a) => a !== "Container" && a.startsWith("Krnl")).join(", ");
    let code = `import van from 'vanjs-core';
`;
    if (atomImports.length > 0) {
      code += `import { ${atomImports} } from '@dinilmusick/krnl-ui';
`;
    }
    code += `
`;
    code += `export function ${componentName}({ state, entity }: any): HTMLElement {
`;
    code += `  const { div } = van.tags;

`;
    code += `  return ${this.renderNodeToCode(root, 2)};
`;
    code += `}

`;
    code += `export default ${componentName};
`;
    return code;
  }
  static renderNodeToCode(node, indentLevel) {
    const indent = " ".repeat(indentLevel);
    const childIndent = " ".repeat(indentLevel + 2);
    if (node.type === "Container") {
      const childCode = (node.children || []).map((c) => this.renderNodeToCode(c, indentLevel + 2)).join(",\n");
      return `div(
${childIndent}{ class: '${node.props.class || "krnl-container"}' }${childCode ? `,
${childCode}` : ""}
${indent})`;
    }
    const propEntries = Object.entries(node.props).map(([k, v]) => {
      if (typeof v === "string" && (v.startsWith("state.") || v.startsWith("entity."))) {
        return `${k}: ${v}`;
      }
      if (k.startsWith("on") && typeof v === "string") {
        return `${k}: () => { ${v} }`;
      }
      return `${k}: ${JSON.stringify(v)}`;
    }).join(", ");
    return `${node.type}({ ${propEntries} })`;
  }
  static collectUsedAtoms(node, atoms) {
    atoms.add(node.type);
    if (node.children) {
      for (const c of node.children) {
        this.collectUsedAtoms(c, atoms);
      }
    }
  }
};
export {
  AstMutationEngine,
  FunctionExecutor,
  JsonRpcRouter,
  StudioFileWatcher,
  StudioServer,
  VanJSCodeGenerator,
  createVanJSRenderPlugin
};
