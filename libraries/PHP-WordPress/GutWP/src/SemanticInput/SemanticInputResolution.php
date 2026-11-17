<?php
declare(strict_types=1);

namespace GutWP\SemanticInput;

final class SemanticInputCandidate {
    public function __construct(
        public readonly string $value,
        public readonly float $similarity = 0.0,
        public readonly float $relevance = 0.0
    ) {}
}

final class SemanticInputResolution {
    public function __construct(
        public readonly string $status, // resolved, ambiguous, invalid, unresolved, failed
        public readonly mixed $value = null,
        public readonly array $candidates = [],
        public readonly mixed $modelOutput = null,
        public readonly ?string $rawInput = null,
        public readonly ?array $error = null,
        public readonly bool $requiresConfirmation = false
    ) {}
}

final class SemanticInputCache {
    private array $entries = [];

    public function __construct(private readonly int $maxEntries = 128) {}

    public function get(string $key): ?SemanticInputResolution {
        if (!isset($this->entries[$key])) return null;
        $val = $this->entries[$key];
        unset($this->entries[$key]);
        $this->entries[$key] = $val;
        return $val;
    }

    public function set(string $key, SemanticInputResolution $val): void {
        unset($this->entries[$key]);
        $this->entries[$key] = $val;
        while (count($this->entries) > $this->maxEntries) {
            array_shift($this->entries);
        }
    }

    public function clear(): void {
        $this->entries = [];
    }
}
