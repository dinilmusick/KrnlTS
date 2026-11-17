// ════ CODENODEPARSER IMPLEMENTATION ══════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════════════════
import { UniversalSocketDefinition, SignalType } from "../../types/index.js";
import {
  parseCodeNodeIO,
  stripComments,
} from './helpers';
import { CodeNodeParsedIO } from './types';

/**
 * Transpiles raw CodeNode script into executable JS, injecting input resolution logic.
 */
export function transpileCodeNodeScript(rawCode: string): { transpiledCode: string; io: CodeNodeParsedIO } {
  const io = parseCodeNodeIO(rawCode);
  let code = rawCode;

  // Replace variable declarations with input resolution & valid JS variable declarations
  io.variables.forEach((v) => {
    const escapedName = v.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (v.direction === 'input') {
      const varRegex = new RegExp(
        `(?:(?:expose|port|io)\\s+)?(?:input|in)\\s+(?:(let|const|var)\\s+)?(${escapedName})(?:\\s*=\\s*([^;\\n\\r]+))?`,
        'g'
      );
      code = code.replace(varRegex, (_match, kind, name, defaultExpr) => {
        const declKind = kind || 'let';
        const fallback = defaultExpr ? defaultExpr.trim() : JSON.stringify(v.defaultValue ?? null);
        return `${declKind} ${name} = (__inputs && (__inputs['var_in_${name}'] !== undefined ? __inputs['var_in_${name}'] : __inputs['${name}']) !== undefined) ? (__inputs['var_in_${name}'] !== undefined ? __inputs['var_in_${name}'] : __inputs['${name}']) : (${fallback});`;
      });
    } else {
      const varRegex = new RegExp(
        `(?:(?:expose|port|io)\\s+)?(?:output|out)\\s+(?:(let|const|var)\\s+)?(${escapedName})(?:\\s*=\\s*([^;\\n\\r]+))?`,
        'g'
      );
      code = code.replace(varRegex, (_match, kind, name, defaultExpr) => {
        const declKind = kind || 'let';
        const fallback = defaultExpr ? defaultExpr.trim() : JSON.stringify(v.defaultValue ?? null);
        return `${declKind} ${name} = ${fallback};`;
      });
    }
  });

  const exportStatements = io.variables
    .filter(v => v.direction === 'output')
    .map(v => `__outputs['var_out_${v.name}'] = (typeof ${v.name} !== 'undefined') ? ${v.name} : null;`);

  const collectorFunc = `
    function __collectOutputs() {
      ${exportStatements.join('\n')}
    }
  `;

  code += collectorFunc;

  return { transpiledCode: code, io };
}

/**
 * Executes a transpiled CodeNode script within a controlled sandbox.
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
): { outputs: Record<string, any>; result: any; error: string | null } {
  const { transpiledCode } = transpileCodeNodeScript(rawScript);
  const outputs: Record<string, any> = {};
  let result: any = null;
  let error: string | null = null;

  try {
    const sandbox = new Function('__inputs', '__outputs', 'pulse', 'context', `
      ${transpiledCode}
      if (typeof __collectOutputs === 'function') {
        __collectOutputs();
      }
      ${options.targetFunction ? `return ${options.targetFunction}(pulse, context);` : 'return null;'}
    `);

    result = sandbox(options.inputs || {}, outputs, options.pulse, options.context);
  } catch (err: any) {
    error = err.message;
    console.error('CodeNode Execution Error:', err);
  }

  return { outputs, result, error };
}

/**
 * Generates UI socket handles based on parsed code IO signatures.
 */
export function generateCodeNodeSockets(
  code: string,
  createPackagedSocket: (opts: any) => UniversalSocketDefinition
): { inputs: UniversalSocketDefinition[]; outputs: UniversalSocketDefinition[] } {
  const io = parseCodeNodeIO(code);

  const inputs: UniversalSocketDefinition[] = [];
  const outputs: UniversalSocketDefinition[] = [];

  // 1. Primary Trigger Stream In
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

  // 2. Variable Inputs
  io.variables.filter(v => v.direction === 'input').forEach((v, idx) => {
    inputs.push(
      createPackagedSocket({
        socketId: `var_in_${v.name}`,
        label: v.name.toUpperCase(),
        polarity: 'input',
        medium: v.signalType === 'number' || v.signalType === 'string' || v.signalType === 'boolean' ? 'data' : 'omni',
        dataType: 'stream',
        signalType: v.signalType,
        connectivity: 'single',
        socketIndex: idx + 1,
        description: `Variable Input: External data for '${v.name}'`,
        iconName: 'database',
      })
    );
  });

  // 3. Primary Trigger Stream Out
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
      description: 'Trigger Stream Out: Dispatches enriched trigger pulses',
      iconName: 'zap',
    })
  );

  // 4. Variable Outputs
  io.variables.filter(v => v.direction === 'output').forEach((v, idx) => {
    outputs.push(
      createPackagedSocket({
        socketId: `var_out_${v.name}`,
        label: v.name.toUpperCase(),
        polarity: 'output',
        medium: v.signalType === 'number' || v.signalType === 'string' || v.signalType === 'boolean' ? 'data' : 'omni',
        dataType: 'stream',
        signalType: v.signalType,
        connectivity: 'multi',
        socketIndex: idx + 1,
        description: `Variable Output: Exported data from '${v.name}'`,
        iconName: 'share-2',
      })
    );
  });

  return { inputs, outputs };
}

export default {
  parseCodeNodeIO,
  transpileCodeNodeScript,
  executeCodeNodeScript,
  generateCodeNodeSockets,
};
