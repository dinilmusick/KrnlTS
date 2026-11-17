import { S3Adapter } from './S3Adapter.js';
import type { StorageConfig } from './types.js';

export class BucketStorageService extends S3Adapter {
  constructor(config: StorageConfig) {
    super({ ...config, provider: config.provider === 's3_compatible' ? 's3_compatible' : 's3' });
  }
}
