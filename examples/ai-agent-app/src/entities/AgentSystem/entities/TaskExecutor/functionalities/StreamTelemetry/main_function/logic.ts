import { StreamTelemetryInput, StreamTelemetryOutput } from '../StreamTelemetryAtom.js';
import { formatMetric } from '../helper_functions/formatMetric.js';

export const main = async (input: StreamTelemetryInput, { state, entity }: any): Promise<StreamTelemetryOutput> => {
  const metric = formatMetric(input.metricName || 'agent_throughput', input.value ?? 98.6);

  return {
    recorded: true,
    metric,
    timestamp: Date.now()
  };
};
