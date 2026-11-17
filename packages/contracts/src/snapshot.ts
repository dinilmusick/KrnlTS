/**
 * @file snapshot.ts
 * @description Floks Contract Snapshot Generator, Diff Engine & Canonical Contract Definition.
 * Enforces docs/04_THETA_COMPONENT_CONTRACTS.md and IMPLEMENTATION-SPEC.md:
 *   implementation_only      => PATCH
 *   additive_compatible       => MINOR
 *   breaking_contract_change => MAJOR
 */

import { z } from 'zod';
import {
  ComponentThemeContract,
  ThemePack,
} from './schemas.js';
import { FLOKS_COMPONENT_REGISTRY } from './registry.js';
import { validateThemePackAgainstContract, ThemeValidationResult } from './validator.js';

export const FLOKS_PUBLIC_SYMBOLS = [
  // UI Layout & Containers
  'AppShell',
  'TopToolbar',
  'BottomStrip',
  'FloatingDetailsPanel',
  'SettingsTab',
  'WorkspaceTilesMenu',
  'UIParent',
  'floksFrnlStore',
  'PanelProps',
  // UI Base Primitives & Forms
  'BaseButton',
  'BaseCard',
  'BaseInput',
  'BaseSelect',
  'BaseToggle',
  'BaseBadge',
  'FrnlStoreProvider',
  'ButtonProps',
  'CredentialField',
  'LoginModal',
  'ConfirmDialog',
  'StatusIndicator',
  // Canvas 2D
  'InfiniteCanvas',
  'DockBar',
  'TileGrid',
  'MonacoEditor',
  // Contracts & Theta
  'FLOKS_CANONICAL_CONTRACT',
  'FLOKS_COMPONENT_REGISTRY',
  'getComponentContract',
  'listComponentContracts',
  'validateThemePackAgainstContract',
  'loadThemePack',
  'createFloksSnapshot',
  'diffContractSnapshots',
  'ComponentThemeContractSchema',
  'VisualSlotSchema',
  'VisualStateSchema',
  'VisualParameterSchema',
  'ThemeTargetSchema',
  'ThemePackSchema',
];

export const FloksContractSnapshotSchema = z.object({
  package: z.literal('@ultrst-armada/floks'),
  version: z.string(),
  timestamp: z.number(),
  checksum: z.string(),
  publicSymbols: z.array(z.string()),
  components: z.record(
    z.object({
      componentId: z.string(),
      componentVersion: z.string(),
      slots: z.array(z.string()),
      states: z.array(z.string()),
      parameters: z.array(z.string()),
      assets: z.array(z.string()),
    })
  ),
  errorCodes: z.array(z.string()),
});
export type FloksContractSnapshot = z.infer<typeof FloksContractSnapshotSchema>;

export interface ContractDiffResult {
  versionRecommendation: 'PATCH' | 'MINOR' | 'MAJOR';
  hasBreakingChanges: boolean;
  hasAdditiveChanges: boolean;
  isIdentical: boolean;
  removedSymbols: string[];
  addedSymbols: string[];
  removedComponents: string[];
  addedComponents: string[];
  changedComponents: string[];
  summary: string;
}

/**
 * Generate canonical contract snapshot for Floks.
 */
export function createFloksSnapshot(
  version: string = '1.1.1',
  registry: Record<string, ComponentThemeContract> = FLOKS_COMPONENT_REGISTRY,
  publicSymbols: string[] = FLOKS_PUBLIC_SYMBOLS
): FloksContractSnapshot {
  const sortedSymbols = [...publicSymbols].sort();
  const components: Record<string, any> = {};

  for (const [compId, contract] of Object.entries(registry)) {
    components[compId] = {
      componentId: contract.componentId,
      componentVersion: contract.componentVersion,
      slots: contract.slots.map((s) => s.id).sort(),
      states: contract.states.map((s) => s.id).sort(),
      parameters: contract.parameters.map((p) => p.id).sort(),
      assets: [...contract.assets].sort(),
    };
  }

  const errorCodes = [
    'ERR_CONTRACT_VIOLATION',
    'ERR_INTERNAL_IMPORT_FORBIDDEN',
    'ERR_LOCAL_SHIM_DETECTED',
    'ERR_THEME_TARGET_MISMATCH',
    'ERR_SLOT_REJECTED',
    'ERR_UNRECOGNIZED_STATE',
  ];

  const rawJson = JSON.stringify({ sortedSymbols, components });
  let hash = 0;
  for (let i = 0; i < rawJson.length; i++) {
    hash = (hash << 5) - hash + rawJson.charCodeAt(i);
    hash |= 0;
  }
  const checksum = `sha256-${Math.abs(hash).toString(16)}`;

  const snapshot: FloksContractSnapshot = {
    package: '@ultrst-armada/floks',
    version,
    timestamp: 1760430000000,
    checksum,
    publicSymbols: sortedSymbols,
    components,
    errorCodes,
  };

  return FloksContractSnapshotSchema.parse(snapshot);
}

/**
 * Computes semantic diff between previous and current Floks contract snapshots.
 */
export function diffContractSnapshots(
  previous: FloksContractSnapshot,
  current: FloksContractSnapshot
): ContractDiffResult {
  const prevSymbols = new Set(previous.publicSymbols);
  const currSymbols = new Set(current.publicSymbols);

  const removedSymbols = previous.publicSymbols.filter((s) => !currSymbols.has(s));
  const addedSymbols = current.publicSymbols.filter((s) => !prevSymbols.has(s));

  const prevCompIds = Object.keys(previous.components);
  const currCompIds = new Set(Object.keys(current.components));

  const removedComponents = prevCompIds.filter((id) => !currCompIds.has(id));
  const addedComponents = Object.keys(current.components).filter((id) => !previous.components[id]);
  const changedComponents: string[] = [];

  for (const compId of Object.keys(current.components)) {
    if (previous.components[compId]) {
      const prevC = previous.components[compId];
      const currC = current.components[compId];

      const removedSlots = prevC.slots.filter((s: string) => !currC.slots.includes(s));
      const removedStates = prevC.states.filter((s: string) => !currC.states.includes(s));

      if (removedSlots.length > 0 || removedStates.length > 0) {
        changedComponents.push(
          `${compId} breaking: removed slots [${removedSlots.join(', ')}], removed states [${removedStates.join(', ')}]`
        );
      } else if (
        prevC.slots.length !== currC.slots.length ||
        prevC.states.length !== currC.states.length ||
        prevC.parameters.length !== currC.parameters.length
      ) {
        changedComponents.push(`${compId} additive extension`);
      }
    }
  }

  const hasBreakingChanges =
    removedSymbols.length > 0 ||
    removedComponents.length > 0 ||
    changedComponents.some((c) => c.includes('breaking'));
  const hasAdditiveChanges =
    addedSymbols.length > 0 ||
    addedComponents.length > 0 ||
    changedComponents.some((c) => c.includes('additive'));
  const isIdentical = !hasBreakingChanges && !hasAdditiveChanges;

  let versionRecommendation: 'PATCH' | 'MINOR' | 'MAJOR' = 'PATCH';
  if (hasBreakingChanges) {
    versionRecommendation = 'MAJOR';
  } else if (hasAdditiveChanges) {
    versionRecommendation = 'MINOR';
  }

  const summary = isIdentical
    ? 'Identical public contract surface (PATCH compatible).'
    : hasBreakingChanges
    ? `Breaking contract change detected: ${removedSymbols.length} removed symbols, ${removedComponents.length} removed components (MAJOR bump required).`
    : `Additive compatible changes: ${addedSymbols.length} added symbols, ${addedComponents.length} added components (MINOR bump required).`;

  return {
    versionRecommendation,
    hasBreakingChanges,
    hasAdditiveChanges,
    isIdentical,
    removedSymbols,
    addedSymbols,
    removedComponents,
    addedComponents,
    changedComponents,
    summary,
  };
}

export const FLOKS_CANONICAL_CONTRACT = {
  package: '@ultrst-armada/floks',
  version: '1.1.1',
  getSnapshot: () => createFloksSnapshot('1.1.1'),
  validateCompatibility: (themePack: ThemePack): ThemeValidationResult =>
    validateThemePackAgainstContract(themePack),
};
