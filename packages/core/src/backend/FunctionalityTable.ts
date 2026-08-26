/**
 * @file FunctionalityTable.ts
 * @description Built-in CRUD table engine for krnlLocalFunctionality instances.
 */

import { IFunctionalityTable, IWorkspaceDataProvider, BackendServiceType } from "./types.js";

export class FunctionalityTable<T = any> implements IFunctionalityTable<T> {
  readonly tableName: string;
  readonly service: BackendServiceType;
  readonly provider: IWorkspaceDataProvider;
  private isTableInitialized = false;

  constructor(tableName: string, provider: IWorkspaceDataProvider) {
    this.tableName = tableName;
    this.provider = provider;
    this.service = provider.engine;
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.isTableInitialized) {
      await this.provider.ensureTable(this.tableName);
      this.isTableInitialized = true;
    }
  }

  async find(filter?: Record<string, any>, options?: { limit?: number; offset?: number; sort?: Record<string, 1 | -1> }): Promise<T[]> {
    await this.ensureInitialized();
    return await this.provider.find<T>(this.tableName, filter, options);
  }

  async findOne(filter: Record<string, any> | string): Promise<T | null> {
    await this.ensureInitialized();
    return await this.provider.findOne<T>(this.tableName, filter);
  }

  async create(record: T): Promise<T> {
    await this.ensureInitialized();
    const result = await this.provider.insert<T>(this.tableName, record);
    return Array.isArray(result) ? result[0] : result;
  }

  async insert(record: T | T[]): Promise<T | T[]> {
    await this.ensureInitialized();
    return await this.provider.insert<T>(this.tableName, record);
  }

  async update(filter: Record<string, any> | string, patch: Partial<T>): Promise<{ affectedRows: number }> {
    await this.ensureInitialized();
    return await this.provider.update<T>(this.tableName, filter, patch);
  }

  async delete(filter: Record<string, any> | string): Promise<{ affectedRows: number }> {
    await this.ensureInitialized();
    return await this.provider.delete(this.tableName, filter);
  }

  async upsert(record: T, keyField = "id"): Promise<T> {
    await this.ensureInitialized();
    const keyVal = (record as any)[keyField];
    if (keyVal !== undefined && keyVal !== null) {
      const existing = await this.findOne({ [keyField]: keyVal });
      if (existing) {
        await this.update({ [keyField]: keyVal }, record);
        return { ...existing, ...record };
      }
    }
    return await this.create(record);
  }

  async count(filter?: Record<string, any>): Promise<number> {
    await this.ensureInitialized();
    return await this.provider.count(this.tableName, filter);
  }

  async query(rawQueryOrFilter: any, params?: any[]): Promise<any> {
    await this.ensureInitialized();
    if (typeof rawQueryOrFilter === "string") {
      return await this.provider.query(rawQueryOrFilter, params);
    }
    return await this.provider.find(this.tableName, rawQueryOrFilter);
  }

  async clear(): Promise<void> {
    await this.ensureInitialized();
    await this.provider.clear(this.tableName);
  }
}
