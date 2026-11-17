// ══════════════════════════════════════════════════════════════════════════════
// DEPM SYSTEM TYPES - SETTINGS
// ══════════════════════════════════════════════════════════════════════════════

export interface GeneralSettings {
  applicationName: string;
  defaultView: 'TILES' | 'GRAPH';
  refreshInterval: number;
  telemetry: boolean;
  notifications: boolean;
  srklDeploymentUrl?: string;
}

export interface AppearanceSettings {
  theme: 'SYSTEM' | 'LIGHT' | 'DARK';
  density: 'COMPACT' | 'NORMAL' | 'COMFORTABLE';
  nodeScale: number;
  animation: boolean;
  iconScale: number;
}

export interface GatewaySettings {
  publicDomain: string;
  routingEnabled: boolean;
  healthCheckInterval: number;
  failoverEnabled: boolean;
  defaultRateLimit: number;
  defaultTimeout: number;
}

export interface SecuritySettings {
  authenticationRequired: boolean;
  authorizationPolicy: string;
  originProtection: boolean;
  providerProtection: boolean;
  auditLogging: boolean;
  credentialEncryption: boolean;
}

export interface MonitoringSettings {
  usageRefreshInterval: number;
  healthRefreshInterval: number;
  anomalyDetection: boolean;
  burstDetection: boolean;
  budgetProjection: boolean;
  alertThresholds: {
    warningPercent: number;
    criticalPercent: number;
  };
}

export interface OverlayWindow {
  id: string;
  type:
    | 'DEPLOYMENT_DETAIL'
    | 'ACCOUNT_DETAIL'
    | 'URL_DETAIL'
    | 'SYSTEM_DATABASE_DETAIL'
    | 'SYSTEM_BUCKET_DETAIL'
    | 'ADMIN_CREDENTIALS_DETAIL'
    | 'ECOSYSTEM_HUB_DETAIL'
    | 'ADD_ACCOUNT'
    | 'CREATE_APP'
    | 'SPAWN_DEPLOYMENT'
    | 'SPAWN_COMPONENT';
  title: string;
  data?: any;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  zIndex: number;
}
