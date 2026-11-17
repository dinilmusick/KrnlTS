// ═══════════════════════════════════════════════════════════════════
// NODE ARCHETYPE REGISTRY & METADATA
// ═══════════════════════════════════════════════════════════════════
import { SpaceNode, UniversalSocketDefinition } from "../types/index.js";
import { CompatibleNodeCategory, NodeSpawnPayload, NodeArchetypeDefinition } from "./archetypes/types";
import { AUDIO_CORE_ARCHETYPES } from "./archetypes/audioArchetypes";
import { EFFECT_CORE_ARCHETYPES } from "./archetypes/effectArchetypes";
import { ROUTING_CORE_ARCHETYPES } from "./archetypes/routingArchetypes";
import { TRIGGER_MODULE_CORE_ARCHETYPES } from "./archetypes/triggerModuleArchetypes";
import { PRIMITIVE_CORE_ARCHETYPES } from "./archetypes/primitiveArchetypes";

export type { CompatibleNodeCategory, NodeSpawnPayload, NodeArchetypeDefinition };

const dynamicArchetypeRegistry: Map<string, NodeArchetypeDefinition> = new Map();

export function registerNodeArchetype(archetype: NodeArchetypeDefinition): void {
  dynamicArchetypeRegistry.set(archetype.id, archetype);
}

export function unregisterNodeArchetype(id: string): void {
  dynamicArchetypeRegistry.delete(id);
}

export function getAllNodeArchetypes(): NodeArchetypeDefinition[] {
  if (dynamicArchetypeRegistry.size === 0) {
    initializeCoreArchetypes();
  }
  return Array.from(dynamicArchetypeRegistry.values());
}

export function initializeCoreArchetypes(): void {
  if (dynamicArchetypeRegistry.size > 0) return;
  const coreArchetypes: NodeArchetypeDefinition[] = [
    ...AUDIO_CORE_ARCHETYPES,
    ...EFFECT_CORE_ARCHETYPES,
    ...ROUTING_CORE_ARCHETYPES,
    ...TRIGGER_MODULE_CORE_ARCHETYPES,
    ...PRIMITIVE_CORE_ARCHETYPES,
  ];
  coreArchetypes.forEach((arch) => {
    dynamicArchetypeRegistry.set(arch.id, arch);
  });
}

// Auto-initialize on module load
initializeCoreArchetypes();
