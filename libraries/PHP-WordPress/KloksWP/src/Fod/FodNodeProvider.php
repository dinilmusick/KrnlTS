<?php

declare(strict_types=1);

namespace KloksWP\Fod;

/**
 * Node definition and provider registry for FOD pipelines.
 */
class FodNodeProvider
{
    private static array $handlers = [];

    public static function register(string $type, callable $handler): void
    {
        self::$handlers[$type] = $handler;
    }

    public static function has(string $type): bool
    {
        return isset(self::$handlers[$type]);
    }

    public static function execute(string $type, array $inputs, array $config = []): mixed
    {
        if (!isset(self::$handlers[$type])) {
            throw new \InvalidArgumentException("No FOD node handler registered for type: {$type}");
        }
        return (self::$handlers[$type])($inputs, $config);
    }

    public static function getRegisteredTypes(): array
    {
        return array_keys(self::$handlers);
    }
}
