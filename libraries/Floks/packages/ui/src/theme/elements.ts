import type { UIElementDefinition } from './types.js';
import { CANONICAL_ELEMENTS } from './canonicalElements.js';

export { CANONICAL_ELEMENTS };

class ElementLedgerRegistry {
  private elements = new Map<string, UIElementDefinition>();

  constructor() {
    this.reset();
  }

  public reset(): void {
    this.elements.clear();
    for (const el of CANONICAL_ELEMENTS) {
      this.elements.set(el.id, { ...el });
    }
  }

  public register(def: UIElementDefinition): void {
    const existing = this.elements.get(def.id);
    if (existing) {
      if (existing.name !== def.name || existing.category !== def.category) {
        throw new Error(
          `Cannot redefine existing UI element "${def.id}" from app "${existing.firstDefinedByApp}" with different semantics in app "${def.firstDefinedByApp}". Reuse canonical definition.`
        );
      }
      return;
    }
    this.elements.set(def.id, { ...def });
  }

  public get(id: string): UIElementDefinition | undefined {
    return this.elements.get(id);
  }

  public has(id: string): boolean {
    return this.elements.has(id);
  }

  public getAll(): UIElementDefinition[] {
    return Array.from(this.elements.values());
  }

  public count(): number {
    return this.elements.size;
  }
}

export const centralLedger = new ElementLedgerRegistry();

export function registerUIElement(def: UIElementDefinition): void {
  centralLedger.register(def);
}

export function getUIElement(id: string): UIElementDefinition | undefined {
  return centralLedger.get(id);
}

export function getAllUIElements(): UIElementDefinition[] {
  return centralLedger.getAll();
}
