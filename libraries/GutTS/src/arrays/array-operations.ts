import {chunk as lodashChunk, compact as lodashCompact, flatten as lodashFlatten, last as lodashLast, uniq as lodashUniq} from "lodash-es";

export function compact<T>(values:readonly(T|null|undefined)[]):T[]{return lodashCompact(values as T[]);}
export function unique<T>(values:readonly T[]):T[]{return lodashUniq(values as T[]);}
export function chunk<T>(values:readonly T[],size:number):T[][]{
  if(!Number.isInteger(size)||size<=0)throw new RangeError("size must be a positive integer");
  return lodashChunk(values as T[],size);
}
export function flatten<T>(values:readonly(T|readonly T[])[]):T[]{return lodashFlatten(values as T[][]);}
export function last<T>(values:readonly T[]):T|undefined{return lodashLast(values as T[]);}
