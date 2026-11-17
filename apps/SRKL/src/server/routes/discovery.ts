/**
 * @file discovery.ts
 * @description API Discovery & Machine-Readable Spec Catalog for AI Agents.
 * Conforms to DeaTS DocumentationManager standard with layers, nextSteps, and OpenAPI 3.0.
 * File size < 200 lines strictly.
 */

import express, { Request, Response } from 'express';
import { getAllDefinitions } from '../serverServiceEngine';

const router = express.Router();

export const SRKL_LAYERS = {
  LAYER_1_AUTH: ['/api/auth/register', '/api/auth/login', '/api/auth/me', '/api/auth/workspaces'],
  LAYER_2_SERVICES: ['/api/services/definitions', '/api/services/templates', '/api/ecosystem/services', '/api/services/groups', '/api/services/tabs'],
  LAYER_3_BACKBLAZE: ['/api/backblaze/auth', '/api/backblaze/buckets', '/api/backblaze/files', '/api/backblaze/create-folder', '/api/backblaze/upload', '/api/backblaze/delete-file', '/api/backblaze/delete-folder', '/api/backblaze/proxy-file'],
  LAYER_4_EXECUTION: ['/api/services/execute-action', '/api/services/execute-endpoint', '/api/services/export', '/api/services/import'],
  LAYER_5_ADMIN_CLUSTER: ['/api/health', '/api/resources', '/api/admin/cluster', '/api/admin/audit-logs', '/api/admin/users', '/api/admin/tables'],
};

export const SRKL_NEXT_STEPS: Record<string, string[]> = {
  'AuthLogin': ['ListVisibleAccounts', 'ListWorkspaces', 'BackblazeBuckets', 'LAYER_2_SERVICES'],
  'BackblazeBuckets': ['BackblazeFiles', 'BackblazeCreateFolder', 'BackblazeUpload'],
  'BackblazeFiles': ['BackblazeUpload', 'BackblazeProxyFile', 'BackblazeDeleteFile'],
  'BackblazeUpload': ['BackblazeFiles'],
  'CreateWorkspace': ['ListWorkspaces'],
};

const API_ENDPOINTS_CATALOG = [
  // System Health & Surveillance
  { id: 'GetHealth', method: 'GET', path: '/api/health', layer: 'LAYER_5_ADMIN_CLUSTER', desc: 'Comprehensive health check of all linked services (Google AI Studio, Backblaze, GitHub, Vercel, Gemini)' },
  { id: 'GetResources', method: 'GET', path: '/api/resources', layer: 'LAYER_5_ADMIN_CLUSTER', desc: 'Enumerate all active cloud resources across all configured services' },
  { id: 'GetServiceHealth', method: 'GET', path: '/api/services/health', layer: 'LAYER_5_ADMIN_CLUSTER', desc: 'Alias for multi-service surveillance health probe' },
  { id: 'GetServiceResources', method: 'GET', path: '/api/services/resources', layer: 'LAYER_5_ADMIN_CLUSTER', desc: 'Alias for multi-service cloud resources aggregator' },
  // Auth & Workspaces
  { id: 'AuthRegister', method: 'POST', path: '/api/auth/register', layer: 'LAYER_1_AUTH', desc: 'Create a new user account in ecosystem database', body: { email: 'string', password: 'string', name: 'string' } },
  { id: 'AuthLogin', method: 'POST', path: '/api/auth/login', layer: 'LAYER_1_AUTH', desc: 'Authenticate with email and password or admin credentials', body: { email: 'string', password: 'string' } },
  { id: 'AuthMe', method: 'GET', path: '/api/auth/me', layer: 'LAYER_1_AUTH', desc: 'Get current authenticated user profile & active workspace' },
  { id: 'ListWorkspaces', method: 'GET', path: '/api/auth/workspaces', layer: 'LAYER_1_AUTH', desc: 'List all workspaces for active user' },
  { id: 'CreateWorkspace', method: 'POST', path: '/api/auth/workspaces', layer: 'LAYER_1_AUTH', desc: 'Create or select active workspace', body: { name: 'string', workspacePath: 'string' } },
  // Services & Definitions
  { id: 'ListDefinitions', method: 'GET', path: '/api/services/definitions', layer: 'LAYER_2_SERVICES', desc: 'List all registered service definitions (built-in & custom)' },
  { id: 'GetDefinition', method: 'GET', path: '/api/services/definitions/:identifier', layer: 'LAYER_2_SERVICES', desc: 'Retrieve single service definition by identifier' },
  { id: 'CreateDefinition', method: 'POST', path: '/api/services/definitions', layer: 'LAYER_2_SERVICES', desc: 'Register or create a custom service definition', body: { identifier: 'string', name: 'string', endpoints: 'array', actions: 'array' } },
  { id: 'UpdateDefinition', method: 'PUT', path: '/api/services/definitions/:identifier', layer: 'LAYER_2_SERVICES', desc: 'Update an existing service definition' },
  { id: 'DeleteDefinition', method: 'DELETE', path: '/api/services/definitions/:identifier', layer: 'LAYER_2_SERVICES', desc: 'Remove a service definition' },
  { id: 'ListTemplates', method: 'GET', path: '/api/services/templates', layer: 'LAYER_2_SERVICES', desc: 'Get list of available template blueprints (Backblaze, Gemini, GitHub, Vercel)' },
  { id: 'InstantiateTemplate', method: 'POST', path: '/api/services/templates/instantiate', layer: 'LAYER_2_SERVICES', desc: 'Instantiate a service from a template', body: { templateId: 'string' } },
  // Workspace-vault service accounts
  { id: 'ListVisibleAccounts', method: 'GET', path: '/api/ecosystem/services', layer: 'LAYER_2_SERVICES', desc: 'List accounts visible in the logged-in user’s selected workspace vault' },
  { id: 'GetAccountResources', method: 'GET', path: '/api/services/accounts/:id/resources', layer: 'LAYER_2_SERVICES', desc: 'List resources from a visible workspace-vault account' },
  // Groups & Tabs Organization
  { id: 'ListGroups', method: 'GET', path: '/api/services/groups', layer: 'LAYER_2_SERVICES', desc: 'List all service groups with colors and icons' },
  { id: 'CreateGroup', method: 'POST', path: '/api/services/groups', layer: 'LAYER_2_SERVICES', desc: 'Create a new service group', body: { name: 'string', description: 'string', color: 'string', icon: 'string' } },
  { id: 'UpdateGroup', method: 'PUT', path: '/api/services/groups/:id', layer: 'LAYER_2_SERVICES', desc: 'Update an existing service group' },
  { id: 'DeleteGroup', method: 'DELETE', path: '/api/services/groups/:id', layer: 'LAYER_2_SERVICES', desc: 'Delete a service group' },
  { id: 'ListTabs', method: 'GET', path: '/api/services/tabs', layer: 'LAYER_2_SERVICES', desc: 'List all workspace tabs and their linked groups' },
  { id: 'CreateTab', method: 'POST', path: '/api/services/tabs', layer: 'LAYER_2_SERVICES', desc: 'Create a new workspace tab', body: { name: 'string', description: 'string', groupIds: 'string[]' } },
  // Execution Engine & Interop
  { id: 'ExecuteAction', method: 'POST', path: '/api/services/execute-action', layer: 'LAYER_4_EXECUTION', desc: 'Execute a defined action on a service provider', body: { serviceId: 'string', actionId: 'string', payload: 'object', accountId: 'string (optional)' } },
  { id: 'ExecuteEndpoint', method: 'POST', path: '/api/services/execute-endpoint', layer: 'LAYER_4_EXECUTION', desc: 'Execute a raw REST endpoint definition', body: { serviceId: 'string', endpoint: 'object', pathParams: 'object', queryParams: 'object', body: 'unknown' } },
  // Backblaze B2 Direct Storage
  { id: 'BackblazeAuth', method: 'POST', path: '/api/backblaze/auth', layer: 'LAYER_3_BACKBLAZE', desc: 'Authorize Backblaze B2 credentials', body: { keyId: 'string', applicationKey: 'string' } },
  { id: 'BackblazeBuckets', method: 'POST', path: '/api/backblaze/buckets', layer: 'LAYER_3_BACKBLAZE', desc: 'List B2 buckets', body: { keyId: 'string', applicationKey: 'string', bucketId: 'string (optional)' } },
  { id: 'BackblazeFiles', method: 'POST', path: '/api/backblaze/files', layer: 'LAYER_3_BACKBLAZE', desc: 'List files in B2 bucket', body: { keyId: 'string', applicationKey: 'string', bucketId: 'string', prefix: 'string' } },
  { id: 'BackblazeCreateFolder', method: 'POST', path: '/api/backblaze/create-folder', layer: 'LAYER_3_BACKBLAZE', desc: 'Create folder marker in B2 bucket', body: { keyId: 'string', applicationKey: 'string', bucketId: 'string', folderPath: 'string' } },
  { id: 'BackblazeUpload', method: 'POST', path: '/api/backblaze/upload', layer: 'LAYER_3_BACKBLAZE', desc: 'Upload file to B2 bucket', body: { keyId: 'string', applicationKey: 'string', bucketId: 'string', fileName: 'string', fileBase64: 'string' } },
  { id: 'BackblazeDeleteFile', method: 'POST', path: '/api/backblaze/delete-file', layer: 'LAYER_3_BACKBLAZE', desc: 'Delete file version from B2 bucket', body: { keyId: 'string', applicationKey: 'string', fileName: 'string', fileId: 'string' } },
  { id: 'BackblazeDeleteFolder', method: 'POST', path: '/api/backblaze/delete-folder', layer: 'LAYER_3_BACKBLAZE', desc: 'Delete entire folder and child objects from B2 bucket', body: { keyId: 'string', applicationKey: 'string', bucketId: 'string', folderPath: 'string' } },
  { id: 'BackblazeProxyFile', method: 'GET', path: '/api/backblaze/proxy-file', layer: 'LAYER_3_BACKBLAZE', desc: 'Proxy stream a file from B2 storage', queryParams: { keyId: 'string', applicationKey: 'string', bucketName: 'string', fileName: 'string' } },
  // Activity & Real-Time Telemetry
  { id: 'GetActivity', method: 'GET', path: '/api/activity', layer: 'LAYER_5_ADMIN_CLUSTER', desc: 'Retrieve activity logs with filters', queryParams: { serviceId: 'string', status: 'string', limit: 'number' } },
  { id: 'GetTelemetryEvents', method: 'GET', path: '/api/telemetry/events', layer: 'LAYER_5_ADMIN_CLUSTER', desc: 'Subscribe to real-time Server-Sent Events (SSE) telemetry stream' },
  // Admin & Cluster
  { id: 'GetCluster', method: 'GET', path: '/api/admin/cluster', layer: 'LAYER_5_ADMIN_CLUSTER', desc: 'Get database cluster topology & environment persistent state' },
  { id: 'GetAuditLogs', method: 'GET', path: '/api/admin/audit-logs', layer: 'LAYER_5_ADMIN_CLUSTER', desc: 'Query security & administrative audit logs' },
  { id: 'GetUsers', method: 'GET', path: '/api/admin/users', layer: 'LAYER_5_ADMIN_CLUSTER', desc: 'List all registered ecosystem users' },
  { id: 'GetTables', method: 'GET', path: '/api/admin/tables', layer: 'LAYER_5_ADMIN_CLUSTER', desc: 'Enumerate database schema tables' },
];

router.get('/', (_req: Request, res: Response) => {
  const definitions = getAllDefinitions();
  res.json({
    system: {
      name: 'SRKL Service Oracle API',
      description: 'Preemptive Machine-Readable Service Hub and Cloud Storage Surveillance API.',
      version: '1.0.0',
    },
    layers: SRKL_LAYERS,
    nextSteps: SRKL_NEXT_STEPS,
    totalEndpoints: API_ENDPOINTS_CATALOG.length,
    endpoints: API_ENDPOINTS_CATALOG,
    availableServiceDefinitions: definitions.map((d) => ({
      identifier: d.identifier,
      name: d.name,
      actions: d.actions.map((a) => a.id),
      endpoints: d.endpoints.map((e) => `${e.method} ${e.path}`),
    })),
  });
});

router.get('/openapi.json', (_req: Request, res: Response) => {
  res.json({
    openapi: '3.0.0',
    info: {
      title: 'SRKL Service Hub API',
      version: '1.0.0',
      description: 'Fully callable REST API surface exposing every user capability for AI agents and integrations.',
    },
    paths: API_ENDPOINTS_CATALOG.reduce((acc: any, ep) => {
      acc[ep.path] = acc[ep.path] || {};
      acc[ep.path][ep.method.toLowerCase()] = {
        summary: ep.desc,
        description: ep.desc,
        tags: [ep.layer],
        requestBody: (ep as any).body ? { content: { 'application/json': { schema: { type: 'object' } } } } : undefined,
      };
      return acc;
    }, {}),
  });
});

export default router;
