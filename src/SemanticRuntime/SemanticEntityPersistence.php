<?php

declare(strict_types=1);

namespace KloksWP\SemanticRuntime;

/**
 * Handles persistence of semantic entities and relations.
 */
class SemanticEntityPersistence
{
    private array $inMemoryStore = [];

    public function save(string $id, array $entity): void
    {
        $this->inMemoryStore[$id] = array_merge($entity, ['updatedAt' => time()]);
        if (function_exists('update_option')) {
            update_option('klokswp_entity_' . $id, $this->inMemoryStore[$id]);
        }
    }

    public function find(string $id): ?array
    {
        if (isset($this->inMemoryStore[$id])) {
            return $this->inMemoryStore[$id];
        }
        if (function_exists('get_option')) {
            $val = get_option('klokswp_entity_' . $id);
            if (is_array($val)) {
                $this->inMemoryStore[$id] = $val;
                return $val;
            }
        }
        return null;
    }

    public function delete(string $id): void
    {
        unset($this->inMemoryStore[$id]);
        if (function_exists('delete_option')) {
            delete_option('klokswp_entity_' . $id);
        }
    }

    public function all(): array
    {
        return $this->inMemoryStore;
    }
}
