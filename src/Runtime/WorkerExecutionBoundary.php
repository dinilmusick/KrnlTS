<?php
declare(strict_types=1);

namespace KrnlWP\Runtime;

final class ExecutionContext {
    public function __construct(
        public readonly bool $isWorkerContext,
        public readonly string $workerId,
        public readonly float $timestamp,
        public readonly ?string $correlationId = null,
        public readonly array $metadata = []
    ) {}
}

final class BackendCommand {
    public function __construct(
        public readonly string $id,
        public readonly string $type,
        public readonly mixed $payload,
        public readonly string $correlationId,
        public readonly ?string $idempotencyKey = null,
        public readonly ?float $createdAt = null
    ) {}
}

final class NormalizedResult {
    public function __construct(
        public readonly string $correlationId,
        public readonly string $status, // COMPLETED, FAILED, CANCELLED
        public readonly mixed $data = null,
        public readonly ?string $error = null,
        public readonly ?float $executionTimestamp = null
    ) {}
}

final class WorkerExecutionBoundary {
    public function __construct(
        public readonly string $workerId,
        private readonly ?\Closure $handler = null
    ) {}

    public function processJob(BackendCommand $command, array $metadata = []): NormalizedResult {
        if ($this->handler === null) {
            return new NormalizedResult($command->correlationId, 'COMPLETED', $command->payload, null, microtime(true) * 1000);
        }

        $context = new ExecutionContext(true, $this->workerId, microtime(true) * 1000, $command->correlationId, $metadata);
        self::assertWorkerContext($context);

        try {
            $data = ($this->handler)($command, $context);
            return new NormalizedResult($command->correlationId, 'COMPLETED', $data, null, microtime(true) * 1000);
        } catch (\Throwable $e) {
            return new NormalizedResult($command->correlationId, 'FAILED', null, $e->getMessage(), microtime(true) * 1000);
        }
    }

    public static function assertWorkerContext(?ExecutionContext $context): void {
        if ($context === null || !$context->isWorkerContext) {
            throw new \RuntimeException('[WorkerExecutionBoundary] Violation: DIRECT_CALL -> SERVICE_BOUNDARY is strictly forbidden.');
        }
    }
}
