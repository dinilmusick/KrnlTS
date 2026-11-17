// ══════════════════════════════════════════════════════════════════════════════════════════
// UIElementBase: Root Template / Base Class for all UI Elements in Qwnsr
// ══════════════════════════════════════════════════════════════════════════════════════════
// @role skeleton
import type { ReactNode } from 'react';
import { GraphEntityParent, QwnsrMetadata } from '../core/GraphEntityParent';

export type ColorPalette = Record<string, any>;
let activePaletteResolver: () => ColorPalette = () => ({});
export function registerQwnsrPaletteResolver(fn: () => ColorPalette): void {
  activePaletteResolver = fn;
}
function getActivePalette(): ColorPalette {
  return activePaletteResolver();
}

export type QwnsrUIRole = 'panel' | 'button' | 'input' | 'tile' | 'badge';
export type QwnsrUIVariant =
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'amber'
  | 'sky'
  | 'emerald'
  | 'danger'
  | 'ghost'
  | 'dock'
  | 'outline';
export type QwnsrUISize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type QwnsrTooltipDirection = 'top' | 'bottom' | 'left' | 'right';

export interface QwnsrUIBaseProps {
  id?: string;
  className?: string;
  variant?: QwnsrUIVariant;
  size?: QwnsrUISize;
  disabled?: boolean;
  isActive?: boolean;
  tooltip?: string;
  tooltipDirection?: QwnsrTooltipDirection;
  shortcutHint?: string;
  children?: ReactNode;
}

/**
 * UIElementBase: Universal Base Class tracing to GraphEntityParent
 * Every UI Model in the application derives from this root template class.
 */
export abstract class UIElementBase extends GraphEntityParent {
  public readonly themeRole: QwnsrUIRole;
  public variant: QwnsrUIVariant;
  public size: QwnsrUISize;
  public isDisabled: boolean;
  public isHighlighted: boolean;
  public tooltipText?: string;
  public tooltipDir: QwnsrTooltipDirection;

  constructor(
    id: string,
    name: string,
    themeRole: QwnsrUIRole,
    variant: QwnsrUIVariant = 'primary',
    size: QwnsrUISize = 'md',
    metadata: QwnsrMetadata = {}
  ) {
    super(id, name, 'ui', metadata);
    this.themeRole = themeRole;
    this.variant = variant;
    this.size = size;
    this.isDisabled = false;
    this.isHighlighted = false;
    this.tooltipDir = 'bottom';
  }

  public getPalette(): ColorPalette {
    return getActivePalette();
  }

  public setDisabled(disabled: boolean): void {
    if (this.isDisabled !== disabled) {
      this.isDisabled = disabled;
      this.emit('disabled_changed', disabled);
    }
  }

  public setHighlighted(highlighted: boolean): void {
    if (this.isHighlighted !== highlighted) {
      this.isHighlighted = highlighted;
      this.emit('highlighted_changed', highlighted);
    }
  }

  public setVariant(variant: QwnsrUIVariant): void {
    this.variant = variant;
    this.emit('variant_changed', variant);
  }

  public initialize(): void {
    this.emit('ui_element_initialized', { id: this.id, role: this.themeRole });
  }

  public dispose(): void {
    this.emit('ui_element_disposed', { id: this.id });
  }

  public toJSON(): Record<string, any> {
    return {
      id: this.id,
      name: this.name,
      role: this.themeRole,
      variant: this.variant,
      size: this.size,
      disabled: this.isDisabled,
      metadata: this.metadata,
    };
  }
}
