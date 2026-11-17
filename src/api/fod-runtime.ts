import {guttsApiById} from './api-registry.js';
import {compact,unique,chunk,flatten,last} from '../arrays/array-operations.js';
import {isJsonValue,parseJson,tryParseJson,stringifyJson} from '../json/json-concepts.js';
import {clamp,inRange,roundTo,isFiniteNumber,sum} from '../numbers/number-operations.js';
import {hasOwn,pick,omit,isPlainObject} from '../objects/object-operations.js';
import {isBlank,isNonBlank,isEmail,startsWithAny,endsWithAny} from '../strings/string-predicates.js';
import {capitalize,camelCase,kebabCase,snakeCase,truncate} from '../strings/string-transform.js';
import {truncateWords} from '../strings/string-truncate-words.js';
import {isUrl,joinUrl,getQueryParam,setQueryParam} from '../urls/url-operations.js';

const utilityFunctions:Record<string,(input:any)=>unknown>={
  compact:i=>compact(i.values),unique:i=>unique(i.values),chunk:i=>chunk(i.values,i.size),flatten:i=>flatten(i.values),last:i=>last(i.values),
  isJsonValue:i=>isJsonValue(i.value),parseJson:i=>parseJson(i.text),tryParseJson:i=>tryParseJson(i.text),stringifyJson:i=>stringifyJson(i.value,i.space),
  clamp:i=>clamp(i.value,i.min,i.max),inRange:i=>inRange(i.value,i.min,i.max),roundTo:i=>roundTo(i.value,i.decimals),isFiniteNumber:i=>isFiniteNumber(i.value),sum:i=>sum(i.values),
  hasOwn:i=>hasOwn(i.value,i.key),pick:i=>pick(i.value,i.keys),omit:i=>omit(i.value,i.keys),isPlainObject:i=>isPlainObject(i.value),
  isBlank:i=>isBlank(i.value),isNonBlank:i=>isNonBlank(i.value),isEmail:i=>isEmail(i.value),startsWithAny:i=>startsWithAny(i.value,i.prefixes),endsWithAny:i=>endsWithAny(i.value,i.suffixes),
  capitalize:i=>capitalize(i.value),camelCase:i=>camelCase(i.value),kebabCase:i=>kebabCase(i.value),snakeCase:i=>snakeCase(i.value),truncate:i=>truncate(i.value,i.maxLength,i.suffix),truncateWords:i=>truncateWords(i.value,i.maxWords,i.suffix),
  isUrl:i=>isUrl(i.value),joinUrl:i=>joinUrl(i.base,...i.parts),getQueryParam:i=>getQueryParam(i.url,i.key),setQueryParam:i=>setQueryParam(i.url,i.key,i.value)
};

export async function executeGuttsApi(apiId:string,input:Record<string,unknown>):Promise<unknown>{
  const api=guttsApiById[apiId];
  if(!api) throw new Error(`Unknown GutTS API '${apiId}'.`);
  const fn=utilityFunctions[api.name];
  if(!fn) throw new Error(`GutTS API '${apiId}' has metadata but no embedded runtime adapter.`);
  return await fn(input);
}
