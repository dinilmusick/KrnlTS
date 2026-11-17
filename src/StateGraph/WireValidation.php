<?php
declare(strict_types=1);

namespace KloksWP\StateGraph;

final class WireValidation {
    public function __construct(
        private readonly ConnectionRuleStore $ruleStore = new ConnectionRuleStore(),
        private readonly NodeArchetypeRegistry $archetypeRegistry = new NodeArchetypeRegistry()
    ) {}

    /**
     * @param array<string, array{type: string, id: string}> $nodes
     * @param array{sourceNode: string, targetNode: string, sourcePort?: string, targetPort?: string} $wire
     * @return array{valid: bool, error?: string}
     */
    public function validateWire(array $nodes, array $wire): array {
        $sourceId = $wire['sourceNode'] ?? '';
        $targetId = $wire['targetNode'] ?? '';

        if ($sourceId === '' || $targetId === '') {
            return ['valid' => false, 'error' => 'Wire must specify both sourceNode and targetNode.'];
        }

        if ($sourceId === $targetId) {
            return ['valid' => false, 'error' => 'Self-connections are forbidden.'];
        }

        if (!isset($nodes[$sourceId])) {
            return ['valid' => false, 'error' => "Source node '$sourceId' does not exist."];
        }

        if (!isset($nodes[$targetId])) {
            return ['valid' => false, 'error' => "Target node '$targetId' does not exist."];
        }

        $sourceType = $nodes[$sourceId]['type'] ?? 'primitive';
        $targetType = $nodes[$targetId]['type'] ?? 'primitive';

        if (!$this->ruleStore->isAllowed($sourceType, $targetType)) {
            return [
                'valid' => false,
                'error' => "Connection from '$sourceType' to '$targetType' is forbidden by connection rules.",
            ];
        }

        return ['valid' => true];
    }
}
