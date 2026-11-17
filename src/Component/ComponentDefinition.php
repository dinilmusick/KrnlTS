<?php

declare(strict_types=1);

namespace FrnlWP\Component;

/**
 * Analogous to FrnlTS component-definition.ts.
 * Encapsulates structured schema for Frnl component states, phases, events, and visual parameters.
 */
class ComponentDefinition
{
    private string $name;
    private array $states;

    public function __construct(string $name, array $states = [])
    {
        if (empty($name)) {
            throw new \InvalidArgumentException('Component name cannot be empty');
        }
        $this->name = $name;
        $this->states = $states;
    }

    public static function define(array $definition): self
    {
        if (empty($definition['name'])) {
            throw new \InvalidArgumentException('Component definition must include a "name" string');
        }

        $states = $definition['states'] ?? [];
        foreach ($states as $stateName => $stateConfig) {
            if (!is_array($stateConfig)) {
                throw new \InvalidArgumentException("State '{$stateName}' configuration must be an array");
            }
            if (empty($stateConfig['phases']['sustainPhase'])) {
                $states[$stateName]['phases']['sustainPhase'] = ['visualDefinition' => ['parameters' => []]];
            }
        }

        return new self($definition['name'], $states);
    }

    public function getName(): string
    {
        return $this->name;
    }

    public function getStates(): array
    {
        return $this->states;
    }

    public function getState(string $stateName): ?array
    {
        return $this->states[$stateName] ?? null;
    }

    public function hasState(string $stateName): bool
    {
        return isset($this->states[$stateName]);
    }

    public function getEventNames(): array
    {
        $names = [];
        foreach ($this->states as $state) {
            if (!empty($state['events']) && is_array($state['events'])) {
                foreach (array_keys($state['events']) as $eventName) {
                    $names[$eventName] = true;
                }
            }
        }
        $list = array_keys($names);
        sort($list);
        return $list;
    }

    public function toArray(): array
    {
        return [
            'name' => $this->name,
            'states' => $this->states,
        ];
    }
}
