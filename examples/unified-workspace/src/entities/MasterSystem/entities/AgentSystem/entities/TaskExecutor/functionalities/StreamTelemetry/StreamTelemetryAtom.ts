export interface StreamTelemetryInput {
  metricName: string;
  value: number;
}
export interface StreamTelemetryOutput {
  logged: boolean;
  metric: string;
  timestamp: number;
}
