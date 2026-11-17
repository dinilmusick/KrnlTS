import {spawn} from "node:child_process";

export interface LocalExecutionRequest {command: string; cwd?: string; environment?: Readonly<Record<string, string>>; timeoutMs?: number;}
export interface LocalExecutionResult {executionId: string; status: "succeeded" | "failed" | "timed-out"; exitCode?: number; stdout: string; stderr: string;}

// Preserve only PATH so requested executables remain discoverable. Never
// inherit other ambient host variables: deployments commonly place access
// tokens, database URLs, and signing keys in process.env.
function buildExecutionEnvironment(
  explicit: Readonly<Record<string, string>> = {},
): NodeJS.ProcessEnv {
  return {
    PATH: process.env.PATH || "/usr/local/bin:/usr/bin:/bin",
    ...explicit,
  };
}

export class LocalExecutionProvider {
  readonly id = "local";

  async execute(request: LocalExecutionRequest): Promise<LocalExecutionResult> {
    const executionId = crypto.randomUUID();
    return new Promise((resolve) => {
      const child = spawn("sh", ["-c", request.command], {
        cwd: request.cwd,
        env: buildExecutionEnvironment(request.environment),
      });
      let stdout = "";
      let stderr = "";
      let settled = false;
      let timer: NodeJS.Timeout | undefined;
      const finish = (result: LocalExecutionResult) => { if (settled) return; settled = true; if (timer) clearTimeout(timer); resolve(result); };
      child.stdout.on("data", (chunk) => { stdout += chunk.toString(); });
      child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
      child.on("error", (error) => finish({executionId, status: "failed", exitCode: undefined, stdout, stderr: stderr + error.message}));
      child.on("close", (code) => finish({executionId, status: code === 0 ? "succeeded" : "failed", exitCode: code ?? undefined, stdout, stderr}));
      if (request.timeoutMs && request.timeoutMs > 0) timer = setTimeout(() => { child.kill("SIGTERM"); finish({executionId, status: "timed-out", stdout, stderr}); }, request.timeoutMs);
    });
  }
}
