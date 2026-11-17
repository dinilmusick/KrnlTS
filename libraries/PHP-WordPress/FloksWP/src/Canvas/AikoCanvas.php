<?php

declare(strict_types=1);

namespace FloksWP\Canvas;

/**
 * Aiko multi-agent conversation and canvas workspace container.
 */
class AikoCanvas
{
    private string $conversationId;

    public function __construct(string $conversationId = 'default-aiko-conv')
    {
        $this->conversationId = $conversationId;
    }

    public function render(): string
    {
        return sprintf(
            '<div class="floks-aiko-canvas" data-conversation-id="%s">' .
            '  <div class="floks-aiko-agent-lane"></div>' .
            '  <div class="floks-aiko-workspace"></div>' .
            '</div>',
            htmlspecialchars($this->conversationId, ENT_QUOTES, 'UTF-8')
        );
    }
}
