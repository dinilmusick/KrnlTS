/**
 * @file DataConcepts.ts
 * @role component
 * @description Polymorphic generic templates for collections, object diffs, deep merge, and lenses.
 */

import { ObjectKit } from "./ObjectKit.js";

/**
 * Indexes an array of objects into a Map using a specified key property.
 */
export function indexBy<T, K extends keyof T>(items: T[], key: K): Map<T[K], T> {
  const map = new Map<T[K], T>();
  for (const item of items) {
    if (item && item[key] !== undefined) {
      map.set(item[key], item);
    }
  }
  return map;
}

/**
 * Groups an array of objects by a key or discriminator function.
 */
export function groupBy<T, K extends PropertyKey>(
  items: T[],
  keyFn: K | ((item: T) => K)
): Record<K, T[]> {
  const result: Record<PropertyKey, T[]> = {};
  for (const item of items) {
    const k: PropertyKey = typeof keyFn === "function" ? (keyFn as (item: T) => K)(item) : (item as any)[keyFn];
    if (!result[k]) {
      result[k] = [];
    }
    result[k].push(item);
  }
  return result as Record<K, T[]>;
}

/**
 * Computes a shallow or 1-level delta between original and modified objects.
 */
export function computeDelta<T extends object>(original: T, modified: T): Partial<T> {
  const delta: Partial<T> = {};
  for (const key of Object.keys(modified) as (keyof T)[]) {
    if (original[key] !== modified[key]) {
      delta[key] = modified[key];
    }
  }
  return delta;
}

/**
 * Deeply merges source into target using ObjectKit.
 */
export function deepMerge<T extends object>(target: T, source: Partial<T>): T {
  return ObjectKit.deepMerge(target, source) as T;
}

/**
 * Creates a functional lens for focused property access and immutable updates.
 */
export function lens<T, R>(
  getter: (obj: T) => R,
  setter: (obj: T, val: R) => T
): { get: (obj: T) => R; set: (obj: T, val: R) => T } {
  return {
    get: getter,
    set: setter
  };
}

/**
 * Partitions an array into two arrays [matches, nonMatches] based on a predicate.
 */
export function partition<T>(items: T[], predicate: (item: T) => boolean): [T[], T[]] {
  const matches: T[] = [];
  const nonMatches: T[] = [];
  for (const item of items) {
    if (predicate(item)) {
      matches.push(item);
    } else {
      nonMatches.push(item);
    }
  }
  return [matches, nonMatches];
}

/**
 * Deduplicates an array by value or key selector.
 */
export function deduplicate<T, K extends keyof T>(items: T[], key?: K): T[] {
  if (!key) {
    return Array.from(new Set(items));
  }
  const seen = new Set<any>();
  const result: T[] = [];
  for (const item of items) {
    const val = item[key];
    if (!seen.has(val)) {
      seen.add(val);
      result.push(item);
    }
  }
  return result;
}

/**
 * Paginates an array with page number and page size.
 */
export function paginate<T>(
  items: T[],
  page: number = 1,
  pageSize: number = 20
): { items: T[]; total: number; page: number; pageSize: number; totalPages: number } {
  const validPage = Math.max(1, page);
  const validSize = Math.max(1, pageSize);
  const total = items.length;
  const totalPages = Math.ceil(total / validSize);
  const startIndex = (validPage - 1) * validSize;
  const paginated = items.slice(startIndex, startIndex + validSize);

  return {
    items: paginated,
    total,
    page: validPage,
    pageSize: validSize,
    totalPages
  };
}
