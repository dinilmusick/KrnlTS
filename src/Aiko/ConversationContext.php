<?php

declare(strict_types=1);

namespace KloksWP\Aiko;

/**
 * Manages conversation history, session state, and context windowing.
 */
class ConversationContext
{
    private string $conversationId;
    /** @var MessageEnvelope[] */
    private array $messages = [];
    private array $metadata = [];

    public function __construct(string $conversationId, array $metadata = [])
    {
        $this->conversationId = $conversationId;
        $this->metadata = $metadata;
    }

    public function getConversationId(): string
    {
        return $this->conversationId;
    }

    public function addMessage(string $role, string $content, array $metadata = []): MessageEnvelope
    {
        $msg = new MessageEnvelope($role, $content, $metadata);
        $this->messages[] = $msg;
        return $msg;
    }

    public function getMessages(): array
    {
        return $this->messages;
    }

    public function clear(): void
    {
        $this->messages = [];
    }

    public function toArray(): array
    {
        return [
            'conversationId' => $this->conversationId,
            'metadata' => $this->metadata,
            'messages' => array_map(fn(MessageEnvelope $m) => $m->toArray(), $this->messages),
        ];
    }
}
