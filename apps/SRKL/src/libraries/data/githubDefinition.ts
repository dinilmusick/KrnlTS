/**
 * @file githubDefinition.ts
 * @description Canonical GitHub ServiceDefinition with authentic REST API endpoints.
 * File size < 200 lines strictly.
 */

import { ServiceDefinition } from '../types/srkl';

export const GITHUB_DEFINITION: ServiceDefinition = {
  identifier: 'github',
  name: 'GitHub',
  description: 'Git source control, repository surveillance, deployments, workflow runs, and API rate limits.',
  version: '1.4.0',
  authType: 'BEARER_TOKEN',
  credentialFields: [
    {
      name: 'token',
      label: 'Personal Access Token (MANDATORY)',
      type: 'password',
      required: true,
      secret: true,
      description: 'GitHub classic PAT or fine-grained token with repo & workflow scopes',
      guideUrl: 'https://github.com/settings/tokens',
    },
    {
      name: 'owner',
      label: 'Account / Organization (MANDATORY)',
      type: 'string',
      required: true,
      secret: false,
      description: 'GitHub username or organization name owning repositories',
      guideUrl: 'https://github.com/settings/profile',
    },
  ],
  endpoints: [
    {
      name: 'List User Repositories',
      method: 'GET',
      path: 'https://api.github.com/user/repos',
      authentication: true,
      description: 'Lists public and private repositories accessible to the authenticated account',
    },
    {
      name: 'Get User Profile',
      method: 'GET',
      path: 'https://api.github.com/user',
      authentication: true,
      description: 'Retrieves authenticated user profile, plan, disk usage, and email',
    },
    {
      name: 'Get Repository',
      method: 'GET',
      path: 'https://api.github.com/repos/{owner}/{repo}',
      authentication: true,
      description: 'Gets full repository details, stars, forks, default branch, and visibility',
    },
    {
      name: 'List Deployments',
      method: 'GET',
      path: 'https://api.github.com/repos/{owner}/{repo}/deployments',
      authentication: true,
      description: 'Lists GitHub environment deployments and production status updates',
    },
    {
      name: 'List Commits',
      method: 'GET',
      path: 'https://api.github.com/repos/{owner}/{repo}/commits',
      authentication: true,
      description: 'Lists recent git commits on the default branch with author and SHA',
    },
    {
      name: 'List Issues',
      method: 'GET',
      path: 'https://api.github.com/repos/{owner}/{repo}/issues',
      authentication: true,
      description: 'Lists open issues and bug reports for the repository',
    },
    {
      name: 'List Pull Requests',
      method: 'GET',
      path: 'https://api.github.com/repos/{owner}/{repo}/pulls',
      authentication: true,
      description: 'Lists open pull requests, merge statuses, and review requests',
    },
    {
      name: 'Check Rate Limit',
      method: 'GET',
      path: 'https://api.github.com/rate_limit',
      authentication: true,
      description: 'Surveils remaining API rate limits, core quota, and reset timestamp',
    },
    {
      name: 'Trigger Workflow Dispatch',
      method: 'POST',
      path: 'https://api.github.com/repos/{owner}/{repo}/actions/workflows/{workflow_id}/dispatches',
      authentication: true,
      description: 'Manually dispatches a GitHub Actions workflow run with input parameters',
    },
  ],
  actions: [
    {
      id: 'LIST_REPOS',
      name: 'List Repositories',
      actionType: 'READ',
      description: 'Enumerate all repositories belonging to the linked GitHub account',
    },
    {
      id: 'CHECK_RATE_LIMIT',
      name: 'Check Rate Limit',
      actionType: 'READ',
      description: 'Fetch current API rate limit remaining and reset window',
    },
    {
      id: 'LIST_DEPLOYMENTS',
      name: 'List Deployments',
      actionType: 'READ',
      description: 'Check active environment deployments across repositories',
    },
    {
      id: 'REFRESH_SURVEILLANCE',
      name: 'Refresh Surveillance',
      actionType: 'REFRESH',
      description: 'Synchronize repository states and activity streams',
    },
  ],
  resources: [
    {
      type: 'REPOSITORY',
      name: 'GitHub Repository',
      description: 'Git source control repository with stars, forks, and branch tracking',
      supportedActions: ['READ', 'REFRESH'],
      hasChildren: true,
    },
    {
      type: 'DEPLOYMENT',
      name: 'GitHub Deployment',
      description: 'Environment deployment build state on GitHub',
      supportedActions: ['READ'],
      hasChildren: false,
    },
  ],
  pollingIntervalSeconds: 180,
};
