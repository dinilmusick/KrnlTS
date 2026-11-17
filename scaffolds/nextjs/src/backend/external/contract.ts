export type JsonSchema = {
  type?: "object" | "array" | "string" | "number" | "integer" | "boolean" | "null";
  properties?: Record<string, JsonSchema>; required?: string[]; additionalProperties?: boolean;
  items?: JsonSchema; enum?: unknown[]; minimum?: number; maximum?: number; minLength?: number; maxLength?: number;
};
export type ExternalTransport = "http" | "mcp";
export type CapabilityAccess = "public" | "authenticated" | "roles";
export interface ExternalPrincipal { readonly userId: string; readonly roles?: readonly string[]; readonly sessionId?: string; }
export interface ExternalCapabilityContext { readonly principal: ExternalPrincipal | null; readonly transport: ExternalTransport; readonly requestId: string; }
export interface ApplicationCapability {
  readonly id: string; readonly description: string; readonly inputSchema: JsonSchema; readonly outputSchema: JsonSchema;
  readonly invocation: { readonly serviceId: string; readonly operationId: string };
  readonly access?: CapabilityAccess; readonly requiredRoles?: readonly string[]; readonly discoverable?: boolean;
}
export interface CapabilityExecutor { execute(serviceId: string, operationId: string, input: unknown, context: ExternalCapabilityContext): Promise<unknown>; }
export type ExternalErrorCode = "INVALID_REQUEST" | "UNAUTHENTICATED" | "FORBIDDEN" | "NOT_FOUND" | "INVALID_INPUT" | "INVALID_OUTPUT" | "METHOD_NOT_ALLOWED" | "INTERNAL_ERROR" | "PARSE_ERROR";
export class ExternalInterfaceError extends Error {
  constructor(readonly code: ExternalErrorCode, message: string, readonly status: number, readonly expose = true) { super(message); this.name = "ExternalInterfaceError"; }
}
