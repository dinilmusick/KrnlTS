/**
 * ASCII Architecture Flowchart: testFixtures
 *
 *   ┌──────────────────────────────────┐
 *   │     Initialize testFixtures      │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │        emailLookupFeature        │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │            emailTool             │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │  Return State / Result Payload   │
 *   └──────────────────────────────────┘
 */

// ══════════════════════════════════════════════════════════════════════════════════
// ════ PHASE 13 TEST FIXTURES & MOCKS ══════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════════

import assert from 'node:assert';
import { ToolDefinition, FeatureDefinition } from '../../types/tools.js';

export const userSearchFeature: FeatureDefinition = {
  schemaVersion: '1.0.0',
  name: 'searchUser',
  description: 'Searches user by email to get their userId',
  endpoint: { method: 'POST', path: '/users/search' },
  input: {
    schema: { type: 'object', properties: { email: { type: 'string' } }, required: ['email'] },
    description: 'Email search payload'
  },
  examples: [{ payload: { email: 'alice@example.com' } }],
  output: {
    schema: { type: 'object', properties: { userId: { type: 'string' }, email: { type: 'string' } }, required: ['userId'] },
    description: 'User details',
    resultMeaning: 'User found'
  },
  learnings: []
};

export const userUpdateFeature: FeatureDefinition = {
  schemaVersion: '1.0.0',
  name: 'updateProfile',
  description: 'Updates a user profile',
  endpoint: { method: 'POST', path: '/users/update' },
  input: {
    schema: {
      type: 'object',
      properties: { userId: { type: 'string' }, department: { type: 'string' } },
      required: ['userId', 'department']
    },
    description: 'Update profile payload'
  },
  examples: [{ payload: { userId: 'usr-1', department: 'Engineering' } }],
  output: {
    schema: { type: 'object', properties: { success: { type: 'boolean' } }, required: ['success'] },
    description: 'Update confirmation',
    resultMeaning: 'Profile updated'
  },
  learnings: []
};

export const userTool: ToolDefinition = {
  schemaVersion: '1.0.0',
  name: 'UserDirectory',
  description: 'Manages corporate users',
  type: 'LOCAL',
  endpointBase: { protocol: 'https', domain: 'api.corp.local', port: 443 },
  features: [userSearchFeature, userUpdateFeature],
  learnings: []
};

export const emailLookupFeature: FeatureDefinition = {
  schemaVersion: '1.0.0',
  name: 'lookupEmailByName',
  description: 'Finds email by employee name',
  endpoint: { method: 'POST', path: '/email/lookup' },
  input: {
    schema: { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] },
    description: 'Name lookup'
  },
  examples: [{ payload: { name: 'Alice Smith' } }],
  output: {
    schema: { type: 'object', properties: { email: { type: 'string' } }, required: ['email'] },
    description: 'Found email',
    resultMeaning: 'Email found'
  },
  learnings: []
};

export const emailTool: ToolDefinition = {
  schemaVersion: '1.0.0',
  name: 'EmailService',
  description: 'Corporate email discovery service',
  type: 'LOCAL',
  endpointBase: { protocol: 'https', domain: 'email.corp.local', port: 443 },
  features: [emailLookupFeature],
  learnings: []
};

// Fixture validation assertions
assert.ok(userTool.name === 'UserDirectory');
assert.ok(emailTool.name === 'EmailService');