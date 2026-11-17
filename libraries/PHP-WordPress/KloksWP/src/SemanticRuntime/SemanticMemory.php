<?php

declare(strict_types=1);

namespace KloksWP\SemanticRuntime;

/**
 * Semantic memory with short-term and long-term stores.
 */
class SemanticMemory
{
    private array $shortTerm = [];
    private array $longTerm = [];

    public function remember(string $key, mixed $value, array $tags = []): void
    {
        $entry = [
            'key' => $key,
            'value' => $value,
            'tags' => $tags,
            'timestamp' => time(),
        ];
        $this->shortTerm[$key] = $entry;
        $this->longTerm[$key] = $entry;
    }

    public function recall(string $key): mixed
    {
        return $this->shortTerm[$key]['value'] ?? $this->longTerm[$key]['value'] ?? null;
    }

    public function recallByTag(string $tag): array
    {
        $matches = [];
        foreach ($this->longTerm as $entry) {
            if (in_array($tag, $entry['tags'] ?? [], true)) {
                $matches[] = $entry;
            }
        }
        return $matches;
    }

    public function clearWorkingMemory(): void
    {
        $this->shortTerm = [];
    }
}
