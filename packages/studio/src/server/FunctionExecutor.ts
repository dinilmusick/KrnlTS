import * as path from 'path';
import * as fs from 'fs';
import { pathToFileURL } from 'url';
import * as esbuild from 'esbuild';

export interface FunctionExecutionRequest {
  filePath: string;
  functionName?: string;
  input?: any;
  state?: any;
}

export interface FunctionExecutionResult {
  success: boolean;
  output?: any;
  durationMs: number;
  memoryDeltaBytes: number;
  error?: string;
  logs: string[];
}

export class FunctionExecutor {
  /**
   * Executes a specific function, entity, or library in an isolated sandbox with metrics.
   */
  static async execute(request: FunctionExecutionRequest): Promise<FunctionExecutionResult> {
    const startTime = performance.now();
    const initialMem = process.memoryUsage().heapUsed;
    const logs: string[] = [];

    let absPath = path.resolve(request.filePath);
    if (!fs.existsSync(absPath)) {
      return {
        success: false,
        durationMs: 0,
        memoryDeltaBytes: 0,
        error: `File not found: ${absPath}`,
        logs: []
      };
    }

    if (fs.lstatSync(absPath).isDirectory()) {
      const base = path.basename(absPath);
      const candidates = [
        path.join(absPath, 'main_function/logic.ts'),
        path.join(absPath, `${base}.ts`),
        path.join(absPath, 'index.ts'),
        path.join(absPath, 'entity.ts')
      ];
      const found = candidates.find(c => fs.existsSync(c));
      if (found) {
        absPath = found;
      } else {
        return {
          success: false,
          durationMs: 0,
          memoryDeltaBytes: 0,
          error: `No executable TypeScript entry point found in directory: ${absPath}`,
          logs: []
        };
      }
    }

    const dirOfEntry = path.dirname(absPath);
    const tempBundlePath = path.join(
      dirOfEntry,
      `.krnl-exec-${Date.now()}-${Math.random().toString(36).substring(7)}.mjs`
    );

    // Custom resolver plugin so esbuild maps local relative imports and workspace packages
    const tsResolverPlugin: esbuild.Plugin = {
      name: 'ts-resolver-plugin',
      setup(build) {
        build.onResolve({ filter: /.*/ }, args => {
          if (args.path.startsWith('.')) {
            const dir = args.resolveDir || path.dirname(args.importer);
            const candidateJs = path.resolve(dir, args.path);
            const candidateTs = candidateJs.replace(/\.js$/, '.ts');

            if (fs.existsSync(candidateTs)) {
              return { path: candidateTs };
            }
            if (fs.existsSync(candidateJs)) {
              return { path: candidateJs };
            }
          }
          return null;
        });
      }
    };

    try {
      await esbuild.build({
        entryPoints: [absPath],
        bundle: true,
        outfile: tempBundlePath,
        format: 'esm',
        platform: 'node',
        target: 'esnext',
        plugins: [tsResolverPlugin],
        external: ['@dinilmusick/krnl-core', 'vanjs-core', 'worker_threads', 'ws', 'fs', 'path', 'http', 'events']
      });

      const fileUrl = pathToFileURL(tempBundlePath).href;
      const mod = await import(fileUrl);

      let targetFn: any = null;
      let targetClass: any = null;

      if (request.functionName && mod[request.functionName]) {
        targetFn = mod[request.functionName];
      } else if (typeof mod.main === 'function') {
        targetFn = mod.main;
      } else if (typeof mod.register === 'function') {
        targetFn = mod.register;
      } else if (typeof mod.default === 'function') {
        targetFn = mod.default;
      } else {
        for (const key of Object.keys(mod)) {
          if (typeof mod[key] === 'function') {
            targetFn = mod[key];
            break;
          }
        }
      }

      // Check if target or any export is a Class
      for (const key of Object.keys(mod)) {
        if (typeof mod[key] === 'function' && mod[key].prototype && Object.getOwnPropertyNames(mod[key].prototype).length > 1) {
          targetClass = mod[key];
          break;
        }
      }

      let executionOutput: any = null;

      if (typeof targetFn === 'function') {
        // 1. Entity System Class
        if (targetFn.prototype && (targetFn.prototype.boot || targetFn.name.endsWith('System') || targetFn.name.endsWith('Entity'))) {
          const instance = new targetFn();
          if (typeof instance.boot === 'function') {
            await instance.boot();
          }
          const registeredFlows = instance['flows'] ? Array.from(instance['flows'].keys()) : [];
          
          // If request specifies a flow to execute
          if (request.input?.flowName && instance['flows']?.has(request.input.flowName)) {
            const flow = instance['flows'].get(request.input.flowName);
            const flowRes = typeof flow.execute === 'function' ? await flow.execute(request.input.payload || {}) : 'Flow initiated';
            executionOutput = {
              entityId: instance.id || targetFn.name,
              flowExecuted: request.input.flowName,
              flowResult: flowRes,
              status: 'FLOW_EXECUTED'
            };
          } else {
            executionOutput = {
              entityId: instance.id || targetFn.name,
              version: instance.version || '1.0.0',
              description: instance.description || 'System Entity',
              status: 'BOOTED_AND_READY',
              registeredFlows
            };
          }
        }
        // 2. SubApp Registration Entry (register function)
        else if (targetFn.name === 'register' || mod.register === targetFn) {
          const mockContext = {
            entity: { id: 'TestSandboxEntity', call: async () => ({}), emitEvent: () => {} },
            logger: { log: (msg: string) => logs.push(msg), error: (msg: string) => logs.push('ERROR: ' + msg) }
          };
          const regResult = await targetFn(mockContext);
          executionOutput = {
            subappName: regResult?.name || 'SubApp',
            operations: (regResult?.operations || []).map((o: any) => ({ name: o.name, description: o.description })),
            ui: regResult?.ui,
            status: 'REGISTERED'
          };
        }
        // 3. Concept Library with static methods
        else if (targetFn.name.endsWith('Concepts') || (targetClass && targetClass.name.endsWith('Concepts'))) {
          const cls = targetClass || targetFn;
          const staticMethods = Object.getOwnPropertyNames(cls).filter(m => typeof cls[m] === 'function' && m !== 'prototype' && m !== 'length' && m !== 'name');
          
          let invokedMethod = request.functionName || request.input?.method;
          let methodArgs = request.input?.args;

          if (!invokedMethod && staticMethods.length > 0) {
            invokedMethod = staticMethods[0];
          }

          if (invokedMethod && typeof cls[invokedMethod] === 'function') {
            if (!methodArgs) {
              if (Array.isArray(request.input)) {
                methodArgs = request.input;
              } else if (request.input && typeof request.input === 'object' && !request.input.method) {
                // Check if parameters match keys (e.g. { a: 10, b: 20 })
                const fnStr = cls[invokedMethod].toString();
                const paramMatch = fnStr.match(/\(([^)]*)\)/);
                const paramNames = paramMatch ? paramMatch[1].split(',').map((p: string) => p.trim().split(':')[0].trim()) : [];
                if (paramNames.length > 1 && paramNames.every((p: string) => p in request.input)) {
                  methodArgs = paramNames.map((p: string) => request.input[p]);
                } else {
                  methodArgs = [request.input];
                }
              } else {
                methodArgs = [];
              }
            }
            const result = await cls[invokedMethod](...methodArgs);
            executionOutput = {
              library: cls.name,
              method: invokedMethod,
              args: methodArgs,
              result
            };
          } else {
            executionOutput = {
              library: cls.name,
              status: 'READY',
              availableMethods: staticMethods
            };
          }
        }
        // 4. Standard Quad-Unit / Logic function
        else {
          const dummyContext = {
            state: request.state || {},
            entity: {
              id: 'TestSandbox',
              call: async () => ({}),
              emitEvent: () => {}
            }
          };

          // If input has { a, b } or similar object, pass directly
          executionOutput = await targetFn(request.input || {}, dummyContext);
        }
      } else if (mod && typeof mod === 'object') {
        executionOutput = {
          exports: Object.keys(mod),
          status: 'MODULE_LOADED'
        };
      } else {
        throw new Error(`No executable function or entity class export found in ${absPath}`);
      }

      const durationMs = parseFloat((performance.now() - startTime).toFixed(2));
      const memoryDeltaBytes = Math.max(0, process.memoryUsage().heapUsed - initialMem);

      return {
        success: true,
        output: executionOutput,
        durationMs,
        memoryDeltaBytes,
        logs
      };
    } catch (err: any) {
      const durationMs = parseFloat((performance.now() - startTime).toFixed(2));
      return {
        success: false,
        durationMs,
        memoryDeltaBytes: 0,
        error: err?.message || String(err),
        logs
      };
    } finally {
      if (fs.existsSync(tempBundlePath)) {
        try { fs.unlinkSync(tempBundlePath); } catch (e) {}
      }
    }
  }
}
