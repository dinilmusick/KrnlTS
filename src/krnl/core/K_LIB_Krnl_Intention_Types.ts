export interface KrnlEventIntention {
  name: string;           // e.g. "state:changed"
  description: string;
  inputs: Record<string, string>;   // fieldName -> description
  outputs: Record<string, string>;  // fieldName -> description
}

export interface KrnlIntentionFunctionality {
  purpose: string;         // What this functionality does
  inputs: Record<string, string>;   // input field -> description
  outputs: Record<string, string>;  // output field -> description
  state: Record<string, string>;    // stateKey -> why it is stored
  events: KrnlEventIntention[];     // all emitter events
}

export interface KrnlIntentionLibraryCategory {
  name: string;
  purpose: string;
  data: Record<string, string>;
  functions: Record<string, string>;
}

export interface KrnlIntentionLibrary {
  purpose: string;
  categories: KrnlIntentionLibraryCategory[];
}

export interface KrnlIntentionEntity {
  purpose: string;
  functionalities: KrnlIntentionFunctionality[];    // aggregated from owned functionalities
  componentEntities: KrnlIntentionEntity[];          // aggregated from children
}

export function buildEntityIntention(entity: any): KrnlIntentionEntity {
  const functionalities: KrnlIntentionFunctionality[] = [];
  if (entity.localFunctionalities) {
    for (const func of entity.localFunctionalities.values()) {
      if (func.intention) {
        functionalities.push(func.intention);
      }
    }
  }

  const componentEntities: KrnlIntentionEntity[] = [];
  if (entity.hierarchyManager && entity.hierarchyManager.ownedComponents) {
    for (const child of entity.hierarchyManager.ownedComponents.values()) {
      componentEntities.push(buildEntityIntention(child));
    }
  }

  return {
    purpose: entity.intention?.purpose || entity.description || "",
    functionalities,
    componentEntities
  };
}
