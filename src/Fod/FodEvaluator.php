<?php

declare(strict_types=1);

namespace KloksWP\Fod;

/**
 * Topologically evaluates a graph of nodes and wires.
 */
class FodEvaluator
{
    public function evaluate(array $graph, array $initialInputs = []): array
    {
        $nodes = $graph['nodes'] ?? [];
        $wires = $graph['wires'] ?? [];
        $results = [];

        // Seed with initial inputs
        foreach ($initialInputs as $key => $val) {
            $results[$key] = $val;
        }

        foreach ($nodes as $node) {
            $id = $node['id'] ?? '';
            $type = $node['type'] ?? 'pass';
            $config = $node['config'] ?? [];

            // Gather inputs from incoming wires
            $inputs = [];
            foreach ($wires as $wire) {
                if (($wire['targetNodeId'] ?? '') === $id) {
                    $sourceId = $wire['sourceNodeId'] ?? '';
                    $targetPort = $wire['targetPort'] ?? 'default';
                    $inputs[$targetPort] = $results[$sourceId] ?? null;
                }
            }

            if (FodNodeProvider::has($type)) {
                $results[$id] = FodNodeProvider::execute($type, $inputs, $config);
            } else {
                $results[$id] = $inputs;
            }
        }

        return $results;
    }
}
