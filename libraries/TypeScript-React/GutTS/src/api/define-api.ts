import type {ApiDefinition, ApiParameter} from "./api-types.js";

export function defineApi(
  definition: Omit<ApiDefinition, "inputSchema">,
): ApiDefinition {
  const properties = Object.fromEntries(
    definition.parameters.map((parameter) => [
      parameter.name,
      {
        ...parameter.schema,
        description: parameter.description,
      },
    ]),
  );

  return Object.freeze({
    ...definition,
    inputSchema: {
      type: "object",
      description: `Arguments for ${definition.name}.`,
      properties,
      required: definition.parameters
        .filter((parameter: ApiParameter) => parameter.required)
        .map((parameter) => parameter.name),
      additionalProperties: false,
    },
  });
}
