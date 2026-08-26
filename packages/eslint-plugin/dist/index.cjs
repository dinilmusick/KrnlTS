"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  default: () => index_default
});
module.exports = __toCommonJS(index_exports);

// src/rules/file-line-limit.ts
var fileLineLimitRule = {
  meta: {
    type: "problem",
    docs: {
      description: "Enforce max 200 lines per file for Krnl codebases.",
      recommended: true
    },
    schema: [
      {
        type: "object",
        properties: {
          max: { type: "number", default: 200 }
        },
        additionalProperties: false
      }
    ],
    messages: {
      fileLineLimitExceeded: "File has {{lines}} lines, which exceeds the strict Krnl limit of {{max}} lines. Decompose into quad-units or concept libraries."
    }
  },
  create(context) {
    const max = context.options[0]?.max ?? 200;
    const sourceCode = context.sourceCode || context.getSourceCode();
    const lines = sourceCode.lines.length;
    return {
      Program(node) {
        if (lines > max) {
          context.report({
            node,
            messageId: "fileLineLimitExceeded",
            data: { lines, max }
          });
        }
      }
    };
  }
};

// src/rules/import-suffix.ts
var importSuffixRule = {
  meta: {
    type: "problem",
    docs: {
      description: "Enforce .js extension on relative imports for NodeNext compatibility.",
      recommended: true
    },
    fixable: "code",
    messages: {
      missingSuffix: "Relative import '{{path}}' must end with '.js' or '.json' for NodeNext resolution."
    }
  },
  create(context) {
    return {
      ImportDeclaration(node) {
        const value = node.source.value;
        if (typeof value === "string" && value.startsWith(".")) {
          if (!value.endsWith(".js") && !value.endsWith(".json") && !value.endsWith(".css")) {
            context.report({
              node: node.source,
              messageId: "missingSuffix",
              data: { path: value },
              fix(fixer) {
                return fixer.replaceText(node.source, `'${value}.js'`);
              }
            });
          }
        }
      }
    };
  }
};

// src/rules/helper-purity.ts
var helperPurityRule = {
  meta: {
    type: "problem",
    docs: {
      description: "Enforce Layer 1 helper purity: helper functions cannot import state or I/O modules directly.",
      recommended: true
    },
    messages: {
      impureImport: "Helper functions (Layer 1) cannot import I/O or state module '{{module}}'. Delegate to Layer 0 libraries or Entity context."
    }
  },
  create(context) {
    const filename = context.filename || context.getFilename?.() || "";
    const isHelper = filename.includes("helper_functions") || filename.includes("/helpers/");
    if (!isHelper) return {};
    return {
      ImportDeclaration(node) {
        const source = node.source.value;
        if (["fs", "node:fs", "http", "node:http", "ws"].includes(source) || /state(\.js)?$/.test(source)) {
          context.report({
            node,
            messageId: "impureImport",
            data: { module: source }
          });
        }
      }
    };
  }
};

// src/rules/no-polling.ts
var noPollingRule = {
  meta: {
    type: "problem",
    docs: {
      description: "Prohibit setInterval and polling in favor of reactive event streams.",
      recommended: true
    },
    messages: {
      noPolling: "Prohibited use of '{{callee}}'. Krnl systems must use reactive events (entity.emitEvent / entity.on) instead of polling."
    }
  },
  create(context) {
    return {
      CallExpression(node) {
        let calleeName = "";
        if (node.callee.type === "Identifier") {
          calleeName = node.callee.name;
        } else if (node.callee.type === "MemberExpression" && node.callee.property.type === "Identifier") {
          calleeName = node.callee.property.name;
        }
        if (calleeName === "setInterval") {
          context.report({
            node,
            messageId: "noPolling",
            data: { callee: calleeName }
          });
        }
      }
    };
  }
};

// src/rules/context-destructuring.ts
var contextDestructuringRule = {
  meta: {
    type: "problem",
    docs: {
      description: "Prevent the { state, system } destructuring trap; require { state, entity } in functionality handlers.",
      recommended: true
    },
    messages: {
      destructureSystem: "Functionality context parameter destructures 'system'. Functionality passes { state, entity }. Always destructure 'entity'."
    }
  },
  create(context) {
    return {
      FunctionDeclaration(node) {
        checkParams(node, context);
      },
      ArrowFunctionExpression(node) {
        checkParams(node, context);
      },
      FunctionExpression(node) {
        checkParams(node, context);
      }
    };
  }
};
function checkParams(node, context) {
  if (node.params && node.params.length >= 2) {
    const ctxParam = node.params[1];
    if (ctxParam && ctxParam.type === "ObjectPattern") {
      let hasSystem = false;
      let hasEntity = false;
      for (const prop of ctxParam.properties) {
        if (prop.type === "Property" && prop.key.type === "Identifier") {
          if (prop.key.name === "system") hasSystem = true;
          if (prop.key.name === "entity") hasEntity = true;
        }
      }
      if (hasSystem && !hasEntity) {
        context.report({
          node: ctxParam,
          messageId: "destructureSystem"
        });
      }
    }
  }
}

// src/rules/no-server-in-subapp.ts
var noServerInSubappRule = {
  meta: {
    type: "problem",
    docs: {
      description: "Sub-apps must not instantiate HTTP or WebSocket servers directly; Krnl handles network ingress.",
      recommended: true
    },
    messages: {
      noServer: "Sub-apps must NEVER start HTTP/WebSocket servers directly ('{{callee}}'). Krnl provides unified network ingress."
    }
  },
  create(context) {
    const filename = context.filename || context.getFilename?.() || "";
    const isSubApp = filename.includes("subapps/") || filename.includes("subapp");
    if (!isSubApp) return {};
    return {
      CallExpression(node) {
        let calleeText = "";
        if (node.callee.type === "MemberExpression") {
          const obj = node.callee.object.name || "";
          const prop = node.callee.property.name || "";
          calleeText = `${obj}.${prop}`;
        }
        if (["http.createServer", "https.createServer", "app.listen", "server.listen"].includes(calleeText)) {
          context.report({
            node,
            messageId: "noServer",
            data: { callee: calleeText }
          });
        }
      }
    };
  }
};

// src/index.ts
var rules = {
  "file-line-limit": fileLineLimitRule,
  "import-suffix": importSuffixRule,
  "helper-purity": helperPurityRule,
  "no-polling": noPollingRule,
  "context-destructuring": contextDestructuringRule,
  "no-server-in-subapp": noServerInSubappRule
};
var plugin = {
  meta: {
    name: "@dinilmusick/eslint-plugin-krnl",
    version: "1.0.0"
  },
  rules,
  configs: {
    recommended: {
      plugins: {
        "@dinilmusick/krnl": { rules }
      },
      rules: {
        "@dinilmusick/krnl/file-line-limit": "error",
        "@dinilmusick/krnl/import-suffix": "error",
        "@dinilmusick/krnl/helper-purity": "error",
        "@dinilmusick/krnl/no-polling": "error",
        "@dinilmusick/krnl/context-destructuring": "error",
        "@dinilmusick/krnl/no-server-in-subapp": "error"
      }
    }
  }
};
var index_default = plugin;
