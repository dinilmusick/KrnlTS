export interface HandleTypeDefinition {
  dataType: string;
  category: 'DATA' | 'VIEW';
  description?: string;
  color?: string;
}

export class HandleTypeRegistry {
  private static types: Map<string, HandleTypeDefinition> = new Map();

  public static register(typeDef: HandleTypeDefinition): void {
    this.types.set(typeDef.dataType.toUpperCase(), typeDef);
  }

  public static get(dataType: string): HandleTypeDefinition | undefined {
    return this.types.get(dataType.toUpperCase());
  }

  public static has(dataType: string): boolean {
    return this.types.has(dataType.toUpperCase());
  }

  public static list(): HandleTypeDefinition[] {
    return Array.from(this.types.values());
  }

  public static clear(): void {
    this.types.clear();
  }
}
