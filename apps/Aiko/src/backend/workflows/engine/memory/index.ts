export interface LogEntry {
  timestamp: number;
  nodeId?: string;
  level: 'info' | 'success' | 'warn' | 'error' | 'ai';
  message: string;
}

export class MemoryStore {
  private variables: Record<string, any> = {};
  private outputs: Record<string, Record<string, any>> = {}; // nodeId -> { outputName: value }
  private logs: LogEntry[] = [];
  private errors: Record<string, string> = {};

  constructor(initialVariables: Record<string, any> = {}) {
    this.variables = { ...initialVariables };
  }

  getVariables(): Record<string, any> {
    return { ...this.variables };
  }

  setVariable(name: string, value: any): void {
    this.variables[name] = value;
  }

  getVariable(name: string): any {
    return this.variables[name];
  }

  setNodeOutputs(nodeId: string, outputs: Record<string, any>): void {
    this.outputs[nodeId] = { ...outputs };
  }

  getNodeOutput(nodeId: string, outputName: string): any {
    return this.outputs[nodeId]?.[outputName];
  }

  getAllOutputs(): Record<string, Record<string, any>> {
    return { ...this.outputs };
  }

  log(message: string, level: 'info' | 'success' | 'warn' | 'error' | 'ai' = 'info', nodeId?: string): void {
    this.logs.push({
      timestamp: Date.now(),
      nodeId,
      level,
      message,
    });
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  setError(nodeId: string, error: string): void {
    this.errors[nodeId] = error;
  }

  getError(nodeId: string): string | undefined {
    return this.errors[nodeId];
  }

  getErrors(): Record<string, string> {
    return { ...this.errors };
  }
}
