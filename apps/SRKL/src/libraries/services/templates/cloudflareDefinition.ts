/**
 * @file cloudflareDefinition.ts
 * @description Canonical Cloudflare ServiceDefinition with authentic REST API endpoints.
 * File size < 200 lines strictly.
 */

import { ServiceDefinition } from '../../types/srkl';

export const CLOUDFLARE_DEFINITION: ServiceDefinition = {
  identifier: 'cloudflare',
  name: 'Cloudflare',
  description: 'Cloudflare Developer Platform: surveillance of Workers, Pages projects, deployments, R2 storage, and DNS zones.',
  version: '1.0.0',
  authType: 'BEARER_TOKEN',
  credentialFields: [
    {
      name: 'accountId',
      label: 'Account ID (MANDATORY)',
      type: 'string',
      required: true,
      secret: false,
      description: 'Cloudflare Account ID from dashboard or token creation screen',
      guideUrl: 'https://dash.cloudflare.com/',
    },
    {
      name: 'apiToken',
      label: 'Your API Token (MANDATORY)',
      type: 'password',
      required: true,
      secret: true,
      description: 'Cloudflare API Token value with Workers & Pages permissions',
      guideUrl: 'https://dash.cloudflare.com/profile/api-tokens',
    },
    {
      name: 'accessKeyId',
      label: 'Access Key ID (S3 / R2)',
      type: 'string',
      required: false,
      secret: false,
      description: 'Access Key ID for S3-compatible client access to R2 storage',
    },
    {
      name: 'secretAccessKey',
      label: 'Secret Access Key (S3 / R2)',
      type: 'password',
      required: false,
      secret: true,
      description: 'Secret Access Key for S3-compatible client access to R2 storage',
    },
    {
      name: 's3Endpoint',
      label: 'S3 API Endpoint (Optional)',
      type: 'string',
      required: false,
      secret: false,
      description: 'S3 API Endpoint (e.g. https://<account_id>.r2.cloudflarestorage.com)',
    },
  ],
  endpoints: [
    {
      name: 'Verify Token',
      method: 'GET',
      path: 'https://api.cloudflare.com/client/v4/user/tokens/verify',
      authentication: true,
      description: 'Tests whether the provided Cloudflare API Token is valid and active',
    },
    {
      name: 'List Accounts',
      method: 'GET',
      path: 'https://api.cloudflare.com/client/v4/accounts',
      authentication: true,
      description: 'Lists all Cloudflare accounts the authenticated token has access to',
    },
    {
      name: 'List Workers Scripts',
      method: 'GET',
      path: 'https://api.cloudflare.com/client/v4/accounts/{accountId}/workers/scripts',
      authentication: true,
      description: 'Lists all serverless Worker scripts deployed in the Cloudflare account',
    },
    {
      name: 'List Pages Projects',
      method: 'GET',
      path: 'https://api.cloudflare.com/client/v4/accounts/{accountId}/pages/projects',
      authentication: true,
      description: 'Lists all Cloudflare Pages frontend projects and custom domains',
    },
    {
      name: 'List DNS Zones',
      method: 'GET',
      path: 'https://api.cloudflare.com/client/v4/zones',
      authentication: true,
      description: 'Lists all DNS zones and custom domains managed under the Cloudflare account',
    },
    {
      name: 'List R2 Buckets',
      method: 'GET',
      path: 'https://api.cloudflare.com/client/v4/accounts/{accountId}/r2/buckets',
      authentication: true,
      description: 'Lists all Cloudflare R2 object storage buckets in the account',
    },
    {
      name: 'List D1 Databases',
      method: 'GET',
      path: 'https://api.cloudflare.com/client/v4/accounts/{accountId}/d1/database',
      authentication: true,
      description: 'Lists all Cloudflare D1 serverless SQL database instances',
    },
  ],
  actions: [
    {
      id: 'VERIFY_TOKEN',
      name: 'Verify API Token',
      actionType: 'READ',
      description: 'Verify token authorization against Cloudflare REST API',
    },
    {
      id: 'LIST_WORKERS',
      name: 'List Workers',
      actionType: 'READ',
      description: 'Fetch all deployed serverless Workers scripts',
    },
    {
      id: 'LIST_PAGES',
      name: 'List Pages Projects',
      actionType: 'READ',
      description: 'Enumerate all connected Pages full-stack projects',
    },
    {
      id: 'LIST_ZONES',
      name: 'List DNS Zones',
      actionType: 'READ',
      description: 'Fetch managed domains and DNS zones in the account',
    },
    {
      id: 'REFRESH_SURVEILLANCE',
      name: 'Refresh Surveillance',
      actionType: 'REFRESH',
      description: 'Poll latest Cloudflare edge compute status and metrics',
    },
  ],
  resources: [
    {
      type: 'WORKER',
      name: 'Cloudflare Worker',
      description: 'Serverless JavaScript/Wasm edge compute function script',
      supportedActions: ['READ', 'REFRESH', 'EXECUTE'],
      hasChildren: false,
    },
    {
      type: 'PAGES_PROJECT',
      name: 'Pages Project',
      description: 'Full-stack web application hosted on Cloudflare Pages',
      supportedActions: ['READ', 'REFRESH'],
      hasChildren: true,
    },
    {
      type: 'ZONE',
      name: 'DNS Zone',
      description: 'Cloudflare managed DNS zone and domain proxy',
      supportedActions: ['READ', 'REFRESH'],
      hasChildren: true,
    },
    {
      type: 'R2_BUCKET',
      name: 'R2 Bucket',
      description: 'S3-compatible zero-egress cloud object storage bucket',
      supportedActions: ['READ', 'REFRESH'],
      hasChildren: false,
    },
  ],
  pollingIntervalSeconds: 60,
};
