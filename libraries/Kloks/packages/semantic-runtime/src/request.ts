import type {SemanticRequest} from './types.js';

export function createSemanticRequest(input:string,intent?:string):SemanticRequest{
  return {id:crypto.randomUUID(),contextId:crypto.randomUUID(),input,intent,requirements:[]};
}
