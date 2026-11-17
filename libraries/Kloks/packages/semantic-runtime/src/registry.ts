import type {CapabilityDescriptor} from './types.js';

export class CapabilityRegistry {
  private readonly items=new Map<string,CapabilityDescriptor>();

  register(capability:CapabilityDescriptor):void {
    if(this.items.has(capability.id)) throw new Error(`Capability already registered: ${capability.id}`);
    this.items.set(capability.id,capability);
  }

  upsert(capability:CapabilityDescriptor):void { this.items.set(capability.id,capability); }
  get(id:string):CapabilityDescriptor|undefined { return this.items.get(id); }
  list():CapabilityDescriptor[] { return [...this.items.values()]; }

  findBySemanticType(semanticType:string):CapabilityDescriptor[] {
    return this.list().filter(c=>
      (c.requirements??[]).some(r=>r.semanticType===semanticType) ||
      (c.provides??[]).some(p=>p.semanticType===semanticType)
    );
  }

  findProviders(semanticType:string):CapabilityDescriptor[] {
    return this.list().filter(c=>
      (c.provides??[]).some(p=>p.semanticType===semanticType)
    );
  }
}
