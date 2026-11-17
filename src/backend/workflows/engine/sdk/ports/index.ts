import { DataType } from "../../types/graph.js";
import { SDKPortDefinition, SDKPortType } from "../types/index.js";

export class PortBuilder {
  static createInput(
    name: string,
    type: DataType | string,
    required: boolean = true,
    defaultValue?: any,
    description?: string
  ): SDKPortDefinition {
    return {
      name,
      type,
      portType: SDKPortType.Data,
      required,
      defaultValue,
      description
    };
  }

  static createOutput(
    name: string,
    type: DataType | string,
    description?: string
  ): SDKPortDefinition {
    return {
      name,
      type,
      portType: SDKPortType.Data,
      required: false,
      description
    };
  }

  static createExecutionInput(name: string, description?: string): SDKPortDefinition {
    return {
      name,
      type: DataType.Any,
      portType: SDKPortType.Execution,
      required: false,
      description
    };
  }

  static createExecutionOutput(name: string, description?: string): SDKPortDefinition {
    return {
      name,
      type: DataType.Any,
      portType: SDKPortType.Execution,
      required: false,
      description
    };
  }
}
