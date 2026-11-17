import type { ElementStatusReport, ThemeEngineStatus } from './types.js';
import { centralLedger } from './elements.js';
import type { ThemeEngine } from './engine.js';

export function getThemeEngineStatus(engine: ThemeEngine): ThemeEngineStatus {
  const socket = engine.getSocket();
  const basePackId = engine.getActiveBasePackId();
  const basePack = engine.getThemePack(basePackId);
  const overrides = engine.getElementOverrides();

  const elementsReport: Record<string, ElementStatusReport> = {};
  const uncoveredElements: string[] = [];

  for (const elId of socket.elementIds) {
    const canonical = centralLedger.get(elId);
    const resolved = engine.resolveElementTheme(elId);

    if (resolved.isFallback) {
      uncoveredElements.push(elId);
    }

    elementsReport[elId] = {
      elementId: elId,
      name: canonical?.name || elId,
      category: canonical?.category || 'specialized',
      appliedThemePackId: resolved.appliedPackId,
      appliedVariant: resolved.appliedVariant,
      isOverridden: resolved.isOverridden,
      isFallback: resolved.isFallback,
      effectiveCssVars: resolved.value.cssVars || {},
      effectiveStyles: resolved.value.styles || {},
      effectiveEffects: (resolved.value.effects as Record<string, string>) || {},
      effectiveAssets: (resolved.value.assets as Record<string, string>) || {}
    };
  }

  // Calculate ignored elements: defined in applied theme packs but not used by app socket
  const relevantPackIds = new Set<string>([basePackId, ...Object.values(overrides)]);
  const ignoredElementsSet = new Set<string>();

  for (const packId of relevantPackIds) {
    const pack = engine.getThemePack(packId);
    if (!pack) continue;
    const styles = pack.variants?.[engine.getMode()]?.elementStyles || pack.elementStyles;
    for (const elKey of Object.keys(styles)) {
      if (!socket.elementIds.includes(elKey)) {
        ignoredElementsSet.add(elKey);
      }
    }
  }

  return {
    appId: socket.appId,
    socketVersion: socket.version,
    registeredElementsCount: socket.elementIds.length,
    activeBasePackId: basePackId,
    activeBasePackName: basePack?.metadata.name || basePackId,
    activeMode: engine.getMode(),
    elementOverridesCount: Object.keys(overrides).length,
    elementOverrides: overrides,
    elements: elementsReport,
    uncoveredElements,
    ignoredElements: Array.from(ignoredElementsSet),
    timestamp: Date.now(),
    isValid: uncoveredElements.length === 0
  };
}
