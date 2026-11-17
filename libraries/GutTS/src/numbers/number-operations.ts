import {clamp as lodashClamp, inRange as lodashInRange, isFinite as lodashIsFinite, round as lodashRound, sum as lodashSum} from "lodash-es";

export function clamp(value:number,min:number,max:number):number{
  if(min>max)throw new RangeError("min must not exceed max");
  return lodashClamp(value,min,max);
}
export function inRange(value:number,min:number,max:number):boolean{
  if(min>max)throw new RangeError("min must not exceed max");
  return lodashInRange(value,min,max);
}
export function roundTo(value:number,decimals=0):number{
  if(!Number.isInteger(decimals)||decimals<0)throw new RangeError("decimals must be a non-negative integer");
  return lodashRound(value,decimals);
}
export function isFiniteNumber(value:unknown):value is number{return typeof value==="number"&&lodashIsFinite(value);}
export function sum(values:readonly number[]):number{return lodashSum(values as number[]);}
