export interface QueryFilter {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'lt' | 'in';
  value: any;
}

export interface SortOrder {
  field: string;
  direction: 'asc' | 'desc';
}

export interface IDataProvider<T> {
  query(filters?: QueryFilter[], sort?: SortOrder[], limit?: number): Promise<T[]>;
  getById(id: string): Promise<T | null>;
  insert(item: T): Promise<T>;
  update(id: string, item: Partial<T>): Promise<T>;
  delete(id: string): Promise<boolean>;
  upsert(item: T): Promise<T>;
  count(filters?: QueryFilter[]): Promise<number>;
}
