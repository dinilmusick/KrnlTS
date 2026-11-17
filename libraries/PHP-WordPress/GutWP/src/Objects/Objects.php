<?php
declare(strict_types=1);

namespace GutWP\Objects;

final class Objects {
    public static function get(object|array $value, string|int $key, mixed $default = null): mixed {
        if (is_array($value)) return $value[$key] ?? $default;
        return property_exists($value, (string) $key) ? $value->{(string) $key} : $default;
    }

    public static function has(object|array $value, string|int $key): bool {
        return is_array($value) ? array_key_exists($key, $value) : property_exists($value, (string) $key);
    }

    public static function hasOwn(object|array $value, string|int $key): bool {
        return self::has($value, $key);
    }

    public static function pick(array $value, array $keys): array {
        $out = [];
        foreach ($keys as $k) {
            if (array_key_exists($k, $value)) {
                $out[$k] = $value[$k];
            }
        }
        return $out;
    }

    public static function omit(array $value, array $keys): array {
        $out = $value;
        foreach ($keys as $k) {
            unset($out[$k]);
        }
        return $out;
    }

    public static function isPlainObject(mixed $value): bool {
        if (is_object($value)) {
            return $value instanceof \stdClass;
        }
        return is_array($value) && !array_is_list($value);
    }
}