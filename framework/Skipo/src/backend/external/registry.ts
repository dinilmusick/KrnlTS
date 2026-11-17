import { ApplicationCapability, CapabilityExecutor, ExternalCapabilityContext, ExternalInterfaceError, ExternalPrincipal, JsonSchema } from "./contract.js";
function validate(schema: JsonSchema, value: unknown, path = "$"): string[] {
  const errors: string[] = [];
  if (schema.enum && !schema.enum.some(item => JSON.stringify(item) === JSON.stringify(value))) return [path + " must match an allowed value"];
  if (schema.type === "object") {
    if (!value || typeof value !== "object" || Array.isArray(value)) return [path + " must be an object"];
    const object = value as Record<string, unknown>;
    for (const key of schema.required ?? []) if (!(key in object)) errors.push(path + "." + key + " is required");
    for (const [key, item] of Object.entries(object)) {
      const child = schema.properties?.[key];
      if (child) errors.push(...validate(child, item, path + "." + key));
      else if (schema.additionalProperties === false) errors.push(path + "." + key + " is not allowed");
    }
  } else if (schema.type === "array") {
    if (!Array.isArray(value)) return [path + " must be an array"];
    if (schema.items) value.forEach((item, index) => errors.push(...validate(schema.items!, item, path + "[" + index + "]")));
  } else if (schema.type === "string") {
    if (typeof value !== "string") errors.push(path + " must be a string");
    else { if (schema.minLength !== undefined && value.length < schema.minLength) errors.push(path + " is too short"); if (schema.maxLength !== undefined && value.length > schema.maxLength) errors.push(path + " is too long"); }
  } else if (schema.type === "number" || schema.type === "integer") {
    if (typeof value !== "number" || !Number.isFinite(value) || (schema.type === "integer" && !Number.isInteger(value))) errors.push(path + " must be a finite " + schema.type);
    else { if (schema.minimum !== undefined && value < schema.minimum) errors.push(path + " is below minimum"); if (schema.maximum !== undefined && value > schema.maximum) errors.push(path + " is above maximum"); }
  } else if (schema.type === "boolean" && typeof value !== "boolean") errors.push(path + " must be a boolean");
  else if (schema.type === "null" && value !== null) errors.push(path + " must be null");
  return errors;
}
export class CapabilityRegistry {
  private readonly capabilities = new Map<string, ApplicationCapability>();
  constructor(private readonly executor: CapabilityExecutor) {}
  register(capability: ApplicationCapability): this {
    if (!/^[a-zA-Z0-9][a-zA-Z0-9._:-]{1,127}$/.test(capability.id)) throw new ExternalInterfaceError("INVALID_REQUEST", "Capability ID is invalid.", 400);
    if (!capability.description.trim() || !capability.invocation.serviceId || !capability.invocation.operationId) throw new ExternalInterfaceError("INVALID_REQUEST", "Capability description and invocation mapping are required.", 400);
    if (this.capabilities.has(capability.id)) throw new ExternalInterfaceError("INVALID_REQUEST", "Capability ID is already registered.", 409);
    this.capabilities.set(capability.id, Object.freeze({ ...capability, invocation: Object.freeze({ ...capability.invocation }) }));
    return this;
  }
  list(principal: ExternalPrincipal | null): ApplicationCapability[] {
    return [...this.capabilities.values()].filter(cap => cap.discoverable !== false && this.isAuthorized(cap, principal));
  }
  get(id: string): ApplicationCapability | undefined { return this.capabilities.get(id); }
  isAuthorized(capability: ApplicationCapability, principal: ExternalPrincipal | null): boolean {
    const access = capability.access ?? "authenticated";
    if (access === "public") return true;
    if (!principal?.userId) return false;
    if (access === "roles") return (capability.requiredRoles ?? []).some(role => principal.roles?.includes(role));
    return true;
  }
  async invoke(id: string, input: unknown, context: ExternalCapabilityContext): Promise<unknown> {
    const capability = this.capabilities.get(id);
    if (!capability || capability.discoverable === false) throw new ExternalInterfaceError("NOT_FOUND", "Capability not found.", 404);
    if (!this.isAuthorized(capability, context.principal)) throw new ExternalInterfaceError(context.principal ? "FORBIDDEN" : "UNAUTHENTICATED", context.principal ? "Capability access is forbidden." : "Authentication is required.", context.principal ? 403 : 401);
    const inputErrors = validate(capability.inputSchema, input);
    if (inputErrors.length) throw new ExternalInterfaceError("INVALID_INPUT", inputErrors.join("; "), 400);
    const output = await this.executor.execute(capability.invocation.serviceId, capability.invocation.operationId, input, context);
    if (validate(capability.outputSchema, output).length) throw new ExternalInterfaceError("INVALID_OUTPUT", "Backend returned a value that violates the declared output schema.", 500, false);
    return output;
  }
}
