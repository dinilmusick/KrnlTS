<?php
declare(strict_types=1);

namespace KrnlWP\Telemetry;

final class TelemetryController {
    private array $spans = [];
    private array $metrics = [];
    private ?string $currentTraceId = null;

    public function startTrace(?string $traceId = null): string {
        $this->currentTraceId = $traceId ?? 'trace_' . bin2hex(random_bytes(8)) . '_' . time();
        return $this->currentTraceId;
    }

    public function currentTraceId(): ?string {
        return $this->currentTraceId;
    }

    public function startSpan(string $name, array $attributes = []): string {
        $spanId = 'span_' . bin2hex(random_bytes(6));
        $this->spans[$spanId] = [
            'id' => $spanId,
            'name' => $name,
            'traceId' => $this->currentTraceId ?? $this->startTrace(),
            'startTime' => hrtime(true) / 1e6, // ms
            'endTime' => null,
            'attributes' => $attributes,
            'status' => 'active',
        ];
        return $spanId;
    }

    public function endSpan(string $spanId, string $status = 'ok', array $extraAttributes = []): void {
        if (!isset($this->spans[$spanId])) return;
        $this->spans[$spanId]['endTime'] = hrtime(true) / 1e6;
        $this->spans[$spanId]['durationMs'] = $this->spans[$spanId]['endTime'] - $this->spans[$spanId]['startTime'];
        $this->spans[$spanId]['status'] = $status;
        $this->spans[$spanId]['attributes'] = array_replace($this->spans[$spanId]['attributes'], $extraAttributes);
    }

    public function recordMetric(string $name, float|int $value, array $tags = []): void {
        $this->metrics[] = [
            'name' => $name,
            'value' => $value,
            'tags' => $tags,
            'timestamp' => hrtime(true) / 1e6,
        ];
    }

    public function increment(string $name, int $delta = 1, array $tags = []): void {
        $this->recordMetric($name, $delta, $tags + ['type' => 'counter']);
    }

    public function getSpans(): array {
        return array_values($this->spans);
    }

    public function getMetrics(): array {
        return $this->metrics;
    }

    public function clear(): void {
        $this->spans = [];
        $this->metrics = [];
        $this->currentTraceId = null;
    }
}
