#!/usr/bin/env node
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
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

// src/bin/krnl.ts
var path13 = __toESM(require("path"), 1);
var fs12 = __toESM(require("fs"), 1);

// ../validate/dist/index.js
var fs2 = __toESM(require("fs"), 1);
var path3 = __toESM(require("path"), 1);
var import_ts_morph = require("ts-morph");
var path = __toESM(require("path"), 1);
var import_ts_morph2 = require("ts-morph");
var import_ts_morph3 = require("ts-morph");
var fs = __toESM(require("fs"), 1);
var path2 = __toESM(require("path"), 1);
var import_ts_morph4 = require("ts-morph");
var import_ts_morph5 = require("ts-morph");
function checkFileLimits(sf, options) {
  const errors = [];
  const warnings = [];
  const filePath = sf.getFilePath();
  const sourceText = sf.getFullText();
  const lines = sourceText.split("\n");
  if (lines.length > options.maxFileLineLimit) {
    errors.push({
      ruleId: "krnl/file-line-limit",
      filePath,
      message: `File exceeds maximum length of ${options.maxFileLineLimit} lines (currently ${lines.length} lines). Decompose into sub-components, custom hooks, quad-units, or concept libraries.`,
      severity: "error"
    });
  }
  for (const decl of sf.getImportDeclarations()) {
    const moduleSpec = decl.getModuleSpecifierValue();
    if (moduleSpec.startsWith(".") && !moduleSpec.endsWith(".js") && !moduleSpec.endsWith(".json") && !moduleSpec.endsWith(".css") && !moduleSpec.endsWith(".svg") && !moduleSpec.endsWith(".png")) {
      errors.push({
        ruleId: "krnl/import-suffix",
        filePath,
        line: decl.getStartLineNumber(),
        message: `Relative import '${moduleSpec}' must end with '.js' for NodeNext module resolution.`,
        severity: "error"
      });
    }
  }
  const isHelper = filePath.includes("helper_functions") || filePath.includes("/helpers/") || filePath.includes("\\helpers\\");
  if (isHelper) {
    for (const fn of sf.getFunctions()) {
      const fnLines = fn.getText().split("\n").length;
      if (fnLines > options.maxHelperLineLimit && !sourceText.includes("Concepts.")) {
        errors.push({
          ruleId: "krnl/helper-line-limit",
          filePath,
          line: fn.getStartLineNumber(),
          message: `Helper function '${fn.getName() || "anonymous"}' exceeds ${options.maxHelperLineLimit} lines (${fnLines} lines). Must delegate to a root libraries/{Domain}Concepts.ts library.`,
          severity: "error"
        });
      }
    }
  }
  const isMainLogic = filePath.endsWith("logic.ts") || filePath.endsWith("logic.js");
  if (isMainLogic) {
    const substantiveLines = lines.filter((l) => {
      const trimmed = l.trim();
      return trimmed.length > 0 && !trimmed.startsWith("//") && !trimmed.startsWith("/*") && !trimmed.startsWith("*");
    });
    if (substantiveLines.length > options.maxMainLogicLimit && !sourceText.includes("helpers") && !sourceText.includes("Concepts") && !sourceText.includes("state")) {
      errors.push({
        ruleId: "krnl/main-delegation",
        filePath,
        message: `Main logic function has ${substantiveLines.length} substantive lines without delegating to Layer 1 helper functions or Layer 0 libraries.`,
        severity: "error"
      });
    }
  }
  return { errors, warnings };
}
function checkComponentRules(sf) {
  const errors = [];
  const warnings = [];
  const filePath = sf.getFilePath();
  const baseName = path.basename(filePath);
  if (filePath.endsWith(".tsx") || filePath.endsWith(".jsx")) {
    const componentNames = [];
    for (const fn of sf.getFunctions()) {
      const name = fn.getName();
      if (name && /^[A-Z]/.test(name)) {
        const hasJsx = fn.getDescendantsOfKind(import_ts_morph2.SyntaxKind.JsxElement).length > 0 || fn.getDescendantsOfKind(import_ts_morph2.SyntaxKind.JsxSelfClosingElement).length > 0 || fn.getDescendantsOfKind(import_ts_morph2.SyntaxKind.JsxFragment).length > 0;
        if (hasJsx) componentNames.push(name);
      }
    }
    for (const stmt of sf.getVariableStatements()) {
      for (const decl of stmt.getDeclarations()) {
        const name = decl.getName();
        if (/^[A-Z]/.test(name)) {
          const typeText = decl.getTypeNode()?.getText() || "";
          const isFcType = typeText.includes("FC") || typeText.includes("FunctionComponent") || typeText.includes("ComponentType");
          const init = decl.getInitializer();
          if (init) {
            const hasJsx = init.getDescendantsOfKind(import_ts_morph2.SyntaxKind.JsxElement).length > 0 || init.getDescendantsOfKind(import_ts_morph2.SyntaxKind.JsxSelfClosingElement).length > 0 || init.getDescendantsOfKind(import_ts_morph2.SyntaxKind.JsxFragment).length > 0;
            if (isFcType || hasJsx) {
              if (!componentNames.includes(name)) componentNames.push(name);
            }
          }
        }
      }
    }
    for (const cls of sf.getClasses()) {
      const name = cls.getName();
      const ext = cls.getExtends()?.getText() || "";
      if (name && (ext.includes("Component") || ext.includes("PureComponent"))) {
        if (!componentNames.includes(name)) componentNames.push(name);
      }
    }
    if (componentNames.length > 1) {
      errors.push({
        ruleId: "krnl/one-component-per-file",
        filePath,
        message: `File '${baseName}' defines multiple React components (${componentNames.join(
          ", "
        )}). Krnl strictly enforces ONE component per file. Decompose into sub-component files.`,
        severity: "error"
      });
    }
  }
  const isHelper = filePath.includes("helper_functions") || filePath.includes("/helpers/") || filePath.includes("\\helpers\\");
  if (isHelper) {
    for (const decl of sf.getImportDeclarations()) {
      const spec = decl.getModuleSpecifierValue();
      if (["fs", "node:fs", "http", "node:http", "ws"].includes(spec)) {
        errors.push({
          ruleId: "krnl/helper-purity",
          filePath,
          line: decl.getStartLineNumber(),
          message: `Helper functions (Layer 1) cannot directly import I/O modules ('${spec}'). Delegate to Layer 0 libraries or ServiceFacade context.`,
          severity: "error"
        });
      }
    }
  }
  return { errors, warnings };
}
function checkOrchestrationRules(sf) {
  const errors = [];
  const warnings = [];
  const filePath = sf.getFilePath();
  const sourceText = sf.getText();
  const calls = sf.getDescendantsOfKind(import_ts_morph3.SyntaxKind.CallExpression);
  for (const call of calls) {
    const exprText = call.getExpression().getText();
    if (exprText === "setInterval" || exprText === "window.setInterval") {
      errors.push({
        ruleId: "krnl/no-polling",
        filePath,
        line: call.getStartLineNumber(),
        message: `Prohibited use of 'setInterval'. Krnl applications must use reactive event streams or triggers.`,
        severity: "error"
      });
    }
  }
  if (sourceText.includes("main = async") || sourceText.includes("export const main = async")) {
    const match = sourceText.match(/main\s*=\s*async\s*\([^,]+,\s*\{([^}]*)\}\s*\)/);
    if (match) {
      const destructured = match[1];
      if (/\bsystem\b/.test(destructured)) {
        errors.push({
          ruleId: "krnl/context-destructuring",
          filePath,
          message: `Functionality context parameter destructures 'system'. Functionality passes { state, orchestration } or service context.`,
          severity: "error"
        });
      }
    }
  }
  const isOrchestrationClass = sf.getClasses().some((c) => {
    const ext = c.getExtends();
    return ext && (ext.getText().includes("FunctionalityOrchestration") || ext.getText().includes("Orchestration") || ext.getText().includes("krnlOrchestrationBase"));
  });
  if (isOrchestrationClass) {
    for (const decl of sf.getImportDeclarations()) {
      const spec = decl.getModuleSpecifierValue();
      if (spec.includes("libraries/") || spec.includes("Concepts")) {
        errors.push({
          ruleId: "krnl/orchestration-no-libraries",
          filePath,
          line: decl.getStartLineNumber(),
          message: `FunctionalityOrchestration class violates Library Calling Invariant. FunctionalityOrchestrations must not call or import libraries directly ('${spec}'). Only functionalities are permitted to call shared libraries.`,
          severity: "error"
        });
      }
    }
    for (const cls of sf.getClasses()) {
      const ext = cls.getExtends();
      if (ext && (ext.getText().includes("FunctionalityOrchestration") || ext.getText().includes("Orchestration") || ext.getText().includes("krnlOrchestrationBase"))) {
        const loops = [
          ...cls.getDescendantsOfKind(import_ts_morph3.SyntaxKind.ForStatement),
          ...cls.getDescendantsOfKind(import_ts_morph3.SyntaxKind.ForOfStatement),
          ...cls.getDescendantsOfKind(import_ts_morph3.SyntaxKind.ForInStatement),
          ...cls.getDescendantsOfKind(import_ts_morph3.SyntaxKind.WhileStatement),
          ...cls.getDescendantsOfKind(import_ts_morph3.SyntaxKind.DoStatement)
        ];
        for (const loop of loops) {
          errors.push({
            ruleId: "krnl/orchestration-purity",
            filePath,
            line: loop.getStartLineNumber(),
            message: `FunctionalityOrchestration '${cls.getName() || "Anonymous"}' violates Orchestration Purity Law. Loops and procedural algorithms are prohibited inside orchestrations. Move logic to a functionality or a global library function.`,
            severity: "error"
          });
        }
        const allowedMethods = /* @__PURE__ */ new Set([
          "flow",
          "getFlow",
          "listFlows",
          "clearFlows",
          "thenFunctionality",
          "parallel",
          "branch",
          "fanOut",
          "thenFunctionalityOrchestration",
          "getSteps",
          "assertServiceBoundary"
        ]);
        for (const method of cls.getMethods()) {
          const methodName = method.getName();
          if (!allowedMethods.has(methodName)) {
            errors.push({
              ruleId: "krnl/orchestration-purity",
              filePath,
              line: method.getStartLineNumber(),
              message: `FunctionalityOrchestration '${cls.getName() || "Anonymous"}' defines custom method '${methodName}'. FunctionalityOrchestrations are purely declarative compositors. Define capabilities as functionalities or global library functions.`,
              severity: "error"
            });
          }
        }
      }
    }
    for (const call of calls) {
      const callText = call.getText();
      if (callText.startsWith("this.flow(") || callText.startsWith("orchestration.flow(")) {
        let currentExpr = call;
        const chainCalls = [];
        while (currentExpr && import_ts_morph3.Node.isCallExpression(currentExpr)) {
          const propAccess = currentExpr.getExpression();
          if (import_ts_morph3.Node.isPropertyAccessExpression(propAccess)) {
            const methodName = propAccess.getName();
            const args2 = currentExpr.getArguments();
            const argText = args2.length > 0 ? args2[0].getText() : void 0;
            chainCalls.unshift({ name: methodName, node: currentExpr, argText });
            currentExpr = propAccess.getExpression();
          } else {
            break;
          }
        }
        let chainId = "orchestration";
        for (const step of chainCalls) {
          if (step.name === "flow") {
            chainId = step.argText ? step.argText.replace(/['"]/g, "") : "orchestration";
          } else if (step.name === "thenFunction") {
            errors.push({
              ruleId: "krnl/orchestration-no-direct-library-calls",
              filePath,
              line: step.node.getStartLineNumber(),
              message: `FunctionalityOrchestration flow '${chainId}' violates Orchestration Purity Law. Orchestrations cannot chain direct library functions via thenFunction(). Orchestrations must only sequence functionalities (thenFunctionality) and peer functionality orchestrations (thenFunctionalityOrchestration).`,
              severity: "error"
            });
          } else if (step.name === "thenService") {
            errors.push({
              ruleId: "krnl/orchestration-no-external-services",
              filePath,
              line: step.node.getStartLineNumber(),
              message: `FunctionalityOrchestration flow '${chainId}' violates Plane Isolation Law L1. A service-level FunctionalityOrchestration cannot compose external services. Use Skipo ServiceOrchestration at the application layer instead.`,
              severity: "error"
            });
          }
        }
      }
    }
  }
  return { errors, warnings };
}
function checkTopLevelPurity(sf) {
  const errors = [];
  const warnings = [];
  const filePath = sf.getFilePath();
  const baseName = path2.basename(filePath);
  const isUiTopLevel = /^(App|main|index|_app|root)\.(tsx|jsx)$/i.test(baseName);
  const isBackendTopLevel = /^(server|app|index)\.(ts|js)$/i.test(baseName) && !filePath.includes("/components/") && !filePath.includes("/orchestrations/") && !filePath.includes("/services/") && !filePath.includes("/libraries/");
  if (isUiTopLevel) {
    const jsxElements = sf.getDescendantsOfKind(import_ts_morph4.SyntaxKind.JsxOpeningElement);
    const jsxSelfClosing = sf.getDescendantsOfKind(import_ts_morph4.SyntaxKind.JsxSelfClosingElement);
    const allJsxTags = [...jsxElements, ...jsxSelfClosing];
    for (const jsx of allJsxTags) {
      const tagName = jsx.getTagNameNode().getText();
      if (/^[a-z]/.test(tagName)) {
        errors.push({
          ruleId: "krnl/top-level-purity",
          filePath,
          line: jsx.getStartLineNumber(),
          message: `Top-level file '${baseName}' violates Top-Level Purity Law. Raw JSX/HTML element '<${tagName}>' is strictly forbidden. Top-level files must ONLY import and compose React components.`,
          severity: "error"
        });
      }
    }
    const calls = sf.getDescendantsOfKind(import_ts_morph4.SyntaxKind.CallExpression);
    for (const call of calls) {
      const exprText = call.getExpression().getText();
      if ([
        "useState",
        "useEffect",
        "useRef",
        "useMemo",
        "useCallback",
        "useReducer",
        "useContext",
        "useLayoutEffect"
      ].includes(exprText) || /^use[A-Z]/.test(exprText) && exprText !== "use") {
        errors.push({
          ruleId: "krnl/top-level-purity",
          filePath,
          line: call.getStartLineNumber(),
          message: `Top-level file '${baseName}' violates Top-Level Purity Law. React hook '${exprText}' is forbidden in top-level files. Encapsulate state and effects inside dedicated component files.`,
          severity: "error"
        });
      }
    }
  }
  if (isBackendTopLevel) {
    const calls = sf.getDescendantsOfKind(import_ts_morph4.SyntaxKind.CallExpression);
    for (const call of calls) {
      const exprText = call.getExpression().getText();
      if (/^(app|router|server)\.(get|post|put|delete|patch|options|head)$/.test(exprText)) {
        errors.push({
          ruleId: "krnl/top-level-purity",
          filePath,
          line: call.getStartLineNumber(),
          message: `Backend entry file '${baseName}' violates Entry Purity Law. Inline route definition '${exprText}' is forbidden. Delegate to dedicated route/controller modules.`,
          severity: "error"
        });
      }
    }
  }
  return { errors, warnings };
}
function checkWorkspaceLayout(projectRoot, errors) {
  const krnlDir = path2.join(projectRoot, "krnl");
  const srcDir = path2.join(projectRoot, "src");
  const targetDir = fs.existsSync(krnlDir) ? krnlDir : fs.existsSync(srcDir) ? srcDir : null;
  if (!targetDir) return;
  const backendDir = path2.join(targetDir, "backend");
  const frontendDir = path2.join(targetDir, "frontend");
  if (fs.existsSync(backendDir)) {
    const bServices = path2.join(backendDir, "services");
    if (fs.existsSync(bServices)) {
      for (const sEntry of fs.readdirSync(bServices, { withFileTypes: true })) {
        if (!sEntry.isDirectory()) continue;
        const sDir = path2.join(bServices, sEntry.name);
        const sLibs = path2.join(sDir, "libraries");
        if (fs.existsSync(sLibs)) {
          for (const entry of fs.readdirSync(sLibs, { withFileTypes: true })) {
            if (!entry.isDirectory()) continue;
            const libPath = path2.join(sLibs, entry.name);
            if (!fs.existsSync(path2.join(libPath, "manifest.json"))) {
              errors.push({
                ruleId: "krnl/concept-manifest-required",
                filePath: libPath,
                message: `Service-owned concept library "${sEntry.name}/${entry.name}" is missing a manifest.json file.`,
                severity: "error"
              });
            }
          }
        }
        const sFuncs = path2.join(sDir, "functionalities");
        if (fs.existsSync(sFuncs)) {
          for (const entry of fs.readdirSync(sFuncs, { withFileTypes: true })) {
            if (!entry.isDirectory()) continue;
            const funcPath = path2.join(sFuncs, entry.name);
            if (!fs.existsSync(path2.join(funcPath, "manifest.json"))) {
              errors.push({
                ruleId: "krnl/functionality-manifest-required",
                filePath: funcPath,
                message: `Service-owned functionality "${sEntry.name}/${entry.name}" is missing a manifest.json file.`,
                severity: "error"
              });
            }
          }
        }
      }
    }
    const bLibs = path2.join(backendDir, "libraries");
    if (fs.existsSync(bLibs)) {
      for (const entry of fs.readdirSync(bLibs, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const libPath = path2.join(bLibs, entry.name);
        if (!fs.existsSync(path2.join(libPath, "manifest.json"))) {
          errors.push({
            ruleId: "krnl/concept-manifest-required",
            filePath: libPath,
            message: `Backend concept library "${entry.name}" is missing a manifest.json file.`,
            severity: "error"
          });
        }
      }
    }
    const bFuncs = path2.join(backendDir, "functionalities");
    if (fs.existsSync(bFuncs)) {
      for (const entry of fs.readdirSync(bFuncs, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const funcPath = path2.join(bFuncs, entry.name);
        if (!fs.existsSync(path2.join(funcPath, "manifest.json"))) {
          errors.push({
            ruleId: "krnl/functionality-manifest-required",
            filePath: funcPath,
            message: `Backend functionality "${entry.name}" is missing a manifest.json file.`,
            severity: "error"
          });
        }
      }
    }
  }
  if (fs.existsSync(frontendDir)) {
    const fLibs = path2.join(frontendDir, "libraries");
    if (fs.existsSync(fLibs)) {
      for (const entry of fs.readdirSync(fLibs, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const libPath = path2.join(fLibs, entry.name);
        if (!fs.existsSync(path2.join(libPath, "manifest.json"))) {
          errors.push({
            ruleId: "krnl/frontend-concept-manifest-required",
            filePath: libPath,
            message: `Frontend concept library "${entry.name}" is missing a manifest.json file.`,
            severity: "error"
          });
        }
      }
    }
    const fFuncs = path2.join(frontendDir, "functionalities");
    if (fs.existsSync(fFuncs)) {
      for (const entry of fs.readdirSync(fFuncs, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const funcPath = path2.join(fFuncs, entry.name);
        if (!fs.existsSync(path2.join(funcPath, "manifest.json"))) {
          errors.push({
            ruleId: "krnl/frontend-functionality-manifest-required",
            filePath: funcPath,
            message: `Frontend functionality "${entry.name}" is missing a manifest.json file.`,
            severity: "error"
          });
        }
      }
    }
  }
}
function checkServiceBoundaries(sf) {
  const errors = [];
  const warnings = [];
  const filePath = sf.getFilePath().replace(/\\/g, "/");
  const serviceMatch = filePath.match(/\/services\/([^/]+)\//);
  if (!serviceMatch) {
    return { errors, warnings };
  }
  const currentService = serviceMatch[1];
  const imports = sf.getImportDeclarations();
  for (const imp of imports) {
    const spec = imp.getModuleSpecifierValue();
    const crossServiceLibMatch = spec.match(/(?:^|\/|\.\.\/)services\/([^/]+)\/libraries\//) || spec.match(/\.\.\/(?:(?:\.\.\/)+)?([^/]+)\/libraries\//);
    if (crossServiceLibMatch) {
      const targetService = crossServiceLibMatch[1];
      if (targetService !== currentService && targetService !== "." && targetService !== "..") {
        errors.push({
          ruleId: "krnl/no-cross-service-library-imports",
          filePath,
          line: imp.getStartLineNumber(),
          message: `Cross-service library import forbidden: '${spec}'. Service '${currentService}' cannot import '${targetService}' libraries directly via filesystem. Access libraries through the '${targetService}' ServiceFacade (e.g. ${targetService}Facade.libraries).`,
          severity: "error"
        });
      }
    }
  }
  return { errors, warnings };
}
var PRIMITIVE_AND_BUILTIN_TYPES = /* @__PURE__ */ new Set([
  "string",
  "number",
  "boolean",
  "symbol",
  "bigint",
  "void",
  "undefined",
  "null",
  "never",
  "unknown",
  "any",
  "object",
  "Record",
  "Array",
  "ReadonlyArray",
  "Map",
  "Set",
  "WeakMap",
  "WeakSet",
  "Promise",
  "Date",
  "RegExp",
  "Error",
  "Uint8Array",
  "Int8Array",
  "Uint16Array",
  "Int16Array",
  "Uint32Array",
  "Int32Array",
  "Float32Array",
  "Float64Array",
  "ArrayBuffer",
  "Buffer",
  "Iterable",
  "AsyncIterable",
  "Iterator",
  "AsyncIterator",
  "Partial",
  "Required",
  "Readonly",
  "Pick",
  "Omit",
  "Exclude",
  "Extract",
  "NonNullable",
  "Parameters",
  "ConstructorParameters",
  "ReturnType",
  "InstanceType"
]);
function detectServiceContext(filePath) {
  const normalized = filePath.replace(/\\/g, "/");
  const match = normalized.match(/(?:^|\/)services\/([^/]+)\/libraries\/([^/]+)/);
  if (match) {
    return { serviceName: match[1], libraryName: match[2] };
  }
  return null;
}
function containsIdentifier(name, target) {
  return name.toLowerCase().includes(target.toLowerCase());
}
function isCustomContextualType(typeName, serviceName, localTypes) {
  if (PRIMITIVE_AND_BUILTIN_TYPES.has(typeName)) return false;
  if (localTypes.has(typeName)) return true;
  if (containsIdentifier(typeName, serviceName)) return true;
  if (/^[A-Z][a-zA-Z0-9]+$/.test(typeName)) return true;
  return false;
}
function hasContextualTypeReference(node, serviceName, localTypes) {
  const typeRefs = node.getDescendantsOfKind(import_ts_morph5.SyntaxKind.TypeReference);
  for (const ref of typeRefs) {
    const text = ref.getTypeName().getText().trim();
    if (isCustomContextualType(text, serviceName, localTypes)) {
      return true;
    }
  }
  return false;
}
function checkScopedLibraryRules(sf) {
  const errors = [];
  const warnings = [];
  const promotableAssets = [];
  const filePath = sf.getFilePath().replace(/\\/g, "/");
  const context = detectServiceContext(filePath);
  if (!context) {
    return { errors, warnings, promotableAssets };
  }
  const { serviceName, libraryName } = context;
  const localTypes = /* @__PURE__ */ new Set();
  sf.getInterfaces().forEach((i) => localTypes.add(i.getName()));
  sf.getTypeAliases().forEach((t) => localTypes.add(t.getName()));
  sf.getClasses().forEach((c) => {
    const n = c.getName();
    if (n) localTypes.add(n);
  });
  sf.getEnums().forEach((e) => localTypes.add(e.getName()));
  const functions = sf.getFunctions();
  for (const fn of functions) {
    const fnName = fn.getName();
    if (!fnName) continue;
    const isContextual = hasContextualTypeReference(fn, serviceName, localTypes);
    const hasServiceName = containsIdentifier(fnName, serviceName);
    if (isContextual) {
      if (!hasServiceName) {
        errors.push({
          ruleId: "krnl/service-library-asset-naming",
          filePath,
          line: fn.getStartLineNumber(),
          message: `Service library asset '${fnName}' in service '${serviceName}' violates scoped library naming convention. Custom library asset identifiers must contain the owning service name ('${serviceName}'). Expected name containing '${serviceName}' (e.g. '${serviceName.toLowerCase()}${fnName[0].toUpperCase()}${fnName.slice(1)}'), or eliminate contextual custom type dependencies to make it a generic promotable utility.`,
          severity: "error"
        });
      }
    } else {
      promotableAssets.push({
        name: fnName,
        kind: "function",
        filePath,
        scope: "service",
        scopeName: serviceName,
        target: "GutTS"
      });
    }
  }
  for (const stmt of sf.getVariableStatements()) {
    for (const decl of stmt.getDeclarations()) {
      const varName = decl.getName();
      const init = decl.getInitializer();
      const isFunction = init && (init.getKind() === import_ts_morph5.SyntaxKind.ArrowFunction || init.getKind() === import_ts_morph5.SyntaxKind.FunctionExpression);
      if (isFunction) {
        const isContextual = hasContextualTypeReference(decl, serviceName, localTypes);
        const hasServiceName = containsIdentifier(varName, serviceName);
        if (isContextual) {
          if (!hasServiceName) {
            errors.push({
              ruleId: "krnl/service-library-asset-naming",
              filePath,
              line: decl.getStartLineNumber(),
              message: `Service library asset '${varName}' in service '${serviceName}' violates scoped library naming convention. Custom library asset identifiers must contain the owning service name ('${serviceName}'). Expected name containing '${serviceName}', or eliminate contextual custom type dependencies to make it a generic promotable utility.`,
              severity: "error"
            });
          }
        } else {
          promotableAssets.push({
            name: varName,
            kind: "function",
            filePath,
            scope: "service",
            scopeName: serviceName,
            target: "GutTS"
          });
        }
      } else {
        const isContextual = hasContextualTypeReference(decl, serviceName, localTypes);
        const hasServiceName = containsIdentifier(varName, serviceName);
        if (isContextual && !hasServiceName) {
          errors.push({
            ruleId: "krnl/service-library-asset-naming",
            filePath,
            line: decl.getStartLineNumber(),
            message: `Service library asset '${varName}' in service '${serviceName}' violates scoped library naming convention. Custom library asset identifiers must contain the owning service name ('${serviceName}').`,
            severity: "error"
          });
        }
      }
    }
  }
  for (const iface of sf.getInterfaces()) {
    const name = iface.getName();
    const hasServiceName = containsIdentifier(name, serviceName);
    const hasProps = iface.getProperties().length > 0;
    if (hasProps && !hasServiceName) {
      errors.push({
        ruleId: "krnl/service-library-asset-naming",
        filePath,
        line: iface.getStartLineNumber(),
        message: `Service library interface '${name}' in service '${serviceName}' violates scoped library naming convention. Custom library asset identifiers must contain the owning service name ('${serviceName}'). Expected name like '${serviceName}${name}'.`,
        severity: "error"
      });
    }
  }
  for (const t of sf.getTypeAliases()) {
    const name = t.getName();
    const hasServiceName = containsIdentifier(name, serviceName);
    const isContextual = hasContextualTypeReference(t, serviceName, localTypes);
    if (isContextual && !hasServiceName) {
      errors.push({
        ruleId: "krnl/service-library-asset-naming",
        filePath,
        line: t.getStartLineNumber(),
        message: `Service library type alias '${name}' in service '${serviceName}' violates scoped library naming convention. Custom library asset identifiers must contain the owning service name ('${serviceName}'). Expected name like '${serviceName}${name}'.`,
        severity: "error"
      });
    }
  }
  for (const cls of sf.getClasses()) {
    const name = cls.getName();
    if (!name) continue;
    const hasServiceName = containsIdentifier(name, serviceName);
    if (!hasServiceName) {
      errors.push({
        ruleId: "krnl/service-library-asset-naming",
        filePath,
        line: cls.getStartLineNumber(),
        message: `Service library class '${name}' in service '${serviceName}' violates scoped library naming convention. Custom library asset identifiers must contain the owning service name ('${serviceName}'). Expected name like '${serviceName}${name}'.`,
        severity: "error"
      });
    }
  }
  return { errors, warnings, promotableAssets };
}
var KrnlValidatorEngine = class {
  project;
  projectRoot;
  limitOptions;
  constructor(optionsOrRoot) {
    const options = typeof optionsOrRoot === "string" ? { projectRoot: optionsOrRoot } : optionsOrRoot;
    this.projectRoot = path3.resolve(options.projectRoot || process.cwd());
    this.limitOptions = {
      maxFileLineLimit: options.maxFileLineLimit ?? 200,
      maxMainLogicLimit: options.maxMainLogicLimit ?? 20,
      maxHelperLineLimit: options.maxHelperLineLimit ?? 30
    };
    const tsConfigPath = path3.join(this.projectRoot, "tsconfig.json");
    if (fs2.existsSync(tsConfigPath)) {
      this.project = new import_ts_morph.Project({ tsConfigFilePath: tsConfigPath, skipAddingFilesFromTsConfig: true });
    } else {
      this.project = new import_ts_morph.Project({ compilerOptions: {
        target: 99
        /* ESNext */
      } });
    }
  }
  validateAll() {
    const files = this.collectSourceFiles(this.projectRoot);
    const errors = [];
    const warnings = [];
    const promotableAssets = [];
    checkWorkspaceLayout(this.projectRoot, errors);
    for (const f of files) {
      const sf = this.project.addSourceFileAtPath(f);
      const fileReport = this.validateSourceFile(sf);
      errors.push(...fileReport.errors);
      warnings.push(...fileReport.warnings);
      if (fileReport.promotableAssets) {
        promotableAssets.push(...fileReport.promotableAssets);
      }
    }
    return {
      valid: errors.length === 0,
      totalFiles: files.length,
      errors,
      warnings,
      promotableAssets
    };
  }
  validateSourceFile(sf) {
    const filePath = sf.getFilePath();
    const baseName = path3.basename(filePath);
    if (baseName.includes("_pb.") || baseName.endsWith(".d.ts")) {
      return { errors: [], warnings: [], promotableAssets: [] };
    }
    const limits = checkFileLimits(sf, this.limitOptions);
    const purity = checkTopLevelPurity(sf);
    const components = checkComponentRules(sf);
    const orchestration = checkOrchestrationRules(sf);
    const boundaries = checkServiceBoundaries(sf);
    const scopedLibraries = checkScopedLibraryRules(sf);
    return {
      errors: [
        ...limits.errors,
        ...purity.errors,
        ...components.errors,
        ...orchestration.errors,
        ...boundaries.errors,
        ...scopedLibraries.errors
      ],
      warnings: [
        ...limits.warnings,
        ...purity.warnings,
        ...components.warnings,
        ...orchestration.warnings,
        ...boundaries.warnings,
        ...scopedLibraries.warnings
      ],
      promotableAssets: scopedLibraries.promotableAssets
    };
  }
  collectSourceFiles(dir, collected = []) {
    if (!fs2.existsSync(dir)) return collected;
    const entries = fs2.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === "node_modules" || entry.name === "dist" || entry.name === ".git") continue;
      const full = path3.join(dir, entry.name);
      if (entry.isDirectory()) {
        this.collectSourceFiles(full, collected);
      } else if (entry.isFile() && (entry.name.endsWith(".ts") || entry.name.endsWith(".js") || entry.name.endsWith(".tsx") || entry.name.endsWith(".jsx"))) {
        collected.push(full);
      }
    }
    return collected;
  }
};

// src/commands/validate.ts
async function runValidate(projectRoot = process.cwd()) {
  console.log(`
\u{1F50D} [Krnl Validate] Scanning project at: ${projectRoot}
`);
  const validator = new KrnlValidatorEngine({ projectRoot });
  const report = validator.validateAll();
  if (report.warnings.length > 0) {
    console.warn(`\u26A0\uFE0F  [WARNINGS] Found ${report.warnings.length} warning(s):`);
    for (const w of report.warnings) {
      console.warn(`  - [${w.ruleId}] ${w.filePath}${w.line ? `:${w.line}` : ""}: ${w.message}`);
    }
  }
  if (!report.valid) {
    console.error(`
\u274C [VALIDATION FAILED] Found ${report.errors.length} error(s):
`);
    for (const err of report.errors) {
      console.error(`  \u274C [${err.ruleId}] ${err.filePath}${err.line ? `:${err.line}` : ""}`);
      console.error(`     ${err.message}
`);
    }
    return false;
  }
  if (report.promotableAssets && report.promotableAssets.length > 0) {
    console.log(`\u{1F4E6} [PROMOTABLE ASSETS] Detected ${report.promotableAssets.length} generic library asset(s) eligible for GutTS promotion:`);
    for (const asset of report.promotableAssets) {
      console.log(`  \u2726 [${asset.scope}:${asset.scopeName}] ${asset.name} (${asset.kind}) -> ${asset.target}`);
    }
    console.log("");
  }
  console.log(`\u2705 [VALIDATION PASSED] ${report.totalFiles} source files verified clean against Krnl paradigms.
`);
  return true;
}

// src/commands/generators/functionalityOrchestrationGenerator.ts
var path5 = __toESM(require("path"), 1);
var fs4 = __toESM(require("fs"), 1);

// src/commands/generators/common.ts
var fs3 = __toESM(require("fs"), 1);
var path4 = __toESM(require("path"), 1);
function getPlaneRoots(projectRoot) {
  const krnlRoot = path4.join(projectRoot, "krnl");
  if (fs3.existsSync(krnlRoot)) {
    return {
      backend: path4.join(krnlRoot, "backend"),
      frontend: path4.join(krnlRoot, "frontend"),
      isKrnlDir: true
    };
  }
  return {
    backend: path4.join(projectRoot, "src"),
    frontend: path4.join(projectRoot, "src"),
    isKrnlDir: false
  };
}

// src/commands/generators/functionalityOrchestrationGenerator.ts
function generateFunctionalityOrchestration(name, projectRoot) {
  const { backend } = getPlaneRoots(projectRoot);
  const orchDir = path5.join(backend, "orchestrations", name);
  fs4.mkdirSync(path5.join(orchDir, "tests"), { recursive: true });
  fs4.writeFileSync(
    path5.join(orchDir, `${name}FunctionalityOrchestration.ts`),
    `import { FunctionalityOrchestration } from '@ultrst-armada/krnl-core';

/**
 * @role functionality-orchestration
 * Declaratively composes functionalities within this service into named flows.
 */
export class ${name}FunctionalityOrchestration extends FunctionalityOrchestration {
  constructor() {
    super({
      id: '${name}FunctionalityOrchestration',
      name: '${name}',
      version: '1.0.0',
      description: '${name} declarative functionality orchestration flow',
    });

    this.flow('default')
      .thenFunctionality('Execute${name}')
      .register({ visibility: 'public' });
  }
}

export default ${name}FunctionalityOrchestration;
`
  );
  fs4.writeFileSync(
    path5.join(orchDir, "tests", `${name}FunctionalityOrchestration.test.ts`),
    `import { describe, it, expect } from 'vitest';
import { ${name}FunctionalityOrchestration } from '../${name}FunctionalityOrchestration.js';

describe('${name}FunctionalityOrchestration', () => {
  it('instantiates and configures declarative functionality flow correctly', () => {
    const orchestration = new ${name}FunctionalityOrchestration();
    expect(orchestration.id).toBe('${name}FunctionalityOrchestration');
    expect(orchestration.getFlow('default')).toBeDefined();
    expect(orchestration.getFlow('default')?.steps).toHaveLength(1);
  });
});
`
  );
  console.log(`\u2705 Created FunctionalityOrchestration: krnl/backend/orchestrations/${name}/`);
}

// src/commands/generators/functionalityGenerator.ts
var fs6 = __toESM(require("fs"), 1);
var path7 = __toESM(require("path"), 1);

// ../core/dist/index.js
var fs5 = __toESM(require("fs"), 1);
var path6 = __toESM(require("path"), 1);
var asyncHooks = globalThis.process?.getBuiltinModule?.("node:async_hooks");
var KrnlPackageReconciler = class {
  /**
   * Scans all manifest.json files across backend and frontend and reconciles root package.json.
   */
  static reconcile(projectRoot = process.cwd(), writeChanges = true) {
    const manifests = this.findManifests(projectRoot);
    const aggregatedDeps = {};
    const aggregatedDevDeps = {};
    for (const mPath of manifests) {
      try {
        const raw = fs5.readFileSync(mPath, "utf8");
        const json = JSON.parse(raw);
        if (json.dependencies && typeof json.dependencies === "object") {
          for (const [pkg, ver] of Object.entries(json.dependencies)) {
            if (!aggregatedDeps[pkg]) aggregatedDeps[pkg] = [];
            if (!aggregatedDeps[pkg].includes(String(ver))) {
              aggregatedDeps[pkg].push(String(ver));
            }
          }
        }
        if (json.devDependencies && typeof json.devDependencies === "object") {
          for (const [pkg, ver] of Object.entries(json.devDependencies)) {
            if (!aggregatedDevDeps[pkg]) aggregatedDevDeps[pkg] = [];
            if (!aggregatedDevDeps[pkg].includes(String(ver))) {
              aggregatedDevDeps[pkg].push(String(ver));
            }
          }
        }
      } catch (err) {
        console.warn(`[KrnlPackageReconciler] Warning: Could not parse ${mPath}:`, err);
      }
    }
    const conflicts = [];
    const resolvedDeps = {};
    const resolvedDevDeps = {};
    for (const [pkg, versions] of Object.entries(aggregatedDeps)) {
      if (versions.length > 1) {
        conflicts.push({ package: pkg, versions });
      }
      resolvedDeps[pkg] = versions[versions.length - 1];
    }
    for (const [pkg, versions] of Object.entries(aggregatedDevDeps)) {
      if (versions.length > 1 && !conflicts.some((c) => c.package === pkg)) {
        conflicts.push({ package: pkg, versions });
      }
      resolvedDevDeps[pkg] = versions[versions.length - 1];
    }
    const pkgJsonPath = path6.join(projectRoot, "package.json");
    let updated = false;
    if (fs5.existsSync(pkgJsonPath)) {
      const pkgContent = JSON.parse(fs5.readFileSync(pkgJsonPath, "utf8"));
      pkgContent.dependencies = pkgContent.dependencies || {};
      pkgContent.devDependencies = pkgContent.devDependencies || {};
      let hasChanges = false;
      for (const [pkg, ver] of Object.entries(resolvedDeps)) {
        if (pkgContent.dependencies[pkg] !== ver) {
          pkgContent.dependencies[pkg] = ver;
          hasChanges = true;
        }
      }
      for (const [pkg, ver] of Object.entries(resolvedDevDeps)) {
        if (!pkgContent.dependencies[pkg] && pkgContent.devDependencies[pkg] !== ver) {
          pkgContent.devDependencies[pkg] = ver;
          hasChanges = true;
        }
      }
      if (hasChanges && writeChanges) {
        fs5.writeFileSync(pkgJsonPath, JSON.stringify(pkgContent, null, 2) + "\n");
        updated = true;
        console.log(`[KrnlPackageReconciler] Reconciled package.json from ${manifests.length} manifest(s).`);
      }
    }
    return {
      updated,
      totalManifests: manifests.length,
      addedDependencies: resolvedDeps,
      addedDevDependencies: resolvedDevDeps,
      conflicts
    };
  }
  /**
   * Discovers all manifest.json files in krnl/ (or src/)
   */
  static findManifests(projectRoot) {
    const searchDirs = [
      path6.join(projectRoot, "krnl", "backend", "services"),
      path6.join(projectRoot, "krnl", "backend", "libraries"),
      path6.join(projectRoot, "krnl", "backend", "functionalities"),
      path6.join(projectRoot, "krnl", "frontend", "libraries"),
      path6.join(projectRoot, "krnl", "frontend", "functionalities"),
      path6.join(projectRoot, "src", "backend", "services"),
      path6.join(projectRoot, "src", "services"),
      path6.join(projectRoot, "src", "functionalities"),
      path6.join(projectRoot, "src", "libraries")
    ];
    const found = [];
    for (const dir of searchDirs) {
      if (fs5.existsSync(dir)) {
        this.scanRecursive(dir, found);
      }
    }
    return found;
  }
  static scanRecursive(dir, found) {
    try {
      const entries = fs5.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name === "node_modules" || entry.name === "dist" || entry.name === ".git") continue;
        const full = path6.join(dir, entry.name);
        if (entry.isDirectory()) {
          this.scanRecursive(full, found);
        } else if (entry.isFile() && entry.name === "manifest.json") {
          found.push(full);
        }
      }
    } catch {
    }
  }
};

// src/commands/generators/functionalityGenerator.ts
function generateFunctionality(name, projectRoot, parentServiceOrOptions) {
  const { backend, frontend } = getPlaneRoots(projectRoot);
  const options = typeof parentServiceOrOptions === "string" ? { parentService: parentServiceOrOptions } : parentServiceOrOptions || {};
  let targetService = options.parentService;
  if (!targetService) {
    const servicesDir = path7.join(backend, "services");
    if (fs6.existsSync(servicesDir)) {
      const existing = fs6.readdirSync(servicesDir, { withFileTypes: true }).filter((d) => d.isDirectory());
      if (existing.length === 1) {
        targetService = existing[0].name;
      }
    }
  }
  const bFuncDir = targetService ? path7.join(backend, "services", targetService, "functionalities", name) : path7.join(backend, "functionalities", name);
  fs6.mkdirSync(path7.join(bFuncDir, "main_function"), { recursive: true });
  fs6.mkdirSync(path7.join(bFuncDir, "helper_functions"), { recursive: true });
  fs6.mkdirSync(path7.join(bFuncDir, "events"), { recursive: true });
  fs6.mkdirSync(path7.join(bFuncDir, "tests"), { recursive: true });
  if (options.withState) {
    fs6.mkdirSync(path7.join(bFuncDir, "state_data"), { recursive: true });
    fs6.writeFileSync(
      path7.join(bFuncDir, "state_data", "state.ts"),
      `export interface ${name}State {
  executionCount: number;
}

export const initialState: ${name}State = {
  executionCount: 0
};
`
    );
  }
  fs6.writeFileSync(
    path7.join(bFuncDir, `${name}Atom.ts`),
    `export interface ${name}Input {
  payload?: string;
}

export interface ${name}Output {
  success: boolean;
  timestamp: number;
}
`
  );
  fs6.writeFileSync(
    path7.join(bFuncDir, "manifest.json"),
    JSON.stringify(
      {
        name,
        service: targetService || void 0,
        description: `${name} quad-unit functionality`,
        dependencies: {}
      },
      null,
      2
    )
  );
  fs6.writeFileSync(
    path7.join(bFuncDir, "main_function", "logic.ts"),
    `import type { ${name}Input, ${name}Output } from "../${name}Atom.js";

export const main = async (input: ${name}Input, context: any): Promise<${name}Output> => {
  return {
    success: true,
    timestamp: Date.now()
  };
};
`
  );
  fs6.writeFileSync(
    path7.join(bFuncDir, "main_function", "lifecycle.ts"),
    `export async function onMount() {}
export async function onTeardown() {}
`
  );
  fs6.writeFileSync(
    path7.join(bFuncDir, "helper_functions", "helper.ts"),
    `/**
 * @role component
 */
export function exampleHelper(): boolean {
  return true;
}
`
  );
  fs6.writeFileSync(
    path7.join(bFuncDir, "events", "events.ts"),
    `/**
 * @role component
 */
export interface ${name}CompletedEvent {
  timestamp: number;
}
`
  );
  fs6.writeFileSync(
    path7.join(bFuncDir, "tests", `${name}.test.ts`),
    `import { describe, it, expect } from "vitest";

describe("${name} functionality", () => {
  it("passes basic test", () => {
    expect(true).toBe(true);
  });
});
`
  );
  const fFuncDir = path7.join(frontend, "functionalities", name);
  fs6.mkdirSync(path7.join(fFuncDir, "tests"), { recursive: true });
  fs6.writeFileSync(
    path7.join(fFuncDir, `${name}0.tsx`),
    `import React from "react";

export const ${name}0: React.FC = () => {
  return (
    <div className="krnl-func-${name.toLowerCase()}">
      <h3>${name} (Variant 0)</h3>
    </div>
  );
};

export default ${name}0;
`
  );
  fs6.writeFileSync(
    path7.join(fFuncDir, "manifest.json"),
    JSON.stringify({ name: `${name}UI`, dependencies: {} }, null, 2)
  );
  fs6.writeFileSync(
    path7.join(fFuncDir, "tests", `${name}0.test.tsx`),
    `import { describe, it, expect } from "vitest";

describe("${name}0 Component", () => {
  it("renders correctly", () => {
    expect(true).toBe(true);
  });
});
`
  );
  KrnlPackageReconciler.reconcile(projectRoot, true);
  console.log(`\u2705 Created Backend Functionality: ${path7.relative(projectRoot, bFuncDir)}/`);
  console.log(`\u2705 Created Frontend Functionality: ${path7.relative(projectRoot, fFuncDir)}/`);
}

// src/commands/generators/libraryGenerator.ts
var fs7 = __toESM(require("fs"), 1);
var path8 = __toESM(require("path"), 1);
function generateLibrary(name, projectRoot, parentService) {
  const { backend, frontend } = getPlaneRoots(projectRoot);
  const conceptName = name.endsWith("Concepts") ? name : `${name}Concepts`;
  let targetService = parentService;
  if (!targetService) {
    const servicesDir = path8.join(backend, "services");
    if (fs7.existsSync(servicesDir)) {
      const existing = fs7.readdirSync(servicesDir, { withFileTypes: true }).filter((d) => d.isDirectory());
      if (existing.length === 1) {
        targetService = existing[0].name;
      }
    }
  }
  if (!targetService) {
    targetService = "App";
  }
  const bLibDir = path8.join(backend, "services", targetService, "libraries", conceptName);
  fs7.mkdirSync(path8.join(bLibDir, "tests"), { recursive: true });
  fs7.writeFileSync(
    path8.join(bLibDir, "definitions.ts"),
    `/**
 * @file definitions.ts
 * @role component
 */
export interface ${conceptName}Options {
  enabled?: boolean;
}
`
  );
  fs7.writeFileSync(
    path8.join(bLibDir, "functions.ts"),
    `/**
 * @file functions.ts
 * @role component
 */
import type { ${conceptName}Options } from "./definitions.js";

export function ${name.toLowerCase()}Transform<T>(data: T, _opts?: ${conceptName}Options): T {
  return data;
}
`
  );
  fs7.writeFileSync(
    path8.join(bLibDir, "index.ts"),
    `export * from "./definitions.js";
export * from "./functions.js";
`
  );
  fs7.writeFileSync(
    path8.join(bLibDir, "manifest.json"),
    JSON.stringify({ name: conceptName, service: targetService, dependencies: {} }, null, 2)
  );
  fs7.writeFileSync(
    path8.join(bLibDir, "tests", `${conceptName}.test.ts`),
    `import { describe, it, expect } from "vitest";
import { ${name.toLowerCase()}Transform } from "../functions.js";

describe("${conceptName}", () => {
  it("runs correctly", () => {
    expect(${name.toLowerCase()}Transform(42)).toBe(42);
  });
});
`
  );
  const fLibDir = path8.join(frontend, "libraries", conceptName);
  fs7.mkdirSync(path8.join(fLibDir, "tests"), { recursive: true });
  fs7.writeFileSync(
    path8.join(fLibDir, "definitions.ts"),
    `export interface ${name}Props {
  label?: string;
}
`
  );
  fs7.writeFileSync(
    path8.join(fLibDir, "components.tsx"),
    `import React from "react";
import type { ${name}Props } from "./definitions.js";
import "./styles.css";

export const ${name}: React.FC<${name}Props> = ({ label = "${name}" }) => {
  return <div className="krnl-${name.toLowerCase()}">{label}</div>;
};
`
  );
  fs7.writeFileSync(
    path8.join(fLibDir, "styles.css"),
    `.krnl-${name.toLowerCase()} {
  font-family: inherit;
}
`
  );
  fs7.writeFileSync(
    path8.join(fLibDir, "manifest.json"),
    JSON.stringify({ name: `${conceptName}UI`, dependencies: {} }, null, 2)
  );
  fs7.writeFileSync(
    path8.join(fLibDir, "tests", `${name}.test.tsx`),
    `import { describe, it, expect } from "vitest";

describe("${name} UI Concept", () => {
  it("renders correctly", () => {
    expect(true).toBe(true);
  });
});
`
  );
  KrnlPackageReconciler.reconcile(projectRoot, true);
  console.log(`\u2705 Created Service-Owned Library: ${path8.relative(projectRoot, bLibDir)}/ (Owner: ${targetService})`);
  console.log(`\u2705 Created Frontend Concept Library: ${path8.relative(projectRoot, fLibDir)}/`);
}

// src/commands/generators/serviceGenerator.ts
var fs8 = __toESM(require("fs"), 1);
var path9 = __toESM(require("path"), 1);
function generateService(name, projectRoot, defaultFrontend) {
  const frontendReference = defaultFrontend?.component ? {
    component: defaultFrontend.component,
    ...defaultFrontend.package ? { package: defaultFrontend.package } : {},
    ...defaultFrontend.export ? { export: defaultFrontend.export } : {},
    relationship: defaultFrontend.relationship ?? "recommended"
  } : void 0;
  const frontendConfig = frontendReference ? JSON.stringify(frontendReference, null, 2).replace(/\n/g, "\n  ") : void 0;
  const { backend } = getPlaneRoots(projectRoot);
  const serviceDir = path9.join(backend, "services", name);
  const funcsDir = path9.join(serviceDir, "functionalities");
  const orchsDir = path9.join(serviceDir, "orchestrations");
  const libsDir = path9.join(serviceDir, "libraries");
  const testsDir = path9.join(serviceDir, "tests");
  fs8.mkdirSync(funcsDir, { recursive: true });
  fs8.mkdirSync(orchsDir, { recursive: true });
  fs8.mkdirSync(libsDir, { recursive: true });
  fs8.mkdirSync(testsDir, { recursive: true });
  const conceptName = `${name}Concepts`;
  const defaultLibDir = path9.join(libsDir, conceptName);
  fs8.mkdirSync(path9.join(defaultLibDir, "tests"), { recursive: true });
  fs8.writeFileSync(
    path9.join(defaultLibDir, "definitions.ts"),
    `/**
 * @file definitions.ts
 * @role component
 */
export interface ${name}Options {
  enabled?: boolean;
}
`
  );
  fs8.writeFileSync(
    path9.join(defaultLibDir, "functions.ts"),
    `/**
 * @file functions.ts
 * @role component
 */
import type { ${name}Options } from "./definitions.js";

export function format${name}Name(input: string, _opts?: ${name}Options): string {
  return "${name}: " + input;
}
`
  );
  fs8.writeFileSync(
    path9.join(defaultLibDir, "index.ts"),
    `export * from "./definitions.js";
export * from "./functions.js";
`
  );
  fs8.writeFileSync(
    path9.join(defaultLibDir, "manifest.json"),
    JSON.stringify({ name: conceptName, description: `${name} service-owned library`, dependencies: {} }, null, 2)
  );
  fs8.writeFileSync(
    path9.join(defaultLibDir, "tests", `${conceptName}.test.ts`),
    `import { describe, it, expect } from "vitest";
import { format${name}Name } from "../functions.js";

describe("${conceptName}", () => {
  it("formats name correctly", () => {
    expect(format${name}Name("test")).toContain("${name}");
  });
});
`
  );
  const frontendProperty = frontendConfig ? `  defaultFrontend: ${frontendConfig},
` : "";
  fs8.writeFileSync(
    path9.join(serviceDir, `${name}ServiceFacade.ts`),
    `import { ServiceFacade } from "@ultrst-armada/krnl-core";
import * as ${name.toLowerCase()}Concepts from "./libraries/${conceptName}/index.js";

export const ${name}ServiceFacade = new ServiceFacade({
  id: "${name.toLowerCase()}.service",
  name: "${name}Service",
  version: "1.0.0",
  description: "${name} service facade",
${frontendProperty}  libraries: {
    ${conceptName}: ${name.toLowerCase()}Concepts,
  },
});

export default ${name}ServiceFacade;
`
  );
  fs8.writeFileSync(
    path9.join(testsDir, `${name}ServiceFacade.test.ts`),
    `import { describe, it, expect } from "vitest";
import { ${name}ServiceFacade } from "../${name}ServiceFacade.js";

describe("${name}ServiceFacade", () => {
  it("initializes and exposes service-owned library", () => {
    expect(${name}ServiceFacade.id).toBe("${name.toLowerCase()}.service");
    expect(${name}ServiceFacade.libraries.${conceptName}).toBeDefined();
    expect(typeof ${name}ServiceFacade.libraries.${conceptName}.format${name}Name).toBe("function");
  });
});
`
  );
  KrnlPackageReconciler.reconcile(projectRoot, true);
  console.log(`\u2705 Created Service: ${path9.relative(projectRoot, serviceDir)}/`);
}

// src/commands/generate.ts
async function runGenerate(type, name, parentService, projectRoot = process.cwd(), options = {}) {
  if (!name) {
    console.error(
      "\u274C Error: Resource name is required. Usage: krnl generate <service|orchestration|functionality|library> <Name> [parentService]"
    );
    process.exit(1);
  }
  const normalizedType = type.toLowerCase().replace(/[-_]/g, "");
  switch (normalizedType) {
    case "service":
      generateService(name, projectRoot, options.defaultFrontend);
      break;
    case "functionalityorchestration":
    case "orchestration":
      generateFunctionalityOrchestration(name, projectRoot);
      break;
    case "functionality":
      generateFunctionality(name, projectRoot, parentService);
      break;
    case "library":
      generateLibrary(name, projectRoot, parentService);
      break;
    default:
      console.error(
        `\u274C Unknown resource type "${type}". Valid types: service, orchestration, functionality, library`
      );
      process.exit(1);
  }
}

// src/commands/watch.ts
var fs9 = __toESM(require("fs"), 1);
var path10 = __toESM(require("path"), 1);
function generateMagneticDeclarations(projectRoot = process.cwd()) {
  const { results: functionalities, libDirs } = scanDirectory(projectRoot);
  let dtsContent = `// Automatically generated by Krnl Magnetic Watcher. Do not edit manually.

`;
  dtsContent += `import { Orchestration } from '@ultrst-armada/krnl-core';

`;
  const globalDeclarations = [];
  for (const func of functionalities) {
    const helpersDir = path10.join(func.funcPath, "helper_functions");
    if (fs9.existsSync(helpersDir)) {
      const files = fs9.readdirSync(helpersDir);
      for (const file of files) {
        if (file.endsWith(".js") || file.endsWith(".ts")) {
          const filePath = path10.join(helpersDir, file);
          const baseName = path10.basename(file, path10.extname(file));
          const importPath = `./${path10.relative(projectRoot, filePath).replace(/\\/g, "/")}`;
          const { named, hasDefault } = parseExports(filePath, baseName);
          if (hasDefault) {
            globalDeclarations.push(`  const ${baseName}: typeof import('${importPath}')['default'];`);
          }
          for (const name of named) {
            globalDeclarations.push(`  const ${name}: typeof import('${importPath}')['${name}'];`);
          }
        }
      }
    }
    const eventsDir = path10.join(func.funcPath, "events");
    if (fs9.existsSync(eventsDir)) {
      const files = fs9.readdirSync(eventsDir);
      for (const file of files) {
        if (file.endsWith(".js") || file.endsWith(".ts")) {
          const filePath = path10.join(eventsDir, file);
          const baseName = path10.basename(file, path10.extname(file));
          const importPath = `./${path10.relative(projectRoot, filePath).replace(/\\/g, "/")}`;
          const { named, hasDefault } = parseExports(filePath, baseName);
          if (hasDefault) {
            globalDeclarations.push(`  const ${baseName}: typeof import('${importPath}')['default'];`);
          }
          for (const name of named) {
            globalDeclarations.push(`  const ${name}: typeof import('${importPath}')['${name}'];`);
          }
        }
      }
    }
  }
  for (const libPath of libDirs) {
    scanLibFiles(libPath, projectRoot, globalDeclarations);
  }
  if (globalDeclarations.length > 0) {
    dtsContent += `declare global {
${Array.from(new Set(globalDeclarations)).join("\n")}
}
`;
  }
  const outPath = path10.join(projectRoot, "krnl-magnetic.d.ts");
  fs9.writeFileSync(outPath, dtsContent);
  console.log(`[Krnl Watch] Updated ambient declarations: ${outPath}`);
}
function scanLibFiles(dir, projectRoot, decls) {
  if (!fs9.existsSync(dir)) return;
  for (const entry of fs9.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
    const full = path10.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanLibFiles(full, projectRoot, decls);
    } else if ((entry.name.endsWith(".ts") || entry.name.endsWith(".js")) && !entry.name.endsWith(".d.ts")) {
      const baseName = path10.basename(entry.name, path10.extname(entry.name));
      const importPath = `./${path10.relative(projectRoot, full).replace(/\\/g, "/")}`;
      const { named, hasDefault } = parseExports(full, baseName);
      if (hasDefault) decls.push(`  const ${baseName}: typeof import('${importPath}')['default'];`);
      for (const n of named) decls.push(`  const ${n}: typeof import('${importPath}')['${n}'];`);
    }
  }
}
function scanDirectory(dir, results = [], libDirs = []) {
  if (!fs9.existsSync(dir)) return { results, libDirs };
  const list = fs9.readdirSync(dir, { withFileTypes: true });
  for (const entry of list) {
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === "dist" || entry.name === ".git") continue;
      const fullPath = path10.join(dir, entry.name);
      if (entry.name === "functionalities") {
        const funcs = fs9.readdirSync(fullPath, { withFileTypes: true });
        for (const f of funcs) {
          if (f.isDirectory()) results.push({ funcPath: path10.join(fullPath, f.name), funcName: f.name });
        }
      } else if (entry.name === "libraries" || entry.name === "library") {
        libDirs.push(fullPath);
      } else {
        scanDirectory(fullPath, results, libDirs);
      }
    }
  }
  return { results, libDirs };
}
function parseExports(filePath, defaultName) {
  const content = fs9.readFileSync(filePath, "utf8");
  const named = [];
  let hasDefault = false;
  const namedRegex = /export\s+(?:const|let|var|function|class|async\s+function)\s+([a-zA-Z0-9_$]+)/g;
  let match;
  while ((match = namedRegex.exec(content)) !== null) {
    if (match[1]) named.push(match[1]);
  }
  if (content.includes("export default")) {
    hasDefault = true;
  }
  return { named, hasDefault };
}

// src/commands/build.ts
var path11 = __toESM(require("path"), 1);
var fs10 = __toESM(require("fs"), 1);
var import_child_process = require("child_process");
async function runBuild(projectRoot = process.cwd(), options = {}) {
  KrnlPackageReconciler.reconcile(projectRoot, true);
  const target = options.service || options.orchestration;
  if (target) {
    console.log(`\u{1F3D7}\uFE0F  [Krnl Build] Target service/orchestration variant: "${target}"`);
  } else if (options.all) {
    console.log(`\u{1F3D7}\uFE0F  [Krnl Build] Combined multi-service build`);
  }
  console.log("\u{1F50D} [Krnl Build] Running AST & layer purity validation...");
  const valid = await runValidate(projectRoot);
  if (!valid) {
    console.error("\u274C [Krnl Build] Build aborted due to validation errors.");
    return { success: false, error: "Validation failed" };
  }
  generateMagneticDeclarations(projectRoot);
  const tsConfigPath = path11.join(projectRoot, "tsconfig.json");
  if (fs10.existsSync(tsConfigPath)) {
    console.log("\u{1F3D7}\uFE0F  [Krnl Build] Compiling TypeScript source files to dist/...");
    const localTsc = path11.join(projectRoot, "node_modules", ".bin", "tsc");
    const tscCmd = fs10.existsSync(localTsc) ? localTsc : "tsc";
    try {
      (0, import_child_process.execSync)(`${tscCmd} -p tsconfig.json`, { cwd: projectRoot, stdio: "inherit" });
    } catch (err) {
      console.error("\u274C [Krnl Build] TypeScript compilation failed.");
      return { success: false, error: "TypeScript compilation failed" };
    }
  } else {
    console.log("\u2139\uFE0F  [Krnl Build] No tsconfig.json found; skipping TypeScript compiler invocation.");
  }
  console.log("\u2705 [Krnl Build] Project validation, declaration generation, and compilation completed successfully.");
  return { success: true };
}

// src/commands/dev.ts
var http = __toESM(require("http"), 1);
var path12 = __toESM(require("path"), 1);
var fs11 = __toESM(require("fs"), 1);
async function runDev(projectRoot = process.cwd(), options = {}) {
  const port = options.port ?? 8080;
  KrnlPackageReconciler.reconcile(projectRoot, true);
  generateMagneticDeclarations(projectRoot);
  if (options.dryRun) {
    console.log(`\u26A1 [Krnl Dev] Development environment verified on port ${port} (--dry-run).`);
    return {
      port,
      close: async () => {
      }
    };
  }
  const server = http.createServer((req, res) => {
    res.setHeader("Content-Type", "application/json");
    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
    if (url.pathname === "/" || url.pathname === "/health") {
      res.writeHead(200);
      res.end(JSON.stringify({ status: "ok", service: "krnl-dev", port, uptime: process.uptime() }));
      return;
    }
    if (url.pathname === "/manifest") {
      const pkgPath = path12.join(projectRoot, "package.json");
      const pkg = fs11.existsSync(pkgPath) ? JSON.parse(fs11.readFileSync(pkgPath, "utf8")) : {};
      res.writeHead(200);
      res.end(JSON.stringify({ name: pkg.name || "krnl-app", version: pkg.version || "1.0.0" }));
      return;
    }
    res.writeHead(404);
    res.end(JSON.stringify({ error: "Route not found" }));
  });
  await new Promise((resolve3, reject) => {
    server.listen(port, () => resolve3());
    server.on("error", reject);
  });
  console.log(`\u26A1 [Krnl Dev] Development server listening on http://localhost:${port}`);
  const watcher = fs11.watch(projectRoot, { recursive: true }, (_evt, filename) => {
    if (filename && (filename.endsWith(".ts") || filename.endsWith(".js")) && !filename.includes("krnl-magnetic.d.ts")) {
      try {
        generateMagneticDeclarations(projectRoot);
      } catch {
      }
    }
    if (filename && filename.endsWith("manifest.json")) {
      try {
        KrnlPackageReconciler.reconcile(projectRoot, true);
      } catch {
      }
    }
  });
  const close = async () => {
    watcher.close();
    await new Promise((resolve3) => server.close(() => resolve3()));
  };
  return { server, close, port };
}

// src/bin/krnl.ts
var args = process.argv.slice(2);
var command = args[0] || "help";
function optionValue(name) {
  const equalsPrefix = `${name}=`;
  const equalsArg = args.find((arg) => arg.startsWith(equalsPrefix));
  if (equalsArg) return equalsArg.slice(equalsPrefix.length);
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] && !args[index + 1].startsWith("--") ? args[index + 1] : void 0;
}
async function main() {
  switch (command) {
    case "sync": {
      const targetDir = args[1] && !args[1].startsWith("-") ? path13.resolve(process.cwd(), args[1]) : process.cwd();
      console.log("\u{1F4E6} [Krnl Sync] Reconciling package.json from all manifest.json files...");
      const res = KrnlPackageReconciler.reconcile(targetDir, true);
      console.log(`\u2705 Reconciled dependencies from ${res.totalManifests} manifest.json file(s).`);
      if (res.conflicts.length > 0) {
        console.warn("\u26A0\uFE0F Version conflicts detected across manifests:", res.conflicts);
      }
      break;
    }
    case "validate": {
      const targetDir = args[1] && !args[1].startsWith("-") ? path13.resolve(process.cwd(), args[1]) : process.cwd();
      const valid = await runValidate(targetDir);
      process.exit(valid ? 0 : 1);
      break;
    }
    case "generate": {
      const type = args[1];
      const name = args[2];
      const parent = args[3];
      const component = optionValue("--default-frontend");
      const relationship = optionValue("--default-frontend-relationship") === "required" ? "required" : "recommended";
      const frontend = component ? {
        component,
        package: optionValue("--default-frontend-package"),
        export: optionValue("--default-frontend-export"),
        relationship
      } : void 0;
      await runGenerate(type, name, parent, process.cwd(), { defaultFrontend: frontend });
      break;
    }
    case "watch": {
      generateMagneticDeclarations(process.cwd());
      if (args.includes("--watch") || args.includes("-w")) {
        console.log("[Krnl Watch] Continuous watcher enabled.");
        fs12.watch(process.cwd(), { recursive: true }, (_evt, filename) => {
          if (filename && (filename.endsWith(".ts") || filename.endsWith(".js")) && !filename.includes("krnl-magnetic.d.ts")) {
            try {
              generateMagneticDeclarations(process.cwd());
            } catch (e) {
            }
          }
          if (filename && filename.endsWith("manifest.json")) {
            try {
              KrnlPackageReconciler.reconcile(process.cwd(), true);
            } catch (e) {
            }
          }
        });
      }
      break;
    }
    case "build": {
      const targetDir = args[1] && !args[1].startsWith("-") ? path13.resolve(process.cwd(), args[1]) : process.cwd();
      const serviceArgIdx = args.indexOf("--service") !== -1 ? args.indexOf("--service") : args.indexOf("--orchestration");
      const targetService = serviceArgIdx !== -1 ? args[serviceArgIdx + 1] : void 0;
      const isAll = args.includes("--all");
      const res = await runBuild(targetDir, { service: targetService, orchestration: targetService, all: isAll });
      process.exit(res.success ? 0 : 1);
      break;
    }
    case "dev": {
      const targetDir = args[1] && !args[1].startsWith("-") ? path13.resolve(process.cwd(), args[1]) : process.cwd();
      const portArgIdx = args.indexOf("--port");
      const port = portArgIdx !== -1 ? parseInt(args[portArgIdx + 1], 10) : 8080;
      const serviceArgIdx = args.indexOf("--service") !== -1 ? args.indexOf("--service") : args.indexOf("--orchestration");
      const targetService = serviceArgIdx !== -1 ? args[serviceArgIdx + 1] : void 0;
      const isAll = args.includes("--all");
      const dryRun = args.includes("--dry-run") || args.includes("--once");
      const devInstance = await runDev(targetDir, { port, service: targetService, orchestration: targetService, all: isAll, dryRun });
      if (dryRun) {
        process.exit(0);
      }
      process.on("SIGINT", async () => {
        await devInstance.close();
        process.exit(0);
      });
      process.on("SIGTERM", async () => {
        await devInstance.close();
        process.exit(0);
      });
      break;
    }
    case "help":
    default: {
      console.log(`
\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557
\u2551             Krnl Backend Service Framework CLI                \u2551
\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255D

Usage: krnl <command> [options]

Commands:
  dev               Start Krnl service dev server with hot declaration watcher
  build             Validate, generate declarations, and compile project to dist/
  validate          Run deep AST & 4-layer function purity validation
  sync              Reconcile package.json from all co-located manifest.json files
  watch             Generate ambient TypeScript declarations (krnl-magnetic.d.ts)
  generate          Scaffold services, functionality-orchestrations, functionalities, libraries
                    Examples:
                      krnl generate service Payment
                      krnl generate service Payment --default-frontend=PaymentPage --default-frontend-package=@ultrst-armada/floks/ui --default-frontend-export=PaymentPage --default-frontend-relationship=required
                      krnl generate functionality-orchestration Payment
                      krnl generate functionality ProcessPayment Payment
                      krnl generate library TaxCalculator Payment

Options:
  --service <name>  Target a specific service variant to run or build
  --all             Run or build all services as a combined build
  --port <number>   Specify port for Krnl service dev server (default: 8080)
  --dry-run, --once Verify environment without running persistent server
  --watch, -w       Enable continuous file watcher (for watch command)
  --help, -h        Show this help message
`);
      break;
    }
  }
}
main().catch((err) => {
  console.error("\u274C Fatal error:", err);
  process.exit(1);
});
