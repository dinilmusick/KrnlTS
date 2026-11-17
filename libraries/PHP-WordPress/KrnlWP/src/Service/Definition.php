<?php

declare(strict_types=1);

namespace KrnlWP\Service;
final class Definition {
    public function __construct(
        public readonly string $id, public readonly string $name, public readonly string $version,
        public readonly array $operations=[], public readonly array $state=[], public readonly array $events=[],
        public readonly array $dependencies=[], public readonly array $capabilities=[], public readonly array $inputs=[],
        public readonly array $outputs=[], public readonly array $protocols=[], public readonly array $lifecycle=[]
    ) {}
}