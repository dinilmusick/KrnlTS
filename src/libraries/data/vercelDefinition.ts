/**
 * @file vercelDefinition.ts
 * @description Canonical Vercel ServiceDefinition with authentic REST API endpoints.
 * File size < 200 lines strictly.
 */

import { ServiceDefinition } from '../types/srkl';

export const VERCEL_DEFINITION: ServiceDefinition = {
  identifier: 'vercel',
  name: 'Vercel',
  description: 'Vercel Cloud Platform: surveillance of deployments, serverless functions, projects, build logs, and custom domains.',
  version: '1.0.0',
  authType: 'BEARER_TOKEN',
  credentialFields: [
    {
      name: 'token',
      label: 'Personal Access Token (MANDATORY)',
      type: 'password',
      required: true,
      secret: true,
      description: 'Vercel Personal Access Token from vercel.com/account/tokens with deployment & project access',
      guideUrl: 'https://vercel.com/account/tokens',
    },
    {
      name: 'account',
      label: 'Vercel Username / Slug',
      type: 'string',
      required: false,
      secret: false,
      description: 'Vercel username or linked team account identifier',
      guideUrl: 'https://vercel.com/dashboard',
    },
    {
      name: 'teamId',
      label: 'Team ID (Optional)',
      type: 'string',
      required: false,
      secret: false,
      description: 'Optional Team ID (team_xxx) or slug to scope deployment surveillance',
    },
  ],
  endpoints: [
    {
      name: 'List Deployments',
      method: 'GET',
      path: 'https://api.vercel.com/v6/deployments',
      authentication: true,
      description: 'Lists all deployments under the authenticated Vercel account or team',
    },
    {
      name: 'Get Deployment Details',
      method: 'GET',
      path: 'https://api.vercel.com/v13/deployments/{id}',
      authentication: true,
      description: 'Retrieves metadata, state, build duration, and URLs for a specific deployment',
    },
    {
      name: 'Get Deployment Events',
      method: 'GET',
      path: 'https://api.vercel.com/v2/deployments/{id}/events',
      authentication: true,
      description: 'Streams build and runtime event logs for an active deployment',
    },
    {
      name: 'List Projects',
      method: 'GET',
      path: 'https://api.vercel.com/v9/projects',
      authentication: true,
      description: 'Lists all projects and linked git repositories in the account',
    },
    {
      name: 'Get Project',
      method: 'GET',
      path: 'https://api.vercel.com/v9/projects/{idOrName}',
      authentication: true,
      description: 'Get project details, framework presets, and environment configurations',
    },
    {
      name: 'Get User Profile',
      method: 'GET',
      path: 'https://api.vercel.com/v2/user',
      authentication: true,
      description: 'Retrieves authenticated Vercel user profile, email, and subscription plan',
    },
    {
      name: 'List Project Domains',
      method: 'GET',
      path: 'https://api.vercel.com/v9/projects/{idOrName}/domains',
      authentication: true,
      description: 'Lists custom production and preview DNS domains configured for a project',
    },
    {
      name: 'Cancel Deployment',
      method: 'PATCH',
      path: 'https://api.vercel.com/v12/deployments/{id}/cancel',
      authentication: true,
      description: 'Cancels an in-progress or queued Vercel build deployment',
    },
    {
      name: 'Delete Deployment',
      method: 'DELETE',
      path: 'https://api.vercel.com/v13/deployments/{id}',
      authentication: true,
      description: 'Permanently deletes a deployment instance and invalidates its preview alias',
    },
  ],
  actions: [
    {
      id: 'LIST_DEPLOYMENTS',
      name: 'List Deployments',
      actionType: 'READ',
      description: 'Enumerate all active and historical deployments for linked account',
    },
    {
      id: 'LIST_PROJECTS',
      name: 'List Projects',
      actionType: 'READ',
      description: 'Fetch all connected Vercel projects and git repos',
    },
    {
      id: 'CHECK_USER',
      name: 'Verify User Token',
      actionType: 'READ',
      description: 'Verify token authorization against Vercel REST API',
    },
    {
      id: 'REFRESH_SURVEILLANCE',
      name: 'Refresh Surveillance',
      actionType: 'REFRESH',
      description: 'Poll latest deployment statuses and metrics',
    },
  ],
  resources: [
    {
      type: 'DEPLOYMENT',
      name: 'Vercel Deployment',
      description: 'Live production or preview deployment URL and build state',
      supportedActions: ['READ', 'REFRESH', 'EXECUTE'],
      hasChildren: false,
    },
    {
      type: 'PROJECT',
      name: 'Vercel Project',
      description: 'Connected frontend or full-stack application workspace',
      supportedActions: ['READ', 'REFRESH'],
      hasChildren: true,
    },
  ],
  pollingIntervalSeconds: 60,
};
