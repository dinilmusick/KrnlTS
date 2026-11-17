<?php

declare(strict_types=1);

namespace KloksWP\Aiko;

/**
 * Message envelope for Aiko multi-agent interactions.
 */
class MessageEnvelope
{
    private string $id;
    private string $role;
    private string $content;
    private array $metadata;
    private int $timestamp;

    public function __construct(string $role, string $content, array $metadata = [], ?string $id = null)
    {
        $this->id = $id ?? uniqid('msg_', true);
        $this->role = $role;
        $this->content = $content;
        $this->metadata = $metadata;
        $this->timestamp = time();
    }

    public function getId(): string
    {
        return $this->id;
    }

    public function getRole(): string
    {
        return $this->role;
    }

    public function getContent(): string
    {
        return $this->content;
    }

    public function getMetadata(): array
    {
        return $this->metadata;
    }

    public function getTimestamp(): int
    {
        return $this->timestamp;
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'role' => $this->role,
            'content' => $this->content,
            'metadata' => $this->metadata,
            'timestamp' => $this->timestamp,
        ];
    }
}
