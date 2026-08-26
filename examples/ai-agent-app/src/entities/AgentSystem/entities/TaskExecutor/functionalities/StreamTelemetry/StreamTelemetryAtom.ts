export interface StreamTelemetryInput {
  metricName: string;
  value: number;
}

export interface StreamTelemetryOutput {
  recorded: boolean;
  metric: string;
  timestamp: number;
}
