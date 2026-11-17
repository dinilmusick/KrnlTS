import {LocalExecutionProvider, type LocalExecutionResult} from "./local-execution-provider.js";

export interface VerificationStep {id: string; name: string; command: string; cwd?: string;}
export interface VerificationReport {id: string; status: "passed" | "failed"; checks: readonly LocalExecutionResult[];}

export class CommandVerificationProvider {
  readonly id = "command-verification";
  constructor(private readonly execution = new LocalExecutionProvider()) {}

  async verify(steps: readonly VerificationStep[]): Promise<VerificationReport> {
    const checks: LocalExecutionResult[] = [];
    for (const step of steps) {
      const result = await this.execution.execute({command: step.command, cwd: step.cwd});
      checks.push(result);
      if (result.status !== "succeeded") return {id: crypto.randomUUID(), status: "failed", checks};
    }
    return {id: crypto.randomUUID(), status: "passed", checks};
  }
}
