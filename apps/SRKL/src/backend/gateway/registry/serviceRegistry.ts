export interface GatewayServiceRecord {
  name: string;
  version: string;
  runtime: 'client' | 'server';
  deployment: 'local' | 'remote';
  endpoint?: string;
}

export class GatewayRegistry {
  private records: Map<string, GatewayServiceRecord> = new Map();

  public register(record: GatewayServiceRecord): void {
    this.records.set(record.name, record);
  }

  public lookup(name: string): GatewayServiceRecord | null {
    return this.records.get(name) || null;
  }
}

export const serviceRegistry = new GatewayRegistry();
