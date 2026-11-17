/**
 * JavaScript Code Linter and Validator for CodeNode Trigger Stream payloads.
 */

import { transpileCodeNodeScript } from './codeNodeParser';

export interface LintError {
  message: string;
  line?: number;
  column?: number;
}

export interface LintResult {
  isValid: boolean;
  error: LintError | null;
}

/**
 * Validates JavaScript code with support for custom syntax keywords ('expose input', 'expose output', 'expose function').
 */
export function lintJavaScriptCode(code: string): LintResult {
  if (!code || !code.trim()) {
    return { isValid: true, error: null };
  }

  try {
    // Transpile custom syntax before running JS compilation check
    const { transpiledCode } = transpileCodeNodeScript(code);
    new Function('pulse', 'context', '__runtime', transpiledCode);
    return { isValid: true, error: null };
  } catch (err: any) {
    const rawMessage = err?.message || String(err);
    let line: number | undefined;
    let column: number | undefined;

    // Extract line/column information from error if present
    const locMatch =
      rawMessage.match(/(\d+):(\d+)/) ||
      err.stack?.match(/<anonymous>:(\d+):(\d+)/) ||
      err.stack?.match(/Function:(\d+):(\d+)/);

    if (locMatch) {
      const parsedLine = parseInt(locMatch[1], 10);
      line = Math.max(1, parsedLine > 3 ? parsedLine - 3 : parsedLine);
      column = parseInt(locMatch[2], 10);
    }

    return {
      isValid: false,
      error: {
        message: rawMessage,
        line,
        column,
      },
    };
  }
}

/**
 * Default starter template for Code Nodes demonstrating custom syntax keywords:
 *   - 'expose input' to declare input variables as node sockets
 *   - 'expose output' to declare output variables as node sockets
 *   - 'expose function' to expose functions with dedicated input & output sockets
 */
export const DEFAULT_CODE_NODE_SCRIPT = `// ── CODE NODE: REACTIVE LOGIC & SIGNAL ROUTING ──
// Custom Syntax Keywords:
// • 'expose input let <name> = <val>;'   -> Creates an INPUT handle for variable
// • 'expose output let <name> = <val>;'  -> Creates an OUTPUT handle for variable
// • 'expose function <name>(<args>) {}'  -> Creates dedicated handles for function:
//     - 0 args: TRIGGER input handle (no output handle if void)
//     - 1 arg:  Accepts data primitive OR object
//     - >1 arg: Accepts object { arg1, arg2 } matching signature
//     - Return: Creates an OUTPUT handle (omitted if function is void)

expose input let accentGain = 1.0;
expose input let folder;
expose output let processedGain = 0;

// Void function: 0 inputs -> Trigger signal executes it (no output handle)
expose function resetGain() {
  accentGain = 1.0;
}

// Single-param function: Ingests primitive data or object, returns number -> Has output handle
expose function boostGain(amount) {
  accentGain = Math.min(2.0, accentGain + amount);
  return accentGain;
}

// Multi-param function: Ingests object { vol, pan } matching signature
expose function computeStereo(vol, pan) {
  return { left: vol * (1 - pan), right: vol * pan };
}

// Dynamic per-pulse stream processing
if (pulse) {
  pulse.intensity = (pulse.beat === 0 ? 1.0 : 0.65) * accentGain;
  processedGain = pulse.intensity;
  pulse.payloadData = { accentGain, folder };
}
`;
