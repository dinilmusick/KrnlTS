import { UniversalSocketDefinition, SignalType, SignalMedium, SignalDataType, ConnectivityType } from "../types/index.js";
import { SIGNAL_TYPES } from './canonicalSignalTable';

export interface ExposedVariableDef {
  name: string;
  direction: 'input' | 'output';
  defaultValue?: any;
  inferredType: 'number' | 'string' | 'boolean' | 'object' | 'any';
  signalType: SignalType;
  rawDeclaration: string;
}

export interface ExposedFunctionDef {
  name: string;
  params: string[];
  paramCount: number;
  isVoid: boolean;
  rawSignature: string;
  rawBody: string;
  hasInputTrigger: boolean;
  acceptsPrimitiveOrObject: boolean;
  acceptsObjectSignature: boolean;
  inferredReturnType?: 'number' | 'string' | 'boolean' | 'object' | 'void' | 'any';
  returnSignalType?: SignalType;
}

export interface CodeNodeParsedIO {
  variables: ExposedVariableDef[];
  functions: ExposedFunctionDef[];
}

/**
 * Strips block comments and line comments while preserving line count/breaks
 */
function stripComments(code: string): string {
  // Replace line comments // ... with blank spaces
  let result = code.replace(/\/\/[^\n\r]*/g, (match) => ' '.repeat(match.length));
  // Replace block comments /* ... */ with blank spaces
  result = result.replace(/\/\*[\s\S]*?\*\//g, (match) => {
    // Preserve newlines inside block comments
    return match.replace(/[^\n\r]/g, ' ');
  });
  return result;
}

/**
 * Parses initial value expression and infers JS primitive type & SignalType
 */
function parseInitialValue(valStr?: string): { defaultValue: any; inferredType: 'number' | 'string' | 'boolean' | 'object' | 'any'; signalType: SignalType } {
  if (!valStr || !valStr.trim()) {
    return { defaultValue: undefined, inferredType: 'any', signalType: 'object' };
  }
  const trimmed = valStr.trim();

  // Number literal
  if (/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(trimmed)) {
    const num = Number(trimmed);
    return { defaultValue: num, inferredType: 'number', signalType: 'number' };
  }

  // String literal ('...', "...", `...`)
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
      (trimmed.startsWith('`') && trimmed.endsWith('`'))) {
    const str = trimmed.slice(1, -1);
    return { defaultValue: str, inferredType: 'string', signalType: 'string' };
  }

  // Boolean literal
  if (trimmed === 'true') {
    return { defaultValue: true, inferredType: 'boolean', signalType: 'boolean' };
  }
  if (trimmed === 'false') {
    return { defaultValue: false, inferredType: 'boolean', signalType: 'boolean' };
  }

  // Object or Array literal
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    try {
      // Evaluate standard JSON or JS literal safely
      const parsed = new Function(`return (${trimmed});`)();
      return { defaultValue: parsed, inferredType: 'object', signalType: 'object' };
    } catch {
      return { defaultValue: {}, inferredType: 'object', signalType: 'object' };
    }
  }

  return { defaultValue: trimmed, inferredType: 'any', signalType: 'object' };
}

/**
 * Checks whether a function body returns a non-void value.
 * Per specification: "there won't be an output handle if the function returns nothing (void)".
 */
function analyzeFunctionReturn(body: string, isArrowExpression: boolean): { isVoid: boolean; inferredReturnType: 'number' | 'string' | 'boolean' | 'object' | 'void' | 'any'; returnSignalType: SignalType } {
  if (isArrowExpression) {
    // Direct expression return e.g. () => x * 2
    return { isVoid: false, inferredReturnType: 'any', returnSignalType: 'object' };
  }

  const cleanBody = stripComments(body);

  // Look for return statements
  const returnRegex = /\breturn\b([^;}\n\r]*)/g;
  let match: RegExpExecArray | null;
  let hasMeaningfulReturn = false;
  let sampleReturnExpr = '';

  while ((match = returnRegex.exec(cleanBody)) !== null) {
    const expr = (match[1] || '').trim();
    if (expr && expr !== 'undefined' && expr !== 'void 0') {
      hasMeaningfulReturn = true;
      sampleReturnExpr = expr;
      break;
    }
  }

  if (!hasMeaningfulReturn) {
    return { isVoid: true, inferredReturnType: 'void', returnSignalType: 'trigger' };
  }

  // Infer return type from expression if obvious
  if (/^-?\d+(\.\d+)?$/.test(sampleReturnExpr) || sampleReturnExpr.includes('+') || sampleReturnExpr.includes('*') || sampleReturnExpr.includes('-')) {
    return { isVoid: false, inferredReturnType: 'number', returnSignalType: 'number' };
  }
  if (sampleReturnExpr.startsWith('"') || sampleReturnExpr.startsWith("'") || sampleReturnExpr.startsWith('`')) {
    return { isVoid: false, inferredReturnType: 'string', returnSignalType: 'string' };
  }
  if (sampleReturnExpr === 'true' || sampleReturnExpr === 'false' || sampleReturnExpr.includes('===') || sampleReturnExpr.includes('>') || sampleReturnExpr.includes('<')) {
    return { isVoid: false, inferredReturnType: 'boolean', returnSignalType: 'boolean' };
  }

  return { isVoid: false, inferredReturnType: 'any', returnSignalType: 'object' };
}

/**
 * Extracts balanced curly braces for function bodies
 */
function extractBlockBody(source: string, startIndex: number): { body: string; endIndex: number } | null {
  const openBrace = source.indexOf('{', startIndex);
  if (openBrace === -1) return null;

  let depth = 1;
  let i = openBrace + 1;
  let inString: string | null = null;
  let inEscape = false;

  while (i < source.length && depth > 0) {
    const char = source[i];

    if (inString) {
      if (inEscape) {
        inEscape = false;
      } else if (char === '\\') {
        inEscape = true;
      } else if (char === inString) {
        inString = null;
      }
    } else {
      if (char === '"' || char === "'" || char === '`') {
        inString = char;
      } else if (char === '{') {
        depth++;
      } else if (char === '}') {
        depth--;
      }
    }
    i++;
  }

  if (depth === 0) {
    return {
      body: source.slice(openBrace + 1, i - 1),
      endIndex: i,
    };
  }

  return null;
}

/**
 * Main parser for CodeNode scripts. Detects custom syntax keywords:
 *   - Variables: `expose input let/const/var <name> = <val>;`
 *                `expose output let/const/var <name> = <val>;`
 *                (also supports `expose in`, `expose out`, `port input`, `input let`, etc.)
 *   - Functions: `expose function <name>(<params>) { ... }`
 *                `expose async function <name>(<params>) { ... }`
 *                `expose const <name> = (<params>) => { ... };`
 */
export function parseCodeNodeIO(code: string): CodeNodeParsedIO {
  const variables: ExposedVariableDef[] = [];
  const functions: ExposedFunctionDef[] = [];

  if (!code || !code.trim()) {
    return { variables, functions };
  }

  const cleaned = stripComments(code);

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. Parse Exposed Variables
  // ─────────────────────────────────────────────────────────────────────────────
  // Matches keywords: (expose|port|io)? followed by (input|in|output|out) or (expose|port|io)
  const varPattern = /(?:(?:expose|port|io)\s+)?\b(input|in|output|out)\s+(?:(?:let|const|var)\s+)?([a-zA-Z_$][a-zA-Z0-9_$]*)(?:\s*=\s*([^;\n\r]+))?(?:;|\n|$)/gi;

  let vMatch: RegExpExecArray | null;
  const seenVarNames = new Set<string>();

  while ((vMatch = varPattern.exec(cleaned)) !== null) {
    const dirToken = (vMatch[1] || 'input').toLowerCase();
    const direction: 'input' | 'output' = (dirToken === 'output' || dirToken === 'out') ? 'output' : 'input';
    const name = vMatch[2];
    const rawVal = vMatch[3];

    if (!name || seenVarNames.has(name)) continue;
    if (rawVal && (rawVal.includes('=>') || /^(?:async\s+)?function\b/.test(rawVal.trim()))) continue;
    seenVarNames.add(name);

    const { defaultValue, inferredType, signalType } = parseInitialValue(rawVal);

    variables.push({
      name,
      direction,
      defaultValue,
      inferredType,
      signalType,
      rawDeclaration: vMatch[0].trim(),
    });
  }

  // Also support: `expose let <name> = <val>;` without input/output explicit tag -> defaults to input
  const defaultVarPattern = /(?:expose|port|io)\s+(?:let|const|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)(?:\s*=\s*([^;\n\r]+))?(?:;|\n|$)/gi;
  while ((vMatch = defaultVarPattern.exec(cleaned)) !== null) {
    const name = vMatch[1];
    const rawVal = vMatch[2];

    if (!name || seenVarNames.has(name)) continue;
    if (rawVal && (rawVal.includes('=>') || /^(?:async\s+)?function\b/.test(rawVal.trim()))) continue;
    seenVarNames.add(name);

    const { defaultValue, inferredType, signalType } = parseInitialValue(rawVal);
    variables.push({
      name,
      direction: 'input',
      defaultValue,
      inferredType,
      signalType,
      rawDeclaration: vMatch[0].trim(),
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. Parse Exposed Functions
  // ─────────────────────────────────────────────────────────────────────────────
  // Pattern A: `expose [async] function <name>(<params>) { ... }`
  const standardFnPattern = /(?:expose|port|io)\s+(?:async\s+)?function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(([^)]*)\)/gi;
  let fnMatch: RegExpExecArray | null;
  const seenFnNames = new Set<string>();

  while ((fnMatch = standardFnPattern.exec(cleaned)) !== null) {
    const name = fnMatch[1];
    const paramsRaw = fnMatch[2] || '';
    const matchEnd = fnMatch.index + fnMatch[0].length;

    if (!name || seenFnNames.has(name)) continue;

    const block = extractBlockBody(cleaned, matchEnd);
    const body = block ? block.body : '';

    const params = paramsRaw
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);

    const paramCount = params.length;
    const { isVoid, inferredReturnType, returnSignalType } = analyzeFunctionReturn(body, false);

    seenFnNames.add(name);
    functions.push({
      name,
      params,
      paramCount,
      isVoid,
      rawSignature: `(${params.join(', ')})`,
      rawBody: body,
      hasInputTrigger: paramCount === 0,
      acceptsPrimitiveOrObject: paramCount === 1,
      acceptsObjectSignature: paramCount > 1,
      inferredReturnType,
      returnSignalType,
    });
  }

  // Pattern B: `expose const/let/var <name> = [async] (<params>) => { ... }`
  const arrowFnPattern = /(?:expose|port|io)\s+(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(?:async\s+)?(?:\(([^)]*)\)|([a-zA-Z_$][a-zA-Z0-9_$]*))\s*=>/gi;
  while ((fnMatch = arrowFnPattern.exec(cleaned)) !== null) {
    const name = fnMatch[1];
    const paramsRaw = fnMatch[2] ?? fnMatch[3] ?? '';
    const matchEnd = fnMatch.index + fnMatch[0].length;

    if (!name || seenFnNames.has(name)) continue;

    const restAfterArrow = cleaned.slice(matchEnd).trim();
    let body = '';
    let isArrowExpr = false;

    if (restAfterArrow.startsWith('{')) {
      const block = extractBlockBody(cleaned, matchEnd);
      body = block ? block.body : '';
    } else {
      isArrowExpr = true;
      const endStmt = restAfterArrow.indexOf(';');
      body = endStmt !== -1 ? restAfterArrow.slice(0, endStmt) : restAfterArrow.split('\n')[0];
    }

    const params = paramsRaw
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);

    const paramCount = params.length;
    const { isVoid, inferredReturnType, returnSignalType } = analyzeFunctionReturn(body, isArrowExpr);

    seenFnNames.add(name);
    functions.push({
      name,
      params,
      paramCount,
      isVoid,
      rawSignature: `(${params.join(', ')})`,
      rawBody: body,
      hasInputTrigger: paramCount === 0,
      acceptsPrimitiveOrObject: paramCount === 1,
      acceptsObjectSignature: paramCount > 1,
      inferredReturnType,
      returnSignalType,
    });
  }

  return { variables, functions };
}

/**
 * Transpiles custom syntax keywords into standard JavaScript ready for execution.
 * Replaces keywords while maintaining line and column alignments as closely as possible.
 */
export function transpileCodeNodeScript(rawCode: string): { transpiledCode: string; io: CodeNodeParsedIO } {
  const io = parseCodeNodeIO(rawCode);
  let code = rawCode;

  // Replace variable declarations:
  // e.g. `expose input let x = 10;`
  // -> `let x = (__inputs && (__inputs['var_in_x'] !== undefined ? __inputs['var_in_x'] : __inputs['x']) !== undefined) ? (__inputs['var_in_x'] !== undefined ? __inputs['var_in_x'] : __inputs['x']) : 10;`
  io.variables.forEach((v) => {
    if (v.direction === 'input') {
      const escapedName = v.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const varRegex = new RegExp(
        `(?:(?:expose|port|io)\\s+)?(?:input|in)\\s+(?:(let|const|var)\\s+)?(${escapedName})(?:\\s*=\\s*([^;\\n\\r]+))?`,
        'g'
      );
      code = code.replace(varRegex, (_match, kind, name, defaultExpr) => {
        const declKind = kind || 'let';
        const fallback = defaultExpr ? defaultExpr.trim() : JSON.stringify(v.defaultValue ?? null);
        return `${declKind} ${name} = (__inputs && (__inputs['var_in_${name}'] !== undefined ? __inputs['var_in_${name}'] : __inputs['${name}']) !== undefined) ? (__inputs['var_in_${name}'] !== undefined ? __inputs['var_in_${name}'] : __inputs['${name}']) : (${fallback})`;
      });

      // Default `expose let x = 10;`
      const defRegex = new RegExp(
        `(?:expose|port|io)\\s+(let|const|var)\\s+(${escapedName})(?:\\s*=\\s*([^;\\n\\r]+))?`,
        'g'
      );
      code = code.replace(defRegex, (_match, kind, name, defaultExpr) => {
        const declKind = kind || 'let';
        const fallback = defaultExpr ? defaultExpr.trim() : JSON.stringify(v.defaultValue ?? null);
        return `${declKind} ${name} = (__inputs && (__inputs['var_in_${name}'] !== undefined ? __inputs['var_in_${name}'] : __inputs['${name}']) !== undefined) ? (__inputs['var_in_${name}'] !== undefined ? __inputs['var_in_${name}'] : __inputs['${name}']) : (${fallback})`;
      });
    } else {
      // Output variable:
      // e.g. `expose output let y = 20;` -> `let y = 20;`
      const escapedName = v.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const varRegex = new RegExp(
        `(?:(?:expose|port|io)\\s+)?(?:output|out)\\s+(?:(let|const|var)\\s+)?(${escapedName})(?:\\s*=\\s*([^;\\n\\r]+))?`,
        'g'
      );
      code = code.replace(varRegex, (_match, kind, name, defaultExpr) => {
        const declKind = kind || 'let';
        const fallback = defaultExpr ? defaultExpr.trim() : JSON.stringify(v.defaultValue ?? null);
        return `${declKind} ${name} = (${fallback})`;
      });
    }
  });

  // Replace function keyword declarations:
  // e.g. `expose function play()` -> `function play()`
  // and `expose async function play()` -> `async function play()`
  // and `expose const play = () =>` -> `const play = () =>`
  code = code.replace(/(?:expose|port|io)\s+(function\s+[a-zA-Z_$][a-zA-Z0-9_$]*)/g, '$1');
  code = code.replace(/(?:expose|port|io)\s+(async\s+function\s+[a-zA-Z_$][a-zA-Z0-9_$]*)/g, '$1');
  code = code.replace(/(?:expose|port|io)\s+((?:const|let|var)\s+[a-zA-Z_$][a-zA-Z0-9_$]*\s*=)/g, '$1');

  // Register exposed functions and output variables at runtime:
  const exportStatements: string[] = [];
  io.functions.forEach((f) => {
    exportStatements.push(`if (typeof ${f.name} === 'function') { __exposedFunctions['${f.name}'] = ${f.name}; }`);
  });
  io.variables.forEach((v) => {
    if (v.direction === 'output') {
      exportStatements.push(`try { if (typeof ${v.name} !== 'undefined') { __outputs['${v.name}'] = ${v.name}; __outputs['var_out_${v.name}'] = ${v.name}; } } catch (e) {}`);
    } else {
      // Also mirror final input variable value
      exportStatements.push(`try { if (typeof ${v.name} !== 'undefined') { __inputs['${v.name}'] = ${v.name}; } } catch (e) {}`);
    }
  });

  const fullTranspiled = `
    const __inputs = (__runtime && __runtime.inputs) || {};
    const __outputs = {};
    const __exposedFunctions = {};

    function __collectOutputs() {
      ${exportStatements.join('\n')}
    }

    ${code}

    __collectOutputs();

    return {
      outputs: __outputs,
      exposedFunctions: __exposedFunctions,
      inputs: __inputs,
      collectOutputs: __collectOutputs,
      payloadData: pulse && pulse.payloadData ? pulse.payloadData : {}
    };
  `;

  return {
    transpiledCode: fullTranspiled,
    io,
  };
}

/**
 * Safely executes CodeNode JavaScript with support for exposed variables and function handles.
 */
export function executeCodeNodeScript(
  rawScript: string,
  options: {
    pulse?: any;
    context?: any;
    inputs?: Record<string, any>;
    targetFunction?: string;
    functionArgs?: any;
  }
): {
  success: boolean;
  outputs: Record<string, any>;
  functionResult?: any;
  error?: string | null;
  exposedFunctions?: Record<string, Function>;
  enrichedPulse?: any;
} {
  const { transpiledCode, io } = transpileCodeNodeScript(rawScript);

  try {
    const fn = new Function('pulse', 'context', '__runtime', transpiledCode);
    const pulseClone = options.pulse ? JSON.parse(JSON.stringify(options.pulse)) : { intensity: 1, payloadData: {} };
    const runtime = { inputs: { ...(options.inputs || {}) } };

    const executionResult = fn(pulseClone, options.context || {}, runtime);
    const exposedFunctions = executionResult.exposedFunctions || {};
    let functionResult: any = undefined;

    // If an external trigger or data socket specifically invoked a target function:
    if (options.targetFunction && exposedFunctions[options.targetFunction]) {
      const targetFn = exposedFunctions[options.targetFunction];
      const fnMeta = io.functions.find((f) => f.name === options.targetFunction);

      if (fnMeta) {
        if (fnMeta.paramCount === 0) {
          // Zero params: Trigger execution
          functionResult = targetFn();
        } else if (fnMeta.paramCount === 1) {
          // Single param: Can receive either a primitive or an object
          const arg = options.functionArgs;
          let passedVal = arg;
          if (arg && typeof arg === 'object' && fnMeta.params[0] in arg) {
            passedVal = arg[fnMeta.params[0]];
          }
          functionResult = targetFn(passedVal);
        } else {
          // Multiple params: Ingests object matching signature { p1, p2, ... }
          const arg = options.functionArgs || {};
          const callArgs = fnMeta.params.map((p) => (arg && typeof arg === 'object' ? arg[p] : undefined));
          functionResult = targetFn(...callArgs);
        }

        // Re-collect outputs to capture any state changes made by targetFn
        if (typeof executionResult.collectOutputs === 'function') {
          executionResult.collectOutputs();
        }
      }
    }

    const outputs = { ...(executionResult.outputs || {}) };

    if (options.targetFunction) {
      const fnMeta = io.functions.find((f) => f.name === options.targetFunction);
      if (fnMeta && !fnMeta.isVoid && functionResult !== undefined) {
        outputs[fnMeta.name] = functionResult;
        outputs[`fn_out_${fnMeta.name}`] = functionResult;
      }
    }

    return {
      success: true,
      outputs,
      functionResult,
      error: null,
      exposedFunctions,
      enrichedPulse: pulseClone,
    };
  } catch (err: any) {
    return {
      success: false,
      outputs: {},
      error: err?.message || String(err),
    };
  }
}

/**
 * Universal Socket Builder for CodeNode instances.
 * Dynamically builds input handles and output handles for:
 *   1. Standard Trigger Stream In/Out
 *   2. Custom Exposed Input Variables (`var_in_<name>`)
 *   3. Custom Exposed Output Variables (`var_out_<name>`)
 *   4. Custom Exposed Functions (`fn_in_<name>` -> Trigger or Data Primitive/Object In)
 *   5. Custom Exposed Function Returns (`fn_out_<name>` -> Data Out, strictly omitted if void)
 *   6. Data In / Data Out ports
 */
export function generateCodeNodeSockets(
  code: string,
  createPackagedSocket: (opts: any) => UniversalSocketDefinition
): { inputs: UniversalSocketDefinition[]; outputs: UniversalSocketDefinition[] } {
  const io = parseCodeNodeIO(code);

  const inputs: UniversalSocketDefinition[] = [];
  const outputs: UniversalSocketDefinition[] = [];

  // 1. Primary Trigger Stream In (Always first input handle)
  inputs.push(
    createPackagedSocket({
      socketId: 'trigger_in',
      label: 'TRIG STR IN',
      polarity: 'input',
      medium: 'trigger',
      dataType: 'stream',
      signalType: 'trigger_stream',
      connectivity: 'single',
      socketIndex: 0,
      description: 'Trigger Stream In: Ingests incoming stream of rhythm trigger pulses to enrich with custom code payload',
      iconName: 'zap',
    })
  );

  // 2. Custom Exposed Input Variables
  const inputVars = io.variables.filter((v) => v.direction === 'input');
  inputVars.forEach((v) => {
    const typeLabel = v.inferredType.toUpperCase();
    inputs.push(
      createPackagedSocket({
        socketId: `var_in_${v.name}`,
        label: `${v.name.toUpperCase()} IN`,
        polarity: 'input',
        medium: 'data',
        dataType: 'stream',
        signalType: v.signalType,
        connectivity: 'single',
        socketIndex: inputs.length,
        description: `Exposed Variable Input: ${v.name} (${typeLabel}, default: ${JSON.stringify(v.defaultValue ?? null)})`,
        iconName: v.inferredType === 'number' ? 'hash' : v.inferredType === 'string' ? 'file-text' : v.inferredType === 'boolean' ? 'toggle-left' : 'braces',
        customMeta: { isExposedVar: true, varName: v.name, defaultValue: v.defaultValue, inferredType: v.inferredType },
      })
    );
  });

  // 3. Custom Exposed Function Input Handles
  io.functions.forEach((f) => {
    if (f.paramCount === 0) {
      // 0 parameters: Trigger signal handle to run the function
      inputs.push(
        createPackagedSocket({
          socketId: `fn_in_${f.name}`,
          label: `${f.name.toUpperCase()} TRIG`,
          polarity: 'input',
          medium: 'trigger',
          dataType: 'pulse',
          signalType: 'trigger',
          connectivity: 'single',
          socketIndex: inputs.length,
          description: `Function Trigger In: Invokes ${f.name}() without arguments on incoming trigger pulse`,
          iconName: 'play',
          customMeta: { isExposedFunction: true, fnName: f.name, paramCount: 0, isVoid: f.isVoid },
        })
      );
    } else if (f.paramCount === 1) {
      // 1 parameter: Ingests either a single primitive or an object
      inputs.push(
        createPackagedSocket({
          socketId: `fn_in_${f.name}`,
          label: `${f.name.toUpperCase()} (${f.params[0].toUpperCase()})`,
          polarity: 'input',
          medium: 'data',
          dataType: 'stream',
          signalType: 'object',
          connectivity: 'single',
          socketIndex: inputs.length,
          description: `Function Input: Ingests data primitive or object { ${f.params[0]} } to invoke ${f.name}(${f.params[0]})`,
          iconName: 'code-2',
          customMeta: { isExposedFunction: true, fnName: f.name, paramCount: 1, params: f.params, isVoid: f.isVoid },
        })
      );
    } else {
      // >1 parameters: Ingests structured object matching signature
      const signatureLabel = f.params.join(',').toUpperCase();
      inputs.push(
        createPackagedSocket({
          socketId: `fn_in_${f.name}`,
          label: `${f.name.toUpperCase()} ({${signatureLabel}})`,
          polarity: 'input',
          medium: 'data',
          dataType: 'stream',
          signalType: 'object',
          connectivity: 'single',
          socketIndex: inputs.length,
          description: `Function Signature Input: Ingests structured object { ${f.params.join(', ')} } into ${f.name}()`,
          iconName: 'braces',
          customMeta: { isExposedFunction: true, fnName: f.name, paramCount: f.paramCount, params: f.params, isVoid: f.isVoid },
        })
      );
    }
  });

  // 4. General Data In (Receptacle for unstructured object/primitive context)
  inputs.push(
    createPackagedSocket({
      socketId: 'data_in',
      label: 'DATA IN',
      polarity: 'input',
      medium: 'data',
      dataType: 'stream',
      signalType: 'object',
      connectivity: 'single',
      socketIndex: inputs.length,
      description: 'Data / Parameters In: Ingests structured object or primitive values into script context',
      iconName: 'braces',
    })
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // OUTPUTS
  // ─────────────────────────────────────────────────────────────────────────────
  // 1. Primary Trigger Stream Out (Always first output handle)
  outputs.push(
    createPackagedSocket({
      socketId: 'trigger_out',
      label: 'TRIG STR OUT',
      polarity: 'output',
      medium: 'trigger',
      dataType: 'stream',
      signalType: 'trigger_stream',
      connectivity: 'multi',
      socketIndex: 0,
      description: 'Trigger Stream Out: Outputs trigger pulses enriched with custom code payload',
      iconName: 'zap',
    })
  );

  // 2. Custom Exposed Output Variables
  const outputVars = io.variables.filter((v) => v.direction === 'output');
  outputVars.forEach((v) => {
    const typeLabel = v.inferredType.toUpperCase();
    outputs.push(
      createPackagedSocket({
        socketId: `var_out_${v.name}`,
        label: `${v.name.toUpperCase()} OUT`,
        polarity: 'output',
        medium: 'data',
        dataType: 'stream',
        signalType: v.signalType,
        connectivity: 'multi',
        socketIndex: outputs.length,
        description: `Exposed Variable Output: Emits updated ${v.name} (${typeLabel})`,
        iconName: v.inferredType === 'number' ? 'hash' : v.inferredType === 'string' ? 'file-text' : v.inferredType === 'boolean' ? 'toggle-left' : 'braces',
        customMeta: { isExposedVar: true, varName: v.name, inferredType: v.inferredType },
      })
    );
  });

  // 3. Custom Exposed Function Returns (ONLY if function is NOT void!)
  // User Requirement: "there won't be an output handle if the function returns nothing ( void)"
  io.functions.forEach((f) => {
    if (!f.isVoid) {
      outputs.push(
        createPackagedSocket({
          socketId: `fn_out_${f.name}`,
          label: `${f.name.toUpperCase()} OUT`,
          polarity: 'output',
          medium: 'data',
          dataType: 'stream',
          signalType: f.returnSignalType || 'object',
          connectivity: 'multi',
          socketIndex: outputs.length,
          description: `Function Output: Emits return value computed by ${f.name}()`,
          iconName: 'code-2',
          customMeta: { isExposedFunctionReturn: true, fnName: f.name, returnType: f.inferredReturnType },
        })
      );
    }
  });

  // 4. General Data Out
  outputs.push(
    createPackagedSocket({
      socketId: 'data_out',
      label: 'DATA OUT',
      polarity: 'output',
      medium: 'data',
      dataType: 'stream',
      signalType: 'object',
      connectivity: 'multi',
      socketIndex: outputs.length,
      description: 'Data Out: Outputs evaluated script data object payload',
      iconName: 'braces',
    })
  );

  return { inputs, outputs };
}
