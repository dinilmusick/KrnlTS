import { AdminDatabaseClusterConfig, UserStorageConnection } from '@kloks/state-graph';

export const STORAGE_KEY_CONNECTIONS = 'depm_user_storage_connections';

export const CLEAN_DATABASE_CLUSTER: AdminDatabaseClusterConfig = {
  activePrimaryId: 'db_system_primary',
  syncPolicy: 'async_replication',
  autoFailover: true,
  healthCheckIntervalSeconds: 30,
  databases: [],
};

export const DEFAULT_CONNECTIONS: UserStorageConnection[] = [];

