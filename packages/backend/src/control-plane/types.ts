export interface ClusterConfig {
  nodes: string[];
  primary: string;
}

export interface AuditEvent {
  id: string;
  timestamp: number;
  userId: string;
  action: string;
  resource: string;
  details?: Record<string, any>;
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'down';
  latencyMs: number;
  lastCheck: number;
}
