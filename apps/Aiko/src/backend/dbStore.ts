import { KeyModelUsageStats, KeyModelFailure } from './types.js';
import { IntelligenceSpecPreset, PreferencesSpecPreset } from './intelligence/types.js';
import { metricsStorage } from './storage/metricsStorage.js';
import { presetsStorage } from './storage/presetsStorage.js';

export class PersistentDbStore {
  public recordKeyModelCall(keyId: string, modelId: string, timestamp?: string): void { metricsStorage.recordKeyModelCall(keyId, modelId, timestamp); }
  public getKeyModelUsageStats(keyId: string, modelId: string): KeyModelUsageStats { return metricsStorage.getKeyModelUsageStats(keyId, modelId); }
  public getAllKeyModelUsageStats(): KeyModelUsageStats[] { return metricsStorage.getAllKeyModelUsageStats(); }
  public recordKeyModelFailure(keyId: string, modelId: string, error?: string, timestamp?: string): void { metricsStorage.recordKeyModelFailure(keyId, modelId, error, timestamp); }
  public recordKeyModelSuccess(keyId: string, modelId: string): void { metricsStorage.recordKeyModelSuccess(keyId, modelId); }
  public getKeyModelFailures(keyId: string): Record<string, KeyModelFailure> { return metricsStorage.getKeyModelFailures(keyId); }
  public resetKeyModelFailures(keyId: string): void { metricsStorage.resetKeyModelFailures(keyId); }
  public recordKeyUsage(keyId: string, modelId: string, _latencyMs: number, success: boolean, _cost?: number): void {
    if (!modelId) return;
    this.recordKeyModelCall(keyId, modelId);
    if (success) this.recordKeyModelSuccess(keyId, modelId); else this.recordKeyModelFailure(keyId, modelId);
  }
  public loadPresets(): IntelligenceSpecPreset[] { return presetsStorage.loadPresets(); }
  public getPresetById(id: string): IntelligenceSpecPreset | null { return presetsStorage.getPresetById(id); }
  public savePreset(preset: IntelligenceSpecPreset): IntelligenceSpecPreset { return presetsStorage.savePreset(preset); }
  public deletePreset(id: string): boolean { return presetsStorage.deletePreset(id); }
  public resetPresetsToDefault(): IntelligenceSpecPreset[] { return presetsStorage.resetPresetsToDefault(); }
  public loadPreferencesPresets(): PreferencesSpecPreset[] { return presetsStorage.loadPreferencesPresets(); }
  public getPreferencesPresetById(id: string): PreferencesSpecPreset | null { return presetsStorage.getPreferencesPresetById(id); }
  public savePreferencesPreset(preset: PreferencesSpecPreset): PreferencesSpecPreset { return presetsStorage.savePreferencesPreset(preset); }
  public deletePreferencesPreset(id: string): boolean { return presetsStorage.deletePreferencesPreset(id); }
  public resetPreferencesPresetsToDefault(): PreferencesSpecPreset[] { return presetsStorage.resetPreferencesPresetsToDefault(); }
  public saveModelHealthStatus(modelId: string, status: string, consecutiveFailures: number, lastCheckedAt: string): void { metricsStorage.saveModelHealthStatus(modelId, status, consecutiveFailures, lastCheckedAt); }
  public loadModelHealthStatuses(): Record<string, { status: string; consecutiveFailures: number; lastCheckedAt: string }> { return metricsStorage.loadModelHealthStatuses(); }
}
export const dbStore = new PersistentDbStore();
