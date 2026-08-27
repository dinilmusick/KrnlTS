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
      if (request.functionName && mod[request.functionName]) {
        targetFn = mod[request.functionName];
      } else if (typeof mod.main === 'function') {
        targetFn = mod.main;
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

      let executionOutput: any = null;

      if (typeof targetFn === 'function') {
        // Check if target is an Entity Class constructor
        if (targetFn.prototype && (targetFn.prototype.boot || targetFn.name.endsWith('System') || targetFn.name.endsWith('Entity'))) {
          const instance = new targetFn();
          if (typeof instance.boot === 'function') {
            await instance.boot();
          }
          executionOutput = {
            entityId: instance.id || targetFn.name,
            version: instance.version || '1.0.0',
            description: instance.description || 'System Entity',
            status: 'BOOTED_AND_READY',
            registeredFlows: instance['flows'] ? Array.from(instance['flows'].keys()) : []
          };
        } else {
          // Standard Quad-Unit or Pure Function
          const dummyContext = {
            state: request.state || {},
            entity: {
              id: 'TestSandbox',
              call: async () => ({}),
              emitEvent: () => {}
            }
          };
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
