<?php
declare(strict_types=1);

namespace KloksWP\StateGraph;

final class ConnectionRuleStore {
    private array $allowedTransitions = [];

    public function __construct() {
        $this->registerDefaults();
    }

    private function registerDefaults(): void {
        $rules = [
            ['source' => 'trigger', 'target' => 'effect'],
            ['source' => 'trigger', 'target' => 'control'],
            ['source' => 'primitive', 'target' => 'effect'],
            ['source' => 'primitive', 'target' => 'control'],
            ['source' => 'data', 'target' => 'effect'],
            ['source' => 'data', 'target' => 'control'],
            ['source' => 'control', 'target' => 'effect'],
            ['source' => 'control', 'target' => 'routing'],
            ['source' => 'routing', 'target' => 'effect'],
            ['source' => 'audio', 'target' => 'audio'],
            ['source' => 'module', 'target' => 'effect'],
        ];

        foreach ($rules as $rule) {
            $this->allow($rule['source'], $rule['target']);
        }
    }

    public function allow(string $sourceType, string $targetType): void {
        $this->allowedTransitions[$sourceType][$targetType] = true;
    }

    public function isAllowed(string $sourceType, string $targetType): bool {
        return !empty($this->allowedTransitions[$sourceType][$targetType]);
    }

    public function allowedTargets(string $sourceType): array {
        return array_keys($this->allowedTransitions[$sourceType] ?? []);
    }
}
