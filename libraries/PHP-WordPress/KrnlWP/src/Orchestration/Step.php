<?php
declare(strict_types=1);

namespace KrnlWP\Orchestration;

final class Step {
    public function __construct(
        public readonly string $id,
        public readonly string $type,
        public readonly string $target,
        public readonly array $dependsOn = [],
        public readonly ?\Closure $condition = null,
        public readonly ?int $concurrency = null,
        public readonly ?\Closure $inputFactory = null,
        public readonly array $retryPolicy = [],
        public readonly ?int $timeoutMs = null,
        public readonly ?\Closure $catchHandler = null,
        public readonly ?\Closure $compensation = null
    ) {}
}