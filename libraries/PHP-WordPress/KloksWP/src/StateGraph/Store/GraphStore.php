<?php

declare(strict_types=1);

namespace KloksWP\StateGraph\Store;

/**
 * In-memory & serialized graph store for state graph topologies.
 */
class GraphStore
{
    private array $nodes = [];
    private array $wires = [];
    private array $metadata = [];

    public function addNode(string $id, string $type, array $position = ['x' => 0, 'y' => 0], array $config = []): void
    {
        $this->nodes[$id] = [
            'id' => $id,
            'type' => $type,
            'position' => $position,
            'config' => $config,
        ];
    }

    public function removeNode(string $id): void
    {
        unset($this->nodes[$id]);
        $this->wires = array_values(array_filter(
            $this->wires,
            fn($w) => $w['sourceNodeId'] !== $id && $w['targetNodeId'] !== $id
        ));
    }

    public function addWire(string $id, string $sourceNodeId, string $targetNodeId, string $sourcePort = 'out', string $targetPort = 'in'): void
    {
        $this->wires[] = [
            'id' => $id,
            'sourceNodeId' => $sourceNodeId,
            'targetNodeId' => $targetNodeId,
            'sourcePort' => $sourcePort,
            'targetPort' => $targetPort,
        ];
    }

    public function getNodes(): array
    {
        return $this->nodes;
    }

    public function getWires(): array
    {
        return $this->wires;
    }

    public function toArray(): array
    {
        return [
            'nodes' => array_values($this->nodes),
            'wires' => $this->wires,
            'metadata' => $this->metadata,
        ];
    }
}
