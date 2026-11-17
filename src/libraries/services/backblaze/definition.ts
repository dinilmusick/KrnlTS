/**
 * @file definition.ts
 * @description Service Definition schema for Backblaze B2 integration.
 * Conforms to Srkl-spec.md Section 15.
 * File size < 200 lines strictly.
 */

import { ServiceDefinition } from '../../types/srkl';

export const BACKBLAZE_DEFINITION: ServiceDefinition = {
  identifier: 'backblaze-b2',
  name: 'Backblaze B2',
  description: 'Enterprise Object Cloud Storage for buckets, media, and archive vaults.',
  version: '2.1.0',
  authType: 'API_KEY',
  credentialFields: [
    {
      name: 'keyId',
      label: 'Application Key ID',
      type: 'string',
      required: true,
      secret: false,
      description: 'Your Backblaze B2 Key ID',
    },
    {
      name: 'applicationKey',
      label: 'Application Key Secret',
      type: 'password',
      required: true,
      secret: true,
      description: 'The secret application key generated in Backblaze B2 Console',
    },
    {
      name: 'region',
      label: 'Storage Region',
      type: 'string',
      required: false,
      secret: false,
      description: 'Default region e.g. us-west-002, us-east-005, eu-central-003',
    },
  ],
  endpoints: [
    { name: 'Authorize Account', method: 'GET', path: '/b2api/v2/b2_authorize_account', authentication: true, description: 'Generates authorization token, API URL, and download URL' },
    { name: 'List Buckets', method: 'POST', path: '/b2api/v2/b2_list_buckets', authentication: true, description: 'Returns all buckets and storage quotas for account' },
    { name: 'Create Bucket', method: 'POST', path: '/b2api/v2/b2_create_bucket', authentication: true, description: 'Provisions a new public or private bucket' },
    { name: 'List File Names', method: 'POST', path: '/b2api/v2/b2_list_file_names', authentication: true, description: 'Enumerates file versions, media metadata, and objects in bucket' },
    { name: 'Download Media / File', method: 'GET', path: '/file/{bucketName}/{fileName}', authentication: true, description: 'Fetches media payloads, images, audio streams, and videos' },
    { name: 'Upload File', method: 'POST', path: '/b2api/v2/b2_upload_file', authentication: true, description: 'Uploads binary or media assets into bucket storage' },
    { name: 'Get File Info', method: 'POST', path: '/b2api/v2/b2_get_file_info', authentication: true, description: 'Inspects SHA1 checksum, MIME types, and header tags' },
    { name: 'Delete File Version', method: 'POST', path: '/b2api/v2/b2_delete_file_version', authentication: true, description: 'Permanently removes a file version from B2 storage' },
  ],
  actions: [
    { id: 'LIST_BUCKETS', name: 'List Buckets', actionType: 'READ', description: 'Enumerate all storage buckets' },
    { id: 'GET_BUCKET', name: 'Get Bucket Details', actionType: 'READ', description: 'Fetch bucket metadata' },
    { id: 'CREATE_BUCKET', name: 'Create Bucket', actionType: 'CREATE', description: 'Create a new B2 bucket' },
    { id: 'DELETE_BUCKET', name: 'Delete Bucket', actionType: 'DELETE', description: 'Deletes empty bucket', destructive: true },
    { id: 'LIST_OBJECTS', name: 'List Objects', actionType: 'READ', description: 'List files in bucket' },
    { id: 'GET_OBJECT_METADATA', name: 'Get Object Metadata', actionType: 'READ', description: 'Inspect object header tags' },
    { id: 'DELETE_OBJECT', name: 'Delete Object', actionType: 'DELETE', description: 'Remove file from bucket', destructive: true },
    { id: 'REFRESH', name: 'Refresh Surveillance', actionType: 'REFRESH', description: 'Poll storage usage' },
  ],
  resources: [
    { type: 'bucket', name: 'Storage Bucket', description: 'Root bucket container', supportedActions: ['READ', 'DELETE', 'CREATE'], hasChildren: true },
    { type: 'object', name: 'Object / File', description: 'Stored file artifact', supportedActions: ['READ', 'DELETE'], hasChildren: false },
  ],
  pollingIntervalSeconds: 60,
};
