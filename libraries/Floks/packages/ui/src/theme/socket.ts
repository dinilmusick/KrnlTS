import type { AppThemeSocket } from './types.js';
import { centralLedger } from './elements.js';

export function validateSocketElements(socket: AppThemeSocket): { valid: boolean; missing: string[] } {
  const missing: string[] = [];
  for (const elId of socket.elementIds) {
    if (!centralLedger.has(elId)) {
      missing.push(elId);
    }
  }
  return {
    valid: missing.length === 0,
    missing
  };
}

export function createAppThemeSocket(definition: AppThemeSocket): AppThemeSocket {
  if (!definition.appId || !definition.appName) {
    throw new Error('AppThemeSocket requires appId and appName.');
  }
  if (!Array.isArray(definition.elementIds) || definition.elementIds.length === 0) {
    throw new Error(`AppThemeSocket "${definition.appId}" must define at least one elementId.`);
  }

  const check = validateSocketElements(definition);
  if (!check.valid) {
    throw new Error(
      `AppThemeSocket "${definition.appId}" references unknown UI elements: [${check.missing.join(', ')}]. Register them with the centralLedger first.`
    );
  }

  return {
    ...definition,
    version: definition.version || '1.0.0'
  };
}
