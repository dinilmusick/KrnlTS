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
      fileLineLimitExceeded: "File has {{lines}} lines, which exceeds the strict Krnl limit of {{max}} lines. Decompose into sub-components, custom hooks, quad-units, or concept libraries."
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
      impureImport: "Helper functions (Layer 1) cannot import I/O or state module '{{module}}'. Delegate to Layer 0 libraries or ServiceFacade context."
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
      noPolling: "Prohibited use of '{{callee}}'. Krnl systems must use reactive events (facade.emitEvent / facade.on) instead of polling."
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
      description: "Prevent the { state, system } destructuring trap; require { state, facade } or { state, service } in functionality handlers.",
      recommended: true
    },
    messages: {
      destructureSystem: "Functionality context parameter destructures 'system'. Functionality passes { state, facade }. Destructure 'facade' or 'service'."
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
      let hasValidContext = false;
      for (const prop of ctxParam.properties) {
        if (prop.type === "Property" && prop.key.type === "Identifier") {
          if (prop.key.name === "system") hasSystem = true;
          if (["facade", "service", "orchestration"].includes(prop.key.name)) hasValidContext = true;
        }
      }
      if (hasSystem && !hasValidContext) {
        context.report({
          node: ctxParam,
          messageId: "destructureSystem"
        });
      }
    }
  }
}

// src/rules/top-level-purity.ts
var topLevelPurityRule = {
  meta: {
    type: "problem",
    docs: {
      description: "Enforce Top-Level File Purity: top-level files (App.tsx, main.ts, server.ts, etc.) must only import and compose components/modules without raw HTML/JSX markup, hooks, or route handlers.",
      recommended: true
    },
    messages: {
      topLevelRawMarkup: "Top-level file '{{filename}}' violates Top-Level Purity Law. Raw JSX/HTML tag '<{{tag}}>' is strictly forbidden. Top-level files must ONLY import and compose React components.",
      topLevelHook: "Top-level file '{{filename}}' violates Top-Level Purity Law. React hook '{{hook}}' is forbidden in top-level files. Encapsulate state and effects inside dedicated component files.",
      topLevelBackendRoute: "Backend entry file '{{filename}}' violates Entry Purity Law. Inline route definition '{{route}}' is forbidden. Delegate to dedicated route/controller modules."
    }
  },
  create(context) {
    const filename = context.filename || context.getFilename?.() || "";
    const normalized = filename.replace(/\\/g, "/");
    const baseName = normalized.split("/").pop() || "";
    const isUiTopLevel = /^(App|main|index|_app|root)\.(tsx|jsx)$/i.test(baseName);
    const isBackendTopLevel = /^(server|app|main|index)\.(ts|js)$/i.test(baseName) && (normalized.endsWith(`/${baseName}`) || normalized.includes("/src/") || !normalized.includes("/"));
    if (!isUiTopLevel && !isBackendTopLevel) return {};
    return {
      JSXOpeningElement(node) {
        if (!isUiTopLevel) return;
        const tagName = getTagName(node.name);
        if (tagName && /^[a-z]/.test(tagName)) {
          context.report({
            node,
            messageId: "topLevelRawMarkup",
            data: { filename: baseName, tag: tagName }
          });
        }
      },
      JSXSelfClosingElement(node) {
        if (!isUiTopLevel) return;
        const tagName = getTagName(node.name);
        if (tagName && /^[a-z]/.test(tagName)) {
          context.report({
            node,
            messageId: "topLevelRawMarkup",
            data: { filename: baseName, tag: tagName }
          });
        }
      },
      CallExpression(node) {
        if (isUiTopLevel) {
          let calleeName = "";
          if (node.callee.type === "Identifier") {
            calleeName = node.callee.name;
          } else if (node.callee.type === "MemberExpression" && node.callee.property.type === "Identifier") {
            calleeName = node.callee.property.name;
          }
          if (["useState", "useEffect", "useRef", "useMemo", "useCallback", "useReducer", "useContext", "useLayoutEffect"].includes(calleeName) || /^use[A-Z]/.test(calleeName) && calleeName !== "use") {
            context.report({
              node,
              messageId: "topLevelHook",
              data: { filename: baseName, hook: calleeName }
            });
          }
        }
        if (isBackendTopLevel) {
          if (node.callee.type === "MemberExpression") {
            const objName = node.callee.object.name || "";
            const propName = node.callee.property.name || "";
            const httpMethods = ["get", "post", "put", "delete", "patch", "options", "head"];
            if (["app", "router", "server"].includes(objName) && httpMethods.includes(propName.toLowerCase())) {
              context.report({
                node,
                messageId: "topLevelBackendRoute",
                data: { filename: baseName, route: `${objName}.${propName}` }
              });
            }
          }
        }
      }
    };
  }
};
function getTagName(nameNode) {
  if (!nameNode) return null;
  if (nameNode.type === "JSXIdentifier") return nameNode.name;
  if (nameNode.type === "JSXMemberExpression") return `${getTagName(nameNode.object)}.${nameNode.property.name}`;
  return null;
}

// src/rules/one-component-per-file.ts
var oneComponentPerFileRule = {
  meta: {
    type: "problem",
    docs: {
      description: "Enforce strictly one React component per file in .tsx/.jsx files.",
      recommended: true
    },
    messages: {
      multipleComponents: "File '{{filename}}' defines multiple React components ({{components}}). Krnl enforces strictly ONE component per file. Decompose into sub-component files."
    }
  },
  create(context) {
    const filename = context.filename || context.getFilename?.() || "";
    if (!filename.endsWith(".tsx") && !filename.endsWith(".jsx")) return {};
    const baseName = filename.replace(/\\/g, "/").split("/").pop() || "";
    const componentDeclarations = [];
    function hasJsx(node) {
      if (!node) return false;
      if (node.type === "JSXElement" || node.type === "JSXFragment") return true;
      if (node.type === "ReturnStatement") return hasJsx(node.argument);
      if (node.type === "BlockStatement") {
        return node.body.some((stmt) => hasJsx(stmt));
      }
      if (node.type === "IfStatement") {
        return hasJsx(node.consequent) || hasJsx(node.alternate);
      }
      return false;
    }
    return {
      FunctionDeclaration(node) {
        const name = node.id?.name;
        if (name && /^[A-Z]/.test(name) && hasJsx(node.body)) {
          componentDeclarations.push({ name, node });
        }
      },
      VariableDeclarator(node) {
        const name = node.id?.name;
        if (!name || !/^[A-Z]/.test(name)) return;
        const isFcType = node.id.typeAnnotation?.typeAnnotation?.typeName?.name === "FC" || node.id.typeAnnotation?.typeAnnotation?.typeName?.right?.name === "FC" || node.id.typeAnnotation?.typeAnnotation?.typeName?.right?.name === "FunctionComponent";
        if (node.init && (node.init.type === "ArrowFunctionExpression" || node.init.type === "FunctionExpression")) {
          if (isFcType || hasJsx(node.init.body)) {
            componentDeclarations.push({ name, node });
          }
        }
      },
      ClassDeclaration(node) {
        const name = node.id?.name;
        if (name && node.superClass) {
          const superName = node.superClass.name || node.superClass.property?.name;
          if (["Component", "PureComponent"].includes(superName)) {
            componentDeclarations.push({ name, node });
          }
        }
      },
      "Program:exit"() {
        if (componentDeclarations.length > 1) {
          const names = componentDeclarations.map((c) => c.name).join(", ");
          for (let i = 1; i < componentDeclarations.length; i++) {
            context.report({
              node: componentDeclarations[i].node,
              messageId: "multipleComponents",
              data: { filename: baseName, components: names }
            });
          }
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
  "top-level-purity": topLevelPurityRule,
  "one-component-per-file": oneComponentPerFileRule
};
var plugin = {
  meta: {
    name: "@ultrst-armada/eslint-plugin-krnl",
    version: "1.0.2"
  },
  rules,
  configs: {
    recommended: {
      plugins: {
        "@ultrst-armada/krnl": { rules }
      },
      rules: {
        "@ultrst-armada/krnl/file-line-limit": "error",
        "@ultrst-armada/krnl/import-suffix": "error",
        "@ultrst-armada/krnl/helper-purity": "error",
        "@ultrst-armada/krnl/no-polling": "error",
        "@ultrst-armada/krnl/context-destructuring": "error",
        "@ultrst-armada/krnl/top-level-purity": "error",
        "@ultrst-armada/krnl/one-component-per-file": "error"
      }
    }
  }
};
var index_default = plugin;
