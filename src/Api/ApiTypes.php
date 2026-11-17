<?php
declare(strict_types=1);

namespace GutWP\Api;

final class ApiParameter {
    public function __construct(
        public readonly string $name,
        public readonly string $description,
        public readonly bool $required,
        public readonly array $schema = []
    ) {}
}

final class ApiSemantics {
    public function __construct(
        public readonly bool $deterministic = true,
        public readonly bool $pure = true,
        public readonly bool $sideEffects = false
    ) {}
}

final class ApiExample {
    public function __construct(
        public readonly array $input,
        public readonly mixed $output
    ) {}
}

final class ApiDefinition {
    public function __construct(
        public readonly string $id,
        public readonly string $name,
        public readonly string $category,
        public readonly string $description,
        public readonly array $parameters = [],
        public readonly array $output = [],
        public readonly ?ApiSemantics $semantics = null,
        public readonly array $errors = [],
        public readonly array $examples = [],
        public readonly array $inputSchema = []
    ) {}
}
