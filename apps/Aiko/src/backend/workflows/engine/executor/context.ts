import { ErrorCollector } from "../error/index.js";
import type { WorkflowExecutionContext } from "../../types.js";
import type { RuntimeNodeAdapter } from "../../../runtime/RuntimeNodeAdapter.js";

export interface VerifiedLuthPrincipal extends WorkflowExecutionContext {
  readonly verified: true;
  readonly userId: string;
  readonly workspaceId: string;
  readonly roles?: readonly string[];
}
export interface CustomCodeExecutionService {
  execute(
    input: { code: string; inputs: Record<string, unknown>; variables: Record<string, unknown>; executionId: string; workspaceId: string },
    principal: VerifiedLuthPrincipal,
    signal?: AbortSignal
  ): Promise<Record<string, unknown>>;
}
export interface GraphExecutionServices {
  readonly runtime?: Pick<RuntimeNodeAdapter, "execute" | "cleanupExecution">;
  readonly customCode?: CustomCodeExecutionService;
  readonly ai?: { generate(prompt: string, data: Record<string, unknown>, principal?: VerifiedLuthPrincipal, signal?: AbortSignal): Promise<string> };
  readonly libraries?: Readonly<Record<string, unknown>>;
}
export interface SchedulerInterface {
  getIsCancelled(): boolean;
  logMessage(message: string, level: "info" | "success" | "warn" | "error" | "ai", nodeId?: string): void;
}
export class ExecutionContext {
  public readonly executionId: string;
  public readonly workspaceId?: string;
  public readonly principal?: VerifiedLuthPrincipal;
  public readonly services: GraphExecutionServices;
  public readonly startTime: number;
  private variables: Record<string, any> = {};
  private runtimeObjects = new Map<string, any>();
  private activeConnections = new Set<string>();
  public readonly errorCollector = new ErrorCollector();
  private schedulerRef: SchedulerInterface;
  private controller = new AbortController();
  private externalSignal?: AbortSignal;
  private externalAbort?: () => void;
  public readonly signal: AbortSignal;
  constructor(scheduler: SchedulerInterface, initialVariables: Record<string, any> = {}, executionId?: string, workspaceId?: string, principal?: VerifiedLuthPrincipal, services: GraphExecutionServices = {}, signal?: AbortSignal) {
    this.executionId = executionId || globalThis.crypto.randomUUID();
    this.workspaceId = workspaceId;
    this.principal = principal;
    this.services = services;
    this.startTime = Date.now();
    this.schedulerRef = scheduler;
    this.variables = { ...initialVariables };
    this.externalSignal = signal;
    this.signal = this.controller.signal;
    if (signal) {
      this.externalAbort = () => this.cancel();
      if (signal.aborted) this.controller.abort(signal.reason);
      else signal.addEventListener("abort", this.externalAbort, { once: true });
    }
  }
  getScheduler(): SchedulerInterface { return this.schedulerRef; }
  getVariable(name: string): any { return this.variables[name]; }
  setVariable(name: string, value: any): void { this.variables[name] = value; }
  getVariables(): Record<string, any> { return { ...this.variables }; }
  registerRuntimeObject(id: string, obj: any): void { this.runtimeObjects.set(id, obj); }
  getRuntimeObject(id: string): any { return this.runtimeObjects.get(id); }
  unregisterRuntimeObject(id: string): void { this.runtimeObjects.delete(id); }
  registerActiveConnection(id: string): void { this.activeConnections.add(id); }
  unregisterActiveConnection(id: string): void { this.activeConnections.delete(id); }
  cancel(): void { if (!this.controller.signal.aborted) this.controller.abort(); }
  isCancelled(): boolean { return this.signal.aborted || this.schedulerRef.getIsCancelled(); }
  log(message: string, level: "info" | "success" | "warn" | "error" | "ai" = "info", nodeId?: string): void { this.schedulerRef.logMessage(message, level, nodeId); }
  dispose(): void {
    if (this.externalSignal && this.externalAbort) this.externalSignal.removeEventListener("abort", this.externalAbort);
    for (const [id, obj] of this.runtimeObjects) {
      try {
        if (typeof obj?.close === "function") obj.close();
        else if (typeof obj?.destroy === "function") obj.destroy();
        else if (typeof obj?.dispose === "function") obj.dispose();
      } catch (error) { this.log("Failed to dispose runtime object " + id + ": " + String(error), "warn"); }
    }
    this.runtimeObjects.clear();
    this.activeConnections.clear();
  }
}
