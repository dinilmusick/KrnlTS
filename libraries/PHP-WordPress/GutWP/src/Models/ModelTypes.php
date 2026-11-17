<?php
declare(strict_types=1);

namespace GutWP\Models;

final class ModelMetadata {
    public function __construct(
        public readonly string $id,
        public readonly string $name,
        public readonly string $provider,
        public readonly string $version,
        public readonly string $description,
        public readonly array $capabilities = [],
        public readonly array $size = [],
        public readonly string $runtime = 'remote-api',
        public readonly array $examples = [],
        public readonly ?string $whenToUse = null,
        public readonly ?string $avoidWhen = null
    ) {}
}

interface ModelRuntime {
    public function load(ModelMetadata $metadata): object;
    public function unload(object $model): void;
}

final class ModelLease {
    public function __construct(
        public readonly object $model,
        private readonly \Closure $releaseCallback
    ) {}

    public function release(): void {
        ($this->releaseCallback)();
    }
}
