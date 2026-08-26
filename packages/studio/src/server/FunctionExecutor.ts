import * as path from 'path';
import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';

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

    return new Promise((resolve) => {
      try {
        const workerCode = `
          const { parentPort, workerData } = require('worker_threads');
          const path = require('path');

          async function run() {
            try {
              let mod;
              const ext = path.extname(workerData.filePath);
              if (ext === '.ts') {
                try {
                  mod = await import(workerData.filePath);
                } catch (e) {
                  mod = await import('file://' + workerData.filePath);
                }
              } else {
                mod = await import('file://' + workerData.filePath);
              }

              const fn = workerData.functionName
                ? (mod[workerData.functionName] || mod.default || mod.main)
                : (mod.main || mod.default || mod[Object.keys(mod)[0]]);

              if (typeof fn !== 'function') {
                throw new Error("No executable function export found in " + workerData.filePath);
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
          workerData: request
        });

        const timer = setTimeout(() => {
          worker.terminate();
          resolve({
            success: false,
            durationMs: performance.now() - startTime,
            memoryDeltaBytes: 0,
            error: 'Execution timed out after 5000ms',
            logs
          });
        }, 5000);

        worker.on('message', (msg: any) => {
          clearTimeout(timer);
          const durationMs = parseFloat((performance.now() - startTime).toFixed(2));
          const memoryDeltaBytes = process.memoryUsage().heapUsed - initialMem;
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
            durationMs: performance.now() - startTime,
            memoryDeltaBytes: 0,
            error: err?.message || String(err),
            logs
          });
        });
      } catch (err: any) {
        resolve({
          success: false,
          durationMs: performance.now() - startTime,
          memoryDeltaBytes: 0,
          error: err?.message || String(err),
          logs
        });
      }
    });
  }
}
