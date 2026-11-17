<?php

declare(strict_types=1);

namespace KloksWP\Ai;

/**
 * Manages API keys with WP options, constants, and environment variables.
 */
class KeyManager
{
    private const OPTION_PREFIX = 'klokswp_ai_key_';

    public static function getKey(string $provider): ?string
    {
        $envKey = strtoupper($provider) . '_API_KEY';
        $val = getenv($envKey);
        if ($val !== false && $val !== '') {
            return (string)$val;
        }

        $constantName = 'KLOKS_' . strtoupper($provider) . '_KEY';
        if (defined($constantName)) {
            return (string)constant($constantName);
        }

        if (function_exists('get_option')) {
            $opt = get_option(self::OPTION_PREFIX . strtolower($provider));
            if (!empty($opt) && is_string($opt)) {
                return $opt;
            }
        }

        return null;
    }

    public static function setKey(string $provider, string $key): bool
    {
        if (function_exists('update_option')) {
            return (bool)update_option(self::OPTION_PREFIX . strtolower($provider), $key);
        }
        putenv(strtoupper($provider) . '_API_KEY=' . $key);
        return true;
    }

    public static function hasKey(string $provider): bool
    {
        return self::getKey($provider) !== null;
    }
}
