import { BaseStorageAdapter } from './BaseStorageAdapter.js';
import { FileInfo, StorageConfig } from './types.js';

let createClient: any;

export class SupabaseStorageAdapter extends BaseStorageAdapter {
  private client: any;
  private bucket: string;

  constructor(config: StorageConfig) {
    super(config);
    this.bucket = config.bucket || '';
  }

  private async ensureClient() {
    if (this.client) return;
    try {
      const sb = await import('@supabase/supabase-js');
      createClient = sb.createClient;
      this.client = createClient(this.config.endpoint!, this.config.accessKey!); // key is anon/service_role
    } catch (e) {
      throw new Error('@supabase/supabase-js is not installed or failed to initialize.');
    }
  }

  async read(pathStr: string): Promise<Uint8Array> {
    await this.ensureClient();
    const { data, error } = await this.client.storage
      .from(this.bucket)
      .download(this.normalizePath(pathStr));
      
    if (error) throw error;
    const arrayBuffer = await data.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  }

  async write(pathStr: string, data: Uint8Array | string): Promise<void> {
    await this.ensureClient();
    const { error } = await this.client.storage
      .from(this.bucket)
      .upload(this.normalizePath(pathStr), data, { upsert: true });
      
    if (error) throw error;
  }

  async delete(pathStr: string): Promise<void> {
    await this.ensureClient();
    const { error } = await this.client.storage
      .from(this.bucket)
      .remove([this.normalizePath(pathStr)]);
      
    if (error) throw error;
  }

  async exists(pathStr: string): Promise<boolean> {
    await this.ensureClient();
    try {
      await this.stat(pathStr);
      return true;
    } catch {
      return false;
    }
  }

  async list(pathStr = ''): Promise<FileInfo[]> {
    await this.ensureClient();
    const { data, error } = await this.client.storage
      .from(this.bucket)
      .list(this.normalizePath(pathStr));
      
    if (error) throw error;
    
    return data.map((item: any) => ({
      path: item.name,
      size: item.metadata?.size || 0,
      modifiedAt: item.metadata?.lastModified ? new Date(item.metadata.lastModified).getTime() : 0
    }));
  }

  async stat(pathStr: string): Promise<FileInfo> {
    await this.ensureClient();
    // List file specifically to get stats
    const dir = pathStr.split('/').slice(0, -1).join('/');
    const name = pathStr.split('/').pop();
    
    const { data, error } = await this.client.storage
      .from(this.bucket)
      .list(dir, { search: name });
      
    if (error || !data || data.length === 0) {
      throw new Error('Not found');
    }
    
    const item = data.find((d: any) => d.name === name);
    if (!item) throw new Error('Not found');
    
    return {
      path: pathStr,
      size: item.metadata?.size || 0,
      modifiedAt: item.metadata?.lastModified ? new Date(item.metadata.lastModified).getTime() : 0
    };
  }

  async mkdir(_pathStr: string): Promise<void> {
    // Supabase has flat hierarchy, no explicit mkdir needed
  }
}
