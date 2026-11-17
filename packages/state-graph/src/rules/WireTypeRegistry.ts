export interface WireTypeDefinition {
  wireType: string;
  color: string;
  strokeWidth: number;
  dashArray?: string;
  style?: 'bezier' | 'straight' | 'step';
  description?: string;
}

export class WireTypeRegistry {
  private static wireTypes: Map<string, WireTypeDefinition> = new Map();

  public static register(def: WireTypeDefinition): void {
    this.wireTypes.set(def.wireType.toUpperCase(), def);
  }

  public static get(wireType: string): WireTypeDefinition | undefined {
    return this.wireTypes.get(wireType.toUpperCase());
  }

  public static list(): WireTypeDefinition[] {
    return Array.from(this.wireTypes.values());
  }

  public static clear(): void {
    this.wireTypes.clear();
  }
}
