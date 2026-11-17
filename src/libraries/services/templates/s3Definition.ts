/**
 * @file s3Definition.ts
 * @description Service Definition schema for AWS S3 & S3-compatible cloud storage.
 * Adheres strictly to Skipo governance (< 200 lines).
 */

import { ServiceDefinition } from '../../types/srkl';

export const AWS_S3_DEFINITION: ServiceDefinition = {
  identifier: 'aws-s3',
  name: 'AWS S3',
  description: 'Amazon Web Services S3 & S3-compatible object storage for vaults, blobs, and workspaces.',
  version: '1.0.0',
  authType: 'API_KEY',
  credentialFields: [
    {
      name: 'accessKeyId',
      label: 'Access Key ID',
      type: 'string',
      required: true,
      secret: false,
      description: 'AWS IAM User Access Key ID (e.g. AKIA...) or S3-compatible key',
    },
    {
      name: 'secretAccessKey',
      label: 'Secret Access Key',
      type: 'password',
      required: true,
      secret: true,
      description: 'AWS IAM User Secret Access Key',
    },
    {
      name: 'region',
      label: 'AWS Region',
      type: 'string',
      required: false,
      secret: false,
      description: 'AWS Region e.g. us-east-1, us-west-2, eu-central-1',
    },
    {
      name: 'bucketName',
      label: 'Default Bucket Name',
      type: 'string',
      required: false,
      secret: false,
      description: 'Target bucket name for storage and backups',
    },
    {
      name: 'endpoint',
      label: 'Custom S3 Endpoint (Optional)',
      type: 'string',
      required: false,
      secret: false,
      description: 'Optional custom endpoint URL for MinIO, Wasabi, or Cloudflare R2',
    },
  ],
  endpoints: [
    { name: 'List Buckets', method: 'GET', path: '/', authentication: true, description: 'Enumerates account buckets' },
    { name: 'Get Bucket Location', method: 'GET', path: '/{bucket}?location', authentication: true, description: 'Queries bucket AWS region' },
    { name: 'List Objects', method: 'GET', path: '/{bucket}?list-type=2', authentication: true, description: 'Lists objects and versions in bucket' },
    { name: 'Put Object', method: 'PUT', path: '/{bucket}/{key}', authentication: true, description: 'Uploads object or blob' },
    { name: 'Get Object', method: 'GET', path: '/{bucket}/{key}', authentication: true, description: 'Downloads object payload' },
    { name: 'Delete Object', method: 'DELETE', path: '/{bucket}/{key}', authentication: true, description: 'Deletes object from bucket' },
  ],
  actions: [
    { id: 'LIST_BUCKETS', name: 'List Buckets', actionType: 'READ', description: 'Enumerate all storage buckets' },
    { id: 'GET_BUCKET', name: 'Get Bucket Details', actionType: 'READ', description: 'Fetch bucket configuration' },
    { id: 'CREATE_BUCKET', name: 'Create Bucket', actionType: 'CREATE', description: 'Provisions a new bucket' },
    { id: 'DELETE_BUCKET', name: 'Delete Bucket', actionType: 'DELETE', description: 'Removes empty bucket', destructive: true },
    { id: 'LIST_OBJECTS', name: 'List Objects', actionType: 'READ', description: 'List files in bucket' },
    { id: 'DELETE_OBJECT', name: 'Delete Object', actionType: 'DELETE', description: 'Delete object', destructive: true },
    { id: 'REFRESH', name: 'Refresh Surveillance', actionType: 'REFRESH', description: 'Poll storage usage' },
  ],
  resources: [
    {
      type: 'BUCKET',
      name: 'S3 Bucket',
      description: 'AWS S3 or S3-compatible cloud storage bucket',
      supportedActions: ['READ', 'CREATE', 'DELETE', 'REFRESH'],
      hasChildren: true,
    },
  ],
  pollingIntervalSeconds: 60,
};
