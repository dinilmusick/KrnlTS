import { StreamTelemetryInput, StreamTelemetryOutput } from '../StreamTelemetryAtom.js';
import { logMetric } from '../helper_functions/logMetric.js';

export const main = async (input: StreamTelemetryInput): Promise<StreamTelemetryOutput> => {
  const metric = logMetric(input.metricName || 'throughput', input.value ?? 100);
  return {
    logged: true,
    metric,
    timestamp: Date.now()
  };
};
