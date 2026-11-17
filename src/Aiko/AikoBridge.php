<?php

declare(strict_types=1);

namespace SkipoWP\Aiko;

/**
 * Aiko integration bridge for composite Skipo applications.
 */
class AikoBridge
{
    private string $defaultAgent;

    public function __construct(string $defaultAgent = 'SkipoAssistant')
    {
        $this->defaultAgent = $defaultAgent;
    }

    public function dispatchAgentTask(string $agentRole, string $instruction, array $context = []): array
    {
        return [
            'taskId' => uniqid('task_', true),
            'agentRole' => $agentRole ?: $this->defaultAgent,
            'instruction' => $instruction,
            'context' => $context,
            'status' => 'queued',
            'timestamp' => time(),
        ];
    }
}
