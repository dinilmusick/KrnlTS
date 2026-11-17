// ══════════════════════════════════════════════════════════════════════════════════════════
// 1. IMPORTS & EXTERNAL DEPENDENCIES
// ══════════════════════════════════════════════════════════════════════════════════════════
import { SpaceNode, NodeCategoryKey, NodeMeshSetting } from "../../types/index.js";

// ══════════════════════════════════════════════════════════════════════════════════════════
// 2. DATA SCHEMAS, INTERFACES & TYPES (Pluggable 2D & 3D Asset System)
// ══════════════════════════════════════════════════════════════════════════════════════════

export type RenderEngineMode = '3d' | '2d';

/**
 * 2D Sprite Visual Specification for a Node Archetype
 */
export interface Node2DSpriteSetting {
  spriteId: string;
  spriteName: string;
  category: 'container' | 'trigger' | 'effect' | 'io' | 'router' | 'module' | 'converter' | 'data';
  subType: string;
  iconName: string; // Lucide icon identifier
  accentColor: string;
  secondaryColor: string;
  badgeText: string;
  dimensions: { width: number; height: number };
  glowColor: string;
  themeStyle: 'fantasy_rts' | 'sci_fi_matrix' | 'neo_brutalist';
  description: string;
  role: string;
}

/**
 * Combined Pluggable Asset Definition for any Node
 */
export interface PluggableNodeAsset {
  nodeType: string;
  subType?: string;
  name: string;
  asset3D: NodeMeshSetting;
  asset2D: Node2DSpriteSetting;
}

// ══════════════════════════════════════════════════════════════════════════════════════════
// 3. CANONICAL NODE ASSET CATALOG (2D Sprites & 3D Meshes)
// ══════════════════════════════════════════════════════════════════════════════════════════
