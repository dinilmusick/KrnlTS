import { UniversalSocketDefinition, SignalType } from "../../types/index.js";
import { CompatibleNodeCategory, NodeSpawnPayload } from "../../core/nodeArchetypeRegistry.js";

export type { CompatibleNodeCategory };

export interface CompatibleSpawnOption {
  id: string;
  category: CompatibleNodeCategory;
  label: string;
  description: string;
  iconName: string;
  colorHex: string;
  badge: string;
  matchingSocketId: string;
  matchingSocketIndex?: number;
  spawnType: NodeSpawnPayload;
}

export interface ResolvedSocketDetails {
  socketDef?: UniversalSocketDefinition;
  signalType: SignalType;
  portLabel: string;
  socketTitle: string;
  signalName: string;
  signalColor: string;
}
