export interface SystemHealthInput {
  ping?: boolean;
}

export interface SystemHealthOutput {
  status: 'ONLINE' | 'DEGRADED';
  activeSubsystems: string[];
  uptimeSeconds: number;
  timestamp: number;
}
