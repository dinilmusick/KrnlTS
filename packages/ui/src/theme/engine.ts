import type {
  AppThemeSocket,
  ModularThemePack,
  ThemeApplicationState,
  UIElementThemeValue
} from './types.js';
import { mapSemanticTokensToCssVars } from './tokenMapper.js';
import { resolveTypographyCascade } from './schema/cascade.js';

export class ThemeEngine {
  private socket: AppThemeSocket;
  private packs = new Map<string, ModularThemePack>();
  private activeBasePackId: string;
  private activeMode: 'dark' | 'light' = 'dark';
  private elementOverrides = new Map<string, string>();
  private listeners = new Set<(state: ThemeApplicationState) => void>();

  constructor(
    socket: AppThemeSocket,
    initialPacks: ModularThemePack[] = [],
    initialMode: 'dark' | 'light' = 'dark'
  ) {
    this.socket = socket;
    for (const pack of initialPacks) this.registerThemePack(pack);
    this.activeBasePackId = socket.defaultThemePackId || initialPacks[0]?.metadata.id || '';
    this.activeMode = initialMode;
  }

  public registerThemePack(pack: ModularThemePack): void { this.packs.set(pack.metadata.id, pack); }
  public getThemePack(packId: string): ModularThemePack | undefined { return this.packs.get(packId); }
  public getAllThemePacks(): ModularThemePack[] { return Array.from(this.packs.values()); }
  public getSocket(): AppThemeSocket { return this.socket; }
  public getActiveBasePackId(): string { return this.activeBasePackId; }
  public getMode(): 'dark' | 'light' { return this.activeMode; }

  public setBaseThemePack(packId: string): void {
    if (!this.packs.has(packId)) throw new Error(`Theme pack "${packId}" is not registered.`);
    this.activeBasePackId = packId;
    this.notify();
    this.applyToDOM();
  }

  public setMode(mode: 'dark' | 'light'): void {
    if (this.activeMode === mode) return;
    this.activeMode = mode;
    this.notify();
    this.applyToDOM();
  }

  public toggleMode(): 'dark' | 'light' {
    this.activeMode = this.activeMode === 'dark' ? 'light' : 'dark';
    this.notify();
    this.applyToDOM();
    return this.activeMode;
  }

  public setElementOverride(elementId: string, packId: string): void {
    if (!this.socket.elementIds.includes(elementId)) {
      throw new Error(`Element "${elementId}" is not part of app socket "${this.socket.appId}".`);
    }
    if (!this.packs.has(packId)) throw new Error(`Theme pack "${packId}" is not registered.`);
    this.elementOverrides.set(elementId, packId);
    this.notify();
    this.applyToDOM();
  }

  public clearElementOverride(elementId: string): void {
    this.elementOverrides.delete(elementId);
    this.notify();
    this.applyToDOM();
  }

  public clearAllOverrides(): void {
    this.elementOverrides.clear();
    this.notify();
    this.applyToDOM();
  }

  public batchSetElementOverrides(overrides: Record<string, string>): void {
    for (const [elId, packId] of Object.entries(overrides)) {
      if (this.socket.elementIds.includes(elId) && this.packs.has(packId)) {
        this.elementOverrides.set(elId, packId);
      }
    }
    this.notify();
    this.applyToDOM();
  }

  public getElementOverrides(): Record<string, string> {
    const res: Record<string, string> = {};
    for (const [elId, packId] of this.elementOverrides.entries()) res[elId] = packId;
    return res;
  }

  public resolveElementTheme(elementId: string): {
    appliedPackId: string;
    appliedVariant: 'dark' | 'light';
    isOverridden: boolean;
    isFallback: boolean;
    value: UIElementThemeValue;
  } {
    const overridePackId = this.elementOverrides.get(elementId);
    const targetPackId = overridePackId || this.activeBasePackId;
    const targetPack = this.packs.get(targetPackId);
    const isOverridden = !!overridePackId;

    if (targetPack) {
      const modeVariant = targetPack.variants?.[this.activeMode]?.elementStyles?.[elementId];
      if (modeVariant) return { appliedPackId: targetPackId, appliedVariant: this.activeMode, isOverridden, isFallback: false, value: modeVariant };
      const defaultStyle = targetPack.elementStyles?.[elementId];
      if (defaultStyle) return { appliedPackId: targetPackId, appliedVariant: targetPack.metadata.mode || this.activeMode, isOverridden, isFallback: false, value: defaultStyle };
    }

    const basePack = this.packs.get(this.activeBasePackId);
    if (basePack) {
      const baseModeVariant = basePack.variants?.[this.activeMode]?.elementStyles?.[elementId];
      if (baseModeVariant) return { appliedPackId: this.activeBasePackId, appliedVariant: this.activeMode, isOverridden: false, isFallback: false, value: baseModeVariant };
      const baseDefaultStyle = basePack.elementStyles?.[elementId];
      if (baseDefaultStyle) return { appliedPackId: this.activeBasePackId, appliedVariant: basePack.metadata.mode || this.activeMode, isOverridden: false, isFallback: false, value: baseDefaultStyle };
    }

    const fallback = this.socket.elementDefaults?.[elementId] || {};
    return { appliedPackId: targetPackId, appliedVariant: this.activeMode, isOverridden, isFallback: true, value: fallback as UIElementThemeValue };
  }

  public computeAllCssVariables(): Record<string, string> {
    const basePack = this.packs.get(this.activeBasePackId);
    const cssVars: Record<string, string> = {};
    const tokens = basePack?.variants?.[this.activeMode]?.tokens || basePack?.tokens;
    if (tokens) Object.assign(cssVars, mapSemanticTokensToCssVars(tokens));

    const typo = basePack?.variants?.[this.activeMode]?.typography || basePack?.typography;
    if (typo) {
      const resolvedTypo = resolveTypographyCascade(typo, tokens?.accent.primary);
      Object.assign(cssVars, resolvedTypo.cssVars);
    }

    for (const elId of this.socket.elementIds) {
      const resolved = this.resolveElementTheme(elId);
      if (resolved.value.cssVars) Object.assign(cssVars, resolved.value.cssVars);
    }
    return cssVars;
  }

  public applyToDOM(target?: HTMLElement): void {
    if (typeof document === 'undefined') return;
    const root = target || document.documentElement;
    const vars = this.computeAllCssVariables();
    for (const [key, val] of Object.entries(vars)) {
      if (val) root.style.setProperty(key, val);
    }
    root.setAttribute('data-skipo-theme-id', this.activeBasePackId);
    root.setAttribute('data-skipo-theme-mode', this.activeMode);
    root.setAttribute('data-theme', this.activeMode);
    root.setAttribute('data-skipo-overrides-count', String(this.elementOverrides.size));
    if (this.activeMode === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
  }

  public subscribe(fn: (state: ThemeApplicationState) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private notify(): void {
    const state: ThemeApplicationState = {
      activeBasePackId: this.activeBasePackId,
      activeMode: this.activeMode,
      elementOverrides: this.getElementOverrides()
    };
    for (const fn of this.listeners) fn(state);
  }
}
