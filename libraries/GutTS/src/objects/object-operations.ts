import {has as lodashHas, isPlainObject as lodashIsPlainObject, omit as lodashOmit, pick as lodashPick} from "lodash-es";

export function hasOwn<T extends object>(value:T,key:PropertyKey):boolean{return lodashHas(value,key);}
export function pick<T extends object,K extends keyof T>(value:T,keys:readonly K[]):Pick<T,K>{return lodashPick(value,keys as K[]);}
export function omit<T extends object,K extends keyof T>(value:T,keys:readonly K[]):Omit<T,K>{return lodashOmit(value,keys as K[]);}
export function isPlainObject(value:unknown):value is Record<string,unknown>{return lodashIsPlainObject(value);}
