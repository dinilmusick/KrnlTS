import { SDKParameterDefinition, SDKParameterType } from "../types/index.js";

export class ParameterBuilder {
  static createInteger(
    name: string,
    defaultValue: number = 0,
    description?: string,
    min?: number,
    max?: number
  ): SDKParameterDefinition {
    return {
      name,
      type: SDKParameterType.Integer,
      defaultValue,
      description,
      validation: (val: any) => {
        if (typeof val !== "number" || !Number.isInteger(val)) {
          return `Parameter '${name}' must be an integer.`;
        }
        if (min !== undefined && val < min) {
          return `Parameter '${name}' must be at least ${min}.`;
        }
        if (max !== undefined && val > max) {
          return `Parameter '${name}' must be at most ${max}.`;
        }
        return null;
      }
    };
  }

  static createFloat(
    name: string,
    defaultValue: number = 0.0,
    description?: string,
    min?: number,
    max?: number
  ): SDKParameterDefinition {
    return {
      name,
      type: SDKParameterType.Float,
      defaultValue,
      description,
      validation: (val: any) => {
        if (typeof val !== "number") {
          return `Parameter '${name}' must be a number.`;
        }
        if (min !== undefined && val < min) {
          return `Parameter '${name}' must be at least ${min}.`;
        }
        if (max !== undefined && val > max) {
          return `Parameter '${name}' must be at most ${max}.`;
        }
        return null;
      }
    };
  }

  static createString(
    name: string,
    defaultValue: string = "",
    description?: string,
    regex?: RegExp
  ): SDKParameterDefinition {
    return {
      name,
      type: SDKParameterType.String,
      defaultValue,
      description,
      validation: (val: any) => {
        if (typeof val !== "string") {
          return `Parameter '${name}' must be a string.`;
        }
        if (regex && !regex.test(val)) {
          return `Parameter '${name}' does not match required format.`;
        }
        return null;
      }
    };
  }

  static createBoolean(
    name: string,
    defaultValue: boolean = false,
    description?: string
  ): SDKParameterDefinition {
    return {
      name,
      type: SDKParameterType.Boolean,
      defaultValue,
      description,
      validation: (val: any) => {
        if (typeof val !== "boolean") {
          return `Parameter '${name}' must be a boolean.`;
        }
        return null;
      }
    };
  }

  static createEnum(
    name: string,
    options: string[],
    defaultValue?: string,
    description?: string
  ): SDKParameterDefinition {
    const finalDefault = defaultValue !== undefined ? defaultValue : options[0];
    return {
      name,
      type: SDKParameterType.Enum,
      defaultValue: finalDefault,
      description,
      options,
      validation: (val: any) => {
        if (!options.includes(val)) {
          return `Parameter '${name}' must be one of: ${options.join(", ")}`;
        }
        return null;
      }
    };
  }

  static createJSON(
    name: string,
    defaultValue: any = {},
    description?: string
  ): SDKParameterDefinition {
    return {
      name,
      type: SDKParameterType.JSON,
      defaultValue,
      description,
      validation: (val: any) => {
        try {
          if (typeof val === "string") {
            JSON.parse(val);
          }
          return null;
        } catch {
          return `Parameter '${name}' must be valid JSON.`;
        }
      }
    };
  }
}
