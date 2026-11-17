// ══════════════════════════════════════════════════════════════════════════════════════════
// CANONICAL PRESETS WORKSPACE STORAGE (PURE FILE-BASED VAULT)
// ══════════════════════════════════════════════════════════════════════════════════════════

import { IntelligenceSpecPreset, PreferencesSpecPreset } from '../intelligence/types.js';
import { DEFAULT_INTELLIGENCE_PRESETS, DEFAULT_PREFERENCES_PRESETS } from '../intelligence/presets.js';
import { readVaultJsonSync, writeVaultJsonSync } from './workspaceFileSystem.js';

const INTEL_PRESETS_FILENAME = 'intelligence_presets.json';
const PREF_PRESETS_FILENAME = 'preferences_presets.json';

/**
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * UTILITY: PresetsStorageCoordinator
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * Presets Persistence Path:
 * ┌───────────────────────────────────────────────────────────┐
 * │ PresetsStorageCoordinator.savePreset(preset)              │
 * └─────────────────────────────┬─────────────────────────────┘
 *                               │
 *                               ▼
 * ┌───────────────────────────────────────────────────────────┐
 * │ writeVaultJsonSync: docustack_vault/intelligence_presets  │
 * └─────────────────────────────┬─────────────────────────────┘
 *                               │
 *                               ▼
 * ┌───────────────────────────────────────────────────────────┐
 * │ WorkspaceFS: Asynchronous Multi-Cloud Storage Broadcast   │
 * └───────────────────────────────────────────────────────────┘
 * ──────────────────────────────────────────────────────────────────────────────────────────
 */
export class PresetsStorageCoordinator {
  private intelPresets: IntelligenceSpecPreset[] = [];
  private prefPresets: PreferencesSpecPreset[] = [];
  private loaded = false;

  private ensureLoaded(): void {
    if (!this.loaded) {
      this.intelPresets = readVaultJsonSync(INTEL_PRESETS_FILENAME, DEFAULT_INTELLIGENCE_PRESETS);
      this.prefPresets = readVaultJsonSync(PREF_PRESETS_FILENAME, DEFAULT_PREFERENCES_PRESETS);
      this.loaded = true;
    }
  }

  public loadPresets(): IntelligenceSpecPreset[] {
    this.ensureLoaded();
    return [...this.intelPresets];
  }

  public getPresetById(id: string): IntelligenceSpecPreset | null {
    this.ensureLoaded();
    return this.intelPresets.find((p) => p.id === id) || null;
  }

  public savePreset(preset: IntelligenceSpecPreset): IntelligenceSpecPreset {
    this.ensureLoaded();
    const idx = this.intelPresets.findIndex((p) => p.id === preset.id);
    if (idx >= 0) {
      this.intelPresets[idx] = preset;
    } else {
      this.intelPresets.push(preset);
    }
    writeVaultJsonSync(INTEL_PRESETS_FILENAME, this.intelPresets);
    return preset;
  }

  public deletePreset(id: string): boolean {
    this.ensureLoaded();
    const prevLen = this.intelPresets.length;
    this.intelPresets = this.intelPresets.filter((p) => p.id !== id);
    if (this.intelPresets.length !== prevLen) {
      writeVaultJsonSync(INTEL_PRESETS_FILENAME, this.intelPresets);
      return true;
    }
    return false;
  }

  public resetPresetsToDefault(): IntelligenceSpecPreset[] {
    this.intelPresets = [...DEFAULT_INTELLIGENCE_PRESETS];
    writeVaultJsonSync(INTEL_PRESETS_FILENAME, this.intelPresets);
    return [...this.intelPresets];
  }

  public loadPreferencesPresets(): PreferencesSpecPreset[] {
    this.ensureLoaded();
    return [...this.prefPresets];
  }

  public getPreferencesPresetById(id: string): PreferencesSpecPreset | null {
    this.ensureLoaded();
    return this.prefPresets.find((p) => p.id === id) || null;
  }

  public savePreferencesPreset(preset: PreferencesSpecPreset): PreferencesSpecPreset {
    this.ensureLoaded();
    const idx = this.prefPresets.findIndex((p) => p.id === preset.id);
    if (idx >= 0) {
      this.prefPresets[idx] = preset;
    } else {
      this.prefPresets.push(preset);
    }
    writeVaultJsonSync(PREF_PRESETS_FILENAME, this.prefPresets);
    return preset;
  }

  public deletePreferencesPreset(id: string): boolean {
    this.ensureLoaded();
    const prevLen = this.prefPresets.length;
    this.prefPresets = this.prefPresets.filter((p) => p.id !== id);
    if (this.prefPresets.length !== prevLen) {
      writeVaultJsonSync(PREF_PRESETS_FILENAME, this.prefPresets);
      return true;
    }
    return false;
  }

  public resetPreferencesPresetsToDefault(): PreferencesSpecPreset[] {
    this.prefPresets = [...DEFAULT_PREFERENCES_PRESETS];
    writeVaultJsonSync(PREF_PRESETS_FILENAME, this.prefPresets);
    return [...this.prefPresets];
  }
}

export const presetsStorage = new PresetsStorageCoordinator();