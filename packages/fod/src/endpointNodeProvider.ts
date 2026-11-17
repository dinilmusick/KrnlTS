import type {FodEndpointDescriptor,FodNodeDefinition,FodPort} from './types.js';

function portsFromSchema(schema:Record<string,unknown>|undefined,direction:'input'|'output'):FodPort[] {
  if (!schema || schema.type !== 'object') {
    return [{id:direction === 'input' ? 'input' : 'result',name:direction === 'input' ? 'input' : 'result',direction,dataType:String(schema?.type ?? 'any')}];
  }
  const properties=(schema.properties ?? {}) as Record<string,Record<string,unknown>>;
  const required=new Set(Array.isArray(schema.required) ? schema.required.map(String) : []);
  return Object.entries(properties).map(([id,value])=>({
    id,name:id,direction,
    dataType:String(value?.type ?? 'any'),
    required:required.has(id),
    description:typeof value?.description === 'string' ? value.description : undefined,
    schema:value
  }));
}

export function scanBackendFacade(facade:Record<string,unknown>):FodEndpointDescriptor[] {
  const endpoints:FodEndpointDescriptor[]=[];
  const services=(facade.services ?? {}) as Record<string,any>;
  for (const [serviceKey,service] of Object.entries(services)) {
    const definition=service?.definition;
    if (!definition?.operations) continue;
    for (const [operationKey,operation] of Object.entries<any>(definition.operations)) {
      if (typeof service.execute !== 'function') continue;
      endpoints.push({
        id:String(operation.id ?? `${service.id ?? serviceKey}.${operationKey}`),
        serviceId:String(service.id ?? serviceKey),
        serviceName:String(service.name ?? serviceKey),
        operationId:String(operation.id ?? operationKey),
        operationName:String(operation.name ?? operationKey),
        description:typeof operation.description === 'string' ? operation.description : undefined,
        runtime:typeof service.runtime === 'string' ? service.runtime : undefined,
        deployment:typeof service.deployment === 'string' ? service.deployment : undefined,
        inputSchema:operation.inputSchema as Record<string,unknown>|undefined,
        outputSchema:operation.outputSchema as Record<string,unknown>|undefined,
        invoke:(input:unknown)=>service.execute(operationKey,input)
      });
    }
  }
  return endpoints;
}

export function endpointToNode(endpoint:FodEndpointDescriptor):FodNodeDefinition {
  return {
    type:`host/${endpoint.id}`,
    label:endpoint.operationName,
    description:endpoint.description ?? endpoint.operationId,
    category:'host-app',
    group:endpoint.serviceName,
    inputs:portsFromSchema(endpoint.inputSchema,'input'),
    outputs:portsFromSchema(endpoint.outputSchema,'output'),
    metadata:{
      endpointId:endpoint.id,
      serviceId:endpoint.serviceId,
      operationId:endpoint.operationId,
      runtime:endpoint.runtime,
      deployment:endpoint.deployment
    }
  };
}

export function scanBackendFacadeToNodes(facade:Record<string,unknown>):{endpoints:FodEndpointDescriptor[];nodes:FodNodeDefinition[]} {
  const endpoints=scanBackendFacade(facade);
  return {endpoints,nodes:endpoints.map(endpointToNode)};
}
