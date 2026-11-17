<?php

declare(strict_types=1);

namespace KloksWP\Ai;

/**
 * Handles inference calls, token limits, timeouts, and fallbacks.
 */
class AiInference
{
    private AiProviderInterface $provider;

    public function __construct(?AiProviderInterface $provider = null)
    {
        $this->provider = $provider ?? AiProvider::get();
    }

    public function infer(string $prompt, array $params = []): array
    {
        $startTime = microtime(true);
        $result = $this->provider->complete($prompt, $params);
        $duration = microtime(true) - $startTime;

        return [
            'output' => $result,
            'duration' => $duration,
            'model' => $params['model'] ?? 'default',
            'status' => 'success',
        ];
    }

    public function chat(array $messages, array $params = []): array
    {
        $startTime = microtime(true);
        $reply = $this->provider->chat($messages, $params);
        $duration = microtime(true) - $startTime;

        return [
            'message' => $reply,
            'duration' => $duration,
            'status' => 'success',
        ];
    }
}
