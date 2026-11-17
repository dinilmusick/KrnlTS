export type JSONPrimitive = string | number | boolean | null;
export type JSONValue = JSONPrimitive | JSONValue[] | { [key: string]: JSONValue };
export interface ExecutionError { code?: string; message: string; details?: JSONValue; }
export interface ExecutionResult { success?: boolean; response?: { body?: JSONValue; status?: number }; output?: JSONValue; [key: string]: unknown; }
