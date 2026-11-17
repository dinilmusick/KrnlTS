<?php

declare(strict_types=1);

namespace KloksWP\Aiko;

use KloksWP\Ai\AiProvider;

/**
 * Aiko gateway bridge for KloksWP.
 */
class AikoBridge
{
    private array $conversations = [];
    private string $endpoint;

    public function __construct(string $endpoint = 'http://localhost:8080/v1')
    {
        $this->endpoint = rtrim($endpoint, '/');
    }

    public function getOrCreateContext(string $conversationId): ConversationContext
    {
        if (!isset($this->conversations[$conversationId])) {
            $this->conversations[$conversationId] = new ConversationContext($conversationId);
        }
        return $this->conversations[$conversationId];
    }

    public function chat(string $conversationId, string $userMessage, array $options = []): array
    {
        $context = $this->getOrCreateContext($conversationId);
        $context->addMessage('user', $userMessage);

        $provider = AiProvider::get($options['provider'] ?? 'default');
        $reply = $provider->chat(
            array_map(fn($m) => ['role' => $m->getRole(), 'content' => $m->getContent()], $context->getMessages()),
            $options
        );

        $context->addMessage($reply['role'] ?? 'assistant', $reply['content'] ?? '');

        return [
            'conversationId' => $conversationId,
            'reply' => $reply['content'] ?? '',
            'role' => $reply['role'] ?? 'assistant',
        ];
    }

    public function getEndpoint(): string
    {
        return $this->endpoint;
    }
}
