<?php

declare(strict_types=1);

namespace FloksWP\Canvas;

/**
 * Unified OmniCanvas supporting FOD flow graphs, Aiko multi-agent, and 2D canvas layouts.
 */
class OmniCanvas
{
    private string $mode;
    private array $config;

    public function __construct(string $mode = 'fod', array $config = [])
    {
        $this->mode = $mode;
        $this->config = $config;
    }

    public function render(): string
    {
        if ($this->mode === 'aiko') {
            $convId = $this->config['conversationId'] ?? 'aiko-session';
            return (new AikoCanvas($convId))->render();
        }

        $nodes = $this->config['nodes'] ?? [];
        $wires = $this->config['wires'] ?? [];
        return (new FodCanvas($this->config['id'] ?? 'omni-canvas', $nodes, $wires))->render();
    }
}
