import { NodeRegistry } from "../registry/index.js";
import { registerPresetNodes } from "./presets.js";
import { registerCoreNodes } from "./core.js";
import { registerMathNodes } from "./math.js";
import { registerLogicNodes } from "./logic.js";
import { registerStringNodes } from "./string.js";
import { registerCollectionsNodes } from "./collections.js";
import { registerParsingNodes } from "./parsing.js";
import { registerNetworkingNodes } from "./networking.js";
import { registerAiNodes } from "./ai.js";
import { registerDatabaseNodes } from "./database.js";
import { registerUtilitiesNodes } from "./utilities.js";
import { registerRuntimeNodes } from "./runtime.js";

export function registerAllNodes(registry: NodeRegistry): NodeRegistry {
  registerPresetNodes(registry);
  registerCoreNodes(registry);
  registerMathNodes(registry);
  registerLogicNodes(registry);
  registerStringNodes(registry);
  registerCollectionsNodes(registry);
  registerParsingNodes(registry);
  registerNetworkingNodes(registry);
  registerAiNodes(registry);
  registerDatabaseNodes(registry);
  registerUtilitiesNodes(registry);
  registerRuntimeNodes(registry);
  return registry;
}
