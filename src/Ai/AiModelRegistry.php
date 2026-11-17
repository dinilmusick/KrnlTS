<?php

declare(strict_types=1);

namespace KloksWP\Ai;

/**
 * Registry of canonical AI models and their capabilities.
 */
class AiModelRegistry
{
    private static array $models = [
        'gemini-1.5-pro' => [
            'id' => 'gemini-1.5-pro',
            'provider' => 'google',
            'contextWindow' => 2000000,
            'supportsVision' => true,
            'supportsTools' => true,
        ],
        'gemini-1.5-flash' => [
            'id' => 'gemini-1.5-flash',
            'provider' => 'google',
            'contextWindow' => 1000000,
            'supportsVision' => true,
            'supportsTools' => true,
        ],
        'gpt-4o' => [
            'id' => 'gpt-4o',
            'provider' => 'openai',
            'contextWindow' => 128000,
            'supportsVision' => true,
            'supportsTools' => true,
        ],
        'claude-3-5-sonnet' => [
            'id' => 'claude-3-5-sonnet',
            'provider' => 'anthropic',
            'contextWindow' => 200000,
            'supportsVision' => true,
            'supportsTools' => true,
        ],
        'deepseek-coder' => [
            'id' => 'deepseek-coder',
            'provider' => 'deepseek',
            'contextWindow' => 64000,
            'supportsVision' => false,
            'supportsTools' => false,
        ],
    ];

    public static function all(): array
    {
        return self::$models;
    }

    public static function get(string $modelId): ?array
    {
        return self::$models[$modelId] ?? null;
    }

    public static function register(string $id, array $metadata): void
    {
        self::$models[$id] = $metadata;
    }

    public static function has(string $id): bool
    {
        return isset(self::$models[$id]);
    }
}
