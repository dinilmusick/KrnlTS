import {endsWith as lodashEndsWith, startsWith as lodashStartsWith} from "lodash-es";
import validator from "validator";

export function isBlank(value:string):boolean{return value.trim().length===0;}
export function isNonBlank(value:string):boolean{return !isBlank(value);}
export function isEmail(value:string):boolean{return validator.isEmail(value);}
export function startsWithAny(value:string,prefixes:readonly string[]):boolean{return prefixes.some(prefix=>lodashStartsWith(value,prefix));}
export function endsWithAny(value:string,suffixes:readonly string[]):boolean{return suffixes.some(suffix=>lodashEndsWith(value,suffix));}
