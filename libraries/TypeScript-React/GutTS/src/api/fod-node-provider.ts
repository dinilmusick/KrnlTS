import {guttsApiDefinitions} from './api-registry.js';
import type {ApiDefinition,JsonSchema} from './api-types.js';

export interface GuttsFodPort {id:string;name:string;direction:'input'|'output';dataType:string;required?:boolean;description?:string;schema?:JsonSchema;}
export interface GuttsFodNodeDefinition {
  type:string;label:string;description:string;category:'gutts';group:string;
  inputs:GuttsFodPort[];outputs:GuttsFodPort[];
  metadata:{apiId:string;package:string;semantics:ApiDefinition['semantics']};
}

const schemaType=(schema:JsonSchema|undefined)=>String(schema?.type ?? 'any');

export function guttsApiToFodNode(api:ApiDefinition):GuttsFodNodeDefinition {
  return {
    type:`gutts/${api.id}`,label:api.name,description:api.description,category:'gutts',
    group:api.category,
    inputs:api.parameters.map(parameter=>({id:parameter.name,name:parameter.name,direction:'input',dataType:schemaType(parameter.schema),required:parameter.required,description:parameter.description,schema:parameter.schema})),
    outputs:[{id:'result',name:'result',direction:'output',dataType:schemaType(api.output),...(api.output.description ? {description:api.output.description} : {}),schema:api.output}],
    metadata:{apiId:api.id,package:'@dinilmusick/gutts',semantics:api.semantics}
  };
}

export const guttsFodNodeDefinitions:readonly GuttsFodNodeDefinition[]=Object.freeze(guttsApiDefinitions.map(guttsApiToFodNode));
