import { NodeRegistry } from "../registry/index.js";
import { MemoryStore } from "../memory/index.js";
import { GraphJSON, NodeJSON, ErrorCategory, Severity } from "../types/graph.js";
import { normalizeError } from "../error/index.js";
import { ExecutionContext } from "./context.js";

function isValidIdentifier(name: string): boolean {
  if (!/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name)) {
    return false;
  }
  const reserved = new Set([
    "break", "case", "catch", "class", "const", "continue", "debugger", "default",
    "delete", "do", "else", "export", "extends", "finally", "for", "function",
    "if", "import", "in", "instanceof", "new", "return", "super", "switch",
    "this", "throw", "try", "typeof", "var", "void", "while", "with", "yield",
    "let", "static", "enum", "await", "null", "true", "false"
  ]);
  return !reserved.has(name);
}

export function findFirstAndLastExecNodes(graph: any): { firstNodeId: string | null, lastNodeId: string | null } {
  if (!graph || !graph.nodes || graph.nodes.length === 0) {
    return { firstNodeId: null, lastNodeId: null };
  }

  const nodes = graph.nodes;
  const edges = graph.edges || [];

  // Filter execution edges (yellow flow lines)
  const execEdges = edges.filter((e: any) => e.sourceHandle === "exec-out" || e.sourceHandle?.startsWith("exec-out-") || e.targetHandle === "exec-in");

  if (execEdges.length === 0) {
    // If no execution edges exist, find the first non-constant/non-variable node, or just the first node
    const activeNodes = nodes.filter((n: any) => {
      const type = n.type || n.data?.nodeType || "";
      return type !== "core/constant" && type !== "core/primitive" && !type.startsWith("variables/");
    });
    const firstNode = activeNodes[0] || nodes[0];
    const lastNode = activeNodes[activeNodes.length - 1] || nodes[nodes.length - 1];
    return {
      firstNodeId: firstNode ? firstNode.id : null,
      lastNodeId: lastNode ? lastNode.id : null
    };
  }

  const execSources = new Set<string>(execEdges.map((e: any) => e.source));
  const execTargets = new Set<string>(execEdges.map((e: any) => e.target));

  // Find the first node: is a source but not a target
  let firstNodeId = Array.from(execSources).find(id => !execTargets.has(id)) || null;
  // Find the last node: is a target but not a source
  let lastNodeId = Array.from(execTargets).find(id => !execSources.has(id)) || null;

  // Fallbacks in case of circular exec loops or single node
  if (!firstNodeId && execSources.size > 0) {
    firstNodeId = Array.from(execSources)[0];
  }
  if (!lastNodeId && execTargets.size > 0) {
    lastNodeId = Array.from(execTargets)[execTargets.size - 1];
  }

  return { firstNodeId, lastNodeId };
}

export async function executeNode(
  node: NodeJSON,
  graph: GraphJSON,
  memory: MemoryStore,
  context?: ExecutionContext,
  registry: NodeRegistry = new NodeRegistry()
): Promise<Record<string, any>> {
  const definition = registry.getDefinition(node.type);

  if (!definition) {
    const registryError = new Error(`Node type '${node.type}' is not registered in the engine registry.`);
    (registryError as any).code = "MISSING_NODE";
    (registryError as any).category = ErrorCategory.Validation;
    (registryError as any).severity = Severity.Fatal;
    
    const normalized = normalizeError(registryError, node.id, graph.metadata?.id);
    if (context) {
      context.errorCollector.addError(normalized);
    }
    throw registryError;
  }

  // 1. Resolve connected inputs dynamically from incoming edges
  const resolvedInputs: Record<string, any> = {};
  const incomingEdges = graph.edges.filter(edge => edge.target === node.id);
  
  // Pre-initialize all expected input variable names as undefined so they exist in scope
  if (node.data && node.data.inputVariables) {
    Object.values(node.data.inputVariables).forEach((varName: any) => {
      if (typeof varName === "string" && varName) {
        resolvedInputs[varName] = undefined;
      }
    });
  }
  if (node.data && Array.isArray(node.data.inputs)) {
    node.data.inputs.forEach((input: any) => {
      if (input && typeof input.value === "string" && input.value) {
        resolvedInputs[input.value] = undefined;
      }
    });
  }

  incomingEdges.forEach(edge => {
    // Look up the registered variable name for this connection, e.g. "math_add_1"
    const inputVarName = node.data.inputVariables?.[edge.id] ||
                         ((node.type === "core/group" || node.data?.nodeType === "core/group") && edge.targetHandle ? edge.targetHandle : null) ||
                         node.data.inputVariables?.[edge.source] ||
                         `input_${edge.source.split("-").pop()}`;
    
    // Retrieve value from source node's specific output cached in isolated memory (falls back to "result")
    const sourceOutputName = edge.sourceHandle || "result";
    const sourceValue = memory.getNodeOutput(edge.source, sourceOutputName);
    if (sourceValue !== undefined) {
      resolvedInputs[inputVarName] = sourceValue;
      // Native nodes consume canonical port IDs rather than generated JS variable names.
      if (definition.metadata.nativeExecution && edge.targetHandle) {
        resolvedInputs[edge.targetHandle] = sourceValue;
      }
    } else {
      // Keep it defined as null in scope if not ready/undefined
      if (resolvedInputs[inputVarName] === undefined) {
        resolvedInputs[inputVarName] = null;
      }
      if (definition.metadata.nativeExecution && edge.targetHandle && resolvedInputs[edge.targetHandle] === undefined) {
        resolvedInputs[edge.targetHandle] = null;
      }
    }
  });

  // Also read any default or user configured properties from node data
  Object.entries(definition.inputs || {}).forEach(([key, inputDef]) => {
    if (resolvedInputs[key] !== undefined) return;
    if (node.data[key] !== undefined) {
      resolvedInputs[key] = node.data[key];
    } else if (inputDef.defaultValue !== undefined) {
      resolvedInputs[key] = inputDef.defaultValue;
    }
  });

  // Map Group's "input" variable to firstNodeId inputs if we are inside a sub-scheduler (i.e. memory has a variable "input")
  const parentInput = memory.getVariable("input");
  if (parentInput !== undefined) {
    const { firstNodeId } = findFirstAndLastExecNodes(graph);
    if (node.id === firstNodeId) {
      Object.keys(definition.inputs || {}).forEach(key => {
        if (resolvedInputs[key] === undefined || resolvedInputs[key] === null) {
          resolvedInputs[key] = parentInput;
        }
      });
      if (node.data && node.data.inputVariables) {
        Object.values(node.data.inputVariables).forEach((varName: any) => {
          if (typeof varName === "string" && varName && (resolvedInputs[varName] === undefined || resolvedInputs[varName] === null)) {
            resolvedInputs[varName] = parentInput;
          }
        });
      }
      if (resolvedInputs["input"] === undefined || resolvedInputs["input"] === null) {
        resolvedInputs["input"] = parentInput;
      }
    }
  }

  // Extract retry settings from node configurations or fallback to defaults
  const retryCount = typeof node.data.retryCount === "number" ? node.data.retryCount : 0;
  const retryDelay = typeof node.data.retryDelay === "number" ? node.data.retryDelay : 1000;
  const exponentialBackoff = !!node.data.exponentialBackoff;

  let attempt = 0;
  let lastError: any = null;

  while (attempt <= retryCount) {
    if (context?.isCancelled()) {
      const cancelErr = new Error("Execution cancelled.");
      (cancelErr as any).code = "EXECUTION_CANCELLED";
      throw cancelErr;
    }

    try {
      if (attempt === 0) {
        memory.log(`[Executing] Node '${node.id}' [${definition.metadata.displayName}]`, "info", node.id);
      } else {
        memory.log(`[Executing] Node '${node.id}' [${definition.metadata.displayName}] (Attempt ${attempt + 1}/${retryCount + 1})`, "info", node.id);
      }

      if (definition.metadata.nativeExecution) {
        const nativeOutputs = await definition.execute(resolvedInputs, memory, node.id, context);
        const outputs = nativeOutputs && typeof nativeOutputs === "object" ? nativeOutputs : { result: nativeOutputs };
        memory.setNodeOutputs(node.id, outputs);
        memory.log(`[Success] Native node '${node.id}' finished.`, "success", node.id);
        return outputs;
      }

      if (node.type === "custom/js-block") {
        if (!context?.services.customCode || !context.principal || !context.workspaceId) {
          throw new Error("Custom JavaScript blocks require an isolated Aiko code execution service.");
        }
        const customOutputs = await context.services.customCode.execute({
          code: String(node.data.code || ""),
          inputs: resolvedInputs,
          variables: context.getVariables(),
          executionId: context.executionId,
          workspaceId: context.workspaceId
        }, context.principal, context.signal);
        memory.setNodeOutputs(node.id, customOutputs);
        memory.log("[Success] Isolated custom code node '" + node.id + "' finished.", "success", node.id);
        return customOutputs;
      }
      // Only source-controlled defaults execute in-process. Graph-authored code is
      // delegated to an isolated service and never evaluated in the Aiko API process.
      const code = definition.metadata.defaultCode || "// No trusted default code is registered for this node.\nreturn null;";

      // Capture console logs inside user code
      const consoleLogs: string[] = [];
      const customConsole = {
        log: (...args: any[]) => {
          consoleLogs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(" "));
        },
        info: (...args: any[]) => {
          consoleLogs.push("[INFO] " + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(" "));
        },
        warn: (...args: any[]) => {
          consoleLogs.push("[WARN] " + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(" "));
        },
        error: (...args: any[]) => {
          consoleLogs.push("[ERROR] " + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(" "));
        }
      };

      const aiHelper = {
        generate: async (prompt: string, contextData: any = {}) => {
          if (!context?.services.ai) throw new Error("No Aiko AI service was provided to this graph execution.");
          return context.services.ai.generate(prompt, contextData, context.principal, context.signal);
        }
      };

      // Retrieve state variables so they are accessible inside code
      const workflowVars = { ...memory.getVariables() };



      const loadedLibs: Record<string, any> = { ...(context?.services.libraries || {}) };
      const requestedLibraries = (graph as any).libraries || [];
      for (const lib of requestedLibraries) {
        if (!loadedLibs[lib.alias || lib.name]) {
          throw new Error("Graph dependency '" + lib.name + "' was not supplied by Aiko trusted execution services.");
        }
      }

      // Prepare function parameters
      const argKeys = [
        "inputs", 
        "ai", 
        "console", 
        "variables"
      ];
      const argVals = [
        resolvedInputs, 
        aiHelper, 
        customConsole, 
        workflowVars
      ];

      Object.entries(resolvedInputs).forEach(([key, val]) => {
        if (isValidIdentifier(key)) {
          argKeys.push(key);
          argVals.push(val);
        }
      });
      

      Object.entries(loadedLibs).forEach(([key, val]) => {
        if (isValidIdentifier(key)) {
          argKeys.push(key);
          argVals.push(val);
        }
      });

      const fnBody = `
        return (async () => {
          ${code}
        })();
      `;

      let executionPromise: Promise<any>;
      try {
        const runFn = new Function(...argKeys, fnBody);
        executionPromise = runFn(...argVals);
      } catch (compileErr: any) {
        throw new Error(`Syntax/Compile Error in Javascript Block: ${compileErr.message}`);
      }

      const nodeTimeout = typeof node.data.timeout === "number" ? node.data.timeout : ((graph as any).settings?.executionTimeout || 5000);
      if (nodeTimeout > 0) {
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            const timeoutErr = new Error(`Node execution timed out after ${nodeTimeout} ms.`);
            (timeoutErr as any).code = "NETWORK_TIMEOUT";
            (timeoutErr as any).category = ErrorCategory.Network;
            (timeoutErr as any).severity = Severity.Error;
            reject(timeoutErr);
          }, nodeTimeout);
        });
        executionPromise = Promise.race([executionPromise, timeoutPromise]);
      }

      const rawResult = await executionPromise;

      // Wrap rawResult inside a single result output, merging custom outputs if rawResult is an object
      const outputs = {
        result: rawResult,
        ...(rawResult && typeof rawResult === "object" && !Array.isArray(rawResult) ? rawResult : {})
      };

      // Persist any updated variables back to memory
      Object.entries(workflowVars).forEach(([k, v]) => {
        memory.setVariable(k, v);
      });

      // Write captured user logs back to engine logs
      consoleLogs.forEach(msg => {
        memory.log(`[User Console] ${msg}`, "info", node.id);
      });

      // Cache outputs in MemoryStore
      memory.setNodeOutputs(node.id, outputs);

      const outputString = typeof rawResult === "object" ? JSON.stringify(rawResult) : String(rawResult);
      memory.log(`[Success] Node '${node.id}' finished. Output: ${outputString}`, "success", node.id);
      
      return outputs;
    } catch (error: any) {
      lastError = error;
      const normalized = normalizeError(error, node.id, graph.metadata?.id);
      
      if (context) {
        context.errorCollector.addError(normalized);
      }

      if (attempt < retryCount && normalized.retryable) {
        attempt++;
        const currentDelay = exponentialBackoff ? retryDelay * Math.pow(2, attempt - 1) : retryDelay;
        memory.log(`[Retry] Node '${node.id}' failed: ${normalized.message} (Attempt ${attempt}/${retryCount}). Retrying in ${currentDelay}ms...`, "warn", node.id);
        
        if (context) {
          context.errorCollector.addRetry(node.id, attempt, error);
        }
        
        await new Promise(resolve => setTimeout(resolve, currentDelay));
      } else {
        // Log final failure
        memory.setError(node.id, normalized.message);
        memory.log(`[Failure] Node '${node.id}' failed: ${normalized.message}`, "error", node.id);
        throw error;
      }
    }
  }

  throw lastError;
}
