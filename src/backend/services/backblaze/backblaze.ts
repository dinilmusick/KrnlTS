/**
 * @file backblaze.ts
 * @description Backblaze B2 Service Facade.
 * Conforms to APP_ARCHITECTURE_SPEC Sections 5 & 6.
 */

import { backblazeClient } from './client/backblazeClient';
import { backblazeServer } from './server/backblazeServer';
import { remoteBackblaze } from './remote/remoteBackblaze';

export const runtime: 'client' | 'server' = 'server';
export const deployment: 'local' | 'remote' = 'remote';

export const service = {
  name: 'backblaze',
  runtime,
  deployment,
  listBuckets: async (credentials: Record<string, unknown>) => {
    return remoteBackblaze.listBuckets(credentials);
  },
  createBucket: async (credentials: Record<string, unknown>, name: string, type: 'allPublic' | 'allPrivate') => {
    return remoteBackblaze.createBucket(credentials, name, type);
  },
  deleteBucket: async (credentials: Record<string, unknown>, bucketId: string) => {
    return remoteBackblaze.deleteBucket(credentials, bucketId);
  },
  listFiles: async (credentials: Record<string, unknown>, bucketId: string) => {
    return remoteBackblaze.listFiles(credentials, bucketId);
  },
  client: backblazeClient,
  server: backblazeServer,
};

export const backblazeService = service;
