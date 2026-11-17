export type RuntimeCredentialFieldDefinition = { id: string };

export function createRuntimeCredentialDraft(fields: readonly RuntimeCredentialFieldDefinition[]): Record<string, string> {
  return Object.fromEntries(fields.map(field => [field.id, '']));
}
