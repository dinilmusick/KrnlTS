<?php

declare(strict_types=1);

namespace FrnlWP\FrontendApi;

use FrnlWP\Store\SemanticStore;

/**
 * Analogous to FrnlTS createFrnlFrontendApi.
 * Provides real-time inspection, control invocation, and component snapshotting.
 */
class FrontendApi
{
    private SemanticStore $store;
    private array $options;
    private array $mountedAt = [];

    public function __construct(SemanticStore $store, array $options = [])
    {
        $this->store = $store;
        $this->options = $options;
        foreach (array_keys($this->store->getEntities()) as $id) {
            $this->mountedAt[$id] = time();
        }
    }

    public function inspect(): array
    {
        $entities = $this->store->getEntities();
        $components = [];
        foreach (array_keys($entities) as $id) {
            $components[] = $this->inspectComponent($id);
        }

        $rootTree = array_values(array_filter($components, fn($c) => $c['parentId'] === null));

        return [
            'apiVersion' => 1,
            'application' => [
                'id' => $this->options['applicationId'] ?? 'frnl-app',
                'route' => $this->options['route'] ?? '/',
            ],
            'componentCount' => count($components),
            'components' => $components,
            'tree' => $rootTree,
            'events' => $this->store->getEvents(),
            'libraries' => array_keys($this->store->getLibraries()),
        ];
    }

    public function inspectComponent(string $componentId): array
    {
        $entity = $this->store->getEntity($componentId);
        if (!$entity) {
            throw new \InvalidArgumentException("Unknown Frnl component: {$componentId}");
        }

        $parents = $this->store->getComponentParents();
        $parentId = $parents[$componentId] ?? null;
        $path = $this->buildPath($componentId, $parents);
        $children = $this->getChildrenOf($componentId, $parents);

        $controls = [
            'setState' => [
                'id' => 'setState',
                'kind' => 'setState',
                'available' => true,
            ],
            'setVisualParameter' => [
                'id' => 'setVisualParameter',
                'kind' => 'setVisualParameter',
                'available' => true,
            ],
            'applyTheme' => [
                'id' => 'applyTheme',
                'kind' => 'applyTheme',
                'available' => count($this->store->getThemes()) > 0,
            ],
        ];

        return [
            'id' => $componentId,
            'type' => $entity['type'] ?? 'Component',
            'path' => $path,
            'parentId' => $parentId,
            'rendered' => true,
            'lifecycle' => [
                'mounted' => true,
                'rendered' => true,
                'mountedAt' => $this->mountedAt[$componentId] ?? time(),
            ],
            'state' => $entity['state'] ?? 'default',
            'properties' => $entity['properties'] ?? [],
            'visualParameters' => $this->store->getVisualParameters($componentId),
            'controls' => $controls,
            'events' => array_keys($entity['events'] ?? []),
            'children' => $children,
        ];
    }

    public function invoke(string $componentId, string $controlId, mixed $payload = null): mixed
    {
        $snapshot = $this->inspectComponent($componentId);
        if (!isset($snapshot['controls'][$controlId])) {
            throw new \InvalidArgumentException("Frnl control not found: {$componentId}.{$controlId}");
        }

        switch ($controlId) {
            case 'setState':
                if (!is_string($payload)) {
                    throw new \InvalidArgumentException('setState expects string payload');
                }
                $this->store->setEntityState($componentId, $payload);
                return true;

            case 'setVisualParameter':
                if (!is_array($payload) || !isset($payload['parameter'], $payload['value'])) {
                    throw new \InvalidArgumentException('setVisualParameter expects array with parameter and value');
                }
                $this->store->setVisualOverride($componentId, (string)$payload['parameter'], $payload['value']);
                return true;

            case 'applyTheme':
                if (!is_string($payload)) {
                    throw new \InvalidArgumentException('applyTheme expects string theme name');
                }
                $this->store->applyTheme($componentId, $payload);
                return true;

            default:
                return $this->store->invokeEvent($componentId, $controlId, $payload);
        }
    }

    public function component(string $componentId): array
    {
        return [
            'inspect' => fn() => $this->inspectComponent($componentId),
            'invoke' => fn(string $controlId, mixed $payload = null) => $this->invoke($componentId, $controlId, $payload),
        ];
    }

    private function buildPath(string $componentId, array $parents): array
    {
        $path = [];
        $visited = [];
        $cursor = $componentId;

        while ($cursor !== null) {
            if (isset($visited[$cursor])) {
                throw new \RuntimeException("Circular Frnl component scope at: {$cursor}");
            }
            $visited[$cursor] = true;
            array_unshift($path, $cursor);
            $cursor = $parents[$cursor] ?? null;
        }

        return $path;
    }

    private function getChildrenOf(string $parentId, array $parents): array
    {
        $children = [];
        foreach ($parents as $childId => $pId) {
            if ($pId === $parentId) {
                $children[] = (string)$childId;
            }
        }
        sort($children);
        return $children;
    }
}
