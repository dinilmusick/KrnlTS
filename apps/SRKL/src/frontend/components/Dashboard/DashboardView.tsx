/**
 * @file DashboardView.tsx
 * @description Master Dashboard view orchestrator for SRKL.
 * Adheres to Srkl-spec.md Section 21 & Skipo code limits (<200 lines).
 */

import React from 'react';
import { DashboardMetrics } from './DashboardMetrics';
import { DashboardServiceGrid } from './DashboardServiceGrid';
import { DashboardRecentActivity } from './DashboardRecentActivity';

export function DashboardView(): React.ReactElement {
  return (
    <div id="srkl-dashboard-view" className="space-y-6 max-w-7xl mx-auto w-full pb-16">
      <div className="border-b border-neutral-800 pb-3">
        <h1 className="text-lg font-bold text-neutral-100 font-mono tracking-wide">
          SERVICE HUB SURVEILLANCE
        </h1>
        <p className="text-xs text-neutral-400 font-mono">
          Unified real-time telemetry, health surveillance, and access control across service providers.
        </p>
      </div>

      <DashboardMetrics />
      <DashboardServiceGrid />
      <DashboardRecentActivity />
    </div>
  );
}
