import {
  SpaceNode,
  UniversalSocketDefinition,
  SignalMedium,
  SignalDataType,
  SignalPolarity,
  ConnectivityType,
  SignalType,
} from "../../types/index.js";

export type { UniversalSocketDefinition };
export type NodeSocketDescriptor = UniversalSocketDefinition;

export interface NodeSocketsResult {
  inputs: UniversalSocketDefinition[];
  outputs: UniversalSocketDefinition[];
}
