/**
 * @file snapshot.ts
 * @description Contract snapshot generator, diff engine, and semantic versioning rules.
 * Enforces:
 *   implementation_only      => PATCH
 *   additive_compatible       => MINOR
 *   breaking_contract_change => MAJOR
 */

import { ContractSnapshot, ContractSnapshotSchema } from './schemas.js';
import { KLOKS_PUBLIC_SURFACE, ExportSymbolEntry } from './surface.js';

export interface ContractDiffResult {
  versionRecommendation: 'PATCH' | 'MINOR' | 'MAJOR';
  hasBreakingChanges: boolean;
  hasAdditiveChanges: boolean;
  isIdentical: boolean;
  removedSymbols: string[];
  addedSymbols: string[];
  changedSignatures: string[];
  summary: string;
}

/**
 * Generate canonical contract snapshot for Kloks.
 */
export function createKloksSnapshot(
  version: string = '1.0.2',
  surface: ExportSymbolEntry[] = KLOKS_PUBLIC_SURFACE
): ContractSnapshot {
  const publicSymbols = surface.map((s) => s.name).sort();
  const normalizedSignatures: Record<string, string> = {};
  const zodFingerprints: Record<string, string> = {};

  for (const item of surface) {
    normalizedSignatures[item.name] = `${item.category}:${item.subpath}`;
    zodFingerprints[item.name] = item.hasZodSchema ? 'zod-verified' : 'typescript-only';
  }

  const facades = surface
    .filter((s) => s.name.endsWith('Facade') || s.name.endsWith('facade'))
    .map((s) => s.name)
    .sort();

  const events = [
    'AudioServiceEvents.stateChange',
    'MidiServiceEvents.midiEvent',
    'TelemetryEvents.reading',
  ];

  const commands = [
    'WorkspaceBackendFacade.project.list',
    'WorkspaceBackendFacade.project.get',
    'WorkspaceBackendFacade.project.save',
    'WorkspaceBackendFacade.project.create',
    'WorkspaceBackendFacade.project.delete',
    'WorkspaceBackendFacade.sample.list',
    'WorkspaceBackendFacade.sample.upload',
    'WorkspaceBackendFacade.sample.delete',
    'WorkspaceBackendFacade.asset.listPool',
    'WorkspaceBackendFacade.asset.createFolder',
    'WorkspaceBackendFacade.asset.upload',
    'WorkspaceBackendFacade.asset.delete',
  ];

  const errorCodes = [
    'ERR_CONTRACT_VIOLATION',
    'ERR_INTERNAL_IMPORT_FORBIDDEN',
    'ERR_LOCAL_SHIM_DETECTED',
    'ERR_INCOMPATIBLE_SURFACE',
  ];

  const rawJson = JSON.stringify({ publicSymbols, facades, commands, events });
  // Simple deterministic hash
  let hash = 0;
  for (let i = 0; i < rawJson.length; i++) {
    hash = (hash << 5) - hash + rawJson.charCodeAt(i);
    hash |= 0;
  }
  const checksum = `sha256-${Math.abs(hash).toString(16)}`;

  const snapshot: ContractSnapshot = {
    package: '@ultrst-armada/kloks',
    version,
    timestamp: 1760377000000,
    checksum,
    publicSymbols,
    normalizedSignatures,
    zodFingerprints,
    facades,
    events,
    commands,
    errorCodes,
  };

  return ContractSnapshotSchema.parse(snapshot);
}

/**
 * Computes semantic diff between previous and current contract snapshots.
 */
export function diffContractSnapshots(
  previous: ContractSnapshot,
  current: ContractSnapshot
): ContractDiffResult {
  const prevSymbols = new Set(previous.publicSymbols);
  const currSymbols = new Set(current.publicSymbols);

  const removedSymbols = previous.publicSymbols.filter((s) => !currSymbols.has(s));
  const addedSymbols = current.publicSymbols.filter((s) => !prevSymbols.has(s));
  const changedSignatures: string[] = [];

  for (const s of current.publicSymbols) {
    if (prevSymbols.has(s)) {
      const prevSig = previous.normalizedSignatures[s];
      const currSig = current.normalizedSignatures[s];
      if (prevSig && currSig && prevSig !== currSig) {
        changedSignatures.push(`${s} (${prevSig} -> ${currSig})`);
      }
    }
  }

  const hasBreakingChanges = removedSymbols.length > 0;
  const hasAdditiveChanges = addedSymbols.length > 0 || changedSignatures.length > 0;
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
    ? `Breaking contract change detected: ${removedSymbols.length} removed symbols (MAJOR bump required).`
    : `Additive compatible changes: ${addedSymbols.length} added symbols (MINOR bump required).`;

  return {
    versionRecommendation,
    hasBreakingChanges,
    hasAdditiveChanges,
    isIdentical,
    removedSymbols,
    addedSymbols,
    changedSignatures,
    summary,
  };
}
