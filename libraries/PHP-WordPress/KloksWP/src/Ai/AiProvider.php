<?php

declare(strict_types=1);

namespace KloksWP\Ai;

/**
 * AI Provider interface and registry for KloksWP.
 */
interface AiProviderInterface
{
    public function getName(): string;
    public function complete(string $prompt, array $options = []): string;
    public function chat(array $messages, array $options = []): array;
    public function isAvailable(): bool;
}

class MockAiProvider implements AiProviderInterface
{
    public function getName(): string
    {
        return 'mock';
    }

    public function complete(string $prompt, array $options = []): string
    {
        return "AI response to: " . substr($prompt, 0, 50);
    }

    public function chat(array $messages, array $options = []): array
    {
        $last = end($messages)['content'] ?? '';
        return [
            'role' => 'assistant',
            'content' => "Synthesized response to: " . substr($last, 0, 50),
        ];
    }

    public function isAvailable(): bool
    {
        return true;
    }
}

class AiProvider
{
    private static array $providers = [];

    public static function register(string $name, AiProviderInterface $provider): void
    {
        self::$providers[$name] = $provider;
    }

    public static function get(string $name = 'default'): AiProviderInterface
    {
        if (isset(self::$providers[$name])) {
            return self::$providers[$name];
        }
        if (isset(self::$providers['default'])) {
            return self::$providers['default'];
        }
        return new MockAiProvider();
    }

    public static function has(string $name): bool
    {
        return isset(self::$providers[$name]);
    }
}
