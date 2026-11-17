<?php
declare(strict_types=1);

namespace KloksWP\StateGraph;

final class NodeArchetypeRegistry {
    private array $archetypes = [];

    public function __construct() {
        $this->registerDefaults();
    }

    private function registerDefaults(): void {
        $defaults = [
            'primitive' => ['category' => 'core', 'description' => 'Atomic value node (number, string, boolean)'],
            'data'      => ['category' => 'io', 'description' => 'External state, options, meta, or cache data'],
            'trigger'   => ['category' => 'event', 'description' => 'Dispatches execution signals on hook or interval'],
            'effect'    => ['category' => 'action', 'description' => 'Side-effect executor (HTTP, DB write, mail)'],
            'audio'     => ['category' => 'media', 'description' => 'Audio generator, filter or mixer unit'],
            'module'    => ['category' => 'composite', 'description' => 'Encapsulated sub-graph unit'],
            'control'   => ['category' => 'logic', 'description' => 'Branch, switch, loop, or throttle controller'],
            'routing'   => ['category' => 'flow', 'description' => 'Signal distributor and merger'],
        ];

        foreach ($defaults as $type => $info) {
            $this->register($type, $info['category'], $info['description']);
        }
    }

    public function register(string $type, string $category, string $description, array $ports = []): void {
        $this->archetypes[$type] = [
            'type' => $type,
            'category' => $category,
            'description' => $description,
            'ports' => $ports,
        ];
    }

    public function has(string $type): bool {
        return isset($this->archetypes[$type]);
    }

    public function get(string $type): array {
        return $this->archetypes[$type] ?? throw new \InvalidArgumentException("Unknown node archetype: $type");
    }

    public function all(): array {
        return $this->archetypes;
    }

    public function byCategory(string $category): array {
        return array_filter($this->archetypes, static fn($a) => $a['category'] === $category);
    }
}
