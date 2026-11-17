import { SkipoBase } from '@kloks/functions/base';
import { IDataProvider, QueryFilter, SortOrder } from './types.js';

export abstract class BaseDataProvider<T> extends SkipoBase implements IDataProvider<T> {
  abstract query(filters?: QueryFilter[], sort?: SortOrder[], limit?: number): Promise<T[]>;
  abstract getById(id: string): Promise<T | null>;
  abstract insert(item: T): Promise<T>;
  abstract update(id: string, item: Partial<T>): Promise<T>;
  abstract delete(id: string): Promise<boolean>;
  abstract upsert(item: T): Promise<T>;
  abstract count(filters?: QueryFilter[]): Promise<number>;
}
