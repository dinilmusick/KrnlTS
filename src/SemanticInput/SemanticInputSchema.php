<?php
declare(strict_types=1);

namespace GutWP\SemanticInput;

final class SemanticInputSchema {
    public function __construct(
        public readonly string $type,
        public readonly ?string $format = null,
        public readonly ?string $pattern = null,
        public readonly array $properties = [],
        public readonly array $required = [],
        public readonly array $enum = [],
        public readonly ?self $items = null,
        public readonly ?string $description = null
    ) {}

    public static function fromArray(array $data): self {
        $items = isset($data['items']) && is_array($data['items']) ? self::fromArray($data['items']) : null;
        $props = [];
        if (isset($data['properties']) && is_array($data['properties'])) {
            foreach ($data['properties'] as $k => $v) {
                if (is_array($v)) $props[$k] = self::fromArray($v);
            }
        }
        return new self(
            (string) ($data['type'] ?? 'string'),
            isset($data['format']) ? (string) $data['format'] : null,
            isset($data['pattern']) ? (string) $data['pattern'] : null,
            $props,
            (array) ($data['required'] ?? []),
            (array) ($data['enum'] ?? []),
            $items,
            isset($data['description']) ? (string) $data['description'] : null
        );
    }
}

final class SemanticInputContext {
    public function __construct(
        public readonly ?string $application = null,
        public readonly ?string $workspace = null,
        public readonly ?string $field = null,
        public readonly ?string $label = null,
        public readonly array $vocabulary = [],
        public readonly array $examples = []
    ) {}
}
