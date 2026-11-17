import { BaseStorageAdapter } from './BaseStorageAdapter.js';
import type { StorageConfig } from './types.js';
import { LocalFSAdapter } from './LocalFSAdapter.js';
import { BucketStorageService } from './BucketStorageService.js';
import { BackblazeB2Adapter } from './BackblazeB2Adapter.js';
import { SupabaseStorageAdapter } from './SupabaseStorageAdapter.js';
import { GoogleDriveStorageService } from './GoogleDriveStorageService.js';
import type { GoogleDriveRuntimeAuthOptions } from './GoogleDriveStorageService.js';

export interface StorageAdapterRuntimeOptions {
  /** Server-only OAuth dependencies; never include these in persisted connection JSON. */
  googleDrive?: GoogleDriveRuntimeAuthOptions;
}

export class StorageAdapterFactory {
  static create(config: StorageConfig, runtimeOptions: StorageAdapterRuntimeOptions = {}): BaseStorageAdapter {
    switch (config.provider) {
      case 'local_fs':
        return new LocalFSAdapter(config);
      case 'backblaze_b2':
      case 'b2':
        return new BackblazeB2Adapter(config);
      case 'supabase':
        return new SupabaseStorageAdapter(config);
      case 'google_drive':
        return new GoogleDriveStorageService(config, runtimeOptions.googleDrive);
      case 's3':
      case 's3_compatible':
        return new BucketStorageService(config);
      default:
        throw new Error(`Unsupported storage provider: ${config.provider}`);
    }
  }
}
