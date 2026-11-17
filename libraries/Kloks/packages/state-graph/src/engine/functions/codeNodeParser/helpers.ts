// ════ CODENODEPARSER EXTRACTED HELPERS ════════════════════════════════════════════
import { UniversalSocketDefinition, SignalType, SignalMedium, SignalDataType, ConnectivityType } from "../../types/index.js";
import { ExposedVariableDef, ExposedFunctionDef, CodeNodeParsedIO } from './types';

export function stripComments(code: string): string {
  // Replace line comments // ... with blank spaces
  let result = code.replace(/\/\/[^\n\r]*/g, (match) => ' '.repeat(match.length));
  // Replace block comments /* ... */ with blank spaces
  result = result.replace(/\/\*[\s\S]*?\*\//g, (match) => {
    // Preserve newlines inside block comments
    return match.replace(/[^\n\r]/g, ' ');
  });
  return result;
}

export function parseInitialValue(valStr?: string): { defaultValue: any; inferredType: 'number' | 'string' | 'boolean' | 'object' | 'any'; signalType: SignalType } {
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

export function analyzeFunctionReturn(body: string, isArrowExpression: boolean): { isVoid: boolean; inferredReturnType: 'number' | 'string' | 'boolean' | 'object' | 'void' | 'any'; returnSignalType: SignalType } {
  if (isArrowExpression) {
    // Direct expression return e.g. () => x * 2
    return { isVoid: false, inferredReturnType: 'any', returnSignalType: 'object' };
  }

  // Look for return keyword in body
  const stripped = stripComments(body);
  const hasReturn = /\breturn\b/.test(stripped);
  
  if (!hasReturn) {
    return { isVoid: true, inferredReturnType: 'void', returnSignalType: 'trigger' };
  }

  return { isVoid: false, inferredReturnType: 'any', returnSignalType: 'object' };
}

export function extractBlockBody(source: string, startIndex: number): { body: string; endIndex: number } | null {
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
    return { body: source.slice(openBrace + 1, i - 1), endIndex: i };
  }
  return null;
}

export function parseCodeNodeIO(code: string): CodeNodeParsedIO {
  const variables: ExposedVariableDef[] = [];
  const functions: ExposedFunctionDef[] = [];

  if (!code || !code.trim()) {
    return { variables, functions };
  }

  const cleanCode = stripComments(code);

  // 1. Parse variables: `expose input let x = 10;` or `expose output var y;`
  const varRegex = /(?:(?:expose|port|io)\s+)?(input|in|output|out)\s+(?:(let|const|var)\s+)?([a-zA-Z_$][a-zA-Z0-9_$]*)(?:\s*=\s*([^;\\n\\r]+))?/g;
  let match;
  while ((match = varRegex.exec(cleanCode)) !== null) {
    const direction = (match[1] === 'input' || match[1] === 'in') ? 'input' : 'output';
    const name = match[3];
    const defaultExpr = match[4];
    const { defaultValue, inferredType, signalType } = parseInitialValue(defaultExpr);

    variables.push({
      name,
      direction,
      defaultValue,
      inferredType,
      signalType,
      rawDeclaration: match[0],
    });
  }

  // 2. Parse functions: `expose function onPulse(data) { ... }`
  const funcRegex = /(?:(?:expose|port|io)\s+)?function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(([^)]*)\)/g;
  while ((match = funcRegex.exec(cleanCode)) !== null) {
    const name = match[1];
    const params = match[2].split(',').map(p => p.trim()).filter(Boolean);
    const bodyInfo = extractBlockBody(code, match.index + match[0].length);
    
    if (bodyInfo) {
      const { isVoid, inferredReturnType, returnSignalType } = analyzeFunctionReturn(bodyInfo.body, false);
      functions.push({
        name,
        params,
        paramCount: params.length,
        isVoid,
        rawSignature: match[0],
        rawBody: bodyInfo.body,
        hasInputTrigger: true,
        acceptsPrimitiveOrObject: true,
        acceptsObjectSignature: params.length === 1,
        inferredReturnType,
        returnSignalType,
      });
    }
  }

  return { variables, functions };
}
