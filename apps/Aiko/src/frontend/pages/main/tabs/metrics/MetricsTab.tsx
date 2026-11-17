/**
 * @file MetricsTab.tsx
 * @description Canonical Metrics Tab within Main Page.
 * Conforms to L9 (Lines <= 200).
 */

import React from 'react';
import { MetricsView } from '../../../../components/views/MetricsView.js';

export interface MetricsTabProps {
  onCloseToGraph: () => void;
  logs: any[];
  summary: any;
  usageStats: any[];
}

export function MetricsTab(props: MetricsTabProps) {
  return <MetricsView {...props} />;
}

export default MetricsTab;
