<?php

declare(strict_types=1);

namespace FrnlWP\Store;

final class SemanticStore
{
    private array $entities = [];
    private array $definitions = [];
    private array $themes = [];
    private array $handlers = [];
    private array $parents = [];
    private array $overrides = [];
    private array $libraries = [];
    private array $events = [];

    public function registerEntity(string $id, string $state = 'idle', array $properties = []): void
    {
        $this->entities[$id] = ['state' => $state, 'properties' => $properties];
    }

    public function unregisterEntity(string $id): void
    {
        unset($this->entities[$id], $this->parents[$id], $this->overrides[$id]);
    }

    public function setState(string $id, string $state): void
    {
        $this->requireEntity($id);
        $previous = $this->entities[$id]['state'];
        $this->entities[$id]['state'] = $state;
        $this->events[] = [
            'type' => 'entity.stateChanged',
            'payload' => ['entityId' => $id, 'previousState' => $previous, 'state' => $state],
        ];
    }

    public function setEntityState(string $id, string $state): void
    {
        $this->setState($id, $state);
    }

    public function setProperty(string $id, string $key, mixed $value): void
    {
        $this->requireEntity($id);
        $this->entities[$id]['properties'][$key] = $value;
        $this->events[] = [
            'type' => 'entity.propertyChanged',
            'payload' => ['entityId' => $id, 'key' => $key, 'value' => $value],
        ];
    }

    public function setProperties(string $id, array $properties): void
    {
        foreach ($properties as $k => $v) {
            $this->setProperty($id, $k, $v);
        }
    }

    public function entity(string $id): array
    {
        return $this->entities[$id] ?? throw new \RuntimeException("Unknown component: $id");
    }

    public function getEntity(string $id): ?array
    {
        return $this->entities[$id] ?? null;
    }

    public function getEntities(): array
    {
        return $this->entities;
    }

    public function getComponentParents(): array
    {
        return $this->parents;
    }

    public function getThemes(): array
    {
        return $this->themes;
    }

    public function getLibraries(): array
    {
        return $this->libraries;
    }

    public function getEvents(): array
    {
        return $this->events;
    }

    public function registerDefinition(string $id, array $definition): void
    {
        $this->definitions[$id] = $definition;
    }

    public function registerTheme(string $name, array $theme): void
    {
        $this->themes[$name] = $theme;
    }

    public function applyTheme(string $id, string $theme): void
    {
        $this->requireEntity($id);
        if (!isset($this->themes[$theme])) {
            throw new \RuntimeException("Unknown theme: $theme");
        }
        $this->entities[$id]['theme'] = $theme;
    }

    public function setVisualOverride(string $id, string $parameter, mixed $value): void
    {
        $this->requireEntity($id);
        $this->overrides[$id][$parameter] = $value;
    }

    public function visual(string $id): array
    {
        $this->requireEntity($id);
        $entity = $this->entities[$id];
        $def = $this->definitions[$id] ?? [];
        $base = $def['states'][$entity['state']]['visualParameters'] ?? [];
        $theme = $this->themes[$entity['theme'] ?? ''][$def['name'] ?? '']['states'][$entity['state']]['visualParameters'] ?? [];
        return array_replace($base, $theme, $this->overrides[$id] ?? []);
    }

    public function getVisualParameters(string $id): array
    {
        return isset($this->entities[$id]) ? $this->visual($id) : [];
    }

    public function registerLibrary(string $address, mixed $library): void
    {
        $this->libraries[$address] = $library;
    }

    public function library(string $address): mixed
    {
        return $this->libraries[$address] ?? throw new \RuntimeException("Unknown library: $address");
    }

    public function on(string $id, string $event, callable $handler): callable
    {
        $key = $id . '.' . $event;
        $this->handlers[$key][] = $handler;
        $i = array_key_last($this->handlers[$key]);
        return function () use ($key, $i): void {
            unset($this->handlers[$key][$i]);
        };
    }

    public function invoke(string $id, string $event, mixed $payload = null): mixed
    {
        $result = null;
        foreach ($this->handlers[$id . '.' . $event] ?? [] as $h) {
            $result = $h($payload, ['componentId' => $id, 'state' => $this->entities[$id]['state'], 'store' => $this]);
        }
        return $result;
    }

    public function invokeEvent(string $id, string $event, mixed $payload = null): mixed
    {
        return $this->invoke($id, $event, $payload);
    }

    public function parent(string $id, ?string $parentId = null): ?string
    {
        if (func_num_args() > 1) {
            $this->parents[$id] = $parentId;
        }
        return $this->parents[$id] ?? null;
    }

    public function events(): array
    {
        return $this->events;
    }

    private function requireEntity(string $id): void
    {
        if (!isset($this->entities[$id])) {
            throw new \RuntimeException("Unknown component: $id");
        }
    }
}