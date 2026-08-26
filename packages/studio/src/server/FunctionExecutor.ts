import * as path from 'path';
import * as fs from 'fs';
import { Worker } from 'worker_threads';
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
   * Executes a specific function in an isolated process/worker with performance metrics.
   */
  static async execute(request: FunctionExecutionRequest): Promise<FunctionExecutionResult> {
    const startTime = performance.now();
    const initialMem = process.memoryUsage().heapUsed;
    const logs: string[] = [];

    const absPath = path.resolve(request.filePath);
    if (!fs.existsSync(absPath)) {
      return {
        success: false,
        durationMs: 0,
        memoryDeltaBytes: 0,
        error: `File not found: ${absPath}`,
        logs: []
      };
    }

    // Custom resolver plugin so esbuild seamlessly maps .js imports to .ts source files
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

    let bundledCode = '';
    try {
      const result = await esbuild.build({
        entryPoints: [absPath],
        bundle: true,
        write: false,
        format: 'esm',
        platform: 'node',
        target: 'esnext',
        plugins: [tsResolverPlugin],
        external: ['@dinilmusick/krnl-core', 'vanjs-core', 'worker_threads', 'ws', 'fs', 'path', 'http', 'events']
      });

      if (result.outputFiles && result.outputFiles.length > 0) {
        bundledCode = result.outputFiles[0].text;
      } else {
        throw new Error('esbuild produced no output');
      }
    } catch (err: any) {
      return {
        success: false,
        durationMs: parseFloat((performance.now() - startTime).toFixed(2)),
        memoryDeltaBytes: 0,
        error: 'Bundle error: ' + (err?.message || String(err)),
        logs
      };
    }

    const codeBase64 = Buffer.from(bundledCode).toString('base64');

    return new Promise((resolve) => {
      try {
        const workerCode = `
          const { parentPort, workerData } = require('worker_threads');

          async function run() {
            try {
              const mod = await import('data:text/javascript;base64,' + workerData.codeBase64);

              const fn = workerData.functionName
                ? (mod[workerData.functionName] || mod.default || mod.main)
                : (mod.main || mod.default || mod[Object.keys(mod)[0]]);

              if (typeof fn !== 'function') {
                throw new Error("No executable function export found in " + workerData.absPath);
              }

              const dummyContext = {
                state: workerData.state || {},
                entity: {
                  id: 'TestSandbox',
                  call: async () => ({}),
                  emitEvent: () => {}
                }
              };

              const result = await fn(workerData.input || {}, dummyContext);
              parentPort.postMessage({ success: true, output: result });
            } catch (err) {
              parentPort.postMessage({ success: false, error: err && err.message ? err.message : String(err) });
            }
          }

          run();
        `;

        const worker = new Worker(workerCode, {
          eval: true,
          workerData: {
            absPath,
            codeBase64,
            functionName: request.functionName,
            input: request.input,
            state: request.state
          }
        });

        const timer = setTimeout(() => {
          worker.terminate();
          resolve({
            success: false,
            durationMs: parseFloat((performance.now() - startTime).toFixed(2)),
            memoryDeltaBytes: 0,
            error: 'Execution timed out after 5000ms',
            logs
          });
        }, 5000);

        worker.on('message', (msg: any) => {
          clearTimeout(timer);
          const durationMs = parseFloat((performance.now() - startTime).toFixed(2));
          const memoryDeltaBytes = Math.max(0, process.memoryUsage().heapUsed - initialMem);
          resolve({
            success: msg.success,
            output: msg.output,
            error: msg.error,
            durationMs,
            memoryDeltaBytes,
            logs
          });
        });

        worker.on('error', (err: any) => {
          clearTimeout(timer);
          resolve({
            success: false,
            durationMs: parseFloat((performance.now() - startTime).toFixed(2)),
            memoryDeltaBytes: 0,
            error: err?.message || String(err),
            logs
          });
        });
      } catch (err: any) {
        resolve({
          success: false,
          durationMs: parseFloat((performance.now() - startTime).toFixed(2)),
          memoryDeltaBytes: 0,
          error: err?.message || String(err),
          logs
        });
      }
    });
  }
}
