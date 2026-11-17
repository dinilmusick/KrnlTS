import { WorkflowNode } from "../types/index.js";

export function validateNodeInputsAndParameters(
  node: WorkflowNode,
  inputs: Record<string, any>,
  nodeData: Record<string, any> = {}
): string[] {
  const errors: string[] = [];

  // 1. Validate required inputs
  Object.entries(node.inputs).forEach(([key, definition]) => {
    if (definition.required && (inputs[key] === undefined || inputs[key] === null || inputs[key] === "")) {
      errors.push(`Missing required input: '${key}' on node of type '${node.metadata.name}'.`);
    }
  });

  // 2. Validate parameters against definitions
  if (node.parameters) {
    Object.entries(node.parameters).forEach(([key, definition]) => {
      const value = nodeData[key] !== undefined ? nodeData[key] : definition.defaultValue;
      
      if (definition.validation) {
        const validationError = definition.validation(value);
        if (validationError) {
          errors.push(validationError);
        }
      }
    });
  }

  // 3. Custom node-specific validation
  if (node.validate) {
    const customErrors = node.validate(inputs);
    errors.push(...customErrors);
  }

  return errors;
}
