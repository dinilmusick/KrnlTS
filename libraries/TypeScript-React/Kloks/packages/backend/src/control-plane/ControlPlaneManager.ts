import { SkipoBase } from '@kloks/functions/base';
import { BaseAccountProvider } from '../auth/BaseAccountProvider.js';
import { AuditLogger } from './AuditLogger.js';
import { DatabaseClusterManager } from './DatabaseClusterManager.js';

export class ControlPlaneManager extends SkipoBase {
  public auth: BaseAccountProvider;
  public audit: AuditLogger;
  public cluster: DatabaseClusterManager;

  constructor(auth: BaseAccountProvider, audit: AuditLogger, cluster: DatabaseClusterManager) {
    super();
    this.auth = auth;
    this.audit = audit;
    this.cluster = cluster;
  }
}
