export type JsonSchema = {
  type?: string;
  description?: string;
  properties?: Record<string, JsonSchema>;
  items?: JsonSchema;
  required?: string[];
  additionalProperties?: boolean;
  enum?: readonly (string | number | boolean | null)[];
};

export type ApiParameter = {
  name: string;
  description: string;
  required: boolean;
  schema: JsonSchema;
};

export type ApiSemantics = {
  deterministic: boolean;
  pure: boolean;
  sideEffects: boolean;
};

export type ApiExample = {
  input: Record<string, unknown>;
  output: unknown;
};

export type ApiDefinition = {
  id: string;
  name: string;
  category: string;
  description: string;
  parameters: readonly ApiParameter[];
  output: JsonSchema;
  semantics: ApiSemantics;
  errors?: readonly string[];
  examples?: readonly ApiExample[];
  inputSchema: JsonSchema;
};
