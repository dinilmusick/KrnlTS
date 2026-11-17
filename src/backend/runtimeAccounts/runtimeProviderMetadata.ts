import type { RuntimeCapability } from '../runtime/types.js';

export type RuntimeCredentialField = {
  id: string; label: string; description: string; required: boolean;
  secret: boolean; placeholder?: string;
};
export type RuntimeProviderMetadata = {
  id: string; displayName: string; description: string; icon: string;
  authenticationType: 'oauth2-refresh-token' | 'personal-access-token';
  credentialFields: readonly RuntimeCredentialField[];
  capabilities: readonly { id: RuntimeCapability; label: string; description: string }[];
  execution: { available: false; status: 'credentials-only' };
  documentationUrl: string;
};

const capabilities = [
  { id: 'exec', label: 'Command execution', description: 'Run commands in a provisioned environment.' },
  { id: 'filesystem', label: 'Filesystem', description: 'Read and write files in the environment.' },
  { id: 'http', label: 'HTTP access', description: 'Access provider-exposed HTTP services.' },
  { id: 'ports', label: 'Port forwarding', description: 'Expose or forward development ports.' },
  { id: 'persistent', label: 'Persistent environment', description: 'Retain environment state between sessions.' },
] as const;

export const RUNTIME_PROVIDER_METADATA: readonly RuntimeProviderMetadata[] = [
  {
    id: 'google-cloud-shell', displayName: 'Google Cloud Shell',
    description: 'Google-managed cloud development environment.',
    icon: 'cloud', authenticationType: 'oauth2-refresh-token',
    credentialFields: [
      { id: 'refreshToken', label: 'OAuth refresh token', description: 'Refresh token authorized for the Google Cloud Platform scope.', required: true, secret: true },
      { id: 'projectId', label: 'Google Cloud project ID', description: 'Default project to use when opening Cloud Shell.', required: false, secret: false, placeholder: 'my-gcp-project' },
    ],
    capabilities: capabilities.filter(item => ['exec', 'filesystem', 'http', 'ports', 'persistent'].includes(item.id)),
    execution: { available: false, status: 'credentials-only' },
    documentationUrl: 'https://cloud.google.com/shell/docs/reference/rest',
  },
  {
    id: 'fly-io', displayName: 'Fly.io',
    description: 'Fly.io application and machine runtime platform.',
    icon: 'plane', authenticationType: 'personal-access-token',
    credentialFields: [
      { id: 'accessToken', label: 'Fly.io access token', description: 'Personal access token for the Fly.io account or organization.', required: true, secret: true },
      { id: 'organizationSlug', label: 'Organization slug', description: 'Optional default Fly.io organization.', required: false, secret: false, placeholder: 'personal' },
    ],
    capabilities,
    execution: { available: false, status: 'credentials-only' },
    documentationUrl: 'https://fly.io/docs/reference/api/',
  },
  {
    id: 'github-codespaces', displayName: 'GitHub Codespaces',
    description: 'GitHub-hosted development environments attached to repositories.',
    icon: 'github', authenticationType: 'personal-access-token',
    credentialFields: [
      { id: 'personalAccessToken', label: 'GitHub personal access token', description: 'Token authorized to manage Codespaces for the selected repositories.', required: true, secret: true },
      { id: 'repository', label: 'Default repository', description: 'Optional owner/repository default.', required: false, secret: false, placeholder: 'owner/repository' },
    ],
    capabilities,
    execution: { available: false, status: 'credentials-only' },
    documentationUrl: 'https://docs.github.com/en/codespaces',
  },
] as const;

export function getRuntimeProvider(providerId: string): RuntimeProviderMetadata | undefined {
  return RUNTIME_PROVIDER_METADATA.find(provider => provider.id === providerId);
}

export function validateRuntimeProviderFields(providerId: string, fields: unknown): string[] {
  const provider = getRuntimeProvider(providerId);
  if (!provider) return ['Unsupported runtime provider.'];
  if (!fields || typeof fields !== 'object' || Array.isArray(fields)) return ['Credential fields must be an object.'];
  const values = fields as Record<string, unknown>;
  const errors: string[] = [];
  for (const key of Object.keys(values)) {
    if (!provider.credentialFields.some(field => field.id === key)) errors.push('Unsupported credential field: ' + key);
  }
  for (const field of provider.credentialFields) {
    const value = values[field.id];
    if (field.required && (typeof value !== 'string' || !value.trim())) errors.push(field.label + ' is required.');
    if (value !== undefined && (typeof value !== 'string' || value.length > 8192)) errors.push(field.label + ' must be a string no longer than 8192 characters.');
  }
  return errors;
}

export function normalizeRuntimeProviderFields(providerId: string, fields: Record<string, string>): Record<string, string> {
  const provider = getRuntimeProvider(providerId);
  if (!provider) throw new Error('Unsupported runtime provider.');
  return Object.fromEntries(provider.credentialFields
    .filter(field => typeof fields[field.id] === 'string' && fields[field.id].trim())
    .map(field => [field.id, fields[field.id].trim()]));
}
