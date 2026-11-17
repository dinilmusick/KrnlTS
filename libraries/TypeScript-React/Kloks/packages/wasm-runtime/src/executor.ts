import type { RuntimeExecuteRequest, RuntimeResult, WasmRuntime } from "./types.js";
import { ForgeToolchainResolver } from "./toolchainResolver.js";

const DEFAULT_LIMITS = {
  instructionBudget: 10_000_000,
  logicalTimeLimitMs: 10_000,
  memoryLimitBytes: 64 * 1024 * 1024,
  outputLimitBytes: 1024 * 1024,
  filesystemWriteLimitBytes: 1024 * 1024,
  filesystemEntryLimit: 128,
};

export interface WasmExecutor {
  execute(request: RuntimeExecuteRequest, language: "rust" | "go"): Promise<RuntimeResult>;
  dispose(): void;
}

export class ForgeWasmExecutor implements WasmExecutor {
  private disposed = false;

  constructor(private readonly engine: { execute: (...args: any[]) => Promise<any>; dispose: () => void }) {}

  async execute(request: RuntimeExecuteRequest, language: "rust" | "go"): Promise<RuntimeResult> {
    if (this.disposed) throw new Error("Forge WASM executor has been disposed.");
    const started = performance.now();
    const limits = { ...DEFAULT_LIMITS, ...(request.options ?? {}) };
    const extension = language === "rust" ? "rs" : "go";
    const result = await this.engine.execute(
      {
        language,
        target: "wasip1",
        optimization: request.options?.optimization ?? "release",
        entry: request.filename ?? `main.${extension}`,
        files: { [request.filename ?? `main.${extension}`]: request.source },
      },
      {
        stdin: request.inputs === undefined ? "" : JSON.stringify(request.inputs) + "\n",
        args: [],
        env: {},
        determinism: {
          randomSeed: 0,
          realtimeEpochMs: 946684800000,
          clockStepNs: 1_000_000,
        },
        resources: {
          instructionBudget: limits.instructionBudget,
          logicalTimeLimitMs: limits.logicalTimeLimitMs,
          memoryLimitBytes: limits.memoryLimitBytes,
          outputLimitBytes: limits.outputLimitBytes,
          filesystemWriteLimitBytes: limits.filesystemWriteLimitBytes,
          filesystemEntryLimit: limits.filesystemEntryLimit,
          wallTimeLimitMs: request.options?.timeoutMs ?? limits.logicalTimeLimitMs,
        },
      },
    );

    if (!result.run) {
      return {
        success: false,
        stdout: result.build.stdout,
        stderr: result.build.stderr,
        exitCode: 1,
        language,
        diagnostics: result.build.diagnostics,
        executionTimeMs: performance.now() - started,
      };
    }

    return {
      success: result.run.code === 0 && result.run.termination === "exited",
      stdout: result.run.stdout,
      stderr: result.run.stderr || result.run.trapMessage || "",
      exitCode: result.run.code,
      language,
      termination: result.run.termination,
      diagnostics: result.build.diagnostics,
      metrics: result.run.metrics,
      executionTimeMs: result.run.durationMs ?? performance.now() - started,
    };
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.engine.dispose();
  }
}

export async function createForgeWasmExecutor(baseUrl: string): Promise<ForgeWasmExecutor> {
  const { createBrowserEngine } = await import("../vendor/forge/browser/dist/index.js");
  const resolver = new ForgeToolchainResolver();
  const engine = await createBrowserEngine({
    artifactCache: true,
    toolchains: [resolver.resolve("rust", baseUrl) as never, resolver.resolve("go", baseUrl) as never],
  });
  return new ForgeWasmExecutor(engine);
}
