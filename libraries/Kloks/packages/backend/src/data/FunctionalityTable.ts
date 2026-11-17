import { BaseDataProvider } from './BaseDataProvider.js';
import { QueryFilter, SortOrder } from './types.js';

export class FunctionalityTable<T extends { id: string }> extends BaseDataProvider<T> {
  private data: Map<string, T> = new Map();

  async query(filters?: QueryFilter[], _sort?: SortOrder[], limit?: number): Promise<T[]> {
    let results = Array.from(this.data.values());
    if (filters) {
      results = results.filter(item => {
        return filters.every(f => {
          if (f.operator === 'eq') return (item as any)[f.field] === f.value;
          return true;
        });
      });
    }
    if (limit) {
      results = results.slice(0, limit);
    }
    return results;
  }

  async getById(id: string): Promise<T | null> {
    return this.data.get(id) || null;
  }

  async insert(item: T): Promise<T> {
    if (this.data.has(item.id)) throw new Error('Already exists');
    this.data.set(item.id, item);
    return item;
  }

  async update(id: string, item: Partial<T>): Promise<T> {
    const existing = this.data.get(id);
    if (!existing) throw new Error('Not found');
    const updated = { ...existing, ...item } as T;
    this.data.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return this.data.delete(id);
  }

  async upsert(item: T): Promise<T> {
    this.data.set(item.id, item);
    return item;
  }

  async count(filters?: QueryFilter[]): Promise<number> {
    const results = await this.query(filters);
    return results.length;
  }
}
