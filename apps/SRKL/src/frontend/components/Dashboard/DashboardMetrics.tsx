/**
 * @file DashboardMetrics.tsx
 * @description Surveillance summary metric tiles wired to Skipo theme tokens.
 * Adheres to Skipo code limits (<200 lines).
 */

import React from 'react';
import { Server, Route, Activity, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useHub } from '../../context/HubContext';

export function DashboardMetrics(): React.ReactElement {
  const { registry, activityLogs, metrics } = useHub();
  const services = registry.getAll();
  const totalEndpoints = services.reduce((acc, s) => acc + s.definition.endpoints.length, 0);

  const totalOps = activityLogs.length;
  const errorOps = activityLogs.filter((a) => a.status === 'FAILED').length;

  const metricList = Object.values(metrics);
  const hasMetrics = metricList.length > 0;
  const avgHealth = hasMetrics
    ? Math.round(metricList.reduce((acc, m) => acc + m.health, 0) / metricList.length)
    : null;
  const avgLatency = hasMetrics
    ? Math.round(metricList.reduce((acc, m) => acc + m.latencyMs, 0) / metricList.length)
    : null;

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'var(--skipo-surface)',
    borderColor: 'var(--skipo-border-color)',
    borderRadius: 'var(--skipo-radius)',
    boxShadow: 'var(--skipo-shadow)',
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono select-none">
      <div className="p-4 border" style={cardStyle}>
        <div className="flex items-center justify-between text-xs mb-1" style={{ color: 'var(--skipo-text-muted)' }}>
          <span>SURVEILLED SERVICES</span>
          <Server className="w-4 h-4" style={{ color: 'var(--skipo-accent)' }} />
        </div>
        <div className="text-2xl font-black" style={{ color: 'var(--skipo-text)' }}>
          {services.length}
        </div>
        <div className="text-[11px] mt-1 flex items-center gap-1">
          {services.length === 0 ? (
            <span style={{ color: 'var(--skipo-text-muted)' }}>No services registered</span>
          ) : (
            <span className="flex items-center gap-1" style={{ color: 'var(--skipo-success)' }}>
              <CheckCircle2 className="w-3 h-3" /> {services.length} {services.length === 1 ? 'Adapter' : 'Adapters'} Active
            </span>
          )}
        </div>
      </div>

      <div className="p-4 border" style={cardStyle}>
        <div className="flex items-center justify-between text-xs mb-1" style={{ color: 'var(--skipo-text-muted)' }}>
          <span>SERVICE ENDPOINTS</span>
          <Route className="w-4 h-4" style={{ color: 'var(--skipo-info)' }} />
        </div>
        <div className="text-2xl font-black" style={{ color: 'var(--skipo-text)' }}>
          {totalEndpoints}
        </div>
        <div className="text-[11px] mt-1" style={{ color: 'var(--skipo-text-muted)' }}>
          {totalEndpoints === 0 ? 'No routes registered' : `${totalEndpoints} API ${totalEndpoints === 1 ? 'Route' : 'Routes'} Active`}
        </div>
      </div>

      <div className="p-4 border" style={cardStyle}>
        <div className="flex items-center justify-between text-xs mb-1" style={{ color: 'var(--skipo-text-muted)' }}>
          <span>HUB HEALTH INDEX</span>
          <Activity className="w-4 h-4" style={{ color: 'var(--skipo-success)' }} />
        </div>
        <div
          className="text-2xl font-black"
          style={{ color: avgHealth !== null ? 'var(--skipo-success)' : 'var(--skipo-text-muted)' }}
        >
          {avgHealth !== null ? `${avgHealth}%` : '--'}
        </div>
        <div className="text-[11px] mt-1" style={{ color: 'var(--skipo-text-muted)' }}>
          {avgLatency !== null ? `Telemetry Latency: ~${avgLatency}ms` : 'No telemetry active'}
        </div>
      </div>

      <div className="p-4 border" style={cardStyle}>
        <div className="flex items-center justify-between text-xs mb-1" style={{ color: 'var(--skipo-text-muted)' }}>
          <span>TOTAL OPERATIONS</span>
          <ShieldAlert className="w-4 h-4" style={{ color: 'var(--skipo-warning)' }} />
        </div>
        <div className="text-2xl font-black" style={{ color: 'var(--skipo-text)' }}>
          {totalOps}
        </div>
        <div className="text-[11px] mt-1" style={{ color: 'var(--skipo-text-muted)' }}>
          {totalOps === 0 ? 'No activity logged' : `${errorOps} Exceptions recorded`}
        </div>
      </div>
    </div>
  );
}
