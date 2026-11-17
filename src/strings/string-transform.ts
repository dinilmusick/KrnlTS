import {camelCase as lodashCamelCase, capitalize as lodashCapitalize, kebabCase as lodashKebabCase, snakeCase as lodashSnakeCase, truncate as lodashTruncate} from "lodash-es";

export function capitalize(value:string):string{return lodashCapitalize(value);}
export function camelCase(value:string):string{return lodashCamelCase(value);}
export function kebabCase(value:string):string{return lodashKebabCase(value);}
export function snakeCase(value:string):string{return lodashSnakeCase(value);}
export function truncate(value:string,maxLength:number,suffix="…"):string{
  if(maxLength<0)throw new RangeError("maxLength must be non-negative");
  return lodashTruncate(value,{length:maxLength,omission:suffix});
}
