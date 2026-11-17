<?php

declare(strict_types=1);

namespace FloksWP\Theme;

/**
 * Loads and registers semantic theme packs for FloksWP components.
 */
class ThemePackLoader
{
    private static array $loadedThemes = [];

    public static function loadTheme(string $themeName, array $themeTokens): void
    {
        self::$loadedThemes[$themeName] = $themeTokens;
    }

    public static function loadFromJson(string $themeName, string $jsonPath): void
    {
        if (!file_exists($jsonPath)) {
            throw new \InvalidArgumentException("Theme file not found: {$jsonPath}");
        }
        $data = json_decode((string)file_get_contents($jsonPath), true);
        if (!is_array($data)) {
            throw new \InvalidArgumentException("Invalid theme JSON in: {$jsonPath}");
        }
        self::loadTheme($themeName, $data);
    }

    public static function getTheme(string $themeName): ?array
    {
        return self::$loadedThemes[$themeName] ?? null;
    }

    public static function all(): array
    {
        return self::$loadedThemes;
    }
}
